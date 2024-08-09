import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_Template extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Template, goal_lifetime_s, goal_params);
  }

  activate(ai)
  {
    return;
  }

  update(ai)
  {
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

// export { Goal_Template };
