import { env } from '../Env';
import { component_physics } from '../Components/Physics';
import { component_transform } from '../Components/Transform';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';
import { component_player_blocker } from '../Components/PlayerBlocker';


export const system_physics = (() => {

  class PhysicsSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.physics_system_tuples_cylinder = new ecs_component.ComponentContainer(
        component_physics.CylinderCollider.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
      );
      this.physics_system_tuples_kcc = new ecs_component.ComponentContainer(
        component_physics.KinematicCharacterController.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
      );
      // this.physics_system_tuples_box_triggers = new ecs_component.ComponentContainer(
      //   component_physics.BoxTrigger.CLASS_NAME,
      // );
      this.physics_system_tuples_player_blocker = new ecs_component.ComponentContainer(
        component_player_blocker.PlayerBlocker.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.physics_system_tuples_kcc);
      // this.entity_manager_.update_component_container(this.physics_system_tuples_box_triggers);
      this.entity_manager_.update_component_container(this.physics_system_tuples_player_blocker);
      this.entity_manager_.update_component_container(this.physics_system_tuples_cylinder);
    }

    fixed_update(fixed_delta_time_s)
    {
      const e_singletons = this.get_entity("Singletons");
      let c_physics_state = e_singletons.get_component("PhysicsState");
      let physics_world = c_physics_state.physics_world_;

      const max_sub_steps = 0;
      physics_world.stepSimulation(fixed_delta_time_s, max_sub_steps, fixed_delta_time_s);

      const dispatcher = physics_world.getDispatcher();
      const num_manifolds = dispatcher.getNumManifolds();
    
      c_physics_state.clear_collisions();

      for (let i = 0; i < num_manifolds; ++i)
      {
        const contact_manifold = dispatcher.getManifoldByIndexInternal(i);
        const num_contacts = contact_manifold.getNumContacts();

        if (num_contacts > 0)
        {
          const collision_obj0 = contact_manifold.getBody0();
          const collision_obj1 = contact_manifold.getBody1();
          const ud0 = Ammo.castObject(collision_obj0.getUserPointer(), Ammo.btVector3).user_data;
          const ud1 = Ammo.castObject(collision_obj1.getUserPointer(), Ammo.btVector3).user_data;

          if (!ud0.is_contact_listener && !ud1.is_contact_listener)
          {
            continue;
          }

          let contacts = [];
          for (let j = 0; j < num_contacts; ++j)
          {
            let contact = {};
            const contact_point = contact_manifold.getContactPoint(j);
            contact.distance = contact_point.getDistance();
            contact.impulse = contact_point.getAppliedImpulse();
            const normal = contact_point.m_normalWorldOnB;
            contact.normal = { x: normal.x(), y: normal.y(), z: normal.z() };
            const position_0 = contact_point.getPositionWorldOnA();
            const position_1 = contact_point.getPositionWorldOnB();
            contact.position_0 = { x: position_0.x(), y: position_0.y(), z: position_0.z() };
            contact.position_1 = { x: position_1.x(), y: position_1.y(), z: position_1.z() };
            contacts.push(contact);
          }

          if (ud0.is_contact_listener)
          {
            let contacts_a =
            {
              object_id: 0,
              name: ud1.name,
              contacts: contacts,
            };
            c_physics_state.add_collision(ud0.name, contacts_a);
          }

          if (ud1.is_contact_listener)
          {
            let contacts_b =
            {
              object_id: 1,
              name: ud0.name,
              contacts: contacts,
            };
            c_physics_state.add_collision(ud1.name, contacts_b);
          }
        }
      }

      // TODO: we need to use Raycaster.intersectObject in case of Lightsaber-Wall intersects?
      //       https://threejs.org/docs/#api/en/core/Raycaster.intersectObject
      // if ("PlayerSwordTrigger" in collisions)
      // {
      //   const player_sword_collisions = collisions["PlayerSwordTrigger"];

      //   // const obj_id = player_sword_collisions[0].object_id;
      //   // // const collider_name = player_sword_collisions[0].name;
      //   // const contact = player_sword_collisions[0].contacts[0];

      //   // let position = null;
      //   // if (obj_id === 0)
      //   // {
      //   //   position = contact.position_0;
      //   // }
      //   // else
      //   // {
      //   //   position = contact.position_1;
      //   // }

      //   // this.origin.set(position.x, position.y, position.z);
      //   // this.dir.set(contact.normal.x, contact.normal.y, contact.normal.z);
      //   // this.dir.multiplyScalar(-1);

      //   // this.arrow_helper.position.copy(this.origin);
      //   // this.arrow_helper.setDirection(this.dir);

      //   // const e_player_mesh = this.get_entity("PlayerMesh");
      //   // const e_mesh_component = e_player_mesh.get_component("SkinnedMeshComponent");

      //   // const sword = e_mesh_component.bone_;
      //   // sword.getWorldPosition(this.origin);
      //   // sword.getWorldDirection(this.dir);
      //   // this.dir.multiplyScalar(-1);
      //   // this.dir.normalize();

      //   // this.arrow_helper.position.copy(this.origin);
      //   // this.arrow_helper.setDirection(this.dir);

      //   // let to  = new THREE.Vector3();

      //   // to.copy(this.origin);
      //   // this.dir.multiplyScalar(this.length);
      //   // to.add(this.dir);

      //   // const hit_data = c_physics_state.ray_test(this.origin, to);
      //   // const hit = hit_data.find((e) => e.name === "PlayerSwordTrigger");

      //   // this.arrow_helper2.position.set(hit.position.x, hit.position.y, hit.position.z);
      //   // this.dir.set(hit.normal.x, hit.normal.y, hit.normal.z);
      //   // this.dir.normalize();
      //   // this.arrow_helper2.setDirection(this.dir);
      // }

      for (let i = 0; i < this.physics_system_tuples_cylinder.size; ++i)
      {
        const [colliders, transforms] = this.physics_system_tuples_cylinder.component_tuples;

        let c_collider = colliders[i];
        let c_transform = transforms[i];

        if (c_collider.body_type_ !== component_physics.eBodyType.BT_Dynamic)
        {
          continue;
        }

        let trans_pos = c_transform.position;
        let trans_rot = c_transform.rotation;

        const col_pos = c_collider.position;
        const col_rot = c_collider.rotation;

        trans_pos.set(col_pos.x(), col_pos.y(), col_pos.z());
        trans_rot.set(col_rot.x(), col_rot.y(), col_rot.z(), col_rot.w());

        c_transform.position = trans_pos;
        c_transform.rotation = trans_rot;
      }

      for (let i = 0; i < this.physics_system_tuples_player_blocker.size; ++i)
      {
        const [blockers, transforms] = this.physics_system_tuples_player_blocker.component_tuples;

        let c_blocker = blockers[i];
        let c_transform = transforms[i];

        let outer_trigger = c_blocker.outer_trigger_;
        let inner_trigger = c_blocker.inner_trigger_;

        const trans_pos = c_transform.position;
        const trans_rot = c_transform.rotation;

        let col_pos1 = outer_trigger.body_.getWorldTransform().getOrigin();
        let col_rot1 = outer_trigger.body_.getWorldTransform().getRotation();
        let col_pos2 = inner_trigger.body_.getWorldTransform().getOrigin();
        let col_rot2 = inner_trigger.body_.getWorldTransform().getRotation();

        col_pos1.setValue(trans_pos.x, trans_pos.y, trans_pos.z);
        col_rot1.setValue(trans_rot.x, trans_rot.y, trans_rot.z, trans_rot.w);
        col_pos2.setValue(trans_pos.x, trans_pos.y, trans_pos.z);
        col_rot2.setValue(trans_rot.x, trans_rot.y, trans_rot.z, trans_rot.w);

        outer_trigger.body_.getWorldTransform().setOrigin(col_pos1);
        outer_trigger.body_.getWorldTransform().setRotation(col_rot1);
        inner_trigger.body_.getWorldTransform().setOrigin(col_pos2);
        inner_trigger.body_.getWorldTransform().setRotation(col_rot2);
      }

      const [kccs, transforms] = this.physics_system_tuples_kcc.component_tuples;

      for (let i = 0; i < this.physics_system_tuples_kcc.size; ++i)
      {
        let c_kcc = kccs[i];
        let c_transform = transforms[i];

        let trans_pos = c_transform.position;
        // TODO: This is a bad bug. If we don't get rotation here, then MovementSystem rotation breaks???
        let trans_rot = c_transform.rotation;

        const kcc_pos = c_kcc.controller_.getGhostObject().getWorldTransform().getOrigin();
        // const kcc_rot = c_kcc.controller_.getGhostObject().getWorldTransform().getRotation();

        trans_pos.set(kcc_pos.x(), kcc_pos.y(), kcc_pos.z());
        // trans_rot.set(kcc_rot.x(), kcc_rot.y(), kcc_rot.z(), kcc_rot.w());

        c_transform.position = trans_pos;
        // c_transform.rotation = trans_rot;

        // if (env.DEBUG_MODE)
        // {
        //   // c_kcc.debug_mesh_.position.set(kcc_pos.x(), kcc_pos.y(), kcc_pos.z());
        //   // c_kcc.debug_mesh_.quaternion.set(kcc_rot.x(), kcc_rot.y(), kcc_rot.z(), kcc_rot.w());
        // }
      }
    }

    update(delta_time_s)
    {
      if (env.DEBUG_MODE)
      {
        const e_singletons = this.get_entity("Singletons");
        let c_physics_state = e_singletons.get_component("PhysicsState");
        c_physics_state.update_debug_drawer();
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    PhysicsSystem: PhysicsSystem,
  };

})();
