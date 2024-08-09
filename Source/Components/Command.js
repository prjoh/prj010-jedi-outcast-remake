import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { Time } from '../Time';
import { utils } from '../Utils';

export const component_command = (() => {

  // class AICommander extends ecs_component.Component
  // {
  //   static CLASS_NAME = 'AICommander';

  //   get NAME() {
  //     return AICommander.CLASS_NAME;
  //   }

  //   constructor()
  //   {
  //     super();

  //     this.move_forward = 0.0;
  //     this.move_right = 0.0;
  //   }

  //   is_moving()
  //   {
  //     return this.move_forward < 0.0 || this.move_forward > 0.0 || 
  //            this.move_right < 0.0 || this.move_right > 0.0;
  //   }
  // };

  // class CommandQueue
  // {
  //   constructor()
  //   {
  //     this.queue_ = [];
  //   }

  //   size()
  //   {
  //     return this.queue_.length;
  //   }

  //   push(command)
  //   {
  //     this.queue_.push(command);
  //   }

  //   pop()
  //   {
  //     if (this.queue_.length === 0)
  //     {
  //       return null;  
  //     }
      
  //     return this.queue_.shift();
  //   }
  // };

  // class TimedCommandQueue extends CommandQueue
  // {
  //   constructor(command_lifetime)
  //   {
  //     super();

  //     this.command_lifetime_ = command_lifetime;
  //     this.command_lifetimes_ = [];
  //   }

  //   update()
  //   {
  //     const elapsed_time = Time.elapsed_time;

  //     let remove_indices = [];

  //     for (let i = 0; i < this.command_lifetimes_.length; ++i)
  //     {
  //       const lifetime = this.command_lifetimes_[i];

  //       if ((elapsed_time - lifetime) >= this.command_lifetime_)
  //       {
  //         remove_indices.push(i);
  //       }
  //     }

  //     for (const ndx of remove_indices.reverse())
  //     {
  //       utils.array_shift_delete_ndx(this.queue_, ndx);
  //       utils.array_shift_delete_ndx(this.command_lifetimes_, ndx);
  //     }
  //   }

  //   push(command)
  //   {
  //     this.command_lifetimes_.push(Time.elapsed_time);
  //     super.push(command);
  //   }

  //   pop()
  //   {
  //     if (this.size() !== 0)
  //     {
  //       this.command_lifetimes_.shift();
  //     }
  //     return super.pop();
  //   }
  // }

  class PlayerCommander extends ecs_component.Component
  {
    static CLASS_NAME = 'PlayerCommander';

    get NAME() {
      return PlayerCommander.CLASS_NAME;
    }

    constructor()
    {
      super();

      this.move_forward = 0.0;
      this.move_right = 0.0;
      this.jump_pressed = false;
      this.look_delta = new THREE.Vector2();
      this.attack_pressed = false;
    }

    reset()
    {
      this.move_forward = 0.0;
      this.move_right = 0.0;
      this.jump_pressed = false;
      this.look_delta.set(0.0, 0.0);
      this.attack_pressed = false;
    }

    is_moving()
    {
      return this.move_forward < 0.0 || this.move_forward > 0.0 || 
             this.move_right < 0.0 || this.move_right > 0.0;
    }
  };

  return {
    PlayerCommander: PlayerCommander,
    // AICommander: AICommander,
  };

})();
