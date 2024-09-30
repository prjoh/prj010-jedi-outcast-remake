import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { assert } from '../Assert';


export const component_enemy_movement = (() => {

  const eMovementType = Object.freeze({
    MT_Walking:    0,
    MT_Searching:  1,
    MT_Running:    2,
  });

  class EnemyMovementComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'EnemyMovementComponent';

    get NAME() {
      return EnemyMovementComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.move_speed_walking_ = 0.8;
      this.move_speed_running_ = 3.5;

      this.turn_speed_combat = 6.0;

      this.waypoint_threshold = Math.pow(0.5, 2);

      this.current_move_speed = 0.0;
      this.current_turn_speed = 110.0;

      this.move_target_ = null;
      this.is_moving_ = false;
      this.is_move_target_reached_ = false;
  
      this.turn_target_angle_ = null;
      this.is_turning_ = false;
      this.is_turn_target_reached_ = false;

      this.direction_buffer = new THREE.Vector3();
      this.quaternion_buffer = new THREE.Quaternion();
      this.matrix_buffer = new THREE.Matrix4();
    }

    set_move_target(move_target, movement_type)
    {
      this.move_target_ = move_target;
      this.is_moving_ = false;
      this.is_move_target_reached_ = false;

      if (movement_type === eMovementType.MT_Walking || movement_type === eMovementType.MT_Searching)
      {
        this.current_move_speed = this.move_speed_walking_;
      }
      else if (movement_type === eMovementType.MT_Running)
      {
        this.current_move_speed = this.move_speed_running_;
      }
      else
      {
        assert(false, "No movement type passed!");
      }
    }

    set_is_moving()
    {
      this.is_moving_ = true;
    }

    get move_target()
    {
      return this.move_target_;
    }

    get is_moving()
    {
      return this.is_moving_;
    }

    set_move_target_reached()
    {
      this.is_moving_ = false;
      this.move_target_ = null;
      this.is_move_target_reached_ = true;
    }

    has_reached_move_target()
    {
      return this.is_move_target_reached_;
    }

    set_turn_target(target_angle)
    {
      this.turn_target_angle_ = target_angle;
      this.is_turning_ = false;
      this.is_turn_target_reached_ = false;
    }

    set_is_turning()
    {
      this.is_turning_ = true;
    }

    get turn_target_angle()
    {
      return this.turn_target_angle_;
    }

    get is_turning()
    {
      return this.is_turning_;
    }

    set_turn_target_reached()
    {
      this.turn_target_angle_ = null;
      this.is_turning_ = false;
      this.is_turn_target_reached_ = true;
    }

    has_reached_turn_target()
    {
      return this.is_turn_target_reached_;
    }
  };

  return {
    EnemyMovementComponent: EnemyMovementComponent,
    eMovementType: eMovementType,
  };

})();
