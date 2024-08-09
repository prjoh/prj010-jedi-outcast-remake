import { component_command } from '../Components/Command';
import { component_fighting } from '../Components/FightingState';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';


export const system_fighting = (() => {

  class FightingSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.fighting_system_tuples = new ecs_component.ComponentContainer(
        component_command.PlayerCommander.CLASS_NAME,
        component_fighting.FightingState.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.fighting_system_tuples);
    }

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const [player_commanders, fighting_states] = this.fighting_system_tuples.component_tuples;
      const size = this.fighting_system_tuples.size;

      for (let i = 0; i < size; ++i)
      {
        const c_player_commander = player_commanders[i];
        let c_fighting_state = fighting_states[i];

        c_fighting_state.update_timers();

        if (c_player_commander.attack_pressed)
        {
          c_fighting_state.set_attacking();
        }
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    FightingSystem: FightingSystem,
  };

})();
