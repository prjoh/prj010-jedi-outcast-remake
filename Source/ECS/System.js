

export const ecs_system = (() => {

  /** @abstract */
  class System
  {
    constructor(entity_manager)
    {
      this.entity_manager_ = entity_manager;
    }

    get_entity(name)
    {
      return this.entity_manager_.get_entity(name);
    }

    /** @abstract */ init() {}
    /** @abstract */ post_init() {}
    /** @abstract */ pre_update() {}
    /** @abstract */ fixed_update(fixed_delta_time_s) {}
    /** @abstract */ update(delta_time_s) {}
    /** @abstract */ late_update(delta_time_s) {}
  };

  return {
    System: System,
  };

})();
