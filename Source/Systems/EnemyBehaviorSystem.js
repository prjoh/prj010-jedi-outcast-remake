import { component_enemy_behavior } from '../Components/EnemyBehavior';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';


export const system_enemy_behavior = (() => {

  class EnemyBehaviorSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.ai_behavior_system_tuples = new ecs_component.ComponentContainer(
        component_enemy_behavior.EnemyBehaviorComponent.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.ai_behavior_system_tuples);
    }

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const [behaviors] = this.ai_behavior_system_tuples.component_tuples;
      const size = this.ai_behavior_system_tuples.size;

      for (let i = 0; i < size; ++i)
      {
        let c_behavior = behaviors[i];
        c_behavior.behavior.tick(delta_time_s);
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    EnemyBehaviorSystem: EnemyBehaviorSystem,
  };

})();
