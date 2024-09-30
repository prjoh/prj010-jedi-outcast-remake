import { log } from "../Log";
import { eGoalResult } from "./Goal";
import { GoalFactory } from "./GoalFactory";


class GoalManager
{
  constructor(ai)
  {
    this.ai_ = ai;
  
    this.initial_topgoal_ = null;

    this.current_topgoal_ = null;
  }

  create_goal(goal_id, goal_lifetime_s, goal_params, parent = null)
  {
    return GoalFactory.create(this.ai_, this, goal_id, goal_lifetime_s, goal_params, parent);
  }

  init_topgoal(goal_id, goal_lifetime_s, goal_params)
  {
    this.initial_topgoal_ = this.create_goal(goal_id, goal_lifetime_s, goal_params);

    this.current_topgoal_ = this.initial_topgoal_;
    this.current_topgoal_.activate_goal(this.ai_);
  }

  add_topgoal(goal_id, goal_lifetime_s, goal_params)
  {
    this.terminate_goal();

    this.current_topgoal_ = this.create_goal(goal_id, goal_lifetime_s, goal_params);
    this.current_topgoal_.activate_goal(this.ai_);
  }

  terminate_goal()
  {
    if (this.current_topgoal_ === null)
    {
      log.error('Tried terminating null goal.');
      return;
    }

    this.current_topgoal_.terminate(this.ai_);
  }

  tick(delta_time_s)
  {
    if (this.current_topgoal_ === null)
    {
      log.error('Tried updating null goal.');
      return;
    }
  
    this.current_topgoal_.tick(delta_time_s);

    this.current_topgoal_.update_status(this.ai_);
    const topgoal_status = this.current_topgoal_.status;

    if (topgoal_status === eGoalResult.GR_Success)
    {
      this.current_topgoal_ = this.initial_topgoal_;
      this.current_topgoal_.activate_goal(this.ai_);
    }
    else if (topgoal_status === eGoalResult.GR_Failed)
    {
      log.error(`Topgoal failed: ${this.ai_.constructor.name} -> ${this.current_topgoal_.constructor.name}`);
      this.current_topgoal_ = this.initial_topgoal_;
      this.current_topgoal_.activate_goal(this.ai_);
    }
    else
    {
      let current_subgoal = this.current_topgoal_.get_subgoal();

      // If no subgoal exist, we return early
      if (current_subgoal.uuid === this.current_topgoal_.uuid)
      {
        return;
      }

      if (current_subgoal.is_active === false)
      {
        current_subgoal.activate_goal(this.ai_);
      }

      current_subgoal.tick(delta_time_s);
      current_subgoal.update_status(this.ai_);

      let subgoal_parent = current_subgoal.parent;
      subgoal_parent.set_subgoal_result(current_subgoal.status);

      if (current_subgoal.status === eGoalResult.GR_Success || current_subgoal.status === eGoalResult.GR_Failed)
      {
        current_subgoal.remove_from_parent();

        let next_subgoal = this.current_topgoal_.get_subgoal();

        // If no subgoal exist, we return early
        if (next_subgoal.uuid === this.current_topgoal_.uuid)
        {
          return;
        }

        if (next_subgoal.is_active === false)
        {
          next_subgoal.activate_goal(this.ai_);
        }
      }
    }
  }
}

export { GoalManager };
