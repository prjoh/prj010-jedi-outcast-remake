

export const world_base = (() => {

  class World
  {
    constructor(use_resource_manager = true)
    {
      this.use_resource_manager = use_resource_manager;
    }

    load()
    {
    }

    async init_async()
    {
    }

    init()
    {
    }

    destroy()
    {
    }

    pre_update()
    {
    }

    fixed_update(fixed_delta_time_s)
    {
    }

    update(delta_time_s)
    {
    }
    
    late_update(delta_time_s)
    {
    }
  };

  return {
    World: World,
  };

})();
