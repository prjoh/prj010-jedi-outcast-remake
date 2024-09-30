import { ecs_component } from '../ECS/Component';

export const component_interact = (() => {

  class PushableComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'PushableComponent';

    get NAME() {
      return PushableComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.impulse_magnitude_ = params.impulse_magnitude;

      this.impulse_offset_ = new Ammo.btVector3();
      this.impulse_offset_.setValue(params.impulse_offset.x, params.impulse_offset.y, params.impulse_offset.z);

      this.impulse_ = new Ammo.btVector3();
      this.rel_pos_ = new Ammo.btVector3();
    }

    destroy()
    {
      Ammo.destroy(this.impulse_);
      Ammo.destroy(this.rel_pos_);
      Ammo.destroy(this.impulse_offset_);

      super.destroy();
    }
  };

  return {
    PushableComponent: PushableComponent,
  };

})();
