import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_CombatAttackStanding extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_CombatAttackStanding, goal_lifetime_s, goal_params);
  }

  activate(ai)
  {
    ai.set_animation_param("fight_shoot_rapid", true);
    return;
  }

  update(ai)
  {
    if (ai.is_player_alive() === false)
    {
      ai.set_animation_param("fight_shoot_rapid", false);
      return eGoalResult.GR_Success;
    }

    if (this.lifetime <= 0.0)
    {
      ai.set_animation_param("fight_shoot_rapid", false);
      // ai.add_topgoal(eGoal.G_CombatIdle, 60.0);
      return eGoalResult.GR_Success;
    }

    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    ai.set_animation_param("fight_shoot_rapid", false);
    return;
  }

  interrupt(ai)
  {
    return false;
  }
};

export { Goal_CombatAttackStanding };
