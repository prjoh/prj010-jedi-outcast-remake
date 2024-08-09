import { ecs_component } from '../ECS/Component';
import { utils } from '../Utils';


export const component_fighting = (() => {

  class FightingState extends ecs_component.Component
  {
    static CLASS_NAME = 'FightingState';

    get NAME() {
      return FightingState.CLASS_NAME;
    }

    constructor()
    {
      super();

      this.is_attacking_ = new utils.TimedFlag(false, false, 0.0);
    }

    update_timers()
    {
      this.is_attacking_.update();
    }

    get is_attacking()
    {
      return this.is_attacking_.value;
    }

    set_attacking()
    {
      this.is_attacking_ = new utils.TimedFlag(true, false, 0.4);
    }
  };

  return {
    FightingState: FightingState,
  };

})();
