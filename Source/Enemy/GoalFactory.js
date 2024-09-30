import { assert } from "../Assert";
import { eGoal } from "./Goal";
import { Goal_CombatAttackStanding } from "./Goal/Goal_CombatAttackStanding";
import { Goal_CombatAttackWalking } from "./Goal/Goal_CombatAttackWalking";
import { Goal_CombatIdle } from "./Goal/Goal_CombatIdle";
import { Goal_CombatMoveAttackPosition } from "./Goal/Goal_CombatMoveAttackPosition";
import { Goal_Guarding } from "./Goal/Goal_Guarding";
import { Goal_Investigate } from "./Goal/Goal_Investigate";
import { Goal_MoveToPosition } from "./Goal/Goal_MoveToPosition";
import { Goal_Patroling } from "./Goal/Goal_Patroling";
import { Goal_CombatWon } from "./Goal/Goal_CombatWon";
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
    [eGoal.G_Investigate, Goal_Investigate],
    [eGoal.G_CombatIdle, Goal_CombatIdle],
    [eGoal.G_CombatMoveAttackPosition, Goal_CombatMoveAttackPosition],
    [eGoal.G_CombatAttackStanding, Goal_CombatAttackStanding],
    [eGoal.G_CombatAttackWalking, Goal_CombatAttackWalking],
    [eGoal.G_CombatWon, Goal_CombatWon]
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
