import * as THREE from 'three';

import { ANIM_FPS } from '../Config';
import { fsm } from '../FSM';
import { ecs_component } from '../ECS/Component';
import { assert } from '../Assert';
import { env } from '../Env';


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

      // animation_name -> [{ event_id: String, keyframes: [Number], callback: Function }, ...]
      this.keyframe_event_handlers_ = new Map();
      this.current_keyframe_index_ = -1;

      this.onplay_event_handlers_ = new Map();
      this.onfinish_event_handlers_ = new Map();

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
      this.root_rotation_euler_buffer = new THREE.Euler();

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

      const animation_name = action._clip.name;
      const current_state = this.animation_fsm_.get_state(animation_name);
      for (const [ to_state_name, transitions ] of current_state.transitions)
      {
        for (const t of transitions)
        {
          t.set_is_active(true);
        }
      }

      if (this.onfinish_event_handlers_.has(animation_name))
      {
        let callback = this.onfinish_event_handlers_.get(animation_name);
        callback(this.entity_);
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
        onplay_event_handler: null,
        onfinish_event_handler: null,
        keyframe_event_handlers: null,
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

      const animation_names = this.animation_clips_.map(e => e.name);

      if (env.DEBUG_MODE)
      {
        const illegal_ac_states = [...this.animation_config_.keys()].filter(key => animation_names.includes(key) === false)
        const illegal_transition_states = this.state_transitions_.filter(t => !animation_names.includes(t.from_state) || !animation_names.includes(t.to_state));
        assert(illegal_ac_states.length === 0, `Illegal animation config states: ${illegal_ac_states.join(',')}`);
        assert(illegal_transition_states.length === 0, `Illegal transition state names:\n  from_state(${illegal_transition_states.map(obj => obj.from_state).join(',')})\n  to_state(${illegal_transition_states.map(obj => obj.to_state).join(',')})`);
      }

      const states = [];

      for (const animation_name of animation_names)
      {
        const state = this.animation_fsm_.create_state(animation_name);
        states.push(state);

        const ac = this.get_animation_config(animation_name);
        if (ac.keyframe_event_handlers)
        {
          for (const keh of ac.keyframe_event_handlers)
          {
            this.register_keyframe_event_handler(animation_name, keh.event_id, keh.keyframes, keh.callback);
          }
        }

        if (ac.onplay_event_handler)
        {
          this.register_onplay_event_handler(animation_name, ac.onplay_event_handler);
        }

        if (ac.onfinish_event_handler)
        {
          this.register_onfinish_event_handler(animation_name, ac.onfinish_event_handler);
        }
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

    register_keyframe_event_handler(animation_name, event_id, keyframes, callback)
    {
      let event_handler_array = null;
      if (this.keyframe_event_handlers_.has(animation_name))
      {
        event_handler_array = this.keyframe_event_handlers_.get(animation_name);
      }
      else
      {
        event_handler_array = [];
        this.keyframe_event_handlers_.set(animation_name, event_handler_array);
      }

      assert(this.keyframe_event_handlers_.has(animation_name));
      assert(event_handler_array.find(item => item.event_id === event_id) === undefined);

      event_handler_array.push({
        event_id: event_id,
        keyframes: keyframes,
        callback: callback,
      });
    }

    unregister_keyframe_event_handler(animation_name, event_id)
    {
      assert(this.keyframe_event_handlers_.has(animation_name));

      let event_handler_array = this.keyframe_event_handlers_.get(animation_name);
      const updated_event_handler_array = event_handler_array.filter(item => item.event_id !== event_id);
      this.keyframe_event_handlers_.set(animation_name, updated_event_handler_array);
    }

    register_onplay_event_handler(animation_name, callback)
    {
      assert(this.onplay_event_handlers_.has(animation_name) === false);

      this.onplay_event_handlers_.set(animation_name, callback);
    }

    unregister_onplay_event_handler(animation_name)
    {
      assert(this.onplay_event_handlers_.has(animation_name));

      this.onplay_event_handlers_.delete(animation_name);
    }

    register_onfinish_event_handler(animation_name, callback)
    {
      assert(this.onfinish_event_handlers_.has(animation_name) === false);

      this.onfinish_event_handlers_.set(animation_name, callback);
    }

    unregister_onfinish_event_handler(animation_name)
    {
      assert(this.onfinish_event_handlers_.has(animation_name));

      this.onfinish_event_handlers_.delete(animation_name);
    }

    play_animation(animation_name)
    {
      this.last_action_ = this.current_action_;

      const clip = THREE.AnimationClip.findByName( this.animation_clips_, animation_name );
      this.current_action_ = this.mixer_.clipAction( clip );

      if ( this.last_action_ !== null )
      {
        this.last_action_.fadeOut( this.current_fade_duration_ );
      }

      const ac = this.get_animation_config(animation_name);
      const is_looping = ac.loop;
      
      this.current_action_.loop = is_looping ? THREE.LoopRepeat : THREE.LoopOnce;
      this.current_action_.clampWhenFinished = is_looping ? false : true;
      this.current_action_.reset()
                          .setEffectiveTimeScale(1)
                          .setEffectiveWeight(1)
                          .fadeIn(this.current_fade_duration_)
                          .play();

      this.current_keyframe_index_ = -1;

      if (this.onplay_event_handlers_.has(animation_name))
      {
        let callback = this.onplay_event_handlers_.get(animation_name);
        callback(this.entity_);
      }
    }

    update_keyframe_event_handlers()
    {
      if (this.current_action_.isRunning() === false)
      {
        return;
      }

      const animation_name = this.current_action_.getClip().name;

      if (this.keyframe_event_handlers_.has(animation_name) === false)
      {
        return;
      }

      const keyframe_index = Math.floor(this.current_action_.time * ANIM_FPS);

      if (keyframe_index === this.current_keyframe_index_)
      {
        return;
      }

      this.current_keyframe_index_ = keyframe_index;

      const keyframe_event_handlers = this.keyframe_event_handlers_.get(animation_name);

      for (const keh of keyframe_event_handlers)
      {
        if (keh.keyframes.includes(this.current_keyframe_index_))
        {
          keh.callback(this.entity_);
        }
      }
    }
  };

  return {
    AnimationController: AnimationController,
  };

})();
