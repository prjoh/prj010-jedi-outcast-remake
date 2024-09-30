import * as THREE from 'three';
import { assert } from '../Assert';
import { ecs_system } from '../ECS/System';
import { utils } from '../Utils';
import { component_player_state } from '../Components/PlayerState';


export const system_camera = (() => {

  class CameraController extends ecs_system.System
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
      const e_player_camera = this.get_entity("Player_Camera");
      let c_controller = e_player_camera.get_component("CameraController");

      assert(e_player_camera !== null, "No Player_Camera entity found!");
      assert(c_controller !== null, "No CameraController found!");

      let e_player_mesh = this.entity_manager_.get_entity("PlayerMesh");
      let c_player_state = e_player_mesh.get_component("PlayerState");

      if (c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Dead))
      {
        const c_player_transform = e_player_mesh.get_component("Transform");
        const target = c_player_transform;
        let position_offset = c_controller.position_offset_buffer;
        target.local_to_world_vec(c_controller.zero_offset, position_offset);

        c_controller.angle_buffer += c_controller.rotation_speed * fixed_delta_time_s;

        const offset_x = c_controller.rotation_radius * Math.cos(c_controller.angle_buffer);
        const offset_z = c_controller.rotation_radius * Math.sin(c_controller.angle_buffer);
        const new_position = new THREE.Vector3(
          position_offset.x + offset_x,
          position_offset.y + 1.25,
          position_offset.z + offset_z
        );

        let current_position_offset = c_controller.current_position_offset;
        current_position_offset.x = utils.exp_decay(current_position_offset.x, new_position.x, fixed_delta_time_s, 6);
        current_position_offset.y = utils.exp_decay(current_position_offset.y, new_position.y, fixed_delta_time_s, 6);
        current_position_offset.z = utils.exp_decay(current_position_offset.z, new_position.z, fixed_delta_time_s, 6);

        let camera = c_controller.camera;
        camera.position.copy(current_position_offset);
        camera.lookAt(target.position);
      }
      else
      {
        const target = c_controller.target_transform;
        let new_position_offset = c_controller.position_offset_buffer;
  
        target.local_to_world_vec(c_controller.position_offset_local, new_position_offset);
  
        let current_position_offset = c_controller.current_position_offset;
  
        // const t = 1.0 - Math.pow(0.01, delta_time_s);
  
        // current_position_offset.lerp(new_position_offset, t);
        current_position_offset.x = utils.exp_decay(current_position_offset.x, new_position_offset.x, fixed_delta_time_s, 6);
        current_position_offset.y = utils.exp_decay(current_position_offset.y, new_position_offset.y, fixed_delta_time_s, 6);
        current_position_offset.z = utils.exp_decay(current_position_offset.z, new_position_offset.z, fixed_delta_time_s, 6);
  
        let camera = c_controller.camera;
  
        camera.position.copy(current_position_offset);
        // camera.position.copy(new_position_offset);
        camera.lookAt(target.position);
      }
    }

    // TODO: I don't really know why this is jittering ...
    update(delta_time_s)
    {
      // const e_player_camera = this.get_entity("Player_Camera");
      // let c_controller = e_player_camera.get_component("CameraController");

      // assert(e_player_camera !== null, "No Player_Camera entity found!");
      // assert(c_controller !== null, "No CameraController found!");

      // const target = c_controller.target_transform;
      // let new_position_offset = c_controller.position_offset_buffer;

      // target.local_to_world_vec(c_controller.position_offset_local, new_position_offset);

      // let current_position_offset = c_controller.current_position_offset;

      // // const t = 1.0 - Math.pow(0.01, delta_time_s);

      // // current_position_offset.lerp(new_position_offset, t);
      // current_position_offset.x = utils.exp_decay(current_position_offset.x, new_position_offset.x, delta_time_s, 6);
      // current_position_offset.y = utils.exp_decay(current_position_offset.y, new_position_offset.y, delta_time_s, 6);
      // current_position_offset.z = utils.exp_decay(current_position_offset.z, new_position_offset.z, delta_time_s, 6);

      // let camera = c_controller.camera;

      // camera.position.copy(current_position_offset);
      // // camera.position.copy(new_position_offset);
      // camera.lookAt(target.position);
    }

    late_update(delta_time_s) {}
  };

  return {
    CameraController: CameraController,
  };

})();
