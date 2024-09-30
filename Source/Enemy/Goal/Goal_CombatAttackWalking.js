import * as THREE from 'three';
import { Goal, eGoal, eGoalResult } from "../Goal";
import { component_enemy_movement } from '../../Components/EnemyMovement';


class Goal_CombatAttackWalking extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_CombatAttackWalking, goal_lifetime_s, goal_params);

    this.direction_buffer_ = new THREE.Vector3();
    this.target_buffer_ = new THREE.Vector3();
  }

  activate(ai)
  {
    const ai_position = ai.get_current_position();
    const player_info = ai.get_player_info();
    const player_position = player_info.position;

    this.direction_buffer_.copy(player_position).sub(ai_position).multiplyScalar(2.0);
    this.target_buffer_.copy(ai_position).add(this.direction_buffer_);

    this.add_subgoal(eGoal.G_MoveToPosition, 60.0, this.target_buffer_, component_enemy_movement.eMovementType.MT_Walking);
    ai.set_animation_param("fight_walk_shoot", true);

    return;
  }

  update(ai)
  {
    if (ai.is_player_alive() === false)
    {
      ai.set_animation_param("fight_walk_shoot", false);
      return eGoalResult.GR_Success;
    }

    if (this.lifetime <= 0.0)
    {
      ai.set_animation_param("fight_walk_shoot", false);
      return eGoalResult.GR_Success;
    }

    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    ai.set_animation_param("fight_walk_shoot", false);
    return;
  }

  interrupt(ai)
  {
    return false;
  }
};

export { Goal_CombatAttackWalking };
