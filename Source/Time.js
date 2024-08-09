import * as THREE from 'three';


class Time
{
  static delta_time_s_ = 0.0;
  static fixed_delta_time_s_ = 1.0;  // fixed time step per seconds
  static elapsed_time_ = 0.0;
  static time_scale_ = 1.0;

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
    }

    tick()
    {
      Time.delta_time_s_ = this.clock_.getDelta();
      this.time_since_last_frame_s_ += Time.delta_time_s;
      Time.elapsed_time_ = this.clock_.elapsedTime;
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