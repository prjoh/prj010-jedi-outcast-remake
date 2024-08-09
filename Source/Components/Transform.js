import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { utils } from '../Utils';


export const component_transform = (() => {

  const x_axis = new THREE.Vector3(1, 0, 0);
  const y_axis = new THREE.Vector3(0, 1, 0);
  const z_axis = new THREE.Vector3(0, 0, 1);

  const buffer_v1 = new THREE.Vector3();
  const buffer_v2 = new THREE.Vector3();
  const buffer_v3 = new THREE.Vector3();
  const buffer_quat1 = new THREE.Quaternion();
  const buffer_quat2 = new THREE.Quaternion();
  const buffer_m = new THREE.Matrix4();

  class Transform extends ecs_component.Component
  {
    static CLASS_NAME = 'Transform';

    get NAME() {
      return Transform.CLASS_NAME;
    }

    constructor()
    {
      super();

      // Object space
      this.local_position = new THREE.Vector3(0, 0, 0);
      this.local_rotation = new THREE.Quaternion(0, 0, 0, 1);
      this.local_scale = new THREE.Vector3(1, 1, 1);

      this.object_matrix_ = new THREE.Matrix4();
      this.object_matrix_.identity();

      // World space
      this.world_position_ = new THREE.Vector3(0, 0, 0);
      this.world_rotation_ = new THREE.Quaternion(0, 0, 0, 1);
      this.world_scale_ = new THREE.Vector3(1, 1, 1);

      this.world_matrix = new THREE.Matrix4();
      this.world_matrix.identity();

      // Transform graph
      this.parent_ = null;
      this.children_ = [];

      // Buffers
      this.forward_ = new THREE.Vector3();
      this.right_ = new THREE.Vector3();

      this.is_animation_root_ = false;

      // Init
      this.update_world_matrix(true, false);
    }

    // get root()
    // {
    //   if (this.parent_ !== null)
    //   {
    //     return this.parent_.root;
    //   }

    //   return this;
    // }

    get is_animation_root()
    {
      return this.is_animation_root_;
    }

    set_is_animation_root(val)
    {
      this.is_animation_root_ = val;

      for (let c of this.children_)
      {
        c.set_is_animation_root(val);
      }
    }

    on_parent_relation_changed()
    {
      const previous_parent = this.parent_;

      if (previous_parent !== null)
      {
        this.parent_.remove_child(this);
      }

      this.parent_ = null;

      const entity_parent = this.entity_.parent;

      if (entity_parent !== null)
      {
        this.parent_ = entity_parent.get_component("Transform");
        this.parent_.add_child(this);
      }

      this.update_world_matrix(true, true);
    }

    set position(pos)
    {
      if (this.parent_ !== null)
      {
        this.parent_.world_to_local_vec(pos, buffer_v1);
        this.local_position.copy(buffer_v1);
      }
      else
      {
        this.local_position.copy(pos);
      }
    }

    get position()
    {
      this.update_world_matrix(true, false);
      const m = this.world_matrix.elements;
      this.world_position_.x = m[ 12 ];
      this.world_position_.y = m[ 13 ];
      this.world_position_.z = m[ 14 ];
      return this.world_position_;
    }

    set rotation(quat)
    {
      if (this.parent_ !== null)
      {
        this.parent_.world_to_local_quat(quat, buffer_quat2);
        this.local_rotation.copy(buffer_quat2);
      }
      else
      {
        this.local_rotation.copy(quat);
      }
    }

    get rotation()
    {
      this.update_world_matrix(true, false);
      this.world_matrix.decompose(buffer_v1, this.world_rotation_, buffer_v2);
      return this.world_rotation_;
    }

    set scale(s)
    {
      if (this.parent_ !== null)
      {
        this.parent_.world_to_local_vec(s, buffer_v1);
        this.local_scale.copy(buffer_v1);
      }
      else
      {
        this.local_scale.copy(s);
      }
    }

    get scale()
    {
      this.update_world_matrix(true, false);

      const m = this.world_matrix.elements;

      let sx = buffer_v1.set( m[ 0 ], m[ 1 ], m[ 2 ] ).length();
      const sy = buffer_v1.set( m[ 4 ], m[ 5 ], m[ 6 ] ).length();
      const sz = buffer_v1.set( m[ 8 ], m[ 9 ], m[ 10 ] ).length();
  
      // if determinant is negative, we need to invert one scale
      const det = this.world_matrix.determinant();
      if ( det < 0 ) sx = - sx;

      this.world_scale_.x = sx;
      this.world_scale_.y = sy;
      this.world_scale_.z = sz;

      return this.world_scale_;
    }

    get forward()
    {
      // Return the normalized forward vector (blue axis, Z) in world space
      this.update_world_matrix(true, false);
      this.forward_.set(0, 0, 1);
      this.forward_.applyQuaternion(this.world_rotation_);
      return this.forward_.normalize();
    }

    get right()
    {
      const forward = this.forward;
      // Calculate the right vector from the forward vector and world up vector
      this.right_.crossVectors(y_axis, forward);
      return this.right_.normalize();
    }

    // https://discussions.unity.com/t/what-is-the-source-code-of-quaternion-lookrotation/72474
    look_at(target)
    {
      let forward = buffer_v1;
      let right = buffer_v2;
      let up = buffer_v3;
      let up_world = y_axis;
      let quaternion = this.local_rotation;

      forward.copy(target).sub(this.local_position).normalize();

      right.crossVectors(up_world, forward);
      right.normalize();

      up.crossVectors(forward, right);

      var m00 = right.x;
      var m01 = right.y;
      var m02 = right.z;
      var m10 = up.x;
      var m11 = up.y;
      var m12 = up.z;
      var m20 = forward.x;
      var m21 = forward.y;
      var m22 = forward.z;

      const num8 = (m00 + m11) + m22;

      let _x, _y, _z, _w;

      if (num8 > 0) {
          let num = Math.sqrt(num8 + 1);
          _w = num * 0.5;
          num = 0.5 / num;
          _x = (m12 - m21) * num;
          _y = (m20 - m02) * num;
          _z = (m01 - m10) * num;
      } else if ((m00 >= m11) && (m00 >= m22)) {
          var num7 = Math.sqrt(((1 + m00) - m11) - m22);
          var num4 = 0.5 / num7;
          _x = 0.5 * num7;
          _y = (m01 + m10) * num4;
          _z = (m02 + m20) * num4;
          _w = (m12 - m21) * num4;
      } else if (m11 > m22) {
          var num6 = Math.sqrt(((1 + m11) - m00) - m22);
          var num3 = 0.5 / num6;
          _x = (m10 + m01) * num3;
          _y = 0.5 * num6;
          _z = (m21 + m12) * num3;
          _w = (m20 - m02) * num3;
      } else {
          var num5 = Math.sqrt(((1 + m22) - m00) - m11);
          var num2 = 0.5 / num5;
          _x = (m20 + m02) * num2;
          _y = (m21 + m12) * num2;
          _z = 0.5 * num5;
          _w = (m01 - m10) * num2;
      }

      quaternion.set(_x, _y, _z, _w);
    }

    translate_on_axis(axis, distance)
    {
      // translate object by distance along axis in object space
      // axis is assumed to be normalized
  
      buffer_v1.copy( axis ).applyQuaternion( this.local_rotation );
  
      this.local_position.add( buffer_v1.multiplyScalar( distance ) );
    }

    translate_x( distance )
    {
      this.translate_on_axis( x_axis, distance );
    }
  
    translate_y( distance )
    {
      this.translate_on_axis( y_axis, distance );
    }
  
    translate_z( distance )
    {
      this.translate_on_axis( z_axis, distance );
    }

    rotate_on_axis( axis, angle )
    {
      // rotate object on axis in object space
      // axis is assumed to be normalized
      buffer_quat1.setFromAxisAngle( axis, angle );
  
      this.local_rotation.multiply( buffer_quat1 );
    }

    rotate_x( angle )
    {
      this.rotate_on_axis( x_axis, angle );
    }
  
    rotate_y( angle )
    {
      this.rotate_on_axis( y_axis, angle );
    }
  
    rotate_z( angle )
    {
      this.rotate_on_axis( z_axis, angle );
    }

    set_parent(parent)
    {
      this.parent_ = parent;
      this.update_world_matrix(true, true);
    }

    add_child(child)
    {
      this.children_.push(child);
    }

    remove_child(child)
    {
      child.set_parent(null);
      utils.array_shift_delete(this.children_, child);
    }

    local_to_world_vec(src, dst)
    {
      this.update_world_matrix(true, false);
      dst.copy(src);
      dst.applyMatrix4(this.world_matrix);
    }

    local_to_world_quat(src, dst)
    {
      this.update_world_matrix(true, false);
      dst.copy(src);
      dst.multiply(this.rotation);
    }
  
    world_to_local_vec(src, dst)
    {
      this.update_world_matrix( true, false );
      dst.copy(src);
      dst.applyMatrix4(buffer_m.copy(this.world_matrix).invert());
    }

    world_to_local_quat(src, dst)
    {
      this.update_world_matrix(true, false);
      dst.copy(src);
      dst.multiply(buffer_quat1.copy(this.rotation).invert());
    }

    update_world_matrix(update_parents, update_children)
    {
      if ( update_parents === true && this.parent_ !== null)
      {
        this.parent_.update_world_matrix(true, false);
      }

      this.object_matrix_.compose(this.local_position, this.local_rotation, this.local_scale);

      if (this.parent_ === null)
      {
        this.world_matrix.copy(this.object_matrix_);
      }
      else
      {
        this.world_matrix.multiplyMatrices(this.parent_.world_matrix, this.object_matrix_);
      }
  
      if (update_children === true)
      {
        for (let child of this.children_)
        {
          child.update_world_matrix(false, true);
        }
      }
    }
  };

  return {
    Transform: Transform,
    XAxis: x_axis, 
    YAxis: y_axis, 
    ZAxis: z_axis, 
  };

})();
