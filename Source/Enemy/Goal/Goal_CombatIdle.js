import * as THREE from 'three';
import { Time } from "../../Time";
import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_CombatIdle extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_CombatIdle, goal_lifetime_s, goal_params);

    this.courage_timer_ = null;
    this.roll_courage_ = false;

    this.attack_timer_ = null;
    this.roll_attack_ = true;

    this.move_timer_ = null;
    this.move_position_ = false;

    this.direction_buffer_ = new THREE.Vector3();
  }

  activate(ai)
  {
    ai.set_is_in_combat(true);
    ai.set_animation_param("fight_idle", true);

    ai.register_combat();

    this.courage_timer_ = Time.create_timer(2.0, () => {
      this.roll_courage_ = true;
    });
    Time.start_timer(this.courage_timer_);

    this.attack_timer_ = Time.create_timer(1.5, () => {
      this.roll_attack_ = true;
    });
    Time.start_timer(this.attack_timer_);

    this.move_timer_ = Time.create_timer(5.0, () => {
      this.move_position_ = true;
    });
    Time.start_timer(this.move_timer_);

    return;
  }

  // TODO: Make SubGoals for combat
  //  - FindAttackPosition  (X)
  //  - MoveAwayFromPlayer  (X)
  //  - Attack              (X)

  //  - FindCover
  //  - CallForHelp

  //  - MoveToPlayer        (X)
  // TODO: We could use a hex grid just for checking current squad placement
  update(ai)
  {
    if (ai.is_player_alive() === false)
    {
      this.clear_subgoal();

      ai.set_is_in_combat(false);
      ai.set_animation_param("fight_idle", false);

      ai.add_topgoal(eGoal.G_CombatWon, 60.0);
      return eGoalResult.GR_Success;
    }

    if (this.has_subgoal() === true)
    {
      return eGoalResult.GR_Continue;
    }

    this.reset_timers_();
    
    const is_player_in_view = ai.is_player_in_view();

    if (this.move_position_ === true)
    {
      this.move_position_ = false;
      this.add_subgoal(eGoal.G_CombatMoveAttackPosition, 60.0);
    }

    if (is_player_in_view)
    {
      const player_info = ai.get_player_info();
      if (player_info.distance < ai.distance_danger)
      {
        if (this.roll_courage_ === true)
        {
          this.roll_courage_ = false;
          Time.reset_timer(this.courage_timer_);
          Time.start_timer(this.courage_timer_);

          const courage = ai.get_random_int(1, 100);
          if (courage < 30)
          {
            // Get distance from player
            this.add_subgoal(eGoal.G_CombatMoveAttackPosition, 60.0);

            Time.reset_timer(this.courage_timer_);
          }
        }
      }
      else if (player_info.distance > ai.distance_follow)
      {
        // Follow player
        this.add_subgoal(eGoal.G_CombatMoveAttackPosition, 60.0);
      }
      else
      {
        const player_info = ai.get_player_info();
        const player_position = player_info.position;
        const ai_position = ai.get_current_position();
        const ai_direction = ai.get_current_direction();
        this.direction_buffer_.copy(player_position).sub(ai_position);
        const direction_angle_degrees = this.direction_buffer_.angleTo(ai_direction) * THREE.MathUtils.RAD2DEG;
        const is_in_attack_range = direction_angle_degrees < 10.0;

        // Roll for attack
        if (is_in_attack_range && this.roll_attack_ === true)
        {
          this.roll_attack_ = false;
          Time.reset_timer(this.attack_timer_);
          Time.start_timer(this.attack_timer_);

          const attack = ai.get_random_int(1, 100);
          if (attack < 75)
          {
            const attack_time = ai.get_random_float(1.5, 4.0);
            this.add_subgoal(eGoal.G_CombatAttackStanding, attack_time);

            Time.reset_timer(this.attack_timer_);
          }
        }

        // TODO: Cover roll?
      }
    }
    else
    {
      this.add_subgoal(eGoal.G_CombatMoveAttackPosition, 60.0);
    }

    return eGoalResult.GR_Continue;
  }

  terminate(ai)
  {
    // ai.set_animation_param("fight_run_shoot", false);
    ai.set_animation_param("fight_idle", false);
    return;
  }

  interrupt(ai)
  {
    return false;
  }

  reset_timers_()
  {
    if (Time.is_timer_active(this.attack_timer_) === false)
    {
      Time.reset_timer(this.attack_timer_);
      Time.start_timer(this.attack_timer_);
    }

    if (Time.is_timer_active(this.courage_timer_) === false)
    {
      Time.reset_timer(this.courage_timer_);
      Time.start_timer(this.courage_timer_);
    }

    if (Time.is_timer_active(this.move_timer_) === false)
    {
      Time.reset_timer(this.move_timer_);
      Time.start_timer(this.move_timer_);
    }
  }

  try_walk_attack_(ai)
  {
    const attack = ai.get_random_int(1, 100);
    if (attack < 70)
    {
      const attack_time = ai.get_random_float(1.5, 3.0);
      this.add_subgoal(eGoal.G_CombatAttackWalking, attack_time);
    }
  }
};

export { Goal_CombatIdle };
