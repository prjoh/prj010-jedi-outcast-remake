import * as THREE from 'three';

import { env } from '../Env';
import { ecs_component } from '../ECS/Component';
import { 
  BT_COLLISION_MARGIN, 
  BT_GRAVITY, 
  BT_MAX_DEBUG_VERTICES,
  eCollisionGroup,
 } from '../Config';
import { log } from '../Log';
import { component_editor } from './Editor';


export const component_physics = (() => {

  const eBodyType = Object.freeze({
    BT_Dynamic: 0,
    BT_Kinematic: 1,
    BT_Static: 2,
  });
  
  // https://pybullet.org/Bullet/BulletFull/btCollisionObject_8h_source.html
  const eCollisionFlags = Object.freeze({
    CF_StaticObject: 1,
    CF_KinematicObject: 2,
    CF_NoContactResponse: 4,
    CF_CustomMaterialCallback: 8,
    CF_CharacterObject: 16,
  });

  const eActivationState = Object.freeze({
    AS_ActiveTag: 1,
    AS_IslandSleeping: 2,
    AS_WantsDeactivation: 3,
    AS_DisableDeactivation: 4,
    AS_DisableSimulation: 5,
  });

  class Collider extends ecs_component.Component
  {
    get NAME()
    {
      log.error('Unnamed Component: ' + this.constructor.name);
      return '__UNNAMED__';
    }

    constructor(params)
    {
      super();

      // TODO: This is the reason why we should avoid constructors for setting up stuff ....
      // const c_transform = this.entity_.get_component("Transform");
      const position = params.transform.position;
      const rotation = params.transform.rotation;
      let offset = params.offset;

      if (offset === undefined)
      {
        offset = new THREE.Vector3(0.0, 0.0, 0.0);
      }

      const ammo_pos = new Ammo.btVector3(position.x, position.y, position.z);
      const ammo_rot = new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w);

      this.transform_ = new Ammo.btTransform();
      this.transform_.setIdentity();
      this.transform_.setOrigin(ammo_pos);
      this.transform_.setRotation(ammo_rot);

      const ammo_pos2 = new Ammo.btVector3(offset.x, offset.y, offset.z);

      this.center_of_mass_offset_ = new Ammo.btTransform();
      this.center_of_mass_offset_.setIdentity();
      this.center_of_mass_offset_.setOrigin(ammo_pos2);

      this.motion_state_ = new Ammo.btDefaultMotionState(this.transform_, this.center_of_mass_offset_);

      this.angular_factor_ = new Ammo.btVector3(1.0, 1.0, 1.0);

      this.body_type_ = params.body_type;

      this.body_ = null;
      this.info_ = null;
      this.shape_ = null;
      this.inertia_ = null;
      this.user_data_ = new Ammo.btVector3(0, 0, 0);

      this.is_contact_listener = params.is_contact_listener;

      Ammo.destroy(ammo_pos);
      Ammo.destroy(ammo_rot);
      Ammo.destroy(ammo_pos2);
    }

    on_initialized()
    {
      super.on_initialized();

      this.user_data_.user_data = this;
      this.body_.setUserPointer(this.user_data_);
    }

    destroy()
    {
      Ammo.destroy(this.body_);
      Ammo.destroy(this.info_);
      Ammo.destroy(this.shape_);
      Ammo.destroy(this.inertia_);
      Ammo.destroy(this.motion_state_);
      Ammo.destroy(this.transform_);
      Ammo.destroy(this.user_data_);
      Ammo.destroy(this.center_of_mass_offset_);
      Ammo.destroy(this.angular_factor_);

      super.destroy();
    }

    set position(pos)
    {
      if (this.body_type_ === eBodyType.BT_Dynamic)
      {
        log.error("Can't set position on dynamic rigidbody!");
        return;
      }

      const offset = this.center_of_mass_offset_.getOrigin();
      pos.setValue(
        pos.x() - offset.x(),
        pos.y() - offset.y(),
        pos.z() - offset.z(),
      );

      this.body_.getWorldTransform(this.transform_);
      this.transform_.setOrigin(pos);
      this.body_.setWorldTransform(this.transform_);
      this.motion_state_.setWorldTransform(this.transform_);
    }

    get position()
    {
      if (this.body_type_ === eBodyType.BT_Dynamic)
      {
        this.motion_state_.getWorldTransform(this.transform_);
      }
      else
      {
        this.body_.getWorldTransform(this.transform_);
      }
      return this.transform_.getOrigin();
    }

    set rotation(quat)
    {
      if (this.body_type_ === eBodyType.BT_Dynamic)
        {
        log.error("Can't set rotation on dynamic rigidbody!");
        return;
      }
      this.body_.getWorldTransform(this.transform_);
      this.transform_.setRotation(quat);
      this.body_.setWorldTransform(this.transform_);
      this.motion_state_.setWorldTransform(this.transform_);
    }

    get rotation()
    {
      if (this.body_type_ === eBodyType.BT_Dynamic)
      {
        this.motion_state_.getWorldTransform(this.transform_);
      }
      else
      {
        this.body_.getWorldTransform(this.transform_);
      }
      return this.transform_.getRotation();
    }

    // set_rotation(x, y, z, w)
    // {
    //   this.rotation_.setX(x);
    //   this.rotation_.setY(y);
    //   this.rotation_.setZ(z);
    //   this.rotation_.setW(w);
    // }

    create_body(body_info, body_type)
    {
      this.body_ = new Ammo.btRigidBody(body_info);

      if (body_type === eBodyType.BT_Dynamic)
      {
        this.body_.setCollisionFlags(this.body_.getCollisionFlags | 0);
        this.body_.setActivationState(eActivationState.AS_DisableDeactivation);
      }
      else if (body_type === eBodyType.BT_Kinematic)
      {
        this.body_.setCollisionFlags(this.body_.getCollisionFlags | eCollisionFlags.CF_KinematicObject);
        this.body_.setActivationState(eActivationState.AS_DisableDeactivation);
      }
      else if (body_type === eBodyType.BT_Static)
      {
        this.body_.setCollisionFlags(this.body_.getCollisionFlags | eCollisionFlags.CF_StaticObject);
        this.body_.setActivationState(eActivationState.AS_DisableDeactivation);
      }

      // TODO!!!
      this.body_.setActivationState(eActivationState.AS_DisableDeactivation);

      this.body_.setAngularFactor(this.angular_factor_);
    }

    set_rotation_constraints(freeze_x_axis, freeze_y_axis, freeze_z_axis)
    {
      const freeze_x = freeze_x_axis ? 0.0 : 1.0;
      const freeze_y = freeze_y_axis ? 0.0 : 1.0;
      const freeze_z = freeze_z_axis ? 0.0 : 1.0;

      this.angular_factor_.setX(freeze_x);
      this.angular_factor_.setY(freeze_y);
      this.angular_factor_.setZ(freeze_z);

      this.body_.setAngularFactor(this.angular_factor_);
    }

    set_restitution(restitution)
    {
      this.body_.setRestitution(restitution);
    }

    set_friction(friction)
    {
      this.body_.setFriction(friction);
    }

    set_rolling_friction(rolling_friction)
    {
      this.body_.setRollingFriction(rolling_friction);
    }
  };

  class BoxCollider extends Collider
  {
    static CLASS_NAME = 'BoxCollider';

    get NAME() {
      return BoxCollider.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      let bt_size = new Ammo.btVector3(params.size.x * 0.5, params.size.y * 0.5, params.size.z * 0.5);
      this.shape_ = new Ammo.btBoxShape(bt_size);
      this.shape_.setMargin(BT_COLLISION_MARGIN);

      let mass = params.body_type === eBodyType.BT_Static ? 0.0 : params.mass;

      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      this.shape_.calculateLocalInertia(mass, this.inertia_);  // TODO: Check

      this.info_ = new Ammo.btRigidBodyConstructionInfo(
        mass, 
        this.motion_state_, 
        this.shape_, 
        this.inertia_);
      this.create_body(this.info_, params.body_type);

      Ammo.destroy(bt_size);

      params.physics_state.add_collider(this, params.collision_group, params.collision_mask);
    }

    // destroy()
    // {
    //   super.destroy();
    // }
  };

  class CapsuleCollider extends Collider
  {
    static CLASS_NAME = 'CapsuleCollider';

    get NAME() {
      return CapsuleCollider.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      this.shape_ = new Ammo.btCapsuleShape(params.radius, params.height - params.radius * 2.0);
      
      // Set the collision margin
      this.shape_.setMargin(BT_COLLISION_MARGIN);

      /*
       * Inertia is the resistance of any physical object to a change its state of motion, 
       * or the tendency of an object to resist any change in its motion.
       * The products of inertia are zero when the body is symmetrical about the axes of rotation, 
       * such as for a rectangular box or cylinder rotating on their symmetry axis.
       */
      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      this.shape_.calculateLocalInertia(params.mass, this.inertia_);

      this.info_ = new Ammo.btRigidBodyConstructionInfo(
        params.mass, 
        this.motion_state_, 
        this.shape_, 
        this.inertia_);
      this.create_body(this.info_, params.body_type);

      params.physics_state.add_collider(this, params.collision_group, params.collision_mask);
    }
  };

  class ConvexMeshCollider extends Collider
  {
    static CLASS_NAME = 'ConvexMeshCollider';

    get NAME() {
      return ConvexMeshCollider.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      const V0 = new THREE.Vector3();
      const V1 = new THREE.Vector3();
      const V2 = new THREE.Vector3();

      const A0 = new Ammo.btVector3();
      const A1 = new Ammo.btVector3();
      const A2 = new Ammo.btVector3();

      this.shape_ = new Ammo.btConvexHullShape();

      // this.ammo_mesh_ = new Ammo.btTriangleMesh(true, true);

      const extract_geometry = (geometry, matrix_world) => {
        const p = geometry.attributes.position.array;
        for (let i = 0; i < geometry.index.count; i+=3) {
          const i0 = geometry.index.array[i] * 3;
          const i1 = geometry.index.array[i + 1] * 3;
          const i2 = geometry.index.array[i + 2] * 3;

          V0.fromArray(p, i0).applyMatrix4(matrix_world);
          V1.fromArray(p, i1).applyMatrix4(matrix_world);
          V2.fromArray(p, i2).applyMatrix4(matrix_world);

          A0.setX(V0.x);
          A0.setY(V0.y);
          A0.setZ(V0.z);
          A1.setX(V1.x);
          A1.setY(V1.y);
          A1.setZ(V1.z);
          A2.setX(V2.x);
          A2.setY(V2.y);
          A2.setZ(V2.z);

          this.shape_.addPoint(A0, false);
          this.shape_.addPoint(A1, false);
          this.shape_.addPoint(A2, false);

          // ammo_mesh.addTriangle(A0, A1, A2, false);
        }
      };

      Ammo.destroy(A0);
      Ammo.destroy(A1);
      Ammo.destroy(A2);

      if (params.traverse)
      {
        params.mesh.traverse(c => {
          c.updateMatrixWorld(true);
          if (c.geometry) {
            extract_geometry(c.geometry, c.matrixWorld);
          }
        });
      }
      else
      {
        const geometry = params.mesh.geometry;
        params.mesh.updateMatrixWorld(true);
        extract_geometry(geometry, params.mesh.matrixWorld);
      }

      this.shape_.recalcLocalAabb();

      // this.shape_ = new Ammo.btBvhTriangleMeshShape(this.ammo_mesh_, true, true);

      // Set the collision margin
      this.shape_.setMargin(BT_COLLISION_MARGIN);

      /*
       * Inertia is the resistance of any physical object to a change its state of motion, 
       * or the tendency of an object to resist any change in its motion.
       * The products of inertia are zero when the body is symmetrical about the axes of rotation, 
       * such as for a rectangular box or cylinder rotating on their symmetry axis.
       */
      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      this.shape_.calculateLocalInertia(params.mass, this.inertia_);

      this.info_ = new Ammo.btRigidBodyConstructionInfo(
        params.mass, 
        this.motion_state_, 
        this.shape_, 
        this.inertia_);
      this.create_body(this.info_, params.body_type);

      params.physics_state.add_collider(this, params.collision_group, params.collision_mask);
    }
  };

  class ConcaveMeshCollider extends Collider
  {
    static CLASS_NAME = 'ConcaveMeshCollider';

    get NAME() {
      return ConcaveMeshCollider.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      const V0 = new THREE.Vector3();
      const V1 = new THREE.Vector3();
      const V2 = new THREE.Vector3();

      const A0 = new Ammo.btVector3();
      const A1 = new Ammo.btVector3();
      const A2 = new Ammo.btVector3();

      this.ammo_mesh_ = new Ammo.btTriangleMesh(true, true);

      const extract_geometry = (geometry, matrix_world) => {
        const p = geometry.attributes.position.array;
        for (let i = 0; i < geometry.index.count; i+=3) {
          const i0 = geometry.index.array[i] * 3;
          const i1 = geometry.index.array[i + 1] * 3;
          const i2 = geometry.index.array[i + 2] * 3;

          V0.fromArray(p, i0).applyMatrix4(matrix_world);
          V1.fromArray(p, i1).applyMatrix4(matrix_world);
          V2.fromArray(p, i2).applyMatrix4(matrix_world);

          A0.setX(V0.x);
          A0.setY(V0.y);
          A0.setZ(V0.z);
          A1.setX(V1.x);
          A1.setY(V1.y);
          A1.setZ(V1.z);
          A2.setX(V2.x);
          A2.setY(V2.y);
          A2.setZ(V2.z);

          this.ammo_mesh_.addTriangle(A0, A1, A2, false);
        }
      };

      if (params.traverse)
      {
        params.mesh.traverse(c => {
          c.updateMatrixWorld(true);
          if (c.geometry) {
            extract_geometry(c.geometry, c.matrixWorld);
          }
        });
      }
      else
      {
        const geometry = params.mesh.geometry;
        params.mesh.updateMatrixWorld(true);
        extract_geometry(geometry, params.mesh.matrixWorld);
      }

      this.shape_ = new Ammo.btBvhTriangleMeshShape(this.ammo_mesh_, true, true);

      // Set the collision margin
      this.shape_.setMargin(BT_COLLISION_MARGIN);

      /*
       * Inertia is the resistance of any physical object to a change its state of motion, 
       * or the tendency of an object to resist any change in its motion.
       * The products of inertia are zero when the body is symmetrical about the axes of rotation, 
       * such as for a rectangular box or cylinder rotating on their symmetry axis.
       */
      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      this.shape_.calculateLocalInertia(params.mass, this.inertia_);

      this.info_ = new Ammo.btRigidBodyConstructionInfo(
        params.mass, 
        this.motion_state_, 
        this.shape_, 
        this.inertia_);
      this.create_body(this.info_, params.body_type);

      params.physics_state.add_collider(this, params.collision_group, params.collision_mask);
    }

    destroy()
    {
      Ammo.destroy(this.ammo_mesh_);

      super.destroy();
    }
  };

  class CylinderCollider extends Collider
  {
    static CLASS_NAME = 'CylinderCollider';

    get NAME() {
      return CylinderCollider.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      let bt_half_size = new Ammo.btVector3(params.size.x * 0.5, params.size.y * 0.5, params.size.z * 0.5);

      this.shape_ = new Ammo.btCylinderShape(bt_half_size);
      
      Ammo.destroy(bt_half_size);

      // Set the collision margin
      this.shape_.setMargin(BT_COLLISION_MARGIN);

      /*
       * Inertia is the resistance of any physical object to a change its state of motion, 
       * or the tendency of an object to resist any change in its motion.
       * The products of inertia are zero when the body is symmetrical about the axes of rotation, 
       * such as for a rectangular box or cylinder rotating on their symmetry axis.
       */
      this.inertia_ = new Ammo.btVector3(0, 0, 0);
      this.shape_.calculateLocalInertia(params.mass, this.inertia_);

      this.info_ = new Ammo.btRigidBodyConstructionInfo(
        params.mass, 
        this.motion_state_, 
        this.shape_, 
        this.inertia_);
      this.create_body(this.info_, params.body_type);

      params.physics_state.add_collider(this, params.collision_group, params.collision_mask);
    }
  };

  class Trigger extends ecs_component.Component
  {
    get NAME()
    {
      log.error('Unnamed Component: ' + this.constructor.name);
      return '__UNNAMED__';
    }

    constructor(params)
    {
      super();

      const position = params.transform.position;
      const rotation = params.transform.rotation;

      this.transform_ = new Ammo.btTransform();
      this.transform_.setIdentity();
      this.transform_.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
      this.transform_.setRotation(new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w));

      this.shape_ = null;

      this.body_ = new Ammo.btGhostObject();
      this.body_.setWorldTransform(this.transform_);

      this.body_.setCollisionFlags(this.body_.getCollisionFlags() | eCollisionFlags.CF_NoContactResponse);

      this.user_data_ = new Ammo.btVector3(0, 0, 0);

      this.is_contact_listener = params.is_contact_listener;
    }

    on_initialized()
    {
      super.on_initialized();

      this.user_data_.user_data = this;
      this.body_.setUserPointer(this.user_data_);
    }

    set_shape(shape)
    {
      this.shape_ = shape;
      this.body_.setCollisionShape(this.shape_);
      this.body_.activate(true);
    }

    destroy()
    {
      Ammo.destroy(this.body_);
      Ammo.destroy(this.shape_);
      Ammo.destroy(this.transform_);
      Ammo.destroy(this.user_data_);

      super.destroy();
    }
  };

  class BoxTrigger extends Trigger
  {
    static CLASS_NAME = 'BoxTrigger';

    get NAME() {
      return BoxTrigger.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      let bt_size = new Ammo.btVector3(params.size.x * 0.5, params.size.y * 0.5, params.size.z * 0.5);

      const shape = new Ammo.btBoxShape(bt_size);
      shape.setMargin(BT_COLLISION_MARGIN);

      this.set_shape(shape);

      Ammo.destroy(bt_size);

      params.physics_state.add_trigger(this, params.collision_group, params.collision_mask);
    }
  };

  class CylinderTrigger extends Trigger
  {
    static CLASS_NAME = 'CylinderTrigger';

    get NAME() {
      return CylinderTrigger.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      let bt_size = new Ammo.btVector3(params.radius, params.height, params.radius);

      const shape = new Ammo.btCylinderShape(bt_size);
      shape.setMargin(BT_COLLISION_MARGIN);

      this.set_shape(shape);

      Ammo.destroy(bt_size);

      params.physics_state.add_trigger(this, params.collision_group, params.collision_mask);
    }
  };

  class ConvexMeshTrigger extends Trigger
  {
    static CLASS_NAME = 'ConvexMeshTrigger';

    get NAME() {
      return ConvexMeshTrigger.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);


      const V0 = new THREE.Vector3();
      const V1 = new THREE.Vector3();
      const V2 = new THREE.Vector3();

      const A0 = new Ammo.btVector3();
      const A1 = new Ammo.btVector3();
      const A2 = new Ammo.btVector3();

      let shape = new Ammo.btConvexHullShape();

      // this.ammo_mesh_ = new Ammo.btTriangleMesh(true, true);

      const extract_geometry = (geometry, matrix_world) => {
        const p = geometry.attributes.position.array;
        for (let i = 0; i < geometry.index.count; i+=3) {
          const i0 = geometry.index.array[i] * 3;
          const i1 = geometry.index.array[i + 1] * 3;
          const i2 = geometry.index.array[i + 2] * 3;

          V0.fromArray(p, i0).applyMatrix4(matrix_world);
          V1.fromArray(p, i1).applyMatrix4(matrix_world);
          V2.fromArray(p, i2).applyMatrix4(matrix_world);

          A0.setX(V0.x);
          A0.setY(V0.y);
          A0.setZ(V0.z);
          A1.setX(V1.x);
          A1.setY(V1.y);
          A1.setZ(V1.z);
          A2.setX(V2.x);
          A2.setY(V2.y);
          A2.setZ(V2.z);

          shape.addPoint(A0, false);
          shape.addPoint(A1, false);
          shape.addPoint(A2, false);

          // ammo_mesh.addTriangle(A0, A1, A2, false);
        }
      };

      Ammo.destroy(A0);
      Ammo.destroy(A1);
      Ammo.destroy(A2);

      if (params.traverse)
      {
        params.mesh.traverse(c => {
          c.updateMatrixWorld(true);
          if (c.geometry) {
            extract_geometry(c.geometry, c.matrixWorld);
          }
        });
      }
      else
      {
        const geometry = params.mesh.geometry;
        params.mesh.updateMatrixWorld(true);
        extract_geometry(geometry, params.mesh.matrixWorld);
      }

      shape.recalcLocalAabb();
      this.set_shape(shape);

      params.physics_state.add_trigger(this, params.collision_group, params.collision_mask);
    }
  };

  class KinematicCharacterController extends ecs_component.Component
  {
    static CLASS_NAME = 'KinematicCharacterController';

    get NAME() {
      return KinematicCharacterController.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      const position = params.transform.position;
      const rotation = params.transform.rotation;

      this.transform_ = new Ammo.btTransform();
      this.transform_.setIdentity();
      this.transform_.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
      this.transform_.setRotation(new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w));

      this.shape_ = new Ammo.btCapsuleShape(params.radius, params.height - params.radius * 2.0);
      
      // Set the collision margin
      this.shape_.setMargin(BT_COLLISION_MARGIN);

      this.body_ = new Ammo.btPairCachingGhostObject();
      this.body_.setWorldTransform(this.transform_);
      this.body_.setCollisionShape(this.shape_);
      this.body_.setCollisionFlags(this.body_.getCollisionFlags() | eCollisionFlags.CF_CharacterObject);
      this.body_.activate(true);

      this.user_data_ = new Ammo.btVector3(0, 0, 0);

      this.controller_ = new Ammo.btKinematicCharacterController(this.body_, this.shape_, params.step_height, 1);
      this.controller_.setUseGhostSweepTest(false);
      this.controller_.setUpInterpolate();
      this.controller_.setGravity(BT_GRAVITY);
      this.controller_.setMaxSlope(params.max_slope);
      this.controller_.canJump(true);
      this.controller_.setJumpSpeed(params.jump_speed);
      this.controller_.setMaxJumpHeight(params.max_jump_height);

      this.is_contact_listener = params.is_contact_listener;

      params.physics_state.add_kinematic_character_controller(this, params.collision_group, params.collision_mask);
    }

    set position(pos)
    {
      this.body_.getWorldTransform(this.transform_);
      this.transform_.setOrigin(pos);
      this.body_.setWorldTransform(this.transform_);
    }

    get position()
    {
      this.body_.getWorldTransform(this.transform_);
      return this.transform_.getOrigin();
    }

    set rotation(quat)
    {
      this.body_.getWorldTransform(this.transform_);
      this.transform_.setRotation(quat);
      this.body_.setWorldTransform(this.transform_);
    }

    get rotation()
    {
      this.body_.getWorldTransform(this.transform_);
      return this.transform_.getRotation();
    }

    on_initialized()
    {
      super.on_initialized();

      this.user_data_.user_data = this;
      this.body_.setUserPointer(this.user_data_);
    }

    destroy()
    {
      Ammo.destroy(this.body_);
      Ammo.destroy(this.controller_);
      Ammo.destroy(this.shape_);
      Ammo.destroy(this.transform_);
      Ammo.destroy(this.user_data_);

      super.destroy();
    }

    on_player_death()
    {
      let e_singletons = this.entity_.manager.get_entity("Singletons");
      let c_physics = e_singletons.get_component("PhysicsState");
      c_physics.remove_kinematic_character_controller(this);
    }
  };

  const eDebugDrawMode = Object.freeze({
    DDM_NoDebug: 0,
    DDM_DrawWireframe: (1 << 0),
    DDM_DrawAabb: (1 << 1),
    DDM_DrawFeaturesText: (1 << 2),
    DDM_DrawContactPoints: (1 << 3),
    DDM_NoDeactivation: (1 << 4),
    DDM_NoHelpText: (1 << 5),
    DDM_DrawText: (1 << 6),
    DDM_ProfileTimings: (1 << 7),
    DDM_EnableSatComparison: (1 << 8),
    DDM_DisableBulletLCP: (1 << 9),
    DDM_EnableCCD: (1 << 10),
    DDM_DrawConstraints: (1 << 11),
    DDM_DrawConstraintLimits: (1 << 12),
    DDM_FastWireframe: (1 << 13),
    DDM_DrawNormals: (1 << 14),
    DDM_DrawFrames: (1 << 15),
  });

  class PhysicsDebugDrawer
  {
    /**
     * @param {THREE.Scene} scene
     * @param {Ammo.btCollisionWorld} world
     * @param {int} num_vertices
     */
    constructor(scene, world, num_vertices)
    {
      this.world_ = world;

      this.vertices_ = new Float32Array(num_vertices);
      this.colors_ = new Float32Array(num_vertices);
      this.index_ = 0;
      this.enabled_ = false;

      this.debug_mode_ = eDebugDrawMode.DDM_DrawWireframe;

      const position_attribute = new THREE.BufferAttribute(this.vertices_, 3);
      const color_attribute = new THREE.BufferAttribute(this.colors_, 3);

      position_attribute.setUsage(THREE.StreamDrawUsage);
      color_attribute.setUsage(THREE.StreamDrawUsage);

      this.geometry_ = new THREE.BufferGeometry();
      this.geometry_.setAttribute("position", position_attribute);
      this.geometry_.setAttribute("color", color_attribute);
      this.geometry_.setDrawRange(0, 0);
      
      this.mesh_ = new THREE.LineSegments(
        this.geometry_, 
        new THREE.LineBasicMaterial({ vertexColors: true })
      );
      // mesh.frustumCulled = false;

      scene.add(this.mesh_);

      this.ammo_debug_drawer_ = new Ammo.DebugDrawer();
      this.ammo_debug_drawer_.drawLine = this.drawLine.bind(this);
      this.ammo_debug_drawer_.drawContactPoint = this.drawContactPoint.bind(this);
      this.ammo_debug_drawer_.reportErrorWarning = this.reportErrorWarning.bind(this);
      this.ammo_debug_drawer_.draw3dText = this.draw3dText.bind(this);
      this.ammo_debug_drawer_.setDebugMode = this.setDebugMode.bind(this);
      this.ammo_debug_drawer_.getDebugMode = this.getDebugMode.bind(this);
      this.ammo_debug_drawer_.enable = this.enable.bind(this);
      this.ammo_debug_drawer_.disable = this.disable.bind(this);
      this.ammo_debug_drawer_.update = this.update.bind(this);

      this.world_.setDebugDrawer(this.ammo_debug_drawer_);
    }

    destroy()
    {
      this.mesh_.geometry.dispose();
      this.mesh_.material.dispose();

      Ammo.destroy(this.ammo_debug_drawer_);
    }

    enable()
    {
      this.enabled_ = true;
    }

    disable()
    {
      this.enabled_ = false;
    }

    update()
    {
      if (!this.enabled_)
      {
        this.geometry_.setDrawRange(0, 0);
        return;
      }
    
      this.index_ = 0;

      this.world_.debugDrawWorld();

      if (this.index_ > 0)
      {
        this.geometry_.attributes.position.needsUpdate = true;
        this.geometry_.attributes.color.needsUpdate = true;
      }

      this.geometry_.setDrawRange(0, this.index_);
    }

    draw_vertex_(x, y, z, r, g, b)
    {
      this.vertices_[this.index_ * 3] = x;
      this.vertices_[this.index_ * 3 + 1] = y;
      this.vertices_[this.index_ * 3 + 2] = z;

      this.colors_[this.index_ * 3] = r;
      this.colors_[this.index_ * 3 + 1] = g;
      this.colors_[this.index_ * 3 + 2] = b;

      this.index_ += 1;
    }

    drawLine(from, to, color)
    {
      const heap = Ammo.HEAPF32;
      const r = heap[(color + 0) / 4];
      const g = heap[(color + 4) / 4];
      const b = heap[(color + 8) / 4];
    
      const fromX = heap[(from + 0) / 4];
      const fromY = heap[(from + 4) / 4];
      const fromZ = heap[(from + 8) / 4];
    
      const toX = heap[(to + 0) / 4];
      const toY = heap[(to + 4) / 4];
      const toZ = heap[(to + 8) / 4];

      this.draw_vertex_(fromX, fromY, fromZ, r, g, b);
      this.draw_vertex_(toX, toY, toZ, r, g, b);
    }

    drawContactPoint(point_on_b, normal_on_b, distance, life_time, color)
    {
      // TODO
    }

    reportErrorWarning(warning_str)
    {
      if (Ammo.hasOwnProperty("UTF8ToString"))
      {
        log.warn(Ammo.UTF8ToString(warning_str));
      }
      else
      {
        log.error("Cannot print warningString, please export UTF8ToString from Ammo.js in make.py");
      }
    }

    draw3dText(location, text_str)
    {
      // TODO
    }

    setDebugMode(debug_mode)
    {
      this.debug_mode_ = debug_mode;
    }

    getDebugMode()
    {
      return this.debug_mode_;
    }
  };

  class PhysicsState extends ecs_component.Component
  {
    static CLASS_NAME = 'PhysicsState';

    get NAME() {
      return PhysicsState.CLASS_NAME;
    }

    constructor()
    {
      super();

      this.collision_configuration_ = new Ammo.btDefaultCollisionConfiguration();
      this.dispatcher_ = new Ammo.btCollisionDispatcher(this.collision_configuration_);
      this.broadphase_ = new Ammo.btDbvtBroadphase();
      this.solver_ = new Ammo.btSequentialImpulseConstraintSolver();
      this.physics_world_ = new Ammo.btDiscreteDynamicsWorld(
          this.dispatcher_, 
          this.broadphase_, 
          this.solver_, 
          this.collision_configuration_);
      
      this.physics_world_.setGravity(new Ammo.btVector3(0, BT_GRAVITY, 0));

      this.physics_world_.getDispatchInfo().m_allowedCcdPenetration = 0.01;  // Fix jitter on wall slide

      const broadphase = this.physics_world_.getBroadphase();
      const paircache = broadphase.getOverlappingPairCache();
      paircache.setInternalGhostPairCallback(new Ammo.btGhostPairCallback());

      this.ray_from_ = new Ammo.btVector3();
      this.ray_to_ = new Ammo.btVector3();
      // this.ray_cb_ = new Ammo.AllHitsRayResultCallback(this.ray_from_, this.ray_to_);

      // Map(Listener, Set(Collider))
      this.previous_collisions_ = new Map();
      // Map(Listener, Map(Collider, Array(Collision_Info)))
      this.current_collisions_ = new Map();

      this.debug_drawer_ = null;
      this.draw_debug_physics = null;

      if (env.DEBUG_MODE)
      {
        this.debug_drawer_ = null;
        this.draw_debug_physics = false;
      }

      // this.tmpRayOrigin_ = new Ammo.btVector3();
      // this.tmpRayDst_ = new Ammo.btVector3();
      // // this.rayCallback_ = new Ammo.ClosestRayResultCallback(this.tmpRayOrigin_, this.tmpRayDst_);
      // this.rayCallback_ = new Ammo.AllHitsRayResultCallback(this.tmpRayOrigin_, this.tmpRayDst_);
    }

    destroy()
    {
      Ammo.destroy(this.physics_world_);
      Ammo.destroy(this.solver_);
      Ammo.destroy(this.broadphase_);
      Ammo.destroy(this.dispatcher_);
      Ammo.destroy(this.collision_configuration_);
      Ammo.destroy(this.ray_from_);
      Ammo.destroy(this.ray_to_);
      // Ammo.destroy(this.ray_cb_);

      if (env.DEBUG_MODE)
      {
        if (this.debug_drawer_ !== null)
        {
          this.debug_drawer_.destroy();
        }
      }

      super.destroy();
    }

    add_collision(owner_name, collision_info)
    {
      if (this.current_collisions_.has(owner_name) === false)
      {
        this.current_collisions_.set(owner_name, new Map());
      }

      let collision_infos_map = this.current_collisions_.get(owner_name);

      if (collision_infos_map.has(collision_info.name) === false)
      {
        collision_infos_map.set(collision_info.name, []);
      }

      let collision_infos = collision_infos_map.get(collision_info.name);
      collision_infos.push(collision_info);
    }

    get_collision_info(listener_name, collider_name)
    {
      let current_collisions_map = this.current_collisions_.get(listener_name);
      if (current_collisions_map === undefined)
      {
        return [];
      }

      const collision_infos = current_collisions_map.get(collider_name);
      if (collision_infos === undefined)
      {
        return [];
      }

      return collision_infos;
    }

    clear_collisions()
    {
      this.previous_collisions_.clear();

      for (const [owner, current_collisions_map] of this.current_collisions_)
      {
        if (this.previous_collisions_.has(owner) === false)
        {
          this.previous_collisions_.set(owner, new Set());
        }

        let previous_collisions_set = this.previous_collisions_.get(owner);

        for (const [collider_name, _] of current_collisions_map)
        {
          previous_collisions_set.add(collider_name);
        }
      }

      this.current_collisions_.clear();
    }

    is_collision_enter(listener_name, collider_name)
    {
      let previous_collisions_set = this.previous_collisions_.get(listener_name);
      let current_collisions_map = this.current_collisions_.get(listener_name);

      if (previous_collisions_set === undefined || current_collisions_map === undefined)
      {
        return false;
      }

      return !previous_collisions_set.has(collider_name) && 
              current_collisions_map.has(collider_name);
    }

    is_colliding(listener_name, collider_name)
    {
      let current_collisions_map = this.current_collisions_.get(listener_name);

      if (current_collisions_map === undefined)
      {
        return false;
      }

      return current_collisions_map.has(collider_name);
    }

    is_collision_exit(listener_name, collider_name)
    {
      let previous_collisions_set = this.previous_collisions_.get(listener_name);
      let current_collisions_map = this.current_collisions_.get(listener_name);

      if (previous_collisions_set === undefined || current_collisions_map === undefined)
      {
        return false;
      }

      return previous_collisions_set.has(collider_name) && 
             !current_collisions_map.has(collider_name);
    }

    add_collider(collider, collision_group, collision_mask)
    {
      if (collision_group === undefined)
      {
        collision_group = eCollisionGroup.CG_Default;
      }

      if (collision_mask === undefined)
      {
        collision_mask = eCollisionGroup.CG_All;
      }

      // let proxy = collider.body_.getBroadphaseProxy();
      // proxy.m_collisionFilterGroup = collision_group;
      // proxy.m_collisionFilterMask = collision_mask;

      // TODO: short group, short mask
      this.physics_world_.addRigidBody(collider.body_, collision_group, collision_mask);
      // this.physics_world_.addRigidBody(collider.body_);
    }

    remove_collider(collider)
    {
      this.physics_world_.removeRigidBody(collider.body_);
    }

    add_trigger(trigger, collision_group, collision_mask)
    {
      if (collision_group === undefined)
      {
        collision_group = eCollisionGroup.CG_Default;
      }

      if (collision_mask === undefined)
      {
        collision_mask = eCollisionGroup.CG_All;
      }
    
      this.physics_world_.addCollisionObject(trigger.body_, collision_group, collision_mask);
    }

    remove_trigger(trigger)
    {
      this.physics_world_.removeCollisionObject(trigger.body_);
    }

    add_kinematic_character_controller(kcc, collision_group, collision_mask)
    {
      if (collision_group === undefined)
      {
        collision_group = eCollisionGroup.CG_Default;
      }

      if (collision_mask === undefined)
      {
        collision_mask = eCollisionGroup.CG_All;
      }

      // let proxy = kcc.body_.getBroadphaseHandle();
      // proxy.m_collisionFilterGroup = collision_group;
      // proxy.m_collisionFilterMask = collision_mask;

      /*
      enum CollisionFilterGroups {
        DefaultFilter = 1,
        StaticFilter = 2,
        KinematicFilter = 4,
        DebrisFilter = 8,
        SensorTrigger = 16,
        CharacterFilter = 32,
        AllFilter = -1
      }
      */
      // this.physics_world_.addCollisionObject(kcc.body_, 32, 3);
      this.physics_world_.addCollisionObject(kcc.body_, collision_group, collision_mask);
      this.physics_world_.addAction(kcc.controller_);

      // const broadphase = this.physics_world_.getBroadphase();
      // const paircache = broadphase.getOverlappingPairCache();
      // paircache.setInternalGhostPairCallback(new Ammo.btGhostPairCallback());
    }

    remove_kinematic_character_controller(kcc)
    {
      this.physics_world_.removeCollisionObject(kcc.body_);
      this.physics_world_.removeAction(kcc.controller_);
    }

    ray_test(from_world, to_world, filter_group = eCollisionGroup.CG_All, filter_mask = eCollisionGroup.CG_All)
    {
      this.ray_from_.setValue(from_world.x, from_world.y, from_world.z);
      this.ray_to_.setValue(to_world.x, to_world.y, to_world.z);

      let ray_cb = new Ammo.AllHitsRayResultCallback(this.ray_from_, this.ray_to_);
      ray_cb.set_m_collisionFilterGroup(filter_group);
      ray_cb.set_m_collisionFilterMask(filter_mask);

      this.physics_world_.rayTest(this.ray_from_, this.ray_to_, ray_cb);

      let hit_data = [];

      if (ray_cb.hasHit())
      {
        const collision_objects = ray_cb.get_m_collisionObjects();
        const points = ray_cb.get_m_hitPointWorld();
        const normals = ray_cb.get_m_hitNormalWorld();
        const hits = collision_objects.size();
        const start = {
          x: this.ray_from_.x(),
          y: this.ray_from_.y(),
          z: this.ray_from_.z(),
        };
        const distance = (p1, p2) => {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dz = p2.z - p1.z;
          return Math.sqrt(dx * dx + dy * dy + dz * dz);
        };

        for (let i = 0; i < hits; ++i)
        {
          const obj = collision_objects.at(i);
          const ud0 = Ammo.castObject(obj.getUserPointer(), Ammo.btVector3).user_data;
  
          const point = points.at(i);
          const normal = normals.at(i);
  
          const p = { x: point.x(), y: point.y(), z: point.z() };
          const n = { x: normal.x(), y: normal.y(), z: normal.z() };

          hit_data.push({
            position: p,
            normal: n,
            component: ud0,
            collision_object: obj,
            distance: distance(start, p),
          });
        }
      }

      hit_data.sort((a, b) => { return a.distance - b.distance});

      Ammo.destroy(ray_cb);

      return hit_data;
    }

    /**
     * @param {THREE.Scene} scene
     */
    create_debug_drawer(scene)
    {
      if (env.DEBUG_MODE)
      {
        this.debug_drawer_ = new PhysicsDebugDrawer(scene, this.physics_world_, BT_MAX_DEBUG_VERTICES);
        if (this.draw_debug_physics)
        {
          this.debug_drawer_.enable();
        }
        else
        {
          this.debug_drawer_.disable();
        }
        this.debug_drawer_.setDebugMode(eDebugDrawMode.DDM_DrawWireframe);

        const e_singletons = this.entity.manager.get_entity("Singletons");
        let c_editor = e_singletons.get_component("EditorComponent");
        let debug_draw_page = c_editor.get_page(component_editor.eEditorPage.EP_DebugDraw);

        debug_draw_page.add_binding(this, 'draw_debug_physics', "Physics", null, (value) => {
          if (value === true)
          {
            this.debug_drawer_.enable();
          }
          else
          {
            this.debug_drawer_.disable();
          }
        });
      }
    }

    update_debug_drawer()
    {
      if (env.DEBUG_MODE)
      {
        if (this.debug_drawer_)
          {
            this.debug_drawer_.update();
          }
      }
    }
  };

  return {
    PhysicsState: PhysicsState,
    eBodyType: eBodyType,
    BoxCollider: BoxCollider,
    CapsuleCollider: CapsuleCollider,
    CylinderCollider: CylinderCollider,
    KinematicCharacterController: KinematicCharacterController,
    ConvexMeshCollider: ConvexMeshCollider,
    ConcaveMeshCollider: ConcaveMeshCollider,
    BoxTrigger: BoxTrigger,
    CylinderTrigger: CylinderTrigger,
    ConvexMeshTrigger: ConvexMeshTrigger,
    Trigger: Trigger,
  };

})();
