import { eKeyboardKey } from '../Components/Input';
import { component_player_state } from '../Components/PlayerState';
import { ecs_manager } from '../ECS/EntityManager';
import { ecs_system } from '../ECS/System';


export const system_game_state = (() => {

  class GameStateSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);
    }

    init() {}

    post_init() {}

    pre_update() {}

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const e_player = this.entity_manager_.get_entity("PlayerMesh");
      const c_player_state = e_player.get_component("PlayerState");

      if (c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Dead))
      {
        let e_singletons = this.entity_manager_.get_entity("Singletons");
        let c_menu = e_singletons.get_component("UI_GameMenu");
        let c_input = e_singletons.get_component("InputComponent");

        if (c_menu.is_shown === false)
        {
          c_menu.show();
        }

        if (c_input.is_key_down(eKeyboardKey.KK_Enter))
        {
          c_menu.hide();
          this.entity_manager_.set_quit_state(ecs_manager.eQuitState.QR_GameOver);
        }
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    GameStateSystem: GameStateSystem,
  };

})();
