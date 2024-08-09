import { assert } from "../Assert";
import { 
  EnemyBehavior_Stormtrooper01, 
  EnemyBehavior_Stormtrooper02,
} from "./Behavior/EnemyBehavior_Stormtrooper";
import { eBehaviorID } from "./EnemyBehavior";


class EnemyBehaviorFactory
{
  static BehaviorCtorLUT = new Map([
    [eBehaviorID.BID_Stormtrooper01, EnemyBehavior_Stormtrooper01],
    [eBehaviorID.BID_Stormtrooper02, EnemyBehavior_Stormtrooper02],
  ]);

  static create(behavior_id, entity, behavior_params)
  {
    assert(this.BehaviorCtorLUT.has(behavior_id), `Inavlid behavior id passed: ${behavior_id}.`);
    const enemy_behavior_ctor = this.BehaviorCtorLUT.get(behavior_id);
    return new enemy_behavior_ctor(entity, behavior_params);
  }
};

export { EnemyBehaviorFactory };
