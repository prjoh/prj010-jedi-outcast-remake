import { assert } from "./Assert";
import { Time } from "./Time";


export const utils = (() => {

  class TimedFlag
  {
    constructor(time_s)
    {
      this.time_s_ = time_s;
      this.creation_time_ = Time.elapsed_time;
      this.timeout_ = false;
    }

    is_valid()
    {
      return this.timeout_ === false;
    }

    tick()
    {
      this.timeout_ = (Time.elapsed_time - this.creation_time_) >= this.time_s_;
    }

    reset()
    {
      this.timeout_ = false;
      this.creation_time_ = Time.elapsed_time;
    }
  };

  function array_swap_delete(arr, element)
  {
    const ndx = arr.indexOf(element);
    if (ndx === -1)
    {
      return;
    }
    if (ndx < arr.length - 1)
    {
      arr[ndx] = arr[arr.length - 1];
    }
    arr.pop();
  }

  function array_shift_delete(arr, element)
  {
    let ndx = arr.indexOf(element);
    if (ndx === -1)
    {
      return;
    }
    const stop = arr.length - 1;
    while (ndx < stop) {
      arr[ndx] = arr[++ndx];
    }
    arr.pop();
  }

  function array_swap_delete_ndx(arr, ndx)
  {
    if (ndx < 0 || ndx > arr.length - 1)
    {
      return;
    }
    if (ndx < arr.length - 1)
    {
      arr[ndx] = arr[arr.length - 1];
    }
    arr.pop();
  }

  function array_shift_delete_ndx(arr, ndx)
  {
    if (ndx < 0 || ndx > arr.length - 1)
    {
      return;
    }
    const stop = arr.length - 1;
    while (ndx < stop) {
      arr[ndx] = arr[++ndx];
    }
    arr.pop();
  }

  // [Lerp smoothing is broken]{https://www.youtube.com/watch?v=LSNQuFEDOyQ}
  function exp_decay(a, b, dt, decay = 16)
  {
    return b + (a - b) * Math.exp(-decay * dt);
  }

  function ammo_v3_to_str(v3)
  {
    return `btVector3(${v3.x()}, ${v3.y()}, ${v3.z()})`;
  }

  return {
    array_swap_delete: array_swap_delete,
    array_shift_delete: array_shift_delete,
    array_swap_delete_ndx: array_swap_delete_ndx,
    array_shift_delete_ndx: array_shift_delete_ndx,
    exp_decay: exp_decay,
    ammo_v3_to_str: ammo_v3_to_str,
    TimedFlag: TimedFlag,
  };

})();
