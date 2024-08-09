import { MathUtils } from "three";

import { GoalManager } from "./GoalManager";
import { assert } from "../Assert";


const eBehaviorID = Object.freeze({
  BID_Stormtrooper01:  0,
  BID_Stormtrooper02:  1,
});

class EnemyBehavior
{
  constructor(behavior_id, entity)
  {
    this.behavior_id_ = behavior_id;
    this.entity_ = entity;

    this.goal_manager_ = new GoalManager(this);
  }

  init_topgoal_(goal_id, goal_lifetime_s, ...goal_params)
  {
    this.goal_manager_.init_topgoal(goal_id, goal_lifetime_s, goal_params);
  }

  add_topgoal(goal_id, goal_lifetime_s, ...goal_params)
  {
    this.goal_manager_.add_topgoal(goal_id, goal_lifetime_s, goal_params);
  }

  get_random_int(from, to)
  {
    return MathUtils.randInt(from, to);
  }

  get_random_float(from, to)
  {
    return MathUtils.randFloat(from, to);
  }

  get_next_waypoint(path_position)
  {
    const e_level = this.entity_.manager.get_entity("Level");
    const c_nav_mesh = e_level.get_component("NavMeshComponent");

    const c_transform = this.entity_.get_component("Transform");

    const path = c_nav_mesh.find_path(c_transform.position, path_position);
    assert(path.length > 1, "Unable to retrieve valid path.");
    return path[1];
  }

  get_current_position()
  {
    let c_transform = this.entity_.get_component("Transform");
    return c_transform.position;
  }

  get_current_direction()
  {
    let c_transform = this.entity_.get_component("Transform");
    return c_transform.forward;
  }

  set_animation_param(param_id, param_value)
  {
    let c_controller = this.entity_.get_component("AnimationController");
    let fsm = c_controller.animation_fsm_;
    fsm.set_parameter_value(param_id, param_value);
  }

  request_move_towards(goal_position, movement_type)
  {
    let c_movement = this.entity_.get_component("EnemyMovementComponent");

    assert(c_movement.is_moving === false, "Movement component already moving.");

    c_movement.set_move_target(goal_position, movement_type);
  }

  clear_move_target()
  {
    let c_movement = this.entity_.get_component("EnemyMovementComponent");
    return c_movement.set_move_target_reached();
  }

  has_reached_move_target()
  {
    let c_movement = this.entity_.get_component("EnemyMovementComponent");
    return c_movement.has_reached_move_target();
  }

  request_turn_towards(goal_angle)
  {
    let c_movement = this.entity_.get_component("EnemyMovementComponent");

    assert(c_movement.is_turning === false, "Movement component already turning.");

    c_movement.set_turn_target(goal_angle);
  }

  clear_turn_target()
  {
    let c_movement = this.entity_.get_component("EnemyMovementComponent");
    return c_movement.set_turn_target_reached();
  }

  has_reached_turn_target()
  {
    let c_movement = this.entity_.get_component("EnemyMovementComponent");
    return c_movement.has_reached_turn_target();
  }

  tick(delta_time_s)
  {
    // TODO: Check sensor states and store results in EnemyBehavior (e.g. has_detected_player, has_heard_noise, has_heard_friend)

    this.goal_manager_.tick(delta_time_s);
  }
};

export {
  EnemyBehavior,
  eBehaviorID,
};
