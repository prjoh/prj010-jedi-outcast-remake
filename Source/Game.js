import { log } from './Log';
import { assert } from './Assert';
import { time, Time } from './Time';
import { world } from './World';
import { resources } from './ResourceManager';


export const game = (() => {

  class Game
  {
    constructor()
    {
      this.clock_ = new time.Clock(1.0 / 60.0);

      // TODO
      this.current_world_ = new world.World();

      // Update request handling
      this.request_update_id_ = null;
      this.request_update_ = false;

      // Set event handlers
      window.onfocus = (event) => { this.on_focus_() };
      window.onblur = (event) => { this.on_blur_() };
    }

    run()
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

    on_load_started_(url, loaded, total)
    {

    }

    on_load_progress_(url, loaded, total)
    {

    }

    async on_load_completed_()
    {
      await this.current_world_.init_async();
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
