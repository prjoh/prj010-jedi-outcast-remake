import * as THREE from 'three';
import { assert } from "../../Assert";
import { component_enemy_movement } from "../../Components/EnemyMovement";
import { Goal, eGoal, eGoalResult } from "../Goal";
import { component_transform } from '../../Components/Transform';


class Goal_MoveToPosition extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Patroling, goal_lifetime_s, goal_params);

    this.param_id = null;
    this.movement_type_ = null;
    this.move_target_ = new THREE.Vector3();
    this.direction_to_player_ = new THREE.Vector3();
    this.direction_to_target_ = new THREE.Vector3();
    this.vector_buffer_ = new THREE.Vector3();
  }

  activate(ai)
  {
    // TODO: assert ai is not moving?

    const goal_position = this.get_param(0);
    this.movement_type_ = this.get_param(1);
    this.move_target_.copy(goal_position);
    ai.request_move_towards(this.move_target_, this.movement_type_);

    if (this.movement_type_ === component_enemy_movement.eMovementType.MT_Walking)
    {
      this.param_id = "walk";
      ai.set_animation_param(this.param_id, true);
    }
    else if (this.movement_type_ === component_enemy_movement.eMovementType.MT_Searching)
    {
      this.param_id = "alarm_walk";
      ai.set_animation_param(this.param_id, true);
    }
    else if (this.movement_type_ === component_enemy_movement.eMovementType.MT_Running)
    {
      if (ai.is_player_in_view() === false)
      {
        this.param_id = "fight_run_forward";
        ai.set_animation_param(this.param_id, true);
      }
    }
    else
    {
      assert(false, "No valid movement type passed!");
    }

    return;
  }

  update(ai)
  {
    if (this.movement_type_ === component_enemy_movement.eMovementType.MT_Running && ai.is_moving())
    {
      let next_param_id = null;

      if (ai.is_player_in_view() === false)
      {
        next_param_id = "fight_run_forward";
      }
      else
      {
        const player_info = ai.get_player_info();
        const player_position = player_info.position;
        const ai_position = ai.get_current_position();
        const move_target = ai.get_move_target();
    
        this.direction_to_player_.copy(player_position).sub(ai_position);
        this.direction_to_target_.copy(move_target).sub(ai_position);
  
        const angle_degrees = this.direction_to_player_.angleTo(this.direction_to_target_) * THREE.MathUtils.RAD2DEG;
  
        const perpendicular = this.vector_buffer_.crossVectors(this.direction_to_player_, this.direction_to_target_);
        const dot_product = perpendicular.dot(component_transform.YAxis);
        const is_moving_right = dot_product > 0 ? true : false;
  
        if (angle_degrees < 30.0)
        {
          next_param_id = "fight_run_forward";
        }
        else if (angle_degrees < 135.0)
        {
          if (is_moving_right)
          {
            next_param_id = "fight_run_left";
          }
          else
          {
            next_param_id = "fight_run_right";
          }
        }
        else
        {
          next_param_id = "fight_run_backward";
        }
      }

      if (next_param_id !== null && this.param_id !== next_param_id)
      {
        if (this.param_id !== null)
        {
          ai.set_animation_param(this.param_id, false);
        }
        this.param_id = next_param_id;
        ai.set_animation_param(this.param_id, true);
      }
    }

    if (ai.has_reached_move_target())
    {
      ai.set_animation_param(this.param_id, false);
      return eGoalResult.GR_Success;
    }
    else if (this.lifetime <= 0.0)
    {
      ai.set_animation_param(this.param_id, false);
      return eGoalResult.GR_Failed;
    }

    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    ai.clear_move_target();
    ai.set_animation_param(this.param_id, false);

    return;
  }

  interrupt(ai)
  {
    return false;
  }
};

export { Goal_MoveToPosition };
