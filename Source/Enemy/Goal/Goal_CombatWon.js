import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_CombatWon extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_CombatWon, goal_lifetime_s, goal_params);
  }

  activate(ai)
  {
    ai.unregister_combat();

    ai.set_animation_param("alarm_idle", true);
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

export { Goal_CombatWon };
