import { ecs_component } from '../ECS/Component';

export const component_health = (() => {

  class UI_HealthBar extends ecs_component.Component
  {
    static CLASS_NAME = 'UI_HealthBar';

    get NAME() {
      return UI_HealthBar.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      const health_bar = document.getElementById('health-bar-ui');
      this.inner_ = health_bar.querySelector('.health-bar-inner');
      this.outer_ = health_bar.querySelector('.health-bar-animated');
    }

    on_initialized()
    {
      this.reset();
    }

    reset()
    {
      this.inner_.style.width = '100%';
      this.outer_.style.width = '100%';
    }

    update(health_component)
    {
      let current_health = health_component.current_health_;
      const total_health = health_component.total_health_;

      const new_width = `${(current_health / total_health) * 100}%`;
      this.inner_.style.width = new_width;
    
      setTimeout(() => {
        this.outer_.style.width = new_width;
      }, 500);
    }
  };

  class HealthComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'HealthComponent';

    get NAME() {
      return HealthComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.total_health_ = params.total_health;
      this.current_health_ = params.health;
    }

    on_initialized()
    {
    }

    is_alive()
    {
      return this.current_health_ > 0.0;
    }

    take_damage(damage)
    {
      this.current_health_ = Math.max(0, Math.min(this.total_health_, this.current_health_ - damage));
    }

    heal(health)
    {
      this.current_health_ = Math.max(0, Math.min(this.total_health_, this.current_health_ + health));
    }
  };

  return {
    HealthComponent: HealthComponent,
    UI_HealthBar: UI_HealthBar,
  };

})();
