import * as THREE from 'three';
import { Goal, eGoal, eGoalResult } from "../Goal";
import { env } from '../../Env';
import { component_enemy_movement } from '../../Components/EnemyMovement';


class Goal_CombatMoveAttackPosition extends Goal
{
  static k_num_of_points = 16;

  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_CombatMoveAttackPosition, goal_lifetime_s, goal_params);

    this.position_found_ = true;

    this.position_buffer_ = new THREE.Vector3();
    this.direction_buffer_ = new THREE.Vector3();
  }

  activate(ai)
  {
    // Get a couple of points from navmesh
    // Rank the points for:
    //   - can raycast player
    //   - distance from player
    //   - distance from current
    //   - is in front of player

    const player_info = ai.get_player_info();
    const player_position = player_info.position;
    const player_direction = player_info.direction;
    const search_distance = ai.distance_follow;
    const ai_position = ai.get_current_position();
    // const ai_direction = ai.get_current_direction();

    const calculate_position_score = (point) =>
    {
      const score_weights = [
        0.4,  // player in view
        0.2,  // ai distance
        0.3,  // player distance
        0.1,  // direction
      ];

      const min_distance = ai.distance_danger;
      const max_distance = ai.distance_follow;
      // const spread = (max_distance - min_distance) * 0.5;
      const optimal_distance = (min_distance + max_distance) * 0.5;

      this.position_buffer_.set(point.x, point.y, point.z);
      this.direction_buffer_.copy(player_position).sub(this.position_buffer_);

      // Factor 1: Is player in view
      const is_player_in_view = ai.check_player_in_view(this.position_buffer_);
      const score_in_view = is_player_in_view ? 1.0 : 0.0;

      // Factor 2: Distance to AI
      const distance_to_ai = this.position_buffer_.distanceTo(ai_position);
      const score_distance_to_ai = 1.0 / (1.0 + distance_to_ai)

      // Factor 3: Distance to Player (Gaussian-like Score Function)
      const distance_to_player = this.position_buffer_.distanceTo(player_position);
      // const score_distance_to_player = Math.max(0.0, 1.0 - Math.pow(((distance_to_player - optimal_distance) / spread), 2))
      const sigma = (max_distance - min_distance) / 4
      const score_distance_to_player = (distance_to_player < min_distance || distance_to_player > max_distance)
        ? 0.0
        : Math.exp(-(Math.pow((distance_to_player - optimal_distance), 2)) / (2 * Math.pow(sigma, 2)));

      // Factor 4: Direction angle
      const direction_angle_degrees = this.direction_buffer_.angleTo(player_direction) * THREE.MathUtils.RAD2DEG;
      const score_direction_angle = direction_angle_degrees / 180.0;

      // Composite score using the weighted sum
      const composite_score = (
        score_weights[0] * score_in_view +
        score_weights[1] * score_distance_to_ai +
        score_weights[2] * score_distance_to_player +
        score_weights[3] * score_direction_angle
      )
      
      return composite_score
    };

    let points = [];

    for (let i = 0; i < Goal_CombatMoveAttackPosition.k_num_of_points; ++i)
    {
      const { success, point } = ai.get_random_point_circle(player_position, search_distance);
      if (success === false)
      {
        this.position_found_ = false;
        break;
      }
      points.push({point: point, score: calculate_position_score(point)});
    }

    if (this.position_found_ === false)
    {
      return;
    }

    points.sort((p1, p2) => p2.score - p1.score);

    const ap = points[0].point;
    this.position_buffer_.set(ap.x, ap.y, ap.z);
    this.add_subgoal(eGoal.G_MoveToPosition, 60.0, this.position_buffer_, component_enemy_movement.eMovementType.MT_Running);

    if (env.DEBUG_MODE)
    {
      ai.set_debug_random_points(points);
    }

    return;
  }

  update(ai)
  {
    if (ai.is_player_alive() === false)
    {
      this.clear_subgoal();
      return eGoalResult.GR_Success;
    }

    if (this.position_found_ === false)
    {
      return eGoalResult.GR_Failed;
    }

    if (this.has_subgoal() === false)
    {
      // ai.add_topgoal(eGoal.G_CombatIdle, 60.0);
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

export { Goal_CombatMoveAttackPosition };
