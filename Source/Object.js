import * as THREE from 'three';
import { assert } from './Assert';


export const object = (() => {

  /** @abstract */
  class Object
  {
    /** @abstract */
    get NAME() {}

    constructor()
    {
      this.uuid = THREE.MathUtils.generateUUID();
    }
  };

  class ObjectMap
  {
    constructor()
    {
      this.object_keys_ = [];
      this.objects_ = [];
      this.size_ = 0;
    }

    // Default iterator (for...of loop) iterates over objects
    [Symbol.iterator]() {
      return this.values();
    }

    // Iterator for keys
    *keys() {
      for (let key of this.object_keys_) {
        yield key;
      }
    }

    // Iterator for objects (values)
    *values() {
      for (let obj of this.objects_) {
        yield obj;
      }
    }

    // Iterator for [key, value] pairs
    *entries() {
      for (let i = 0; i < this.object_keys_.length; i++) {
        yield [this.object_keys_[i], this.objects_[i]];
      }
    }

    get size()
    {
      this.check_size_();
      return this.size_;
    }

    destroy()
    {
      for (let c of this.objects_) {
        c.destroy();
      }
      this.objects_ = null;
      this.object_keys_ = null;
    }

    add(obj)
    {
      this.object_keys_.push(obj.NAME);
      this.objects_.push(obj);
      this.size_ += 1;

      this.check_size_();
    }

    find(key)
    {
      const index = this.object_keys_.indexOf(key);
      if (index === -1)
      {
        return null;
      }
      return this.objects_[index];
    }

    front()
    {
      assert(this.size_ > 0, "front() called on empty container");
      return this.objects_.at(0);
    }

    back()
    {
      assert(this.size_ > 0, "back() called on empty container");
      return this.objects_.at(-1);
    }

    remove(key)
    {
      const index = this.object_keys_.indexOf(key);
      assert(index !== -1, `${key} not found`);
      this.object_keys_.splice(index, 1);
      this.objects_.splice(index, 1);
      this.size_ -= 1;
      this.check_size_();
    }

    check_size_()
    {
      assert(
        this.object_keys_.length === this.objects_.length &&
        this.objects_.length === this.size_, 
        "ObjectMap was corrupted.");
    }
  };

  return {
    Object: Object,
    ObjectMap: ObjectMap,
  };

})();
