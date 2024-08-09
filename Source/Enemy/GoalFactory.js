import { assert } from "../Assert";
import { eGoal } from "./Goal";
import { Goal_Guarding } from "./Goal/Goal_Guarding";
import { Goal_MoveToPosition } from "./Goal/Goal_MoveToPosition";
import { Goal_Patroling } from "./Goal/Goal_Patroling";
import { Goal_TurnTowards } from "./Goal/Goal_TurnTowards";
import { Goal_Wait } from "./Goal/Goal_Wait";


class GoalFactory
{
  static GoalCtorLUT = new Map([
    [eGoal.G_Guarding, Goal_Guarding],
    [eGoal.G_Patroling, Goal_Patroling],
    [eGoal.G_MoveToPosition, Goal_MoveToPosition],
    [eGoal.G_TurnTowards, Goal_TurnTowards],
    [eGoal.G_Wait, Goal_Wait],
  ]);

  static create(ai, manager, goal_id, goal_lifetime_s, goal_params, parent)
  {
    assert(this.GoalCtorLUT.has(goal_id), `Inavlid goal id passed: ${goal_id}.`);
    const goal_ctor = this.GoalCtorLUT.get(goal_id);

    let goal = new goal_ctor(goal_lifetime_s, goal_params);
    goal.ai_ = ai;
    goal.parent_ = parent;
    goal.manager_ = manager;
    return goal;
  }
};

export { GoalFactory };
