import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_MoveToPosition extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Patroling, goal_lifetime_s, goal_params);
  }

  activate(ai)
  {
    // TODO: assert ai is not moving?

    const goal_position = this.get_param(0);
    const movement_type = this.get_param(1);
    ai.request_move_towards(goal_position, movement_type);

    ai.set_animation_param("walk", true);

    return;
  }

  update(ai)
  {
    if (ai.has_reached_move_target())
    {
      ai.set_animation_param("walk", false);
      return eGoalResult.GR_Success;
    }
    else if (this.lifetime <= 0.0)
    {
      ai.set_animation_param("walk", false);
      return eGoalResult.GR_Failed;
    }

    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    ai.clear_move_target();
    return;
  }

  interrupt(ai)
  {
    return false;
  }
};

export { Goal_MoveToPosition };
