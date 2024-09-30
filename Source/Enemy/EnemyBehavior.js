import * as THREE from 'three';
import { MathUtils } from "three";

import { GoalManager } from "./GoalManager";
import { assert } from "../Assert";
import { BitFlag } from "../BitFlag";
import { component_enemy_sensors } from "../Components/EnemySensors";
import { log } from '../Log';
import { component_transform } from '../Components/Transform';
import { eCollisionGroup, PLAYER_HEIGHT } from '../Config';
import { Goal_CombatMoveAttackPosition } from './Goal/Goal_CombatMoveAttackPosition';
import { component_player_state } from '../Components/PlayerState';


const eBehaviorID = Object.freeze({
  BID_Stormtrooper01:  0,
  BID_Stormtrooper02:  1,
});

const eSensorState = Object.freeze({
  SS_HeardNoise:      1 << 0,
  SS_HeardFriend:     1 << 1,
  SS_ViewSuspicious:  1 << 2,
  SS_ViewPlayer:      1 << 3,
});

class EnemyBehavior
{
  constructor(behavior_id, entity, params)
  {
    this.behavior_id_ = behavior_id;
    this.entity_ = entity;

    this.goal_manager_ = new GoalManager(this);

    this.is_dead_ = false;

    this.sensor_flags_ = new BitFlag();
    this.point_of_interest_ = new THREE.Vector3();

    this.player_info_ = {
      position: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      distance: -1,
      is_alive: true,
    };

    this.distance_danger_ = params.distance_danger;
    this.distance_follow_ = params.distance_follow;

    this.is_in_combat_ = false;

    this.raycast_position_buffer1_ = new THREE.Vector3();
    this.raycast_position_buffer2_ = new THREE.Vector3();
  }

  tick(delta_time_s)
  {
    if (this.is_alive() === false)
    {
      return;
    }

    this.clear_sensor_states();

    const c_sensors = this.entity_.get_component("EnemySensorsComponent");
    const view_state = c_sensors.current_view_state;

    if (view_state === component_enemy_sensors.eViewSensorState.VSS_Suspicious)
    {
      this.set_sensor_state(eSensorState.SS_ViewSuspicious);

      const c_sensors = this.entity_.get_component("EnemySensorsComponent");
      this.point_of_interest_.copy(c_sensors.point_of_interest);
    }
    else if (view_state === component_enemy_sensors.eViewSensorState.VSS_Detected)
    {
      this.set_sensor_state(eSensorState.SS_ViewPlayer);

      const c_sensors = this.entity_.get_component("EnemySensorsComponent");
      this.point_of_interest_.copy(c_sensors.point_of_interest);
    }

    const e_player = this.entity_.manager.get_entity("PlayerMesh");
    const c_transform = e_player.get_component("Transform");
    const c_player_state = e_player.get_component("PlayerState");
    
    this.player_info_.position.copy(c_transform.position);
    this.player_info_.direction.copy(c_transform.forward);
    this.player_info_.distance = this.get_current_position().distanceTo(this.player_info_.position);
    this.player_info_.is_alive = c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Dead) === false;

    this.goal_manager_.tick(delta_time_s);
  }

  //////////////////////
  // Topgoal handling //
  //////////////////////

  init_topgoal_(goal_id, goal_lifetime_s, ...goal_params)
  {
    this.goal_manager_.init_topgoal(goal_id, goal_lifetime_s, goal_params);
  }

  add_topgoal(goal_id, goal_lifetime_s, ...goal_params)
  {
    this.goal_manager_.add_topgoal(goal_id, goal_lifetime_s, goal_params);
  }

  ///////////
  // Utils //
  ///////////

  get_random_int(from, to)
  {
    return MathUtils.randInt(from, to);
  }

  get_random_float(from, to)
  {
    return MathUtils.randFloat(from, to);
  }

  ////////////////
  // Navigation //
  ////////////////

  get_next_waypoint(path_position)
  {
    const e_level = this.entity_.manager.get_entity("Level");
    const c_nav_mesh = e_level.get_component("NavMeshComponent");

    const c_transform = this.entity_.get_component("Transform");

    const path = c_nav_mesh.find_path(c_transform.position, path_position);
    assert(path.length > 1, "Unable to retrieve valid path.");
    return path[1];
  }

  get_random_point_circle(position, radius)
  {
    const e_level = this.entity_.manager.get_entity("Level");
    const c_nav_mesh = e_level.get_component("NavMeshComponent");
    return c_nav_mesh.find_random_point_circle(position, radius);
  }

  ///////////////////////
  // Transform getters //
  ///////////////////////

  get_current_position()
  {
    let c_transform = this.entity_.get_component("Transform");
    return c_transform.position;
  }

  get_current_rotation()
  {
    let c_transform = this.entity_.get_component("Transform");
    return c_transform.rotation;
  }

  get_current_direction()
  {
    let c_transform = this.entity_.get_component("Transform");
    return c_transform.forward;
  }

  ///////////////
  // Animation //
  ///////////////

  set_animation_param(param_id, param_value)
  {
    // log.debug(`${param_id} - ${param_value}`);

    let c_controller = this.entity_.get_component("AnimationController");
    let fsm = c_controller.animation_fsm_;
    fsm.set_parameter_value(param_id, param_value);
  }

  //////////////
  // Movement //
  //////////////

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

  is_moving()
  {
    let c_movement = this.entity_.get_component("EnemyMovementComponent");
    return c_movement.is_moving;
  }

  get_move_target()
  {
    let c_movement = this.entity_.get_component("EnemyMovementComponent");
    return c_movement.move_target;
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

  /////////////////
  // Hit / Death //
  /////////////////

  hit()
  {
    // TODO: Not implemented
    // this.set_animation_param()
  }

  strike_death()
  {
    if (this.is_dead_)
    {
      return;
    }
    this.set_animation_param(`fight_idle`, true);
    const rand = this.get_random_int(0, 2);
    const param = `is_dead_strike${rand}`;
    this.set_animation_param(param, true);
    this.is_dead_ = true;
  }

  shot_death()
  {
    if (this.is_dead_)
    {
      return;
    }
    this.set_animation_param(`fight_idle`, true);
    this.set_animation_param(`is_dead_shot`, true);
    this.is_dead_ = true;
  }

  on_death_enter()
  {
    this.unregister_combat();

    let c_trigger = this.entity_.get_component("CylinderTrigger");
    let e_singletons = this.entity_.manager.get_entity("Singletons");
    let c_physics = e_singletons.get_component("PhysicsState");
    c_physics.remove_trigger(c_trigger);

    let e_audio = this.entity_.manager.get_entity(this.entity_.name + "Audio_Voice");
    let c_emitter = e_audio.get_component("PositionalAudioEmitterComponent");
    c_emitter.stop();
    c_emitter.set_audio(`death${this.get_random_int(1, 3)}`);
    c_emitter.play();
  }

  on_death_exit()
  {
    let c_collider = this.entity_.get_component("CapsuleCollider");
    let e_singletons = this.entity_.manager.get_entity("Singletons");
    let c_physics = e_singletons.get_component("PhysicsState");
    c_physics.remove_collider(c_collider);
  }

  is_alive()
  {
    let c_health = this.entity_.get_component("HealthComponent");
    return c_health.is_alive();
  }

  ///////////////////
  // Sensor states //
  ///////////////////
  clear_sensor_states()
  {
    this.sensor_flags_.clear();
  }

  set_sensor_state(sensor_state)
  {
    this.sensor_flags_.set(sensor_state);
  }

  unset_sensor_state(sensor_state)
  {
    this.sensor_flags_.unset(sensor_state);
  }

  is_sensor_state_set(sensor_state)
  {
    return this.sensor_flags_.is_set(sensor_state);
  }

  get_point_of_interest()
  {
    return this.point_of_interest_;
  }

  ////////////
  // Combat //
  ////////////
  get distance_danger()
  {
    return this.distance_danger_;
  }

  get distance_follow()
  {
    return this.distance_follow_;
  }

  get is_in_combat()
  {
    return this.is_in_combat_;
  }

  register_combat()
  {
    let e_singletons = this.entity_.manager.get_entity("Singletons");
    let combat_manager = e_singletons.get_component("CombatManager");
    let c_behavior = this.entity_.get_component("EnemyBehaviorComponent");
    combat_manager.register_ai(c_behavior);
  }

  unregister_combat()
  {
    let e_singletons = this.entity_.manager.get_entity("Singletons");
    let combat_manager = e_singletons.get_component("CombatManager");
    let c_behavior = this.entity_.get_component("EnemyBehaviorComponent");
    combat_manager.unregister_ai(c_behavior);
  }

  set_is_in_combat(is_in_combat)
  {
    this.is_in_combat_ = is_in_combat;
  }

  get_player_info()
  {
    return this.player_info_;
  }

  is_player_in_view()
  {
    this.raycast_position_buffer1_.copy(this.get_current_position());
    const p = this.raycast_position_buffer1_;
    this.raycast_position_buffer1_.set(p.x, p.y + PLAYER_HEIGHT, p.z);
    return this.check_player_in_view(this.raycast_position_buffer1_);
  }

  is_player_alive()
  {
    return this.player_info_.is_alive;
  }

  check_player_in_view(position)
  {
    let e_singletons = this.entity_.manager.get_entity("Singletons");
    let c_physics = e_singletons.get_component("PhysicsState");

    this.raycast_position_buffer2_.copy(this.player_info_.position);
    const p = this.raycast_position_buffer2_;
    this.raycast_position_buffer2_.set(p.x, p.y + PLAYER_HEIGHT, p.z);

    let hits = c_physics.ray_test(
      position, 
      this.raycast_position_buffer2_, 
      eCollisionGroup.CG_Enemy, 
      eCollisionGroup.CG_All & ~eCollisionGroup.CG_EnemyHitBox & ~eCollisionGroup.CG_PlayerDeflector);
    if (hits.length > 0)
    {
      const collision_object = hits[0].collision_object;
      const collision_group = collision_object.getBroadphaseHandle().get_m_collisionFilterGroup();
      return collision_group === eCollisionGroup.CG_Player;
    }

    return false;
  }

  set_debug_random_points(sorted_points)
  {
    let c_behavior = this.entity_.get_component("EnemyBehaviorComponent");
    
    const get_color = (score) => {
      const c1 = new THREE.Color(1, 0, 0);
      const c2 = new THREE.Color(0, 1, 0);
      return c1.lerp(c2, score);
    };

    let min = sorted_points[sorted_points.length - 1].score;
    const max = sorted_points[0].score;
    if (min === max) { min = 0 };
    const normalized_scores = sorted_points.map(p => (p.score - min) / (max - min));

    for (let i = 0; i < Goal_CombatMoveAttackPosition.k_num_of_points; ++i)
    {
      let debug_mesh = c_behavior.debug_random_positions_[i];
      let p = sorted_points[i];
      let score = normalized_scores[i];

      debug_mesh.position.set(p.point.x, p.point.y, p.point.z)

      const color = get_color(score);
      debug_mesh.material.color.copy(color);
    }

    let p = c_behavior.debug_random_positions_[0].position;
    p.set(p.x, p.y + 1.0, p.z);
  }
};

export {
  EnemyBehavior,
  eBehaviorID,
  eSensorState,
};
