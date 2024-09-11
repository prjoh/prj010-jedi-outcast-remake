import * as THREE from 'three';

import { eCollisionGroup } from '../Config';
import { component_command } from '../Components/Command';
import { component_player_state } from '../Components/PlayerState';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';


export const system_player_behavior = (() => {

  class PlayerBehaviorSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.system_player_behavior_tuples_ = new ecs_component.ComponentContainer(
        component_command.PlayerCommander.CLASS_NAME,
        component_player_state.PlayerState.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.system_player_behavior_tuples_);
    }

    fixed_update(fixed_delta_time_s)
    {
      let e_player = this.entity_manager_.get_entity("PlayerMesh");
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

      position1.add(direction.multiplyScalar(-0.2));

      position2.copy(position1);
      position2.add(direction.multiplyScalar(4.7));

      let e_singletons = this.entity_manager_.get_entity("Singletons");
      let c_physics = e_singletons.get_component("PhysicsState");

      let hit = c_physics.ray_test(
        position1, 
        position2, 
        eCollisionGroup.CG_Player, 
        eCollisionGroup.CG_All & ~eCollisionGroup.CG_Player);
      if (hit.length > 0)
      {
        // console.log(hit);

        let p = hit[0].position;
        let n = hit[0].normal;
        let collision_object = hit[0].collision_object;

        let c_player_state = e_player.get_component("PlayerState");
        const is_player_attacking = c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Attacking);
        const is_attack_state_attack = c_player_state.get_attack_state() === component_player_state.eAttackState.AS_Attack;

        const collision_group = collision_object.getBroadphaseHandle().get_m_collisionFilterGroup();
        if (collision_group === eCollisionGroup.CG_Enemy && is_player_attacking && is_attack_state_attack)
        {
          console.log("HIT!");
          c_glow.capsule.position.set(p.x, p.y, p.z);
          c_glow.capsule.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(n.x, n.y, n.z));

          c_glow.capsule.material.color.setHex(0xff0000);
        }
        else
        {
          c_glow.capsule.position.set(p.x, p.y, p.z);
          c_glow.capsule.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(n.x, n.y, n.z));

          c_glow.capsule.material.color.setHex(0x00ff00);
        }
      }
    }

    update(delta_time_s)
    {
      const [player_commanders, player_states] = this.system_player_behavior_tuples_.component_tuples;
      const size = this.system_player_behavior_tuples_.size;

      for (let i = 0; i < size; ++i)
      {
        const c_player_commander = player_commanders[i];
        let c_player_state = player_states[i];

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
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    PlayerBehaviorSystem: PlayerBehaviorSystem,
  };

})();
