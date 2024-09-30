import * as THREE from 'three';

import { eCollisionGroup } from '../Config';
import { component_command } from '../Components/Command';
import { component_player_state } from '../Components/PlayerState';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';
import { component_health } from '../Components/Health';
import { env } from '../Env';
import { component_debug } from '../Components/Debug';


export const system_player_behavior = (() => {

  class PlayerBehaviorSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.system_player_behavior_tuples_ = new ecs_component.ComponentContainer(
        component_command.PlayerCommander.CLASS_NAME,
        component_player_state.PlayerState.CLASS_NAME,
        component_health.HealthComponent.CLASS_NAME,
      );

      this.is_death_handled_ = false;
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.system_player_behavior_tuples_);
    }

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      this.update_player_state();
      this.raycast_lightsaber();
      this.handle_player_death();
    }

    late_update(delta_time_s) {}

    update_player_state()
    {
      const [player_commanders, player_states, player_health_components] = this.system_player_behavior_tuples_.component_tuples;
      const size = this.system_player_behavior_tuples_.size;

      for (let i = 0; i < size; ++i)
      {
        const c_player_commander = player_commanders[i];
        let c_player_state = player_states[i];
        const c_player_health = player_health_components[i];

        if (c_player_commander.attack_pressed)
        {
          c_player_state.enqueue_attack_event(0.5);
        }

        c_player_state.update_attack_events();

        if (c_player_commander.move_forward > 0.0)
        {
          c_player_state.set_player_action(component_player_state.ePlayerAction.PS_RunForward);
        }
        else
        {
          c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_RunForward);
        }

        if (c_player_commander.move_forward < 0.0)
        {
          c_player_state.set_player_action(component_player_state.ePlayerAction.PS_RunBackward);
        }
        else
        {
          c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_RunBackward);
        }
        
        if (c_player_commander.move_right < 0.0)
        {
          c_player_state.set_player_action(component_player_state.ePlayerAction.PS_RunRight);
        }
        else
        {
          c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_RunRight);
        }
        
        if (c_player_commander.move_right > 0.0)
        {
          c_player_state.set_player_action(component_player_state.ePlayerAction.PS_RunLeft);
        }
        else
        {
          c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_RunLeft);
        }

        if (c_player_health.is_alive() === false)
        {
          c_player_state.set_player_action(component_player_state.ePlayerAction.PS_Dead);
        }
      }
    }

    raycast_lightsaber()
    {
      let e_player = this.entity_manager_.get_entity("PlayerMesh");

      let c_player_state = e_player.get_component("PlayerState");
      if (c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Dead))
      {
        return;
      }

      let c_glow = e_player.get_component("LightsaberGlow");
      let lightsaber_anchor = c_glow.lightsaber_anchor_;
      let direction = c_glow.direction_buffer_;

      let position1 = c_glow.position_buffer_;
      let position2 = c_glow.position_buffer2_;
      let rotation1 = c_glow.quaternion_buffer_;

      lightsaber_anchor.getWorldPosition(position1);
      lightsaber_anchor.getWorldQuaternion(rotation1);

      direction.set(0.0, 0.0, 1.0);
      direction.applyQuaternion(rotation1);
      direction.normalize();

      position1.add(direction.multiplyScalar(0.3));

      position2.copy(position1);
      position2.add(direction.multiplyScalar(-5.2));

      if (env.DEBUG_MODE && component_debug.DebugDrawer.draw_attack_frames)
      {
        const is_player_attacking = c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Attacking);
        const is_attack_state_attack = c_player_state.get_attack_state() === component_player_state.eAttackState.AS_Attack;

        if (is_player_attacking)
        {
          const e_singletons = this.get_entity("Singletons");
          let c_drawer = e_singletons.get_component("DebugDrawer");
          c_drawer.draw_line(position1, position2, 10.0, is_attack_state_attack ? 0x00ff00 : 0xff0000);
        }
      }

      let e_singletons = this.entity_manager_.get_entity("Singletons");
      let c_physics = e_singletons.get_component("PhysicsState");

      let hit = c_physics.ray_test(
        position1, 
        position2, 
        eCollisionGroup.CG_Player, 
        eCollisionGroup.CG_All & ~eCollisionGroup.CG_Player);
      if (hit.length > 0)
      {
        const p = hit[0].position;
        const n = hit[0].normal;
        const collision_object = hit[0].collision_object;
        const component = hit[0].component;

        let c_player_state = e_player.get_component("PlayerState");
        const is_player_attacking = c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Attacking);
        const is_attack_state_attack = c_player_state.get_attack_state() === component_player_state.eAttackState.AS_Attack;

        const collision_group = collision_object.getBroadphaseHandle().get_m_collisionFilterGroup();
        if (collision_group === eCollisionGroup.CG_EnemyHitBox && is_player_attacking && is_attack_state_attack)
        {
          let c_enemy_health = component.entity.get_component("HealthComponent");
          c_enemy_health.take_damage(100.0);

          let e_audio_saber = this.entity_manager_.get_entity("PlayerAudio_SaberHit");
          let c_audio_saber = e_audio_saber.get_component("AudioEmitterComponent");
          let i = THREE.MathUtils.randInt(0, 3);
          c_audio_saber.stop();
          c_audio_saber.set_audio(`saberhit${i}`);
          c_audio_saber.play();

          let c_enemy = component.entity.get_component("EnemyBehaviorComponent");

          if (c_enemy_health.is_alive())
          {
            c_enemy.behavior.hit();
          }
          else
          {
            c_enemy.behavior.strike_death();
          }
        }
        else
        {
          // if (env.DEBUG_MODE)
          // {
          //   const from = new THREE.Vector3(p.x, p.y, p.z);
          //   let to = new THREE.Vector3().copy(from);
          //   to.x += n.x * 1.5;
          //   to.y += n.y * 1.5;
          //   to.z += n.z * 1.5;

          //   const e_singletons = this.get_entity("Singletons");
          //   let c_drawer = e_singletons.get_component("DebugDrawer");
          //   c_drawer.draw_line(from, to, 2.0);
          // }
        }
      }
    }

    handle_player_death()
    {
      if (this.is_death_handled_)
      {
        return;
      }

      let e_player_mesh = this.entity_manager_.get_entity("PlayerMesh");
      let c_player_state = e_player_mesh.get_component("PlayerState");

      if (c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Dead) === false ||
          c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Falling))
      {
        return;
      }

      let e_player = this.entity_manager_.get_entity("Player");
      let c_kcc = e_player.get_component("KinematicCharacterController");
      let c_blocker = e_player_mesh.get_component("PlayerBlocker");
      
      c_kcc.on_player_death();
      c_blocker.on_player_death();
      
      let e_audio = this.entity_manager_.get_entity("PlayerAudio_Voice");
      let c_emitter = e_audio.get_component("AudioEmitterComponent");
      c_emitter.stop();
      c_emitter.set_audio(`death${THREE.MathUtils.randInt(1, 3)}`);
      c_emitter.play();

      this.is_death_handled_ = true;
    }
  };

  return {
    PlayerBehaviorSystem: PlayerBehaviorSystem,
  };

})();
