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

      this.point_light_ = new THREE.PointLight(
        params.color,
        params.intensity,
        params.distance,
        params.decay,
      );
      this.point_light_.position.set(0.0, 1.0, 0.0);

      // params.scene.add(this.point_light_);

      params.scene.add(new THREE.PointLightHelper( this.point_light_, 0.25 ));
      params.scene.add(new THREE.AxesHelper(1.0));
    }

    on_initialized()
    {
      const c_mesh = this.entity.get_component("SkinnedMeshComponent");
      const lightsaber_mesh = c_mesh.find_child("P1_low_Cylinder.008");

      lightsaber_mesh.add(this.point_light_);
    }
  };

  return {
    LightsaberGlow: LightsaberGlow,
  };

})();
