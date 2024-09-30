import { ecs_component } from '../ECS/Component';


export const component_combat_manager = (() => {

  class CombatManager extends ecs_component.Component
  {
    static CLASS_NAME = 'CombatManager';

    get NAME() {
      return CombatManager.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.combat_ais_ = new Set();
    }

    is_in_combat()
    {
      return this.combat_ais_.size > 0;
    }

    register_ai(enemy_behavior_component)
    {
      this.combat_ais_.add(enemy_behavior_component.uuid);
    }

    unregister_ai(enemy_behavior_component)
    {
      this.combat_ais_.delete(enemy_behavior_component.uuid);
    }
  };

  return {
    CombatManager: CombatManager,
  };

})();
