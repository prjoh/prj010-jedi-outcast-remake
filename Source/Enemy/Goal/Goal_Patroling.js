import { component_enemy_movement } from "../../Components/EnemyMovement";
import { eSensorState } from "../EnemyBehavior";
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

    const is_alarm_state = false;

    for (const p of path)
    {
      this.add_subgoal(eGoal.G_TurnTowards, 2.5, p, is_alarm_state);
      this.add_subgoal(eGoal.G_MoveToPosition, 60.0, p, component_enemy_movement.eMovementType.MT_Walking);
      this.add_subgoal(eGoal.G_Wait, 1.5);
    }

    return;
  }

  update(ai)
  {
    if (ai.is_sensor_state_set(eSensorState.SS_ViewPlayer))
    {
      ai.add_topgoal(eGoal.G_CombatIdle, 60.0);
      return eGoalResult.GR_Success;
    }

    if (this.has_subgoal() === false)
    {
      return eGoalResult.GR_Success;
    }

    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    this.clear_subgoal();

    return;
  }

  interrupt(ai)
  {
    return false;
  }
};

export { Goal_Patroling };
