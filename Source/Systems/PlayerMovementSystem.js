import { component_player_state } from '../Components/PlayerState';
import { ecs_system } from '../ECS/System';


export const system_player_movement = (() => {

  class PlayerMovementSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);
    }

    init() {}

    post_init() {}

    pre_update() {}

    fixed_update(fixed_delta_time_s)
    {
      const e_player = this.get_entity("Player");
      let c_commander = e_player.get_component("PlayerCommander");
      let c_controls = e_player.get_component("CharacterControls");
      let c_kcc = e_player.get_component("KinematicCharacterController");
      let c_transform = e_player.get_component("Transform");

      const e_player_mesh = this.get_entity("PlayerMesh");
      const c_state = e_player_mesh.get_component("PlayerState");

      let controller = c_kcc.controller_;

      if (controller.onGround() === false)
      {
        let velocity_run = c_controls.velocity_run_buffer;

        const v_run_x_sign = Math.sign(velocity_run.x());
        const v_run_z_sign = Math.sign(velocity_run.z());

        velocity_run.setValue(
          v_run_x_sign * Math.max(Math.abs(velocity_run.x()) - 0.05 * fixed_delta_time_s, 0.0), 
          Math.max(velocity_run.y() - 0.4 * fixed_delta_time_s, -0.6), 
          v_run_z_sign * Math.max(Math.abs(velocity_run.z()) - 0.05 * fixed_delta_time_s, 0.0));
        controller.setWalkDirection(velocity_run);
        return;
      }
      else
      {
        let velocity_run = c_controls.velocity_run_buffer;

        if (c_state.get_player_action(component_player_state.ePlayerAction.PS_Dead))
        {
          velocity_run.setValue(0.0, velocity_run.y(), 0.0);
          controller.setWalkDirection(velocity_run);
          return;
        }

        const friction = c_controls.friction_run;
        const speed = velocity_run.length();

        // Apply friction
        if (0.0 < speed)
        {
          velocity_run.setValue(
            velocity_run.x() - fixed_delta_time_s * friction * velocity_run.x(), 
            0.0, 
            velocity_run.z() - fixed_delta_time_s * friction * velocity_run.z()
          );
        }
        else
        {
          velocity_run.setValue(0.0, 0.0, 0.0);
        }

        let attacking_modifier = 1.0;

        if (c_state.get_attack_state() !== component_player_state.eAttackState.AS_None ||
            c_state.get_attack_state() !== component_player_state.eAttackState.AS_Recovery)
        {
          switch (c_state.get_attack_type()) {
            case component_player_state.eAttackType.AT_Standing:
              c_commander.move_forward = 1.0;
              c_commander.move_right = 0.0;
              attacking_modifier = 0.1;
              break;
            case component_player_state.eAttackType.AT_RunFront:
              c_commander.move_forward = 1.0;
              c_commander.move_right = 0.0;
              attacking_modifier = 0.25;
              break;
            case component_player_state.eAttackType.AT_RunBack:
              attacking_modifier = 0.0;
              break;
          }
        }
        else if (c_state.get_attack_state() === component_player_state.eAttackState.AS_Recovery)
        {
          attacking_modifier = 0.5;
        }

        let direction_run = c_controls.direction_run_buffer;
        direction_run.setValue(c_commander.move_right, 0.0, c_commander.move_forward);

        // Update run velocity
        if (direction_run.length() > 0.0)
        {
          direction_run.normalize();

          // Transform the input direction to align with the player's forward direction
          const forward = c_transform.forward;
          const right = c_transform.right;
          direction_run.setValue(
            right.x * direction_run.x() + forward.x *  direction_run.z(),
            0.0,
            right.z * direction_run.x() + forward.z * direction_run.z()
          );

          const is_blocking = c_state.get_player_action(component_player_state.ePlayerAction.PS_Blocking);
          const blocking_modifier = is_blocking ? 0.1 : 1.0;
          
          const is_being_hit = c_state.get_hit_state() === component_player_state.eHitState.HS_Impact;
          const hit_modifier = is_being_hit ? 0.2 : 1.0;

          const acceleration_run = c_controls.acceleration_run * blocking_modifier * attacking_modifier * hit_modifier;

          velocity_run.setValue(
            velocity_run.x() + direction_run.x() * acceleration_run * fixed_delta_time_s, 
            0.0, 
            velocity_run.z() + direction_run.z() * acceleration_run * fixed_delta_time_s
          );

          const clamp_magnitude = (vec3, magnitude_max) =>
          {
            const magnitude = vec3.length();
            if (magnitude == 0.0)
            {
              vec3.setValue(0.0, 0.0, 0.0);
              return;
            }
            const f = Math.min(magnitude, magnitude_max) / magnitude;
            vec3.setValue(f * vec3.x(), f * vec3.y(), f * vec3.z());
            return;
          };
  
          const max_speed_run = c_controls.max_speed_run;
          clamp_magnitude(velocity_run, max_speed_run);
        }

        controller.setWalkDirection(velocity_run);
      }
    }

    update(delta_time_s)
    {
      const e_player_mesh = this.get_entity("PlayerMesh");
      const c_state = e_player_mesh.get_component("PlayerState");

      if (c_state.get_player_action(component_player_state.ePlayerAction.PS_Dead))
      {
        return;
      }

      let attacking_modifier = 1.0;

      if (c_state.get_player_action(component_player_state.ePlayerAction.PS_Attacking))
      {
        attacking_modifier = 0.25;
      }

      const e_player = this.get_entity("Player");
      let c_commander = e_player.get_component("PlayerCommander");
      let c_controls = e_player.get_component("CharacterControls");
      let c_transform = e_player.get_component("Transform");

      const e_player_camera_target = this.get_entity("PlayerCameraTarget");
      let c_target_transform = e_player_camera_target.get_component("Transform");

      const look_delta = c_commander.look_delta;

      const rotation_dir_x = Math.sign(look_delta.y);
      const rotation_dir_y = Math.sign(-look_delta.x);

      const rotation_x = Math.min(Math.abs(look_delta.y) * c_controls.rotation_speed * attacking_modifier * delta_time_s, c_controls.max_rotation);
      const rotation_y = Math.min(Math.abs(look_delta.x) * c_controls.rotation_speed * attacking_modifier * delta_time_s, c_controls.max_rotation);

      c_target_transform.rotate_x(rotation_dir_x * rotation_x);
      c_transform.rotate_y(rotation_dir_y * rotation_y);

      let rotation = c_target_transform.local_rotation;
      let euler = c_controls.euler_buffer.setFromQuaternion(rotation);
      const angle_x_min = c_controls.rotation_angle_x_min;
      const angle_x_max = c_controls.rotation_angle_x_max;

      if (euler.x < angle_x_min)
      {
        euler.set(angle_x_min, euler.y, euler.z);
        rotation.setFromEuler(euler);
      }
      else if (euler.x > angle_x_max)
      {
        euler.set(angle_x_max, euler.y, euler.z);
        rotation.setFromEuler(euler);
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    PlayerMovementSystem: PlayerMovementSystem,
  };

})();
