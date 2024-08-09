import * as THREE from 'three';

import { component_enemy_behavior } from '../Components/EnemyBehavior';
import { component_navigation } from '../Components/Navigation';
import { component_transform } from '../Components/Transform';
import { ecs_component } from '../ECS/Component';
import { env } from '../Env';
import { system_fsm } from './FSMSystem';
import { component_enemy_movement } from '../Components/EnemyMovement';
import { component_physics } from '../Components/Physics';


export const system_enemy_movement = (() => {

  class EnemyMovementSystem extends system_fsm.FSMSystem
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.ai_movement_system_tuples = new ecs_component.ComponentContainer(
        // component_enemy_behavior.EnemyBehaviorComponent.CLASS_NAME,
        component_enemy_movement.EnemyMovementComponent.CLASS_NAME,
        component_navigation.NavAgentComponent.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
        component_physics.CapsuleCollider.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.ai_movement_system_tuples);
    }

    fixed_update(fixed_delta_time_s)
    {

    }

    update(delta_time_s)
    {
      const e_level = this.get_entity("Level");
      const c_nav_mesh = e_level.get_component("NavMeshComponent");

      // const e_player = this.get_entity("Player");
      // const c_player_transform = e_player.get_component("Transform");

      const [/*behaviors, */move_components, nav_agents, transforms, colliders] = this.ai_movement_system_tuples.component_tuples;
      const size = this.ai_movement_system_tuples.size;

      for (let i = 0; i < size; ++i)
      {
        // let c_behavior = behaviors[i];
        let c_movement = move_components[i];
        let c_nav_agent = nav_agents[i];
        let c_transform = transforms[i];
        let c_collider = colliders[i];

        if (c_movement.is_moving === true)
        {
          let current_position = c_transform.position;

          const current_waypoint = c_nav_agent.waypoint;
          const target_position = current_waypoint.position;

          if (current_position.distanceToSquared(target_position) <= c_movement.waypoint_threshold)
          {
            if (current_waypoint.is_endpoint)
            {
              c_nav_agent.reset_path();
              c_movement.set_move_target_reached();
            }
            else
            {
              c_nav_agent.set_next_waypoint();
            }
          }
          else
          {
            // TODO: Check "AI For Games" -> Steering
            let direction = c_movement.direction_buffer;
            direction.copy(target_position)
                      .sub(current_position)
                      .normalize();
            current_position.addScaledVector(direction, c_movement.current_move_speed * delta_time_s);
            c_transform.position = current_position;
            c_transform.look_at(target_position);

            let collider_pos = c_collider.position;
            collider_pos.setValue(current_position.x, current_position.y, current_position.z);
            c_collider.position = collider_pos;
          }
        }
        else if (c_movement.is_moving === false && c_movement.move_target !== null)
        {
          const path = c_nav_mesh.find_path(c_transform.position, c_movement.move_target);

          c_nav_agent.acquire_path(path);

          c_movement.set_is_moving();
        }

        if (c_movement.is_turning === true)
        {
          let rotation = delta_time_s * c_movement.current_turn_speed;

          c_movement.turn_target_angle -= rotation;

          if (c_movement.turn_target_angle < 0.0)
          {
            rotation += c_movement.turn_target_angle;
            c_movement.set_turn_target_reached();
          }

          c_transform.rotate_y(THREE.MathUtils.degToRad(rotation));
        }
        else if (c_movement.is_turning === false && c_movement.turn_target_angle !== null)
        {
          // this.angles_left = c_movement.turn_target_angle;
          c_movement.set_is_turning();
        }

        if (env.DEBUG_MODE)
          {
            if (c_nav_agent.debug_mesh_)
            {
              const pos = c_transform.position;
              pos.y += c_nav_agent.height * 0.5;
              c_nav_agent.debug_mesh_.position.copy(pos);
            }
          }
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    EnemyMovementSystem: EnemyMovementSystem,
  };

})();
