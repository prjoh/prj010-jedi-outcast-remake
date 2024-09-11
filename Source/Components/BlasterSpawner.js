import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { assert } from '../Assert';

export const component_blaster = (() => {

  class BlasterInstance
  {
    constructor(lifetime)
    {
      this.uuid = new THREE.MathUtils.generateUUID();

      this.mesh_ = new THREE.Mesh(
        new THREE.CapsuleGeometry( 0.005, 0.4, 1, 3 ), 
        new THREE.MeshStandardMaterial({
          color: 0xffffff, 
          emissive: 0xf71223, 
          emissiveIntensity: 2.5
        })
      );
      this.mesh_.visible = false;
      this.next_ = null;

      this.is_active = false;
      this.lifetime = lifetime;
      this.direction = new THREE.Vector3();
      this.velocity = new THREE.Vector3();

      const geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 ); 
      const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
      const material2 = new THREE.MeshBasicMaterial( {color: 0xff0000} ); 

      this.p1 = new THREE.Mesh( geometry, material );
      this.p2 = new THREE.Mesh( geometry, material2 );
      this.p1.visible = false;
      this.p2.visible = false;
    }

    create(position, rotation)
    {
      this.mesh_.position.copy(position);
      this.mesh_.quaternion.copy(rotation);
      this.mesh_.visible = true;
      this.is_active = true;

      // this.p1.visible = true;
      // this.p2.visible = true;
    }

    destroy()
    {
      this.mesh_.visible = false;
      this.is_active = false;

      this.p1.visible = false;
      this.p2.visible = false;
    }

    set_next(next)
    {
      this.next_ = next;
    }

    get_next(next)
    {
      return this.next_;
    }
  }

  class BlasterSpawner extends ecs_component.Component
  {
    static CLASS_NAME = 'BlasterSpawner';

    get NAME() {
      return BlasterSpawner.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene_ = params.scene;

      this.size_ = params.size;

      this.instances_ = [];
      this.instance_lifetime_ = params.lifetime;

      for (let i = 0; i < this.size_; ++i)
      {
        this.instances_.push(new BlasterInstance(params.lifetime));
        this.scene_.add(this.instances_[i].mesh_);

        this.scene_.add(this.instances_[i].p1);
        this.scene_.add(this.instances_[i].p2);
      }

      for (let i = 0; i < this.size_ - 1; ++i)
      {
        this.instances_[i].set_next(this.instances_[i + 1]);
      }

      this.available_ = this.instances_[0];

      this.spawn_anchor_ = null;
      this.spawn_position_ = new THREE.Vector3();
      this.spawn_rotation_ = new THREE.Quaternion();
      this.spawn_offset_ = new THREE.Vector3();

      this.time = 5.0;

      this.deflect_outer = new Set();
      this.deflect_inner = new Set();
    }

    spawn(target)
    {
      assert(this.available_ !== null, "Pool overflow. Increase size!");

      let instance = this.available_;
      this.available_ = instance.get_next();

      instance.lifetime = this.instance_lifetime_;

      this.spawn_anchor_.getWorldPosition(this.spawn_position_);
      this.spawn_anchor_.getWorldQuaternion(this.spawn_rotation_);

      this.spawn_offset_.set(0.0, 0.15, 1.0);
      this.spawn_offset_.applyQuaternion(this.spawn_rotation_);
      this.spawn_offset_.normalize();

      // Create a quaternion representing a 90-degree rotation around the x-axis
      let xAxisQuaternion = new THREE.Quaternion();
      xAxisQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(90));

      // Multiply the existing quaternion by the x-axis quaternion
      this.spawn_rotation_.multiply(xAxisQuaternion);

      this.spawn_position_.add(this.spawn_offset_.multiplyScalar(0.15));

      instance.create(this.spawn_position_, this.spawn_rotation_);

      // instance.mesh_.add(new THREE.AxesHelper(1));

      // instance.direction.copy(target).sub(this.spawn_position_).normalize();

      // TODO: Hack
      instance.direction.set(0.0, 1.0, 0.0);
      instance.direction.applyQuaternion(this.spawn_rotation_);
      instance.direction.normalize();
    }

    despawn(instance)
    {
      if (this.deflect_outer.has(instance))
      {
        this.deflect_outer.delete(instance);
      }

      instance.destroy();
      instance.set_next(this.available_);
      this.available_ = instance;
    }

    get instances()
    {
      return this.instances_;
    }

    on_initialized()
    {
      let c_mesh = this.entity.get_component("SkinnedMeshComponent");

      this.spawn_anchor_ = c_mesh.find_child("BlasterBody");

      let e_singletons = this.entity.manager.get_entity("Singletons");
      let c_render_state = e_singletons.get_component("RenderState");

      for (const instance of this.instances_)
      {
        c_render_state.add_to_bloom_pass(instance.mesh_);
      }
    }
  };

  return {
    BlasterSpawner: BlasterSpawner,
  };

})();
