import * as THREE from 'three';

import { fsm } from '../FSM';
import { ecs_component } from '../ECS/Component';


export const component_animation = (() => {

  class AnimationState extends fsm.State
  {
    constructor(fsm, name)
    {
      super(fsm, name);
    }
  };

  class AnimationFSM extends fsm.FiniteStateMachine
  {
    constructor(initial_state)
    {
      super(initial_state);
    }

    create_state(name)
    {
      const state = new AnimationState(this, name);
      this.add_state(state);
      return state;
    }
  };

  class AnimationController extends ecs_component.Component
  {
    static CLASS_NAME = 'AnimationController';

    get NAME() {
      return AnimationController.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.animation_fsm_ = new AnimationFSM(params.initial_state);

      this.mixer_ = null;

      this.animation_clips_ = null;

      this.animation_config_ = params.animation_config;
      this.animation_parameters_ = params.parameters;
      this.state_transitions_ = params.state_transitions;
      this.initialized_ = false;

      for (const [ parameter, initial_value ] of this.animation_parameters_)
      {
        this.animation_fsm_.add_parameter(parameter, initial_value);
      }

      this.last_action_ = null;
      this.current_action_ = null;

      this.current_fade_duration_ = 0.0;

      this.root_translation_buffer1 = new THREE.Vector3(0.0, 0.0, 0.0);
      this.root_translation_buffer2 = new THREE.Vector3(0.0, 0.0, 0.0);
      this.root_translation_offset_buffer = new THREE.Vector3(0.0, 0.0, 0.0);

      this.root_rotation_buffer1 = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);
      this.root_rotation_buffer2 = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);
      this.root_rotation_offset_buffer = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);

      this.add_animations_(params.mesh, params.animations);
    }

    get initialized()
    {
      return this.initialized_;
    }

    on_loop(e)
    {
      const type = e.type;
      const action = e.action;
      const loop_delta = e.loopDelta;
      const target = e.target;

      // const find_root_bone = (animated_mesh) =>
      // {
      //   let root = null;
      //   animated_mesh.traverse((c) => {
      //     if (c.name === "mixamorigHips")
      //     {
      //       root = c;
      //     }
      //   });
      //   return root;
      // }

      // const current_state = this.animation_fsm_.get_state(action._clip.name);
      // const ac = this.get_animation_config(current_state.name);

      // if (ac.apply_root_translation)
      // {
      //   const animated_mesh = this.mixer_.getRoot();
      //   const root_bone = find_root_bone(animated_mesh);

      //   root_bone.position.set(0.0, 0.0, 0.0);
      //   root_bone.quaternion.set(0.0, 0.0, 0.0, 1.0);
      // }
    }

    on_finished(e)
    {
      const type = e.type;
      const action = e.action;
      const direction = e.direction;
      const target = e.target;

      const current_state = this.animation_fsm_.get_state(action._clip.name);
      for (const [ to_state_name, transitions ] of current_state.transitions)
      {
        for (const t of transitions)
        {
          t.set_is_active(true);
        }
      }
    }

    set_fade_duration(fade_duration)
    {
      this.current_fade_duration_ = fade_duration;
    }

    default_animation_config_()
    {
      return {
        loop: true,
        apply_root_translation: false,
        apply_root_rotation: false,
      }
    }

    get_animation_config(animation_name)
    {
      let animation_config = this.animation_config_.get(animation_name);
      if (animation_config === undefined)
      {
        animation_config = this.default_animation_config_();
        this.animation_config_[animation_name] = animation_config;
      }
      return animation_config;
    }

    add_animations_(animated_mesh, animations)
    {
      this.mixer_ = new THREE.AnimationMixer(animated_mesh);
      this.mixer_.addEventListener('loop', this.on_loop.bind(this) );
      this.mixer_.addEventListener('finished', this.on_finished.bind(this) );

      this.animation_clips_ = animations;

      const states = [];

      for (const animation of this.animation_clips_)
      {
        const state = this.animation_fsm_.create_state(animation.name);
        states.push(state);
      }

      for (const state of states)
      {
        const transitions = this.state_transitions_.filter((t) => t.from_state === state.name);

        for (const transition_data of transitions)
        {
          const from_state = transition_data.from_state;
          const transition_user_data = {
            fade_duration: transition_data.fade_duration,
          };

          const t = state.add_transition(transition_data.to_state, transition_data.interrupt_current_state, transition_user_data);
          
          for (const [ parameter_id, type, value ] of transition_data.conditions)
          {
            t.add_condition(parameter_id, type, value);
          }
        }
      }

      this.initialized_ = true;
    }

    play_animation(animation_name)
    {
      this.last_action_ = this.current_action_;

      if ( this.last_action_ !== null )
      {
        this.last_action_.fadeOut( this.current_fade_duration_ );
      }

      const ac = this.get_animation_config(animation_name);
      const is_looping = ac.loop;
      
      const clip = THREE.AnimationClip.findByName( this.animation_clips_, animation_name );
      this.current_action_ = this.mixer_.clipAction( clip );
      this.current_action_.loop = is_looping ? THREE.LoopRepeat : THREE.LoopOnce;
      this.current_action_.clampWhenFinished = is_looping ? false : true;
      this.current_action_.reset()
                          .setEffectiveTimeScale(1)
                          .setEffectiveWeight(1)
                          .fadeIn(this.current_fade_duration_)
                          .play();
    }
  };

  return {
    AnimationController: AnimationController,
  };

})();
