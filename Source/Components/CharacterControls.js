import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { degToRad } from 'three/src/math/MathUtils.js';

export const component_controls = (() => {

  class CharacterControls extends ecs_component.Component
  {
    static CLASS_NAME = 'CharacterControls';

    get NAME() {
      return CharacterControls.CLASS_NAME;
    }

    constructor()
    {
      super();

      this.direction_run_buffer = new Ammo.btVector3(0, 0, 0);
      this.velocity_run_buffer = new Ammo.btVector3(0, 0, 0);

      this.acceleration_run = 1.5;
      this.max_speed_run = 0.11;
      this.friction_run = 10.0;

      this.rotation_speed = 0.25;
      this.max_rotation = 0.1;
      this.euler_buffer = new THREE.Euler();
      this.rotation_angle_x_min = degToRad(-60.0);
      this.rotation_angle_x_max = degToRad(60.0);
    }

    destroy()
    {
      Ammo.destroy(this.direction_run_buffer);
      Ammo.destroy(this.velocity_run_buffer);
    }
  };

  return {
    CharacterControls: CharacterControls,
  };

})();
