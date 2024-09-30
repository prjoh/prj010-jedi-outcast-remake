import { component_interact } from '../Components/Interactable';
import { component_physics } from '../Components/Physics';
import { component_player_state } from '../Components/PlayerState';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';


export const system_interact = (() => {

  class InteractionSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.interaction_system_tuples = new ecs_component.ComponentContainer(
        component_interact.PushableComponent.CLASS_NAME,
        component_physics.CylinderCollider.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.interaction_system_tuples);
    }

    fixed_update(fixed_delta_time_s)
    {
      const e_singletons = this.get_entity("Singletons");
      let c_physics_state = e_singletons.get_component("PhysicsState");

      const [pushables, colliders] = this.interaction_system_tuples.component_tuples;
      const size = this.interaction_system_tuples.size;

      for (let i = 0; i < size; ++i)
      {
        let c_pushable = pushables[i];
        let c_collider = colliders[i];

        if (c_physics_state.is_collision_enter("Player", c_pushable.name))
        {
          const collision_info_array = c_physics_state.get_collision_info("Player", c_pushable.name);
          const object_id = collision_info_array[0].object_id;
          const contact_info = collision_info_array[0].contacts[0];
          const contact_position = object_id === 0 ? contact_info.position_0 : contact_info.position_1;

          c_pushable.impulse_.setValue(
            contact_info.normal.x * c_pushable.impulse_magnitude_ + c_pushable.impulse_offset_.x(), 
            contact_info.normal.y * c_pushable.impulse_magnitude_ + c_pushable.impulse_offset_.y(), 
            contact_info.normal.z * c_pushable.impulse_magnitude_ + c_pushable.impulse_offset_.z(),
          );

          const center_of_mass = c_collider.body_.getCenterOfMassTransform().getOrigin();
          c_pushable.rel_pos_.setValue(
            contact_position.x - center_of_mass.x(),
            contact_position.y - center_of_mass.y(),
            contact_position.z - center_of_mass.z(),
          );

          c_collider.body_.applyImpulse(c_pushable.impulse_, c_pushable.rel_pos);
        }

        if (c_physics_state.is_colliding("Player", "Level_DeathTrigger"))
        {
          let e_player = this.entity_manager_.get_entity("PlayerMesh");
          let c_player_state = e_player.get_component("PlayerState");

          if (c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Falling))
          {
            continue;
          }

          c_player_state.set_player_action(component_player_state.ePlayerAction.PS_Dead);
          c_player_state.set_player_action(component_player_state.ePlayerAction.PS_Falling);

          let e_audio = this.entity_manager_.get_entity("PlayerAudio_Voice");
          let c_emitter = e_audio.get_component("AudioEmitterComponent");
          c_emitter.stop();
          c_emitter.set_audio('falling');
          c_emitter.play();
        }
      }
    }

    update(delta_time_s) {}

    late_update(delta_time_s) {}
  };

  return {
    InteractionSystem: InteractionSystem,
  };

})();
