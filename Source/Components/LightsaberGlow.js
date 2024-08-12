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
    }

    on_initialized()
    {
      let c_mesh = this.entity.get_component("SkinnedMeshComponent");
      let lightsaber_mesh = c_mesh.find_child("P1_low_Cylinder008");

      lightsaber_mesh.add(this.point_light_);
      this.point_light_.position.set(0.0, 0.0, -12.5);

      // let lightblade_mesh = c_mesh.find_child("lightblade_Cylinder001");
      // lightblade_mesh.visible = false;
    }
  };

  return {
    LightsaberGlow: LightsaberGlow,
  };

})();
