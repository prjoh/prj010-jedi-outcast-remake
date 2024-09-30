import { ecs_component } from '../ECS/Component';
import { BitFlag } from '../BitFlag';
import { utils } from '../Utils';
import { env } from '../Env';
import { component_editor } from './Editor';


export const component_player_state = (() => {

  // TODO: Make this PlayerState?
  //  - The player state can be driven by input, but also by current animation state
  /*
  Timing Windows: Attacks often have multiple phases (wind-up, attack, recovery). 
  The attack input triggers the start of the animation, but the game may only register the attack (e.g., hit detection) 
  during specific frames or windows of the animation.

  Animation Events: These are markers placed within the animation timeline that can trigger certain effects. 
  For instance, when the sword reaches a particular point in the animation, 
  an event could be triggered to check for collisions with enemies.
  */

  const ePlayerAction = Object.freeze({
    PS_RunForward:  1 << 0,
    PS_RunBackward: 1 << 1,
    PS_RunLeft:     1 << 2,
    PS_RunRight:    1 << 3,
    PS_Attacking:   1 << 4,
    PS_Hit:         1 << 5,
    PS_Blocking:    1 << 6,
    PS_Dead:        1 << 7,
    PS_Falling:     1 << 8,
  });

  const eHitState = Object.freeze({
    HS_None: 0,
    HS_Impact: 1,
  });

  const eAttackState = Object.freeze({
    AS_None: 0,
    AS_WindUp: 1,
    AS_Attack: 2,
    AS_Recovery: 3,
  });

  const eAttackType = Object.freeze({
    AT_None: 0,
    AT_Standing: 1,
    AT_RunFront: 2,
    AT_RunBack: 3,
  });

  class PlayerState extends ecs_component.Component
  {
    static CLASS_NAME = 'PlayerState';

    get NAME() {
      return PlayerState.CLASS_NAME;
    }

    constructor()
    {
      super();

      this.action_flags_ = new BitFlag();

      this.attack_event_queue_ = [];

      this.attack_state_ = eAttackState.AS_None;
      this.attack_type_ = eAttackType.AS_None;

      this.hit_state_ = eHitState.HS_None;
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
    
        let c_editor = e_singletons.get_component("EditorComponent");
  
        let profiling_page = c_editor.get_page(component_editor.eEditorPage.EP_Profiling);
  
        profiling_page.add_binding(
          this.attack_event_queue_, 
          'length', 
          "Attack Queue", 
          {
            readonly: true,
            format: (v) => Math.trunc(v),
          }
        );

        profiling_page.add_binding(
          this, 
          'attack_state_', 
          "Player Attack", 
          {
            readonly: true,
            format: (v) => Math.trunc(v),
          }
        );
      }
    }

    ///////////////////////////
    // Action event handling //
    ///////////////////////////
    enqueue_attack_event(timer_s = 0.3)
    {
      this.attack_event_queue_.push(new utils.TimedFlag(timer_s));
    }

    update_attack_events()
    {
      this.attack_event_queue_.forEach(timer => timer.tick());
      
      for (let i = this.attack_event_queue_.length - 1; i >= 0; i--)
      {
        if (!this.attack_event_queue_[i].is_valid())
        {
          this.attack_event_queue_.splice(i, 1);
        }
      }
    }

    is_attack_pending()
    {
      return this.attack_event_queue_.length > 0;
    }

    consume_attack_event()
    {
      this.attack_event_queue_.shift();
      this.set_player_action(ePlayerAction.PS_Attacking);
    }

    /////////////////////////
    // Player action flags //
    /////////////////////////
    clear_player_actions()
    {
      this.action_flags_.clear();
    }

    set_player_action(player_action)
    {
      this.action_flags_.set(player_action);
    }

    unset_player_action(player_action)
    {
      this.action_flags_.unset(player_action);
    }

    get_player_action(player_action)
    {
      return this.action_flags_.is_set(player_action);
    }

    //////////////////////
    // Player hit state //
    //////////////////////
    set_hit_state(hit_state)
    {
      this.hit_state_ = hit_state;
    }

    get_hit_state()
    {
      return this.hit_state_;
    }

    /////////////////////////
    // Player attack state //
    /////////////////////////
    set_attack_state(attack_state)
    {
      this.attack_state_ = attack_state;
    }

    get_attack_state()
    {
      return this.attack_state_;
    }

    ////////////////////////
    // Player attack type //
    ////////////////////////
    set_attack_type(attack_type)
    {
      this.attack_type_ = attack_type;
    }

    get_attack_type()
    {
      return this.attack_type_;
    }
  };

  return {
    PlayerState: PlayerState,
    ePlayerAction: ePlayerAction,
    eAttackState: eAttackState,
    eAttackType: eAttackType,
    eHitState: eHitState,
  };

})();
