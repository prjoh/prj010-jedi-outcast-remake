import * as THREE from 'three';
import { component_enemy_movement } from "../../Components/EnemyMovement";
import { Goal, eGoal, eGoalResult } from "../Goal";
import { eSensorState } from '../EnemyBehavior';


class Goal_Investigate extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Investigate, goal_lifetime_s, goal_params);

    this.investigate_position_ = new THREE.Vector3();
    this.return_position_ = new THREE.Vector3();
    this.return_direction_ = new THREE.Vector3();
    this.lost_suspicion_ = false;
    this.return_ = false;
  }

  activate(ai)
  {
    const poi = this.get_param(0);

    const position = ai.get_current_position();
    const direction = ai.get_current_direction();

    this.return_position_.copy(position);
    this.return_direction_.copy(position).add(direction);

    this.create_subgoals_(ai, poi);

    ai.set_animation_param("alarm_idle", true);

    return;
  }

  update(ai)
  {
    if (ai.is_sensor_state_set(eSensorState.SS_ViewPlayer))
    {
      ai.set_animation_param("alarm_idle", false);
      ai.add_topgoal(eGoal.G_CombatIdle, 60.0);
      return eGoalResult.GR_Success;
    }

    if (this.lost_suspicion_ === false)
    {
      this.lost_suspicion_ = ai.is_sensor_state_set(eSensorState.SS_ViewSuspicious) === false;
    }
    else if (ai.is_sensor_state_set(eSensorState.SS_ViewSuspicious))
    {
      ai.set_animation_param("alarm_idle", true);

      this.lost_suspicion_ = false;
      this.return_ = false;

      this.clear_subgoal();

      const poi = ai.get_point_of_interest();
      this.create_subgoals_(ai, poi);

      return eGoalResult.GR_Continue;
    }

    if (this.has_subgoal() === false)
    {
      if (this.return_ === false)
      {
        this.return_ = true;

        ai.set_animation_param("alarm_idle", false);

        const is_alarm_state = false;

        this.add_subgoal(eGoal.G_TurnTowards, 3.0, this.return_position_, is_alarm_state);
        this.add_subgoal(eGoal.G_MoveToPosition, 60.0, this.return_position_, component_enemy_movement.eMovementType.MT_Walking);
        this.add_subgoal(eGoal.G_TurnTowards, 3.0, this.return_direction_, is_alarm_state);
      }
      else
      {
        return eGoalResult.GR_Success;
      }
    }

    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    ai.set_animation_param("alarm_idle", false);

    this.clear_subgoal();

    return;
  }

  interrupt(ai)
  {
    return false;
  }

  create_subgoals_(ai, point_of_interest)
  {
    this.investigate_position_.copy(point_of_interest);

    const is_alarm_state = true;

    this.add_subgoal(eGoal.G_TurnTowards, 1.0, this.investigate_position_, is_alarm_state);
    this.add_subgoal(eGoal.G_Wait, 0.5);
    this.add_subgoal(eGoal.G_MoveToPosition, 60.0, this.investigate_position_, component_enemy_movement.eMovementType.MT_Searching);
    this.add_subgoal(eGoal.G_Wait, 4.0);
  }
};

export { Goal_Investigate };
