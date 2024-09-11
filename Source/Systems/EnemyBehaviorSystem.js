import * as THREE from 'three';
import { eCollisionGroup } from '../Config';
import { component_blaster } from '../Components/BlasterSpawner';
import { component_enemy_behavior } from '../Components/EnemyBehavior';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';
import { component_player_state } from '../Components/PlayerState';
import { component_transform } from '../Components/Transform';
import { intersect } from '../Intersect';


export const system_enemy_behavior = (() => {

  class EnemyBehaviorSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.ai_behavior_system_tuples = new ecs_component.ComponentContainer(
        component_enemy_behavior.EnemyBehaviorComponent.CLASS_NAME,
        component_blaster.BlasterSpawner.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.ai_behavior_system_tuples);
    }

    fixed_update(fixed_delta_time_s)
    {
      const [behaviors, blasters] = this.ai_behavior_system_tuples.component_tuples;
      const size = this.ai_behavior_system_tuples.size;

      let e_singletons = this.entity_manager_.get_entity("Singletons");
      let c_physics = e_singletons.get_component("PhysicsState");

      for (let i = 0; i < size; ++i)
      {
        let c_behavior = behaviors[i];
        let c_blaster = blasters[i];

        for (let shot of c_blaster.instances)
        {
          if (shot.is_active === false)
          {
            continue;
          }

          shot.p1.position
            .copy(shot.mesh_.position)
            .add(new THREE.Vector3().copy(shot.direction).multiplyScalar(-0.2));
          shot.p2.position
            .copy(shot.mesh_.position)
            .add(new THREE.Vector3().copy(shot.direction).multiplyScalar(0.3));

          // TODO: Raycast
          let hit = c_physics.ray_test(
            shot.p1.position, 
            shot.p2.position,
            eCollisionGroup.CG_Enemy, 
            eCollisionGroup.CG_All);// & ~eCollisionGroup.CG_Enemy);
          if (hit.length > 0)
          {
            // console.log(hit);
    
            const p = hit[0].position;
            const n = hit[0].normal;
            const component = hit[0].component;
            const collision_object = hit[0].collision_object;

            const collision_group = collision_object.getBroadphaseHandle().get_m_collisionFilterGroup();
            if (collision_group === eCollisionGroup.CG_Player)
            {
              console.log("OUCH!");
  
              // c_glow.capsule.position.set(p.x, p.y, p.z);
              // c_glow.capsule.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(n.x, n.y, n.z));
    
              // c_glow.capsule.material.color.setHex(0xff0000);
            }
            else if (collision_group === eCollisionGroup.CG_PlayerDeflector)
            {
              const entity =  component.entity;
              // const name =  entity.name;

              // console.log(`Deflect: ${name}`);

              let c_player_blocker = entity.get_component("PlayerBlocker");

              const is_outer_trigger = c_player_blocker.outer_trigger_.uuid === component.uuid;
              const is_inner_trigger = c_player_blocker.inner_trigger_.uuid === component.uuid;

              if (is_outer_trigger && c_blaster.deflect_outer.has(shot) === false)
              {
                // Check whether player can block the shot
                const e_player = this.get_entity("Player");
                let c_transform = e_player.get_component("Transform");
                const player_position = c_transform.position;
                const player_direction = c_transform.forward;

                // TODO: Buffer Vectors!!!
                const player_dir = new THREE.Vector2(player_direction.x, player_direction.z);
                const shot_dir = new THREE.Vector2(p.x - player_position.x, p.z - player_position.z).normalize();
                const angle_rad = shot_dir.angleTo(player_dir);
                const angle_deg = THREE.MathUtils.radToDeg(angle_rad);
                // console.log('Angle between vectors (degrees):', angle_deg);

                if (angle_deg > 45.0)
                {
                  continue;
                }

                const e_player_mesh = this.entity_manager_.get_entity("PlayerMesh");
                let c_player_state = e_player_mesh.get_component("PlayerState");

                if (c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Attacking))
                {
                  continue;
                }

                // console.log(`Deflect OUTER: ${name}`);

                c_blaster.deflect_outer.add(shot);

                // TODO: Buffer Vectors!!!
                // Check if shot will actually reach player
                let sa = new THREE.Vector3().copy(shot.mesh_.position);
                let sbd = new THREE.Vector3().copy(shot.direction).multiplyScalar(4.0);
                let sb = new THREE.Vector3().copy(shot.mesh_.position).add(sbd);
                let pos = c_player_blocker.inner_trigger_.body_.getWorldTransform().getOrigin();
                let p_ = new THREE.Vector3().set(pos.x(), pos.y() + 2.0, pos.z());
                let q = new THREE.Vector3().set(pos.x(), pos.y(), pos.z());
                let r = 0.55;

                const result = intersect.segment_cylinder(sa, sb, p_, q, r);
                if (result.intersects === false)
                {
                  continue;
                }

                c_player_state.set_player_action(component_player_state.ePlayerAction.PS_Blocking);
              }
              else if (is_inner_trigger)
              {
                const is_getting_blocked = c_blaster.deflect_outer.has(shot);
                if (is_getting_blocked === false)
                {
                  continue;
                }

                let direction = shot.direction;
                direction.set(n.x, n.y, n.z);

                let rotation = shot.mesh_.quaternion;
                rotation.setFromUnitVectors(component_transform.YAxis, direction);
              }

              // console.log(`outer: ${is_outer_trigger} | inner: ${is_inner_trigger}`)

              continue;
            }

            c_blaster.despawn(shot);
          }
        }
      }
    }

    update(delta_time_s)
    {
      const [behaviors, blasters] = this.ai_behavior_system_tuples.component_tuples;
      const size = this.ai_behavior_system_tuples.size;

      for (let i = 0; i < size; ++i)
      {
        let c_behavior = behaviors[i];
        let c_blaster = blasters[i];
        
        c_behavior.behavior.tick(delta_time_s);

        // if (c_blaster.time > 0.0)
        // {
        //   c_blaster.time -= delta_time_s;
        // }

        // if (c_blaster.time <= 0.0)
        // {
        //   c_blaster.spawn();
        //   c_blaster.time = 0.6;
        // }

        for (let shot of c_blaster.instances)
        {
          if (shot.is_active === false)
          {
            continue;
          }

          shot.lifetime -= delta_time_s;

          shot.velocity
            .copy(shot.direction)
            .multiplyScalar(25.0 * delta_time_s);
          shot.mesh_.position.add(shot.velocity);

          if (shot.lifetime <= 0.0)
          {
            c_blaster.despawn(shot);
          }
        }
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    EnemyBehaviorSystem: EnemyBehaviorSystem,
  };

})();
