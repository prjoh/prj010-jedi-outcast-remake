import * as THREE from 'three';

class Timer
{
  constructor(time_s, callback, is_looping)
  {
    this.time_s_ = time_s;
    this.cb_ = callback;
    this.is_looping_ = is_looping;
    this.init_time_ = Time.elapsed_time;

    this.uuid = new THREE.MathUtils.generateUUID();
    this.is_active = true;
  }

  tick()
  {
    const timeout = (Time.elapsed_time - this.init_time_) >= this.time_s_;
    if (timeout)
    {
      if (this.is_looping_)
      {
        this.init_time_ = Time.elapsed_time;
      }
      else
      {
        this.is_active = false;
      }

      this.cb_();
    }
  }
};

class Time
{
  static delta_time_s_ = 0.0;
  static fixed_delta_time_s_ = 1.0;  // fixed time step per seconds
  static elapsed_time_ = 0.0;
  static time_scale_ = 1.0;

  static timers_ = new Map();

  static set time_scale(val)
  {
    this.time_scale_ = val;
  }

  static get delta_time_s() {
    return this.delta_time_s_ * this.time_scale_;
  }

  static get fixed_delta_time_s() {
    return this.fixed_delta_time_s_ * this.time_scale_;
  }

  static get elapsed_time() {
    return this.elapsed_time_;
  }

  static create_timer(time_s, callback, is_looping = false)
  {
    const timer = new Timer(time_s, callback, is_looping);
    this.timers_.set(timer.uuid, timer);
    return timer.uuid;
  }

  static destroy_timer(timer_handle)
  {
    if (this.timers_.has(timer_handle) === false)
    {
      return;
    }
    this.timers_.delete(timer_handle);
  }
};

export { Time };

export const time = (() => {

  class Clock
  {
    constructor(fixed_time_step)
    {
      this.clock_ = new THREE.Clock();

      this.time_since_last_frame_s_ = 0.0;

      Time.delta_time_s_ = 0.0;
      Time.fixed_delta_time_s_ = fixed_time_step;
    }

    init()
    {
      this.clock_.start();

      Time.timers_.forEach((v, k, m) => { v.init_time_ = 0.0 });
    }

    tick()
    {
      Time.delta_time_s_ = this.clock_.getDelta();
      this.time_since_last_frame_s_ += Time.delta_time_s;
      Time.elapsed_time_ = this.clock_.getElapsedTime();

      Time.timers_.forEach((v, k, m) => {
        v.tick();

        if (v.is_active === false)
        {
          m.delete(k);
        }
      });
    }

    has_fixed_delta_time_s_tick()
    {
      if (this.time_since_last_frame_s_ < Time.fixed_delta_time_s_)
      {
        return false;
      }    

      this.time_since_last_frame_s_ -= Time.fixed_delta_time_s_;
      return true;
    }
  };

  return {
    Clock: Clock,
  };

})();