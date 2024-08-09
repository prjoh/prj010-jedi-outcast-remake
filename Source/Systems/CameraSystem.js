import { assert } from '../Assert';
import { ecs_system } from '../ECS/System';
import { utils } from '../Utils';


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
