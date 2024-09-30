import { Time } from "../../Time";
import { eSensorState } from "../EnemyBehavior";
import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_Guarding extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Guarding, goal_lifetime_s, goal_params);

    this.init_lifetime_s_ = goal_lifetime_s;

    // this.exit_shoot = 3.0;
    // this.timer = null;
  }

  activate(ai)
  {
    // this.timer = Time.create_timer(5.0, () => {
    //   this.exit_shoot = 3.0;
    //   ai.set_animation_param("alarm_idle", true);
    //   ai.set_animation_param("fight_idle", true);
    //   ai.set_animation_param("fight_shoot_rapid", true);
    // }, true);
    // Time.start_timer(this.timer);

    const animation_param_id = this.get_param(0);
    ai.set_animation_param(animation_param_id, 0);

    return;
  }

  update(ai)
  {
    // if (this.exit_shoot > 0.0)
    // {
    //   this.exit_shoot -= Time.delta_time_s;

    //   if (this.exit_shoot <= 0.0)
    //   {
    //     ai.set_animation_param("alarm_idle", false);
    //     ai.set_animation_param("fight_idle", false);
    //     ai.set_animation_param("fight_shoot_rapid", false);
    //   }
    // }

    // ai.set_animation_param("alarm_idle", true);
    // ai.set_animation_param("fight_idle", true);
    // ai.add_topgoal(eGoal.G_CombatAttackStanding, 600.0);
    // return eGoalResult.GR_Continue;
    
    if (ai.is_sensor_state_set(eSensorState.SS_ViewSuspicious))
    {
      const poi = ai.get_point_of_interest();
      ai.add_topgoal(eGoal.G_Investigate, 60.0, poi);
      return eGoalResult.GR_Success;
    }

    if (ai.is_sensor_state_set(eSensorState.SS_ViewPlayer))
    {
      ai.add_topgoal(eGoal.G_CombatIdle, 60.0);
      return eGoalResult.GR_Success;
    }

    if (this.lifetime <= 0.0)
    {
      const animation_param_id = this.get_param(0);
      const chance = ai.get_random_int(1, 100);

      this.add_lifetime(this.init_lifetime_s_);

      if (chance < 25)
      {
        ai.set_animation_param(animation_param_id, 1);
      }
      else if (chance < 50)
      {
        ai.set_animation_param(animation_param_id, 2);
      }
      else
      {
        ai.set_animation_param(animation_param_id, 0);
      }
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

export { Goal_Guarding };
