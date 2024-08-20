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

      const intensity = 1.2;
      const distance = 0.0;
      const decay = 1.5;

      const point_light = new THREE.PointLight(
        params.color,
        intensity,
        distance,
        decay,
      );

      // point_light.add(new THREE.AxesHelper(10.0));

      this.point_light_ = point_light;
      this.point_light_rotation_ = new THREE.Quaternion();
      this.point_light_direction_ = new THREE.Vector3();
      this.lightsaber_anchor_ = null;

      this.scene_.add(point_light);
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
      this.lightsaber_anchor_.getWorldQuaternion(this.point_light_rotation_);

      this.point_light_direction_.set(0.0, 0.0, 1.0);
      this.point_light_direction_.applyQuaternion(this.point_light_rotation_);
      this.point_light_direction_.normalize();

      this.point_light_.position.add(this.point_light_direction_.multiplyScalar(-0.2));
    }
  };

  return {
    LightsaberGlow: LightsaberGlow,
  };

})();
