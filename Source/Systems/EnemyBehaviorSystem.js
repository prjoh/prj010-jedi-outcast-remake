import * as THREE from 'three';
import { eCollisionGroup } from '../Config';
import { component_blaster } from '../Components/BlasterSpawner';
import { component_enemy_behavior } from '../Components/EnemyBehavior';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';
import { component_player_state } from '../Components/PlayerState';
import { component_transform } from '../Components/Transform';
import { intersect } from '../Intersect';
import { component_enemy_sensors } from '../Components/EnemySensors';
import { assert } from '../Assert';
import { log } from '../Log';


export const system_enemy_behavior = (() => {

  class EnemyBehaviorSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.ai_behavior_system_tuples = new ecs_component.ComponentContainer(
        component_enemy_behavior.EnemyBehaviorComponent.CLASS_NAME,
        component_blaster.BlasterSpawner.CLASS_NAME,
        component_enemy_sensors.EnemySensorsComponent.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
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
      const [behaviors, blasters, sensors, transforms] = this.ai_behavior_system_tuples.component_tuples;
      const size = this.ai_behavior_system_tuples.size;

      let e_singletons = this.entity_manager_.get_entity("Singletons");
      let c_physics = e_singletons.get_component("PhysicsState");

      for (let i = 0; i < size; ++i)
      {
        let c_behavior = behaviors[i];
        let c_blaster = blasters[i];
        const c_sensors = sensors[i];
        const c_transform = transforms[i];

        for (let shot of c_blaster.instances)
        {
          if (shot.is_active === false)
          {
            continue;
          }

          shot.p1
            .copy(shot.mesh_.position)
            .add(new THREE.Vector3().copy(shot.direction).multiplyScalar(-0.35));
          shot.p2
            .copy(shot.mesh_.position)
            .add(new THREE.Vector3().copy(shot.direction).multiplyScalar(0.5));

          // TODO: Raycast
          let hits = c_physics.ray_test(
            shot.p1, 
            shot.p2,
            eCollisionGroup.CG_Enemy, 
            eCollisionGroup.CG_All);// & ~eCollisionGroup.CG_Enemy);
          for (const hit of hits)
          {
            if (this.handle_blaster_hit_(hit, c_blaster, shot) === true)
            {
              break;
            }
          }
        }

        let e_player = this.entity_manager_.get_entity("Player");
        const c_player_transform = e_player.get_component("Transform");

        const enemy_position = c_transform.position;
        const enemy_direction = c_transform.forward;
        const player_position = c_player_transform.position;
        const to_player = new THREE.Vector3().copy(player_position).sub(enemy_position);

        const distance = enemy_position.distanceTo(player_position);

        // TODO: Buffer Vectors!!!
        const enemy_dir = new THREE.Vector2(enemy_direction.x, enemy_direction.z).normalize();
        const player_dir = new THREE.Vector2(to_player.x, to_player.z).normalize();
        const angle_rad = enemy_dir.angleTo(player_dir);
        const angle_deg = THREE.MathUtils.radToDeg(angle_rad);

        const view_angle_far_threshold = c_sensors.view_angle_far_degrees_ * 0.5;
        const view_angle_close_threshold = c_sensors.view_angle_close_degrees_ * 0.5;
        const view_distance_far = c_sensors.view_distance_far_;
        const view_distance_close = c_sensors.view_distance_close_;

        c_sensors.ray_from.copy(enemy_position).setY(0.0);
        c_sensors.ray_from.add(c_sensors.agent_height);
        c_sensors.ray_to.copy(player_position).setY(0.0);
        c_sensors.ray_to.add(c_sensors.agent_height);
        // c_sensors.cube1.position.copy(c_sensors.ray_from);
        // c_sensors.cube2.position.copy(c_sensors.ray_to);

        if (distance < c_sensors.sense_distance_)
        {
          let hits = c_physics.ray_test(
            c_sensors.ray_from, 
            c_sensors.ray_to, 
            eCollisionGroup.CG_Enemy, 
            eCollisionGroup.CG_All & ~eCollisionGroup.CG_EnemyHitBox & ~eCollisionGroup.CG_PlayerDeflector);
          if (hits.length > 0 && this.is_player_hit(hits[0]))
          {
            if (c_sensors.next_view_state !== component_enemy_sensors.eViewSensorState.VSS_Detected)
            {
              c_sensors.schedule_view_state_update(
                component_enemy_sensors.eViewSensorState.VSS_Detected, 
                0.0,
                () => { c_sensors.update_point_of_interest(player_position); }
              );
            }
          }
          else
          {
            if (c_sensors.next_view_state !== component_enemy_sensors.eViewSensorState.VSS_None)
            {
              c_sensors.schedule_view_state_update(component_enemy_sensors.eViewSensorState.VSS_None, 0.0);
            }
          }
        }
        else if (angle_deg > view_angle_far_threshold || distance > view_distance_far)
        {
          if (c_sensors.next_view_state !== component_enemy_sensors.eViewSensorState.VSS_None)
          {
            c_sensors.schedule_view_state_update(component_enemy_sensors.eViewSensorState.VSS_None, 0.0);
          }
        }
        else
        {
          if (angle_deg < view_angle_close_threshold)
          {
            let hits = c_physics.ray_test(
              c_sensors.ray_from, 
              c_sensors.ray_to, 
              eCollisionGroup.CG_Enemy, 
              eCollisionGroup.CG_All & ~eCollisionGroup.CG_EnemyHitBox & ~eCollisionGroup.CG_PlayerDeflector);
            if (hits.length > 0 && this.is_player_hit(hits[0]))
            {
              if (distance < view_distance_close)
              {
                if (c_sensors.next_view_state !== component_enemy_sensors.eViewSensorState.VSS_Detected)
                {
                  c_sensors.schedule_view_state_update(
                    component_enemy_sensors.eViewSensorState.VSS_Detected, 
                    0.3,
                    () => { 
                      const player_position = this.get_player_position();
                      c_sensors.update_point_of_interest(player_position); 
                    }
                  );
                }
              }
              else
              {
                if (c_sensors.next_view_state !== component_enemy_sensors.eViewSensorState.VSS_Suspicious)
                {
                  c_sensors.schedule_view_state_update(
                    component_enemy_sensors.eViewSensorState.VSS_Suspicious, 
                    0.3,
                    () => { 
                      const player_position = this.get_player_position();
                      c_sensors.update_point_of_interest(player_position); 
                    }
                  );
                }
              }
            }
            else
            {
              if (c_sensors.next_view_state !== component_enemy_sensors.eViewSensorState.VSS_None)
              {
                c_sensors.schedule_view_state_update(component_enemy_sensors.eViewSensorState.VSS_None, 0.0);
              }
            }
          }
          else if (angle_deg < view_angle_far_threshold)
          {
            let hits = c_physics.ray_test(
              c_sensors.ray_from, 
              c_sensors.ray_to, 
              eCollisionGroup.CG_Enemy, 
              eCollisionGroup.CG_All & ~eCollisionGroup.CG_EnemyHitBox & ~eCollisionGroup.CG_PlayerDeflector);
            if (hits.length > 0 && this.is_player_hit(hits[0]))
            {
              if (c_sensors.next_view_state !== component_enemy_sensors.eViewSensorState.VSS_Suspicious)
              {
                c_sensors.schedule_view_state_update(
                  component_enemy_sensors.eViewSensorState.VSS_Suspicious, 
                  0.3,
                  () => { 
                    const player_position = this.get_player_position();
                    c_sensors.update_point_of_interest(player_position); 
                  }
                );
              }
            }
            else
            {
              if (c_sensors.next_view_state !== component_enemy_sensors.eViewSensorState.VSS_None)
              {
                c_sensors.schedule_view_state_update(component_enemy_sensors.eViewSensorState.VSS_None, 0.0);
              }
            }
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

    get_player_position()
    {
      let e_player = this.entity_manager_.get_entity("Player");
      const c_player_transform = e_player.get_component("Transform");
      return c_player_transform.position;
    }

    is_player_hit(hit)
    {
      const collision_object = hit.collision_object;
      const collision_group = collision_object.getBroadphaseHandle().get_m_collisionFilterGroup();
      return collision_group === eCollisionGroup.CG_Player;
    }

    handle_blaster_hit_(hit, c_blaster, shot)
    {
      const p = hit.position;
      const n = hit.normal;
      const component = hit.component;
      const collision_object = hit.collision_object;

      const collision_group = collision_object.getBroadphaseHandle().get_m_collisionFilterGroup();
      if (collision_group === eCollisionGroup.CG_Player)
      {
        const e_player =  component.entity;
        let e_singletons = this.entity_manager_.get_entity("Singletons");

        let c_player_health = e_player.find_component("HealthComponent");
        let c_health_bar = e_singletons.get_component("UI_HealthBar");
        let c_player_state = e_player.find_component("PlayerState");

        if (c_player_health.is_alive() === false)
        {
          return false;
        }

        const damage = 12.5;

        c_player_health.take_damage(damage);
        c_health_bar.update(c_player_health);
        c_player_state.set_player_action(component_player_state.ePlayerAction.PS_Hit);
        c_blaster.despawn(shot);

        let e_audio = this.entity_manager_.get_entity("PlayerAudio_Voice");
        let c_emitter = e_audio.get_component("AudioEmitterComponent");
        c_emitter.stop();
        c_emitter.set_audio(`pain${THREE.MathUtils.randInt(1, 4)}`);
        c_emitter.play();

        return true;
      }
      else if (collision_group === eCollisionGroup.CG_EnemyHitBox)
      {
        if (shot.is_deflected === false)
        {
          return false;
        }

        // Get entity from component because the blaster may hit another enemy
        const e_trooper =  component.entity;

        let c_health = e_trooper.get_component("HealthComponent");
        let c_behavior = e_trooper.get_component("EnemyBehaviorComponent");

        c_health.take_damage(100.0);
  
        if (c_health.is_alive())
        {
          c_behavior.behavior.hit();
        }
        else
        {
          c_behavior.behavior.shot_death();
        }

        c_blaster.despawn(shot);

        return true;
      }
      else if (collision_group === eCollisionGroup.CG_PlayerDeflector)
      {
        const e_player_mesh =  component.entity;

        let c_player_blocker = e_player_mesh.get_component("PlayerBlocker");

        const is_outer_trigger = c_player_blocker.outer_trigger_.uuid === component.uuid;
        const is_inner_trigger = c_player_blocker.inner_trigger_.uuid === component.uuid;

        if (is_inner_trigger)
        {
          const is_getting_blocked = c_blaster.deflect_outer.has(shot);
          if (is_getting_blocked === false)
          {
            return false;
          }

          shot.set_deflect();

          let direction = shot.direction;
          direction.set(n.x, n.y, n.z);

          let rotation = shot.mesh_.quaternion;
          rotation.setFromUnitVectors(component_transform.YAxis, direction);

          const e_trooper =  c_blaster.entity;
          let e_reflect_audio = this.entity_manager_.get_entity(e_trooper.name + "Audio_Reflect");
          let c_reflect_audio = e_reflect_audio.find_component("AudioEmitterComponent");
          c_reflect_audio.stop();
          c_reflect_audio.set_audio(`reflect${THREE.MathUtils.randInt(1, 3)}`);
          c_reflect_audio.set_pitch(THREE.MathUtils.randInt(-2, 2) * 100);
          c_reflect_audio.play();

          return true;
        }
        else if (is_outer_trigger)
        {
          if (c_blaster.deflect_outer.has(shot) === true)
          {
            return false;
          }

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

          let c_player_state = e_player_mesh.get_component("PlayerState");

          if (angle_deg > 45.0 || c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Attacking))
          {
            return false;
          }

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
          if (result.intersects)
          {
            c_blaster.deflect_outer.add(shot);
            c_player_state.set_player_action(component_player_state.ePlayerAction.PS_Blocking);
          }

          return false;
        }
        else
        {
          log.debug(component.CLASS_NAME);
          assert(false, "Unreachable.");
        }
      }

      // return true;
      return false;
    }
  };

  return {
    EnemyBehaviorSystem: EnemyBehaviorSystem,
  };

})();
