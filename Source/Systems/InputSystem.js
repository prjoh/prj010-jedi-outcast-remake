import { component_command } from '../Components/Command';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';
import { eKeyboardKey, eMouseButton } from '../Components/Input';


export const system_input = (() => {

  class InputSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.input_system_tuples = new ecs_component.ComponentContainer(
        component_command.PlayerCommander.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.input_system_tuples);
    }

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const e_singletons = this.get_entity("Singletons");
      let c_input = e_singletons.get_component("InputComponent");

      const [commanders] = this.input_system_tuples.component_tuples;
      const size = this.input_system_tuples.size;

      if (c_input.mouse.is_locked === false)
      {
        for (let i = 0; i < size; ++i)
        {
          let c_commander = commanders[i];
          c_commander.reset();
        }
      }
      else
      {
        const forward = c_input.is_key_down(eKeyboardKey.KK_W) ? 1.0 : 0.0;
        const back = c_input.is_key_down(eKeyboardKey.KK_S) ? -1.0 : 0.0;
        const left = c_input.is_key_down(eKeyboardKey.KK_A) ? 1.0 : 0.0;
        const right = c_input.is_key_down(eKeyboardKey.KK_D) ? -1.0 : 0.0;
        const jump_pressed = c_input.is_key_pressed(eKeyboardKey.KK_Space);
        const attack_pressed = c_input.is_mouse_button_pressed(eMouseButton.MB_Left);
  
        for (let i = 0; i < size; ++i)
        {
          let c_commander = commanders[i];
          c_commander.move_forward = forward + back;
          c_commander.move_right = left + right;
          c_commander.jump_pressed = jump_pressed;
          c_commander.attack_pressed = attack_pressed;
          c_input.get_mouse_delta(c_commander.look_delta);
        }
      }

      c_input.reset_();  // Only to be called from InputSystem!
    }

    late_update(delta_time_s) {}
  };

  return {
    InputSystem: InputSystem,
  };

})();
