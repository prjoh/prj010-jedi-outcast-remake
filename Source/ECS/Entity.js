import { object } from '../Object';
import { utils } from '../Utils';


export const ecs_entity = (() => {

  /** @final */
  class Entity extends object.Object
  {
    get NAME() {
      return this.name_;
    }

    constructor(manager, id, name, parent)
    {
      super();

      this.name_ = name;
      this.id_ = id;

      this.manager_ = manager;

      // Entity graph
      this.parent_ = parent !== undefined ? parent : null;
      this.children_ = [];

      this.components_ = new object.ObjectMap();
    }

    get manager()
    {
      return this.manager_;
    }

    get parent()
    {
      return this.parent_;
    }

    get name()
    {
      return this.name_;
    }

    get root()
    {
      if (this.parent_ !== null)
      {
        return this.parent_.root;
      }

      return this;
    }

    destroy()
    {
      if (this.parent_ !== null)
      {
        this.parent_.remove_child(this);

        this.parent_ = null;
      }

      for (let child of this.children_)
      {
        child.parent_ = null;
      }
      this.children_ = [];

      this.components_.destroy();
      this.components_ = null;
    }

    set_parent(parent)
    {
      this.parent_ = parent;
      if (parent !== null)
      {
        parent.children_.push(this);
      }

      for (let c of this.components_.values())
      {
        c.on_parent_relation_changed();
      }
    }

    remove_child(child)
    {
      child.set_parent(null);
      utils.array_shift_delete(this.children_, child);
    }

    add_component(component_ctor, ...args)
    {
      const component = new component_ctor(...args);
      component.entity_ = this;

      this.components_.add(component);

      this.manager_.set_component_type_dirty(component.NAME);

      component.on_initialized();

      return component;
    }

    get_component(name)
    {
      return this.components_.find(name);
    }

    find_component(name)
    {

      let result = this.components_.find(name);

      if (!result)
      {
        for (const c of this.children_)
        {
          result = c.get_component(name);
          if (result)
          {
            return result;
          }
        }

        for (const c of this.children_)
        {
          result = c.find_component(name);
          if (result)
          {
            return result;
          }
        }
      }

      return result;
    }
  };

  return {
    Entity: Entity,
  };

})();
