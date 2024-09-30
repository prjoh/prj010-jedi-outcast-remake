import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';

export const component_lightsaber_glow = (() => {

  class LightsaberGlow extends ecs_component.Component
  {
    static CLASS_NAME = 'LightsaberGlow';

    get NAME() {
      return LightsaberGlow.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene_ = params.scene;

      const intensity = 1.7;
      const distance = 0.0;
      const decay = 1.5;

      const point_light = new THREE.PointLight(
        params.color,
        intensity,
        distance,
        decay,
      );

      this.point_light_ = point_light;
      this.direction_buffer_ = new THREE.Vector3();
      this.lightsaber_anchor_ = null;

      this.scene_.add(point_light);

      this.position_buffer_ = new THREE.Vector3();
      this.position_buffer2_ = new THREE.Vector3();
      this.quaternion_buffer_ = new THREE.Quaternion();

      // const geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 ); 
      // const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
      // this.cube = new THREE.Mesh( geometry, material );
      // this.cube2 = new THREE.Mesh( geometry, material );
      // this.scene_.add(this.cube);
      // this.scene_.add(this.cube2);

      // const geometry2 = new THREE.CapsuleGeometry( 0.01, 1, 1, 3 ); 
      // const material2 = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
      // this.capsule = new THREE.Mesh( geometry2, material2 );
      // this.scene_.add(this.capsule);
    }

    destroy()
    {
      this.point_light_.dispose();

      super.destroy();
    }

    on_initialized()
    {
      let c_mesh = this.entity.get_component("SkinnedMeshComponent");

      this.lightsaber_anchor_ = c_mesh.find_child("P1_low_Cylinder008");
      this.update_point_light();

      let e_singletons = this.entity.manager.get_entity("Singletons");
      let c_render_state = e_singletons.get_component("RenderState");

      let lightblade_mesh = c_mesh.find_child("lightblade_Cylinder001");

      c_render_state.add_to_bloom_pass(lightblade_mesh);
    }

    update_point_light()
    {
      this.lightsaber_anchor_.getWorldPosition(this.point_light_.position);
      this.lightsaber_anchor_.getWorldQuaternion(this.point_light_.quaternion);

      this.direction_buffer_.set(0.0, 0.0, 1.0);
      this.direction_buffer_.applyQuaternion(this.point_light_.quaternion);
      this.direction_buffer_.normalize();

      this.point_light_.position.add(this.direction_buffer_.multiplyScalar(-0.2));
    }
  };

  return {
    LightsaberGlow: LightsaberGlow,
  };

})();
