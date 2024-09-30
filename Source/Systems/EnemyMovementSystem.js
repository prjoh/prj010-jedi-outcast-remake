import * as THREE from 'three';

import { component_enemy_behavior } from '../Components/EnemyBehavior';
import { component_navigation } from '../Components/Navigation';
import { component_transform } from '../Components/Transform';
import { ecs_component } from '../ECS/Component';
import { env } from '../Env';
import { system_fsm } from './FSMSystem';
import { component_enemy_movement } from '../Components/EnemyMovement';
import { component_physics } from '../Components/Physics';
import { component_enemy_sensors } from '../Components/EnemySensors';
import { log } from '../Log';


export const system_enemy_movement = (() => {

  class EnemyMovementSystem extends system_fsm.FSMSystem
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.ai_movement_system_tuples = new ecs_component.ComponentContainer(
        component_enemy_behavior.EnemyBehaviorComponent.CLASS_NAME,
        component_enemy_movement.EnemyMovementComponent.CLASS_NAME,
        component_navigation.NavAgentComponent.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
        component_physics.CapsuleCollider.CLASS_NAME,
        component_enemy_sensors.EnemySensorsComponent.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.ai_movement_system_tuples);
    }

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const e_level = this.get_entity("Level");
      const c_nav_mesh = e_level.get_component("NavMeshComponent");

      // const e_player = this.get_entity("Player");
      // const c_player_transform = e_player.get_component("Transform");

      const [behaviors, move_components, nav_agents, transforms, colliders, sensors] = this.ai_movement_system_tuples.component_tuples;
      const size = this.ai_movement_system_tuples.size;

      for (let i = 0; i < size; ++i)
      {
        let c_behavior = behaviors[i];
        let c_movement = move_components[i];
        let c_nav_agent = nav_agents[i];
        let c_transform = transforms[i];
        let c_collider = colliders[i];
        let c_sensors = sensors[i];

        if (c_behavior.behavior.is_alive() === false)
        {
          continue;
        }

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
            // c_sensors.cube1.position.copy(current_position);
            // c_sensors.cube2.position.copy(target_position);

            let direction = c_movement.direction_buffer;
            direction.copy(target_position)
                      .sub(current_position)
                      .normalize();
            // let direction = new THREE.Vector3().copy(c_transform.forward);
            // direction.applyQuaternion(rotation).normalize();
        
            let movement_step = direction.multiplyScalar(c_movement.current_move_speed * delta_time_s);
        
            let position = c_transform.position;
            position.add(movement_step);
            c_transform.position = position;

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

        if (c_behavior.behavior.is_in_combat)
        {
          let current_position = c_transform.position;

          if (c_behavior.behavior.is_player_in_view())
          {
            const e_player = this.get_entity("PlayerMesh");
            const c_player_transform = e_player.get_component("Transform");
            c_movement.matrix_buffer.lookAt(c_player_transform.position, current_position, component_transform.YAxis);
          }
          else
          {
            c_movement.matrix_buffer.lookAt(c_nav_agent.waypoint.position, current_position, component_transform.YAxis);
          }

          c_movement.quaternion_buffer.setFromRotationMatrix(c_movement.matrix_buffer);

          let rotation = c_transform.rotation;
          rotation.slerp(c_movement.quaternion_buffer, c_movement.turn_speed_combat * delta_time_s);
          c_transform.rotation = rotation;
        }
        else
        {
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
        }

        if (env.DEBUG_MODE)
        {
          if (c_nav_agent.debug_mesh_)
          {
            const pos = c_transform.position;
            pos.y += c_nav_agent.height * 0.5;
            c_nav_agent.debug_mesh_.position.copy(pos);
          }

          if (c_sensors.debug_mesh_)
          {
            c_sensors.debug_mesh_.position.copy(c_transform.position);
            c_sensors.debug_mesh_.position.add(new THREE.Vector3(0.0, 0.2, 0.0));
            c_sensors.debug_mesh_.quaternion.copy(c_transform.rotation);
            c_sensors.debug_mesh_.rotateX(THREE.MathUtils.DEG2RAD * -90.0);
            c_sensors.debug_mesh_.rotateZ(THREE.MathUtils.DEG2RAD * 180.0);

            c_sensors.debug_mesh2_.position.copy(c_transform.position);
            c_sensors.debug_mesh2_.position.add(new THREE.Vector3(0.0, 0.15, 0.0));
            c_sensors.debug_mesh2_.quaternion.copy(c_transform.rotation);
            c_sensors.debug_mesh2_.rotateX(THREE.MathUtils.DEG2RAD * -90.0);
            c_sensors.debug_mesh2_.rotateZ(THREE.MathUtils.DEG2RAD * 180.0);

            c_sensors.debug_mesh3_.position.copy(c_transform.position);
            c_sensors.debug_mesh3_.position.add(new THREE.Vector3(0.0, 0.05, 0.0));

            c_sensors.debug_mesh_sensor_state_.position.copy(c_transform.position);
            c_sensors.debug_mesh_sensor_state_.position.add(new THREE.Vector3(0.0, 2.0, 0.0));
          }

          if (c_behavior.debug_mesh_)
          {
            const e_player = this.get_entity("PlayerMesh");
            const c_player_transform = e_player.get_component("Transform");

            c_behavior.debug_mesh_.position.copy(c_player_transform.position);
            c_behavior.debug_mesh_.position.add(new THREE.Vector3(0.0, 0.2, 0.0));

            c_behavior.debug_mesh2_.position.copy(c_player_transform.position);
            c_behavior.debug_mesh2_.position.add(new THREE.Vector3(0.0, 0.15, 0.0));

            c_behavior.debug_mesh_behavior_state_.position.copy(c_transform.position);
            c_behavior.debug_mesh_behavior_state_.position.add(new THREE.Vector3(0.0, 2.0, 0.0));
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
