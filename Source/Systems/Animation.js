import { degToRad } from 'three/src/math/MathUtils.js';
import { component_animation } from '../Components/Animation';
import { component_command } from '../Components/Command';
import { component_transform } from '../Components/Transform';
import { ecs_component } from '../ECS/Component';
import { system_fsm } from './FSMSystem';
import { component_fighting } from '../Components/FightingState';
import { component_enemy_behavior } from '../Components/EnemyBehavior';
import { component_physics } from '../Components/Physics';


export const system_animation = (() => {

  class AnimationSystem extends system_fsm.FSMSystem
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.animation_system_tuples = new ecs_component.ComponentContainer(
        component_command.PlayerCommander.CLASS_NAME,
        component_animation.AnimationController.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
        component_fighting.FightingState.CLASS_NAME,
      );

      this.animation_system_tuples2 = new ecs_component.ComponentContainer(
        // component_enemy_behavior.EnemyBehaviorComponent.CLASS_NAME,
        component_animation.AnimationController.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
        component_physics.CapsuleCollider.CLASS_NAME,
      );
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.animation_system_tuples);
      this.entity_manager_.update_component_container(this.animation_system_tuples2);
    }

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const [player_commanders, anim_controllers, transforms, fighting_states] = this.animation_system_tuples.component_tuples;
      const size = this.animation_system_tuples.size;

      for (let i = 0; i < size; ++i)
      {
        let c_player_commander = player_commanders[i];
        let c_anim_controller = anim_controllers[i];
        let c_transform = transforms[i];
        let c_fighting_state = fighting_states[i];

        if (c_anim_controller.initialized === false)
        {
          continue;
        }

        let fsm = c_anim_controller.animation_fsm_;

        const is_run_forward = c_player_commander.move_forward > 0.0;
        const is_run_backward = c_player_commander.move_forward < 0.0;
        const is_run_left = c_player_commander.move_right > 0.0;
        const is_run_right = c_player_commander.move_right < 0.0;

        let rotation = c_transform.local_rotation;

        if (is_run_forward && is_run_left)
        {
          rotation.setFromAxisAngle(component_transform.YAxis, degToRad(-30.0));
        }
        else if (is_run_forward && is_run_right)
        {
          rotation.setFromAxisAngle(component_transform.YAxis, degToRad(30.0));
        }
        else
        {
          rotation.setFromAxisAngle(component_transform.YAxis, degToRad(0.0));
        }

        this.set_fsm_parameter(fsm, "is_moving", c_player_commander.is_moving());
        this.set_fsm_parameter(fsm, "is_attacking", c_fighting_state.is_attacking);
        this.set_fsm_parameter(fsm, "is_run_forward", is_run_forward);
        this.set_fsm_parameter(fsm, "is_run_backward", is_run_backward);
        this.set_fsm_parameter(fsm, "is_run_left", is_run_left);
        this.set_fsm_parameter(fsm, "is_run_right", is_run_right);

        this.update_fsm(fsm, {controller: c_anim_controller, transform: c_transform});

        c_anim_controller.mixer_.update(delta_time_s);
      }

      const [/*ai_behaviors, */anim_controllers2, transforms2, colliders] = this.animation_system_tuples2.component_tuples;
      const size2 = this.animation_system_tuples2.size;

      for (let i = 0; i < size2; ++i)
      {
        // const c_ai_behavior = ai_behaviors[i];
        let c_anim_controller = anim_controllers2[i];
        let c_transform = transforms2[i];
        let c_collider = colliders[i];

        if (c_anim_controller.initialized === false)
        {
          continue;
        }

        let fsm = c_anim_controller.animation_fsm_;

        this.update_fsm(fsm, {controller: c_anim_controller, transform: c_transform, collider: c_collider });

        c_anim_controller.mixer_.update(delta_time_s);
      }
    }

    late_update(delta_time_s) {}

    on_state_enter(state, user_data)
    {
      super.on_state_enter(state);

      let animation_controller = user_data.controller;

      const fsm = animation_controller.animation_fsm_;
      if (fsm.transition_user_data)
      {
        const fade_duration = fsm.transition_user_data.fade_duration;
        animation_controller.set_fade_duration(fade_duration);


        const ac = animation_controller.get_animation_config(state.name);
        const transform = user_data.transform;

        if (ac.apply_root_translation)
        {
          const animated_mesh = animation_controller.mixer_.getRoot();
          const root_bone = this.find_root_bone_(animated_mesh);
  
          root_bone.getWorldPosition(animation_controller.root_translation_buffer1);
          root_bone.getWorldQuaternion(animation_controller.root_rotation_buffer1);

          const position = transform.position;
          const rotation = transform.rotation;
          transform.set_is_animation_root(true);
  
          animation_controller.root_rotation_offset_buffer.copy(animation_controller.root_rotation_buffer1).invert().premultiply(rotation);
          animation_controller.root_translation_offset_buffer.copy(animation_controller.root_translation_buffer1).sub(position);
        }
      }

      animation_controller.play_animation(state.name);
    }

    on_state_update(state, user_data)
    {
      super.on_state_update(state);

      let animation_controller = user_data.controller;
      const fsm = animation_controller.animation_fsm_;

      if (fsm.transition_user_data)
      {
        const ac = animation_controller.get_animation_config(state.name);
        const transform = user_data.transform;
        const collider = user_data.collider;

        if (ac.apply_root_translation)
        {
          const animated_mesh = animation_controller.mixer_.getRoot();
          const root_bone = this.find_root_bone_(animated_mesh);
  
          root_bone.getWorldPosition(animation_controller.root_translation_buffer2);
          root_bone.getWorldQuaternion(animation_controller.root_rotation_buffer2);

          animation_controller.root_rotation_buffer2.invert().premultiply(animation_controller.root_rotation_buffer1);
          animation_controller.root_translation_buffer2.sub(animation_controller.root_translation_buffer1);

          root_bone.getWorldPosition(animation_controller.root_translation_buffer1);
          root_bone.getWorldQuaternion(animation_controller.root_rotation_buffer1);

          let position = transform.position;
          let rotation = transform.rotation;

          position.add(animation_controller.root_translation_buffer2);
          rotation.premultiply(animation_controller.root_rotation_buffer2.invert());

          transform.position = position;
          transform.rotation = rotation;

          let collider_pos = collider.position;
          collider_pos.setValue(position.x, position.y, position.z);
          collider.position = collider_pos;
        }
      }
    }

    on_state_exit(state, user_data)
    {
      super.on_state_exit(state);

      let animation_controller = user_data.controller;
      const fsm = animation_controller.animation_fsm_;

      if (fsm.transition_user_data)
      {
        const ac = animation_controller.get_animation_config(state.name);
        const transform = user_data.transform;

        if (ac.apply_root_translation)
        {
          transform.set_is_animation_root(false);
        }
      }
    }

    find_root_bone_(animated_mesh)
    {
      let root = null;
      animated_mesh.traverse((c) => {
        if (c.name === "mixamorigHips")
        {
          root = c;
        }
      });
      return root;
    }
  };

  return {
    AnimationSystem: AnimationSystem,
  };

})();
