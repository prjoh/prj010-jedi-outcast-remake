import { generateUUID } from "three/src/math/MathUtils.js";
import { assert } from "./Assert";


export const fsm = (() => {

  const eConditionType = Object.freeze({
    CT_GreaterThan: 0,
		CT_LessThan: 1,
		CT_GreaterEq: 2,
		CT_LessEq: 3,
		CT_Eq: 4,
		CT_NotEq: 5,
  });

  class TransitionCondition
  {
    constructor(parameter, type, threshold)
    {
      this.parameter_ = parameter;
      this.type_ = type;
      this.threshold_ = threshold;
    }

    is_valid()
    {
      switch(this.type_)
      {
        case eConditionType.CT_GreaterThan:
          return this.parameter_.is_greater(this.threshold_);
        case eConditionType.CT_LessThan:
          return this.parameter_.is_less(this.threshold_);
        case eConditionType.CT_GreaterEq:
          return this.parameter_.is_greater_equal(this.threshold_);
        case eConditionType.CT_LessEq:
          return this.parameter_.is_less_equal(this.threshold_);
        case eConditionType.CT_Eq:
          return this.parameter_.is_equal(this.threshold_);
        case eConditionType.CT_NotEq:
          return this.parameter_.is_not_equal(this.threshold_);
        default:
          assert(false, "Unreachable block");
      }
    }
  };

  class StateTransition
  {
    constructor(from_state, to_state, is_active_on_start, user_data)
    {
      this.from_state_ = from_state;
      this.to_state_ = to_state;
      this.conditions_ = [];
      this.is_active_on_start_ = is_active_on_start;
      this.is_active_ = is_active_on_start;
      this.user_data = user_data;
    }

    get state()
    {
      return this.to_state_;
    }

    get is_active()
    {
      return this.is_active_;
    }

    set_is_active(is_active)
    {
      this.is_active_ = is_active;
    }

    reset()
    {
      this.is_active_ = this.is_active_on_start_;
    }

    is_valid()
    {
      let is_valid = true;

      for (const condition of this.conditions_)
      {
        is_valid &= condition.is_valid();
      }

      return is_valid;
    }

    add_condition(parameter_id, type, threshold)
    {
      const parameters = this.from_state_.parameters;
      assert(parameters.has(parameter_id), `No parameter '${parameter_id}' found when trying to add condition.`);
      const parameter = parameters.get(parameter_id);
      const condition = new TransitionCondition(parameter, type, threshold);
      this.conditions_.push(condition);
    }
  };

  class State
  {
    constructor(fsm, name)
    {
      this.fsm_ = fsm;
      this.name_ = name;
      this.transitions_ = new Map();
    }

    get name()
    {
      return  this.name_
    };

    get parameters()
    {
      return this.fsm_.parameters;
    }

    get transitions()
    {
      return this.transitions_;
    }

    add_transition(to_state_name, is_active_on_start, user_data = null)
    {
      const to_state = this.fsm_.get_state(to_state_name);
      let state_transitions = this.transitions_.get(to_state.name);

      if (state_transitions === undefined)
      {
        state_transitions = [];
      }

      let state_transition = new StateTransition(this, to_state, is_active_on_start, user_data);
      
      state_transitions.push(state_transition);

      this.transitions_.set(to_state.name, state_transitions);

      return state_transition;
    }
  };

  class FSMParameter
  {
    constructor(name, value)
    {
      this.name_ = name;
      this.value_ = value;
    }

    set value(new_value)
    {
      this.value_ = new_value;
    }

    get value()
    {
      return this.value_;
    }

    is_equal(value)
    {
      return this.value_ === value;
    }

    is_not_equal(value)
    {
      return this.value_ !== value;
    }

    is_less(value)
    {
      return this.value_ < value;
    }

    is_greater(value)
    {
      return this.value_ > value;
    }

    is_less_equal(value)
    {
      return this.value_ <= value;
    }

    is_greater_equal(value)
    {
      return this.value_ >= value;
    }
  };

  class FiniteStateMachine
  {
    constructor(initial_state)
    {
      this.states_ = new Map();
      this.initial_state_ = initial_state;
      this.current_state_ = null;
      this.parameters_ = new Map();
      this.transition_user_data = null;
    }

    get parameters()
    {
      return this.parameters_;
    }

    get current_state()
    {
      // if (this.current_state_ === null)
      // {
      //   this.current_state_ = this.get_state_(this.initial_state_);
      //   assert(this.current_state_ !== null, `Unable to initialize current state. State '${this.initial_state_}' not found.`);
      // }

      return this.current_state_;
    }

    set current_state(state)
    {
      this.current_state_ = state;
    }

    add_state(state)
    {
      assert(this.states_.has(state.name) === false, "Tried adding a duplicate state.");
      this.states_.set(state.name, state);
    }

    // TODO: Remove state, and all linked parameters?

    add_parameter(parameter, initial_value)
    {
      assert(this.parameters_.has(parameter) === false, `Tried adding a duplicate parameter.`);
      this.parameters_.set(parameter, new FSMParameter(parameter, initial_value));
    }

    set_parameter_value(parameter, value)
    {
      assert(this.parameters_.has(parameter), `No parameter '${parameter}' found in FSM.`);
			this.parameters_.get(parameter).value = value;
    }

    get_parameter_value(parameter)
    {
      assert(this.parameters_.has(parameter), `No parameter '${parameter}' found in FSM.`);
      this.parameters_.get(parameter).value;
    }

    get_state(state_name)
    {
      const state = this.states_.get(state_name);
      if (state === undefined)
      {
        return null;
      }
      return state;
    }

    // get_current_state()
    // {
    //   if (this.current_state_ === null)
    //   {
    //     this.current_state_ = this.get_state(this.initial_state_);
    //     assert(this.current_state_ !== null, `Unable to initialize initial state. State '${this.initial_state}' not found.`);
    //   }

    //   return this.current_state_;
    // }
  };

  return {
    FiniteStateMachine: FiniteStateMachine,
    State: State,
    StateTransition: StateTransition,
    eConditionType: eConditionType,
  };

})();
