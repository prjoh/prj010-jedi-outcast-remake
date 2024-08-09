import { ecs_component } from '../ECS/Component';
import { EnemyBehaviorFactory } from '../Enemy/EnemyBehaviorFactory';


export const component_enemy_behavior = (() => {

  class EnemyBehaviorComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'EnemyBehaviorComponent';

    get NAME() {
      return EnemyBehaviorComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.behavior_id_ = params.behavior_id;
      this.behavior_params_ = params.behavior_params;

      this.behavior = null;
    }

    on_initialized()
    {
      super.on_initialized();

      this.behavior = EnemyBehaviorFactory.create(this.behavior_id_, this.entity, this.behavior_params_);
    }
  };

  return {
    EnemyBehaviorComponent: EnemyBehaviorComponent,
  };

})();
