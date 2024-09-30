import { EnemyBehavior, eBehaviorID } from "../EnemyBehavior";
import { eGoal } from "../Goal";


class EnemyBehavior_Stormtrooper01 extends EnemyBehavior
{
  constructor(entity, params)
  {
    super(eBehaviorID.BID_Stormtrooper01, entity, params);

    const animation_param_id = params.animation_param_id;

    this.init_topgoal_(eGoal.G_Guarding, 10.0, animation_param_id);
  }
};

class EnemyBehavior_Stormtrooper02 extends EnemyBehavior
{
  constructor(entity, params)
  {
    super(eBehaviorID.BID_Stormtrooper02, entity, params);

    const path = params.path;

    this.init_topgoal_(eGoal.G_Patroling, 10.0, path);
  }
};

export { 
  EnemyBehavior_Stormtrooper01,
  EnemyBehavior_Stormtrooper02,
};
