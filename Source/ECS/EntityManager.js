import { assert } from '../Assert';
import { object } from '../Object';
import { component_transform } from '../Components/Transform';
import { ecs_entity } from './Entity';


export const ecs_manager = (() => {

  const eQuitState = Object.freeze({
    QR_None:           0,
    QR_GameOver:       1,
    QR_CriticalError:  2,
  });

  /** @final */
  class EntityManager
  {
    constructor()
    {
      this.ids_ = 0;
      this.entities_ = new object.ObjectMap();
      this.systems_ = [];

      this.component_type_updated = {};

      this.quit_state_ = eQuitState.QR_None;
    }

    destroy()
    {
      for (let entity of this.entities_)
      {
        entity.destroy();
      }

      this.ids_ = 0;
      this.entities_ = new object.ObjectMap();
      this.systems_ = [];

      this.component_type_updated = {};

      this.quit_state_ = eQuitState.QR_None;
    }

    get quit_state()
    {
      return this.quit_state_;
    }

    set_quit_state(quit_state)
    {
      this.quit_state_ = quit_state;
    }

    generate_name_() {
      return '__entity__' + this.ids_;
    }

    create_entity(name, parent)
    {
      if (!name || this.entities_.find(name) !== null) {
        name = this.generate_name_();
      }

      const entity = new ecs_entity.Entity(this, this.ids_, name, parent);
      entity.add_component(component_transform.Transform);

      if (parent !== undefined)
      {
        entity.set_parent(parent);
      }

      this.entities_.add(entity);

      this.ids_ += 1;

      return entity;
    }

    is_component_type_dirty(component_type)
    {
      if (!(component_type in this.component_type_updated))
      {
        return false;
      }

      assert(component_type in this.component_type_updated, "Key does not exists in component_type_updated map.");
      return this.component_type_updated[component_type];
    }

    set_component_type_dirty(component_type)
    {
      this.component_type_updated[component_type] = true;
    }

    clear_component_type_dirty_flags()
    {
      for (const t in this.component_type_updated)
      {
        this.component_type_updated[t] = false;
      }
    }

    update_component_container(component_container)
    {
      const component_types = component_container.component_types;
      if (!component_types.some(t => this.is_component_type_dirty(t)))
      {
        return;
      }

      component_container.clear();

      for (const entity of this.entities_)
      {
        const components = entity.components_;

        let component_tuple = [];

        for (const t of component_types)   
        {
          const c = components.find(t);
          if (c === null)
          {
            break;
          }
          component_tuple.push(c);
        }

        if (component_tuple.length === component_types.length)
        {
          component_container.add_tuple(component_tuple);
        }
      }
    }

    register_system(system_ctor)
    {
      this.systems_.push(new system_ctor(this));
    }

    get_entity(name)
    {
      return this.entities_.find(name);
    }

    init()
    {
      for (let system of this.systems_)
      {
        system.init();
      }
    }

    post_init()
    {
      for (let system of this.systems_)
      {
        system.post_init();
      }
    }

    pre_update()
    {
      for (let system of this.systems_)
      {
        system.pre_update();
      }
    }

    fixed_update(fixed_delta_time_s)
    {
      for (let system of this.systems_)
      {
        system.fixed_update(fixed_delta_time_s);
      }
    }

    update(delta_time_s)
    {
      for (let system of this.systems_)
      {
        system.update(delta_time_s);
      }
    }

    late_update(delta_time_s)
    {
      for (let system of this.systems_)
      {
        system.late_update(delta_time_s);
      }

      this.clear_component_type_dirty_flags();
    }
  };

  return {
    EntityManager: EntityManager,
    eQuitState: eQuitState,
  };

})();
