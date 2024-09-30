import { component_audio } from '../Components/Audio';
import { ecs_component } from '../ECS/Component';
import { ecs_system } from '../ECS/System';
import { component_player_state } from '../Components/PlayerState';
import { AUDIO_DELAY } from '../Config';


export const system_audio = (() => {

  class AudioSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.audio_emitters_ = new ecs_component.ComponentContainer(
        component_audio.AudioEmitterComponent.CLASS_NAME,
      );
      this.positional_audio_emitters_ = new ecs_component.ComponentContainer(
        component_audio.PositionalAudioEmitterComponent.CLASS_NAME,
      );

      this.is_playing_combat_ = false;
      this.is_playing_death_ = false;
    }

    init() {}

    post_init()
    {
      this.entity_manager_.update_component_container(this.audio_emitters_);
      this.entity_manager_.update_component_container(this.positional_audio_emitters_);
      
      const [emitters] = this.audio_emitters_.component_tuples;
      for (let i = 0; i < this.audio_emitters_.size; ++i)
      {
        let c_emitter = emitters[i];

        if (c_emitter.autoplay)
        {
          c_emitter.play(AUDIO_DELAY);
        }
      }

      const [pemitters] = this.positional_audio_emitters_.component_tuples;
      for (let i = 0; i < this.positional_audio_emitters_.size; ++i)
      {
        let c_emitter = pemitters[i];

        if (c_emitter.autoplay)
        {
          c_emitter.play(AUDIO_DELAY);
        }
      }
    }

    pre_update()
    {
      this.entity_manager_.update_component_container(this.audio_emitters_);
      this.entity_manager_.update_component_container(this.positional_audio_emitters_);
    }

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const e_singletons = this.entity_manager_.get_entity("Singletons");
      const c_combat_manager = e_singletons.get_component("CombatManager");

      let e_audio_music = this.entity_manager_.get_entity("Audio_Music");
      let c_music_player = e_audio_music.get_component("AudioEmitterComponent");
      
      if (c_combat_manager.is_in_combat() && !this.is_playing_combat_)
      {
        this.is_playing_combat_ = true;
        c_music_player.stop();
        c_music_player.set_audio('action');
        c_music_player.play(1.0);
      }
      else if (!c_combat_manager.is_in_combat() && this.is_playing_combat_)
      {
        this.is_playing_combat_ = false;

        c_music_player.stop();
        c_music_player.set_audio('explore');
        c_music_player.play(1.0);
      }
 
      let e_player_mesh = this.entity_manager_.get_entity("PlayerMesh");
      let c_player_state = e_player_mesh.get_component("PlayerState");
      
      if (c_player_state.get_player_action(component_player_state.ePlayerAction.PS_Dead) && !this.is_playing_death_)
      {
        this.is_playing_death_ = true;
        c_music_player.stop();
        c_music_player.set_looping(false);
        c_music_player.set_audio('death');
        c_music_player.play(1.0);
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    AudioSystem: AudioSystem,
  };

})();
