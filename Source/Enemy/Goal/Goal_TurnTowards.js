import * as THREE from 'three';

import { MathUtils } from "three";
import { Goal, eGoal, eGoalResult } from "../Goal";


class Goal_TurnTowards extends Goal
{
  constructor(goal_lifetime_s, goal_params)
  {
    super(eGoal.G_Template, goal_lifetime_s, goal_params);

    this.goal_direction = new THREE.Vector3();
    this.turn_direction = new THREE.Vector3();
    this.param_id = null;
  }

  activate(ai)
  {
    const path_position = this.get_param(0);
    const goal_position = ai.get_next_waypoint(path_position);

    const from_position = ai.get_current_position();

    this.goal_direction.copy(goal_position)
                        .sub(from_position)
                        .normalize();

    const forward = ai.get_current_direction();

    this.turn_direction.copy(forward)
                        .cross(this.goal_direction)
                        .normalize();

    const angle_radians = forward.angleTo(this.goal_direction);
    const angle_degrees = MathUtils.radToDeg(angle_radians);
    const turn_dir = Math.sign(this.turn_direction.y);

    const clamp_angle = (angle_degrees) => {
      const angles = [0, 45, 90, 135, 180];
      return angles.reduce((prev, curr) => 
          Math.abs(curr - angle_degrees) < Math.abs(prev - angle_degrees) ? curr : prev
      );
    };

    let clamped_angles = Math.trunc(clamp_angle(angle_degrees));

    if (clamped_angles > 0)
    {
      // let anim_param_id = "turn_left180";
      let anim_param_id = "turn_";
      if (turn_dir > 0)
      {
        anim_param_id += `left${clamped_angles}`;
      }
      else
      {
        anim_param_id += `right${clamped_angles}`;
      }

      console.log(`TurnTowards: ${anim_param_id} | ${turn_dir * angle_degrees}`);
      ai.set_animation_param(anim_param_id, true);

      this.param_id = anim_param_id;
      // ai.request_turn_towards(180.0);
    }

    return;
  }

  update(ai)
  {

    if (this.lifetime <= 2.0 && this.param_id !== null)
    {
      ai.set_animation_param(this.param_id, false);
    }

    if (this.lifetime <= 0.0)
    {
      return eGoalResult.GR_Success;
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

export { Goal_TurnTowards };
