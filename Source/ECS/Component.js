import { assert } from '../Assert';
import { log } from '../Log';
import { object } from '../Object';


export const ecs_component = (() => {

  class ComponentContainer
  {
    constructor(...component_type_list)
    {
      this.component_tuples_ = [];
      this.component_types_ = [];
      this.num_types_ = 0;
      this.size_ = 0;
      // this.needs_update_ = true;

      for (const t of component_type_list)
      {
        this.component_types_.push(t);
        this.component_tuples_.push([]);
        this.num_types_ += 1;
      }
    }

    get component_types()
    {
      return this.component_types_;
    }

    get component_tuples()
    {
      return this.component_tuples_;
    }

    get num_types()
    {
      return this.num_types_;
    }

    get size()
    {
      return this.size_;
    }

    get_component_type_list(component_type)
    {
      const i = get_tuple_index(component.NAME);
      assert(i !== -1, `Invalid type ${component_type} passed.`);
      return this.component_tuples_[i];
    }

    clear()
    {
      for (let components of this.component_tuples_)
      {
       components.length = 0; 
      }
      this.size_ = 0;
    }

    add_tuple(tuple)
    {
      assert(tuple.length === this.num_types_, "Passed tuple has wrong length.");

      for (const component of tuple)
      {
        const i = this.get_tuple_index(component.NAME);
        assert(i !== -1, `Invalid type ${component.NAME} passed.`);
        this.component_tuples_[i].push(component);
      }

      // All component lists must have equal length
      assert(this.component_tuples_.every(list => list.length === this.component_tuples_[0].length));

      this.size_ += 1;
    }

    get_tuple_index(type_name)
    {
      return this.component_types_.indexOf(type_name);
    }
  };

  /** @abstract */
  class Component extends object.Object
  {
    get NAME() {
      log.error('Unnamed Component: ' + this.constructor.name);
      return '__UNNAMED__';
    }

    constructor()
    {
      super();

      this.entity_ = null;
      // this.is_active_ = true;
    }

    // get is_active()
    // {
    //   return this.is_active_;
    // }

    // set_active(is_active)
    // {
    //   this.is_active_ = is_active;
    // }

    get entity()
    {
      return this.entity_;
    }

    get name()
    {
      return this.entity_.name;
    }

    // TODO: We should have created this instead of constructor usage....
    // create() {}

    destroy() {}

    on_parent_relation_changed() {}

    on_initialized() {}
  };

  return {
    Component: Component,
    ComponentContainer: ComponentContainer,
  };

})();
