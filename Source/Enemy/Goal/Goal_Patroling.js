import { component_enemy_movement } from "../../Components/EnemyMovement";
import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_Patroling extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Patroling, goal_lifetime_s, goal_params);
  }

  activate(ai)
  {
    const path = this.get_param(0);

    for (const p of path)
    {
      this.add_subgoal(eGoal.G_TurnTowards, 2.5, p);
      this.add_subgoal(eGoal.G_MoveToPosition, 60.0, p, component_enemy_movement.eMovementType.MT_Walking);
      this.add_subgoal(eGoal.G_Wait, 1.5);
    }

    return;
  }

  update(ai)
  {
    if (this.has_subgoal() === false)
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

export { Goal_Patroling };
