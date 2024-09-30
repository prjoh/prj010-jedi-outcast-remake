import { MathUtils } from "three";

import { assert } from "../Assert";
import { utils } from "../Utils";


const eGoalResult = Object.freeze({
  GR_Continue:  0,
  GR_Success:   1,
  GR_Failed:    2,
});

const eGoal = Object.freeze({
  G_Guarding:                  0,
  G_Patroling:                 1,
  G_MoveToPosition:            2,
  G_TurnTowards:               3,
  G_Wait:                      4,
  G_Investigate:               5,
  G_CombatIdle:                6,
  G_CombatMoveAttackPosition:  7,
  G_CombatAttackStanding:      8,
  G_CombatAttackWalking:       9,
  G_CombatWon:                 10,
});

class Goal
{
  constructor(goal_id, goal_lifetime_s, goal_params)
  {
    this.ai_ = null;
    this.manager_ = null
    this.parent_ = null;

    this.uuid = MathUtils.generateUUID();
    this.goal_id_ = goal_id;
    this.goal_params_ = goal_params;

    this.is_active_ = false;

    this.goal_lifetime_s_ = goal_lifetime_s;
    this.goal_status_ = null;

    this.subgoals_ = [];

    this.latest_subgoal_result_ = null;
  }

  get parent()
  {
    return this.parent_;
  }

  get id()
  {
    return this.goal_id_;
  }

  get lifetime()
  {
    return this.goal_lifetime_s_;
  }

  get status()
  {
    return this.goal_status_;
  }

  get is_active()
  {
    return this.is_active_;
  }

  add_lifetime(lifetime_s)
  {
    this.goal_lifetime_s_ += lifetime_s;
  }

  get_param(param_index)
  {
    if (param_index < 0 || param_index > this.goal_params_.length - 1)
    {
      return null;
    }
    return this.goal_params_[param_index];
  }

  remove_from_parent()
  {
    assert(parent !== null, "Tried to remove from null parent!");
    utils.array_shift_delete(this.parent.subgoals_, this);
  }

  add_subgoal(goal_id, goal_lifetime_s, ...goal_params)
  {
    if (this.subgoals_.length > 0 && this.subgoals_[0].is_active)
    {
      this.subgoals_[0].terminate_goal();
    }

    const subgoal = this.manager_.create_goal(goal_id, goal_lifetime_s, goal_params, this);
    this.subgoals_.push(subgoal);
  }

  clear_subgoal()
  {
    if (this.has_subgoal())
    {
      let goal = this.get_subgoal();
      if (goal.is_active)
      {
        goal.terminate_goal();
      }
    }

    this.subgoals_.length = 0;
  }

  get_subgoal()
  {
    if (this.subgoals_.length === 0)
    {
      return this;
    }

    return this.subgoals_[0].get_subgoal();
  }

  has_subgoal()
  {
    return this.subgoals_.length > 0;
  }

  set_subgoal_result(result)
  {
    this.latest_subgoal_result_ = result;
  }

  tick(delta_time_s)
  {
    this.goal_lifetime_s_ -= delta_time_s;
  }

  activate_goal()
  {
    this.is_active_ = true;

    this.activate(this.ai_);
  }

  update_status()
  {
    this.goal_status_ = this.update(this.ai_);
  }

  terminate_goal()
  {
    this.terminate(this.ai_);
  }

  // PURE VIRTUAL FUNCTIONS

  activate(ai)
  {
    assert(false, 'No override defined for `activate`: ' + this.constructor.name);
    return;
  }

  update(ai)
  {
    assert(false, 'No override defined for `update`: ' + this.constructor.name);
    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    assert(false, 'No override defined for `terminate`: ' + this.constructor.name);
    return;
  }

  interrupt(ai)
  {
    assert(false, 'No override defined for `interrupt`: ' + this.constructor.name);
    return false;
  }
};

export {
  eGoalResult,
  eGoal,
  Goal,
};
