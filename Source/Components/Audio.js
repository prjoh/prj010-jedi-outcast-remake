import * as THREE from 'three';
import { ecs_component } from '../ECS/Component';
import { resources } from '../ResourceManager';
import { assert } from '../Assert';
import { PositionalAudioHelper } from 'three/addons/helpers/PositionalAudioHelper.js';
import { env } from '../Env';


export const component_audio = (() => {

  const MUSIC_EXPLORE_MARKERS = [
    0.000,
    22.070,
    53.723,
    90.926,
  ];
  const MUSIC_ACTION_MARKERS = [
    0.00,
    42.585,
    87.664,
  ];
  
  class AudioListenerComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'AudioListenerComponent';

    get NAME() {
      return AudioListenerComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.listener_ = new THREE.AudioListener();

      params.camera.add(this.listener_);
    }
  };

  class AudioEmitterBase extends ecs_component.Component
  {
    constructor(params)
    {
      super();

      this.listener_ = params.listener;
      this.audio_map_ = params.audio_lut;
      this.audio_keys = Array.from(this.audio_map_.keys());
      this.autoplay = params.autoplay;

      this.audio_ = null;
    }

    destroy()
    {
      if (this.audio_)
      {
        this.audio_.stop();
      }

      super.destroy();
    }

    get is_playing()
    {
      return this.audio_.isPlaying();
    }

    set_looping(is_looping)
    {
      this.audio_.setLoop(is_looping);
    }

    set_audio(audio_key)
    {
      assert(this.audio_map_.has(audio_key));
      this.audio_.setBuffer(this.audio_map_.get(audio_key));
    }

    set_volume(value)
    {
      this.audio_.setVolume(value);
    }

    set_pitch(value)
    {
      this.audio_.setDetune(value);
    }

    play(delay = 0.0)
    {
      this.audio_.play(delay);
    }

    stop(delay = 0.0)
    {
      this.audio_.stop(delay);
    }

    pause()
    {
      this.audio_.pause();
    }
  };

  class AudioEmitterComponent extends AudioEmitterBase
  {
    static CLASS_NAME = 'AudioEmitterComponent';

    get NAME() {
      return AudioEmitterComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      this.audio_ = new THREE.Audio(this.listener_);

      this.audio_.setBuffer(this.audio_map_.get(params.audio_key));
      this.audio_.setVolume(params.volume);
      this.audio_.setLoop(params.is_looping);
    }
  };

  class PositionalAudioEmitterComponent extends AudioEmitterBase
  {
    static CLASS_NAME = 'PositionalAudioEmitterComponent';

    get NAME() {
      return PositionalAudioEmitterComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super(params);

      this.parent_ = params.mesh;
      this.audio_ = new THREE.PositionalAudio(this.listener_);

      this.audio_.setBuffer(this.audio_map_.get(params.audio_key));
      this.audio_.setLoop(params.is_looping);
      this.audio_.setVolume(params.volume);

      // if (env.DEBUG_MODE)
      // {
      //   this.debug_mesh_ = new PositionalAudioHelper( this.audio_, this.audio_.getRefDistance() );

      //   const offset = new THREE.Group();
      //   offset.position.set(0.0, 0.15, 0.0);
      //   offset.add(this.debug_mesh_);

      //   this.audio_.add( offset );
      // }

      this.parent_.add(this.audio_);
    }

    set_ref_distance(value)
    {
      this.audio_.setRefDistance(value);

      // if (env.DEBUG_MODE)
      // {
      //   this.debug_mesh_.range = value;
      //   this.debug_mesh_.update();
      // }
    }

    set_rolloff_factor(value)
    {
      this.audio_.setRolloffFactor(value);
    }

    // linear, inverse, exponential
    set_distance_model(distance_model)
    {
      this.audio_.setDistanceModel(distance_model);
    }

    // only used my linear distance model
    set_max_distance(value)
    {
      this.audio_.setMaxDistance(value);
    }
  };

  return {
    AudioListenerComponent: AudioListenerComponent,
    AudioEmitterComponent: AudioEmitterComponent,
    PositionalAudioEmitterComponent: PositionalAudioEmitterComponent,
  };

})();
