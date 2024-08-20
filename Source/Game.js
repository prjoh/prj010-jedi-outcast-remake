import { log } from './Log';
import { assert } from './Assert';
import { time, Time } from './Time';
import { resources } from './ResourceManager';
import { test_world } from './Worlds/TestWorld';
import { game_world } from './Worlds/GameWorld';


export const game = (() => {

  const loading_screen = document.getElementById('loading-screen');
  const loading_bar = document.getElementById('loading-bar');
  const progress_value = document.getElementById('progress-value');
  const progress_message = document.getElementById('progress-message');

  class Game
  {
    constructor()
    {
      this.clock_ = new time.Clock(1.0 / 60.0);

      // TODO
      this.current_world_ = new game_world.World();
      // this.current_world_ = new test_world.World();

      // Update request handling
      this.request_update_id_ = null;
      this.request_update_ = false;

      // Set event handlers
      window.onfocus = (event) => { this.on_focus_() };
      window.onblur = (event) => { this.on_blur_() };
    }

    run()
    {
      if (this.current_world_.use_resource_manager === false)
      {
        assert(this.current_world_ !== null, "No world has been set.");
        this.current_world_.load();

        this.on_load_completed_();
      }
      else
      {
        resources.ResourceManager.init(
          this.on_load_started_.bind(this), 
          this.on_load_progress_.bind(this), 
          this.on_load_completed_.bind(this), 
          this.on_load_error_.bind(this)
        );
  
        assert(this.current_world_ !== null, "No world has been set.");
        this.current_world_.load();
      }
    }

    on_load_started_(url, loaded, total)
    {
      progress_message.textContent = "Loading file: " + url;
    }

    on_load_progress_(url, loaded, total)
    {
      const progress = (loaded / total * 100).toFixed(0);
      progress_value.textContent = progress + "%"
      loading_bar.style.setProperty('--loading-bar-value', 45 + (progress * 1.8) + "deg");
      if (url.length < 100)
      {
        progress_message.textContent = "Loading file: " + url;
      }
    }

    async on_load_completed_()
    {
      await this.current_world_.init_async();
      this.current_world_.init();

      progress_message.textContent = "Loading complete!";
      loading_screen.classList.add('hidden');

      this.clock_.init();
      this.set_request_update_(true);
    }

    on_load_error_(url)
    {
      log.error(`Game.on_load_error_: ${url}`);
    }

    set_request_update_(is_active)
    {
      if (this.request_update_id_ !== null)
      {
        cancelAnimationFrame(this.request_update_id_);
      }

      this.request_update_ = is_active;

      log.debug("renderer_active=" + is_active);

      if (is_active)
      {
        this.clock_.init();
        this.update_();
      }
    }

    update_()
    {
      if (this.request_update_)
      {
        this.request_update_id_ = requestAnimationFrame(this.update_.bind(this));
      }

      this.clock_.tick();

      // Update game state
      this.current_world_.pre_update();

      while (this.clock_.has_fixed_delta_time_s_tick())
      {
        this.current_world_.fixed_update(Time.fixed_delta_time_s);
      }
      this.current_world_.update(Time.delta_time_s);
      this.current_world_.late_update(Time.delta_time_s);
    }

    /*
     *  Event handlers
     */
    on_focus_()
    {
      this.set_request_update_(true);
    }

    on_blur_()
    {
      this.set_request_update_(false);
    }
  };

  return {
    Game: Game,
  };

})();
