import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { component_editor } from './Editor';


export const component_debug = (() => {


  class DebugObject
  {
    constructor(object, lifetime_s)
    {
      this.object_ = object;
      this.lifetime_s_ = lifetime_s;
    }

    get is_alive()
    {
      return this.lifetime_s_ > 0.0;
    }

    tick(delta_time_s)
    {
      this.lifetime_s_ -= delta_time_s;
    }
  }

  class DebugDrawer extends ecs_component.Component
  {
    static CLASS_NAME = 'DebugDrawer';

    static draw_attack_frames = false;

    get NAME() {
      return DebugDrawer.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene_ = params.scene;

      this.objects_ = [];
    }

    on_initialized()
    {
      super.on_initialized();

      const e_singletons = this.entity.manager.get_entity("Singletons");
      let c_editor = e_singletons.get_component("EditorComponent");

      let debug_draw_page = c_editor.get_page(component_editor.eEditorPage.EP_DebugDraw);

      debug_draw_page.add_binding(DebugDrawer, 'draw_attack_frames', "AttackFrames", null);
    }

    tick(delta_time_s)
    {
      for (let i = this.objects_.length - 1; i >= 0; i--)
      {
        let object = this.objects_[i];

        object.tick(delta_time_s);

        if (object.is_alive === false)
        {
          this.scene_.remove(object.object_);
          this.objects_.splice(i, 1);

          object.object_.geometry.dispose();
          object.object_.material.dispose();
        }
      }
    }

    draw_line(from, to, time_s = 5.0, color = 0xff00ff)
    {
      const geometry = new THREE.CylinderGeometry( 0.01, 0.01, from.distanceTo(to), 3 );
      const material = new THREE.MeshBasicMaterial( {color: color} ); 
      let object = new THREE.Mesh( geometry, material );

      const position = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
      const direction = new THREE.Vector3().subVectors(to, from).normalize();
      const axis = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
      
      object.position.copy(position);
      object.setRotationFromQuaternion(quaternion);

      this.objects_.push(new DebugObject(object, time_s));
      this.scene_.add( object );
    }
  };

  return {
    DebugDrawer: DebugDrawer,
  };

})();
