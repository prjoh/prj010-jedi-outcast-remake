import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_Wait extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Wait, goal_lifetime_s, goal_params);
  }

  activate(ai)
  {
    return;
  }

  update(ai)
  {
    if (this.lifetime <= 0.0)
    {
      return eGoalResult.GR_Success;
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

export { Goal_Wait };
