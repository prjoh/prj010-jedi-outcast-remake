import { assert } from '../Assert';
import { ecs_system } from '../ECS/System';


export const system_fsm = (() => {

  class FSMSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);
    }

    // init() {}

    // post_init() {}

    // pre_update() {}

    // fixed_update(fixed_delta_time_s) {}

    // update(delta_time_s) {}

    // late_update(delta_time_s) {}

    on_state_enter(state, user_data) {}

    on_state_update(state, user_data) {}

    on_state_exit(state, user_data)
    {
      this.reset_transition_states_(state);
    }

    set_fsm_parameter(fsm, parameter, value)
    {
      fsm.set_parameter_value(parameter, value);
    }

    update_fsm(fsm, user_data)
    {
      // TODO: Weird place for init
      const current_state = fsm.current_state;
      if (current_state === null)
      {
        fsm.current_state_ = fsm.get_state(fsm.initial_state_);
        assert(fsm.current_state_ !== null, `Unable to initialize current state. State '${this.initial_state_}' not found.`);
        this.on_state_enter(fsm.current_state_, user_data);
        return;
      }

      const result = this.try_transition_(fsm);
      if (result !== null)
      {
        const [next_state, transition_user_data] = result;
        fsm.transition_user_data = transition_user_data;

        this.on_state_exit(current_state, user_data);
        this.on_state_enter(next_state, user_data);
      
        fsm.current_state = next_state;
      }

      this.on_state_update(fsm.current_state, user_data);
    }

    try_transition_(fsm)
    {
      const current_state = fsm.current_state;

      for (const [ to_state_name, transitions ] of current_state.transitions)
      {
        for (const t of transitions)
        {
          if (t.is_active && t.is_valid())
          {
            return [t.state, t.user_data];        
          }
        }
      }

      return null;
    }

    // set_state_transitions_active(state, is_active)
    // {
    //   for (const [ to_state_name, transitions ] of state.transitions)
    //   {
    //     for (const t of transitions)
    //     {
    //       t.set_is_active(is_active);
    //     }
    //   }
    // }

    reset_transition_states_(state)
    {
      for (const [ to_state_name, transitions ] of state.transitions)
      {
        for (const t of transitions)
        {
          t.reset();
        }
      }
    }
  };

  return {
    FSMSystem: FSMSystem,
  };

})();
