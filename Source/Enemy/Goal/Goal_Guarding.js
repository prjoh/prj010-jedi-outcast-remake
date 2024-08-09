import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_Guarding extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Guarding, goal_lifetime_s, goal_params);

    this.init_lifetime_s_ = goal_lifetime_s;
  }

  activate(ai)
  {
    const animation_param_id = this.get_param(0);
    ai.set_animation_param(animation_param_id, 0);
    return;
  }

  update(ai)
  {
    if (this.lifetime <= 0.0)
    {
      const animation_param_id = this.get_param(0);
      const chance = ai.get_random_int(1, 100);
      if (chance < 15)
      {
        ai.set_animation_param(animation_param_id, 1);
        this.add_lifetime(this.init_lifetime_s_);
      }
      else if (chance < 30)
      {
        ai.set_animation_param(animation_param_id, 2);
        this.add_lifetime(this.init_lifetime_s_);
      }
      else
      {
        ai.set_animation_param(animation_param_id, 0);
        this.add_lifetime(this.init_lifetime_s_);
      }
    }

    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    return;
  }

  interrupt(ai)
  {
    return false;
  }
};

export { Goal_Guarding };
