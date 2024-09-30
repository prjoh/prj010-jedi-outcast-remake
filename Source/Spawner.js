import * as THREE from 'three';

import { ASSET_ID_ENEMY, ASSET_ID_KYLE, BT_GRAVITY, eCollisionGroup } from './Config';
import { fsm } from './FSM';
import { resources } from './ResourceManager';

import { component_camera } from './Components/Camera';
import { component_mesh } from './Components/Mesh';
import { component_physics } from './Components/Physics';
import { component_command } from './Components/Command';
import { component_controls } from './Components/CharacterControls';
import { component_animation } from './Components/Animation';
import { component_player_state } from './Components/PlayerState';
import { component_navigation } from './Components/Navigation';
import { component_enemy_behavior } from './Components/EnemyBehavior';
import { component_enemy_movement } from './Components/EnemyMovement';
import { component_lightsaber_glow } from './Components/LightsaberGlow';
import { component_blaster } from './Components/BlasterSpawner';
import { component_player_blocker } from './Components/PlayerBlocker';
import { component_health } from './Components/Health';
import { component_enemy_sensors } from './Components/EnemySensors';
import { component_audio } from './Components/Audio';


export const spawner = (() => {

  function spawn_player(entity_manager, scene, directional_light_target, position, rotation, audio_listener)
  {
    const e_singletons = entity_manager.get_entity("Singletons");

    const c_physics_state = e_singletons.get_component("PhysicsState");
    const c_camera = e_singletons.get_component("PerspectiveCamera");

    const model_data = resources.ResourceManager.get_cached_skinned_model(ASSET_ID_KYLE);

    let e_player = entity_manager.create_entity("Player");
    let c_player_transform = e_player.get_component("Transform");
    c_player_transform.position = new THREE.Vector3(0.0, 0.85, 0.0).add(position);
    c_player_transform.rotation = rotation;
    e_player.add_component(component_command.PlayerCommander);
    e_player.add_component(component_controls.CharacterControls);
    e_player.add_component(component_physics.KinematicCharacterController, {
      physics_state: c_physics_state,
      transform: c_player_transform,
      height: 1.7,
      radius: 0.4,
      step_height: 0.35,
      max_slope: Math.PI / 3,
      jump_speed: BT_GRAVITY / 3,
      max_jump_height: 100,
      collision_group: eCollisionGroup.CG_Player,
      collision_mask: eCollisionGroup.CG_All & ~eCollisionGroup.CG_Player,
      is_contact_listener: true,
    });

    let e_player_mesh = entity_manager.create_entity("PlayerMesh", e_player);
    let c_player_mesh_transform = e_player_mesh.get_component("Transform");
    c_player_mesh_transform.position = position;
    e_player_mesh.add_component(component_command.PlayerCommander);
    e_player_mesh.add_component(component_player_state.PlayerState);
    e_player_mesh.add_component(component_animation.AnimationController, {
      mesh: model_data.scene,
      animations: model_data.animations,
      initial_state: '01_IdleArmed',
      parameters: [
        ["is_moving", false],
        ["is_run_forward", false],
        ["is_run_backward", false],
        ["is_run_left", false],
        ["is_run_right", false],
        ["is_attacking", false],
        ["is_blocking0", false],
        ["is_blocking1", false],
        ["is_blocking2", false],
        ["is_hit", false],
        ["is_dead", false],
      ],
      animation_config: new Map([
        [
          "06_OneHandCombo01", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_WindUp);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_Standing);
            },
            onfinish_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_None);
              c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_Attacking);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_None);
            },
            keyframe_event_handlers: [
              {
                event_id: "attack1_active",
                keyframes: [19],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Attack);

                  let e_audio_saber = entity.manager.get_entity("PlayerAudio_Saber");
                  let c_audio = e_audio_saber.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 6);
                  c_audio.stop();
                  c_audio.set_audio(`saberhup${i}`);
                  c_audio.play();
                },
              },
              {
                event_id: "attack1_recovery",
                keyframes: [26],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Recovery);
                },
              },
            ],
          },
        ],
        [
          "06_OneHandCombo02", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_WindUp);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_Standing);
            },
            onfinish_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_None);
              c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_Attacking);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_None);
            },
            keyframe_event_handlers: [
              {
                event_id: "attack2_active",
                keyframes: [7],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Attack);

                  let e_audio_saber = entity.manager.get_entity("PlayerAudio_Saber");
                  let c_audio = e_audio_saber.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 6);
                  c_audio.stop();
                  c_audio.set_audio(`saberhup${i}`);
                  c_audio.play();
                },
              },
              {
                event_id: "attack2_recovery",
                keyframes: [13],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Recovery);
                },
              },
            ],
          },
        ],
        [
          "06_OneHandCombo03", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_WindUp);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_Standing);
            },
            onfinish_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_None);
              c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_Attacking);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_None);
            },
            keyframe_event_handlers: [
              {
                event_id: "attack3_active",
                keyframes: [5],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Attack);

                  let e_audio_saber = entity.manager.get_entity("PlayerAudio_Saber");
                  let c_audio = e_audio_saber.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 6);
                  c_audio.stop();
                  c_audio.set_audio(`saberhup${i}`);
                  c_audio.play();
                },
              },
              {
                event_id: "attack3_recovery",
                keyframes: [13],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Recovery);
                },
              },
            ],
          },
        ],
        [
          "11_RunAttack", // Run + short button press // +
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_WindUp);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_RunFront);
            },
            onfinish_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_None);
              c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_Attacking);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_None);
            },
            keyframe_event_handlers: [
              {
                event_id: "run_attack_active",
                keyframes: [16],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Attack);

                  let e_audio_saber = entity.manager.get_entity("PlayerAudio_Saber");
                  let c_audio = e_audio_saber.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(7, 9);
                  c_audio.stop();
                  c_audio.set_audio(`saberhup${i}`);
                  c_audio.play();
                },
              },
              {
                event_id: "run_attack_recovery",
                keyframes: [31],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Recovery);
                },
              },
            ],
          },
        ],
        [
          "21_BackAttack", // Run + short button press // +
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_WindUp);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_RunBack);
            },
            onfinish_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_attack_state(component_player_state.eAttackState.AS_None);
              c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_Attacking);
              c_player_state.set_attack_type(component_player_state.eAttackType.AT_None);
            },
            keyframe_event_handlers: [
              {
                event_id: "back_attack_active",
                keyframes: [14],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Attack);

                  let e_audio_saber = entity.manager.get_entity("PlayerAudio_Saber");
                  let c_audio = e_audio_saber.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 3);
                  c_audio.stop();
                  c_audio.set_audio(`saberhup${i}`);
                  c_audio.play();
                },
              },
              {
                event_id: "back_attack_recovery",
                keyframes: [20],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.set_attack_state(component_player_state.eAttackState.AS_Recovery);
                },
              },
            ],
          },
        ],
        // [
        //   "12_AttackStrong2", // Run + long button press // ++
        //   {
        //     loop: false,
        //     apply_root_translation: false,
        //     apply_root_rotation: false,
        //   },
        // ],
        // [
        //   "14_OneHandCombo2", // ++ // long button press combo
        //   {
        //     loop: false,
        //     apply_root_translation: false,
        //     apply_root_rotation: false,
        //   },
        // ],
        // [
        //   "16_TwoHandCombo", // + Strong Combo
        //   {
        //     loop: false,
        //     apply_root_translation: false,
        //     apply_root_rotation: false,
        //   },
        // ],

        // [
        //   "13_AttackTwoHand", // Idle + long button press // -
        //   {
        //     loop: false,
        //     apply_root_translation: false,
        //     apply_root_rotation: false,
        //   },
        // ],
        // [
        //   "15_RunningAttack", // -
        //   {
        //     loop: false,
        //     apply_root_translation: false,
        //     apply_root_rotation: false,
        //   },
        // ],
        [
          "17_Block", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: null,
            onfinish_event_handler: null,
            keyframe_event_handlers: [
              {
                event_id: "block_event1",
                keyframes: [15],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_Blocking);
                },
              },
            ],
          },
        ],
        [
          "18_Block2", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: null,
            onfinish_event_handler: null,
            keyframe_event_handlers: [
              {
                event_id: "block_event2",
                keyframes: [14],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_Blocking);
                },
              },
            ],
          },
        ],
        [
          "19_Block3", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: null,
            onfinish_event_handler: null,
            keyframe_event_handlers: [
              {
                event_id: "block_event3",
                // keyframes: [5],
                keyframes: [16],
                callback: (entity) => {
                  let c_player_state = entity.get_component("PlayerState");
                  c_player_state.unset_player_action(component_player_state.ePlayerAction.PS_Blocking);
                },
              },
            ],
          },
        ],
        [
          "20_Hit", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_hit_state(component_player_state.eHitState.HS_Impact);
            },
            onfinish_event_handler: (entity) => {
              let c_player_state = entity.get_component("PlayerState");
              c_player_state.set_hit_state(component_player_state.eHitState.HS_None);
            },
          },
        ],
        [
          "07_Death", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            keyframe_event_handlers: [
              {
                event_id: "audio_bodyfall",
                keyframes: [40, 75],
                callback: (entity) => {
                  let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
                  let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 3);
                  c_emitter.stop();
                  c_emitter.set_audio(`bodyfall${[i]}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "03_RunningArmed", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
              let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
              let i = THREE.MathUtils.randInt(1, 4);
              c_emitter.stop();
              c_emitter.set_audio(`boot${[i]}`);
              c_emitter.play();
            },
            onfinish_event_handler: (entity) => {
              let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
              let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
              let i = THREE.MathUtils.randInt(1, 4);
              c_emitter.stop();
              c_emitter.set_audio(`boot${[i]}`);
              c_emitter.play();
            },
            keyframe_event_handlers: [
              {
                event_id: "player_step",
                keyframes: [9, 21],
                callback: (entity) => {
                  let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
                  let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 4);
                  c_emitter.stop();
                  c_emitter.set_audio(`boot${[i]}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "08_RunBack", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
              let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
              let i = THREE.MathUtils.randInt(1, 4);
              c_emitter.stop();
              c_emitter.set_audio(`boot${[i]}`);
              c_emitter.play();
            },
            onfinish_event_handler: (entity) => {
              let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
              let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
              let i = THREE.MathUtils.randInt(1, 4);
              c_emitter.stop();
              c_emitter.set_audio(`boot${[i]}`);
              c_emitter.play();
            },
            keyframe_event_handlers: [
              {
                event_id: "player_step",
                keyframes: [8, 19],
                callback: (entity) => {
                  let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
                  let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 4);
                  c_emitter.stop();
                  c_emitter.set_audio(`boot${[i]}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "09_RunRight", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
              let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
              let i = THREE.MathUtils.randInt(1, 4);
              c_emitter.stop();
              c_emitter.set_audio(`boot${[i]}`);
              c_emitter.play();
            },
            onfinish_event_handler: (entity) => {
              let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
              let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
              let i = THREE.MathUtils.randInt(1, 4);
              c_emitter.stop();
              c_emitter.set_audio(`boot${[i]}`);
              c_emitter.play();
            },
            keyframe_event_handlers: [
              {
                event_id: "player_step",
                keyframes: [8, 19],
                callback: (entity) => {
                  let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
                  let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 4);
                  c_emitter.stop();
                  c_emitter.set_audio(`boot${[i]}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "10_RunLeft", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
              let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
              let i = THREE.MathUtils.randInt(1, 4);
              c_emitter.stop();
              c_emitter.set_audio(`boot${[i]}`);
              c_emitter.play();
            },
            onfinish_event_handler: (entity) => {
              let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
              let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
              let i = THREE.MathUtils.randInt(1, 4);
              c_emitter.stop();
              c_emitter.set_audio(`boot${[i]}`);
              c_emitter.play();
            },
            keyframe_event_handlers: [
              {
                event_id: "player_step",
                keyframes: [9, 19],
                callback: (entity) => {
                  let e_audio_walk = entity.manager.get_entity("PlayerAudio_Body");
                  let c_emitter = e_audio_walk.get_component("AudioEmitterComponent");
                  let i = THREE.MathUtils.randInt(1, 4);
                  c_emitter.stop();
                  c_emitter.set_audio(`boot${[i]}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
      ]),
      state_transitions: [
        // Idle
        {
          from_state: "01_IdleArmed",
          to_state: "03_RunningArmed",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_forward", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "08_RunBack",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_backward", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "09_RunRight",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_right", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "10_RunLeft",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_left", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "06_OneHandCombo01",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "17_Block",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "18_Block2",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking1", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "19_Block3",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking2", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "20_Hit",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_hit", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_IdleArmed",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Hit
        {
          from_state: "20_Hit",
          to_state: "20_Hit",
          interrupt_current_state: true,
          fade_duration: 0.0,
          conditions: [
            ["is_hit", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "20_Hit",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.2,
          conditions: []
        },
        {
          from_state: "20_Hit",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Running Forward
        {
          from_state: "03_RunningArmed",
          to_state: "01_IdleArmed",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_forward", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "03_RunningArmed",
          to_state: "09_RunRight",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_right", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_RunningArmed",
          to_state: "10_RunLeft",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_left", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_RunningArmed",
          to_state: "11_RunAttack",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_RunningArmed",
          to_state: "17_Block",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_RunningArmed",
          to_state: "18_Block2",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_RunningArmed",
          to_state: "19_Block3",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_RunningArmed",
          to_state: "20_Hit",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_hit", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_RunningArmed",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Running Back
        {
          from_state: "08_RunBack",
          to_state: "01_IdleArmed",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_backward", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "08_RunBack",
          to_state: "17_Block",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "08_RunBack",
          to_state: "18_Block2",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "08_RunBack",
          to_state: "19_Block3",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "08_RunBack",
          to_state: "21_BackAttack",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "08_RunBack",
          to_state: "20_Hit",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_hit", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "08_RunBack",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Running Right
        {
          from_state: "09_RunRight",
          to_state: "01_IdleArmed",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_right", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "09_RunRight",
          to_state: "08_RunBack",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_backward", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "09_RunRight",
          to_state: "17_Block",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "09_RunRight",
          to_state: "18_Block2",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "09_RunRight",
          to_state: "19_Block3",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "09_RunRight",
          to_state: "11_RunAttack",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "09_RunRight",
          to_state: "20_Hit",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_hit", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "09_RunRight",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Running Left
        {
          from_state: "10_RunLeft",
          to_state: "01_IdleArmed",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_left", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "10_RunLeft",
          to_state: "08_RunBack",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_backward", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "10_RunLeft",
          to_state: "11_RunAttack",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "10_RunLeft",
          to_state: "17_Block",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "10_RunLeft",
          to_state: "18_Block2",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "10_RunLeft",
          to_state: "19_Block3",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "10_RunLeft",
          to_state: "20_Hit",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_hit", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "10_RunLeft",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Blocking
        {
          from_state: "17_Block",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.1,
          conditions: []
        },
        {
          from_state: "18_Block2",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.1,
          conditions: []
        },
        {
          from_state: "19_Block3",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.1,
          conditions: []
        },
        {
          from_state: "17_Block",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "18_Block2",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "19_Block3",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Attacking
        {
          from_state: "06_OneHandCombo01",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.3,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "06_OneHandCombo01",
          to_state: "06_OneHandCombo02",
          interrupt_current_state: false,
          fade_duration: 0.0,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "06_OneHandCombo02",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.3,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "06_OneHandCombo02",
          to_state: "06_OneHandCombo03",
          interrupt_current_state: false,
          fade_duration: 0.0,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "06_OneHandCombo03",
          to_state: "06_OneHandCombo01",
          interrupt_current_state: false,
          fade_duration: 0.0,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "06_OneHandCombo03",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.3,
          conditions: []
        },
        {
          from_state: "11_RunAttack",
          to_state: "06_OneHandCombo01",
          interrupt_current_state: false,
          fade_duration: 0.15,
          conditions: [
            ["is_attacking", fsm.eConditionType.CT_Eq, true],
          ],
        },
        {
          from_state: "11_RunAttack",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.1,
          conditions: []
        },
        {
          from_state: "21_BackAttack",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.3,
          conditions: []
        },
        {
          from_state: "06_OneHandCombo01",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "06_OneHandCombo02",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "06_OneHandCombo03",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "11_RunAttack",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "21_BackAttack",
          to_state: "07_Death",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_dead", fsm.eConditionType.CT_Eq, true],
          ]
        },
      ]
    });
    let c_skinned_mesh = e_player_mesh.add_component(component_mesh.SkinnedMeshComponent, {
      scene: scene,
      model: model_data.scene,
      cast_shadow: true,
      receive_shadow: true,
    });
    c_skinned_mesh.setup_kyle();
    c_skinned_mesh.mesh_.add(directional_light_target);
    e_player_mesh.add_component(component_lightsaber_glow.LightsaberGlow, {
      scene: scene,
      color: 0x2E67F8,
    });
    e_player_mesh.add_component(component_player_blocker.PlayerBlocker);
    e_player_mesh.add_component(component_health.HealthComponent, {
      total_health: 100.0,
      health: 100.0,
    });

    let e_player_audio_body = entity_manager.create_entity("PlayerAudio_Body", e_player_mesh);
    e_player_audio_body.add_component(component_audio.AudioEmitterComponent, {
      listener: audio_listener,
      audio_key: 'boot1',
      audio_lut: new Map([
        ['boot1', resources.ResourceManager.get_audio('effects/footsteps/boot1')],
        ['boot2', resources.ResourceManager.get_audio('effects/footsteps/boot2')],
        ['boot3', resources.ResourceManager.get_audio('effects/footsteps/boot3')],
        ['boot4', resources.ResourceManager.get_audio('effects/footsteps/boot4')],
        ['bodyfall1', resources.ResourceManager.get_audio('effects/player/bodyfall_human1')],
        ['bodyfall2', resources.ResourceManager.get_audio('effects/player/bodyfall_human2')],
        ['bodyfall3', resources.ResourceManager.get_audio('effects/player/bodyfall_human3')],
      ]),
      volume: 0.75,
      is_looping: false,
      autoplay: false,
    });

    let e_player_audio_voice = entity_manager.create_entity("PlayerAudio_Voice", e_player_mesh);
    e_player_audio_voice.add_component(component_audio.AudioEmitterComponent, {
      listener: audio_listener,
      audio_key: 'pain25',
      audio_lut: new Map([
        ['death1', resources.ResourceManager.get_audio('effects/player/death1')],
        ['death2', resources.ResourceManager.get_audio('effects/player/death2')],
        ['death3', resources.ResourceManager.get_audio('effects/player/death3')],
        ['pain1', resources.ResourceManager.get_audio('effects/player/pain25')],
        ['pain2', resources.ResourceManager.get_audio('effects/player/pain50')],
        ['pain3', resources.ResourceManager.get_audio('effects/player/pain75')],
        ['pain4', resources.ResourceManager.get_audio('effects/player/pain100')],
        ['falling', resources.ResourceManager.get_audio('effects/player/falling1')],
      ]),
      volume: 0.75,
      is_looping: false,
      autoplay: false,
    });

    let e_player_audio_saber1 = entity_manager.create_entity("PlayerAudio_Saberhum", e_player_mesh);
    e_player_audio_saber1.add_component(component_audio.AudioEmitterComponent, {
      listener: audio_listener,
      audio_key: 'saberhum',
      audio_lut: new Map([
        ['saberhum', resources.ResourceManager.get_audio('effects/lightsaber/saberhum4')],
      ]),
      volume: 0.15,
      is_looping: true,
      autoplay: true,
    });

    let e_player_audio_saber2 = entity_manager.create_entity("PlayerAudio_Saber", e_player_mesh);
    e_player_audio_saber2.add_component(component_audio.AudioEmitterComponent, {
      listener: audio_listener,
      audio_key: 'saberhup1',
      audio_lut: new Map([
        ['saberhup1', resources.ResourceManager.get_audio('effects/lightsaber/saberhup1')],
        ['saberhup2', resources.ResourceManager.get_audio('effects/lightsaber/saberhup2')],
        ['saberhup3', resources.ResourceManager.get_audio('effects/lightsaber/saberhup3')],
        ['saberhup4', resources.ResourceManager.get_audio('effects/lightsaber/saberhup4')],
        ['saberhup5', resources.ResourceManager.get_audio('effects/lightsaber/saberhup5')],
        ['saberhup6', resources.ResourceManager.get_audio('effects/lightsaber/saberhup6')],
        ['saberhup7', resources.ResourceManager.get_audio('effects/lightsaber/saberhup7')],
        ['saberhup8', resources.ResourceManager.get_audio('effects/lightsaber/saberhup8')],
        ['saberhup9', resources.ResourceManager.get_audio('effects/lightsaber/saberhup9')],
      ]),
      volume: 1.0,
      is_looping: false,
      autoplay: false,
    });

    let e_player_audio_saber3 = entity_manager.create_entity("PlayerAudio_SaberHit", e_player_mesh);
    e_player_audio_saber3.add_component(component_audio.AudioEmitterComponent, {
      listener: audio_listener,
      audio_key: 'saberhit',
      audio_lut: new Map([
        ['saberhit0', resources.ResourceManager.get_audio('effects/lightsaber/saberhit')],
        ['saberhit1', resources.ResourceManager.get_audio('effects/lightsaber/saberhit1')],
        ['saberhit2', resources.ResourceManager.get_audio('effects/lightsaber/saberhit2')],
        ['saberhit3', resources.ResourceManager.get_audio('effects/lightsaber/saberhit3')],
      ]),
      is_looping: false,
      autoplay: false,
      volume: 1.0,
    });

    let e_camera_target = entity_manager.create_entity("PlayerCameraTarget", e_player);
    let c_camera_target_transform = e_camera_target.get_component("Transform");
    c_camera_target_transform.local_position = new THREE.Vector3(0.0, 1.25, 0.0);

    let e_player_camera = entity_manager.create_entity("Player_Camera", e_player);
    e_player_camera.add_component(component_camera.CameraController, c_camera.camera, c_camera_target_transform);

    return e_player;
  }

  function spawn_enemy(entity_manager, scene, materials, position, rotation, name, behavior_id, behavior_params, audio_listener)
  {
    const e_singletons = entity_manager.get_entity("Singletons");

    const c_physics_state = e_singletons.get_component("PhysicsState");

    const model_data = resources.ResourceManager.get_cached_skinned_model(ASSET_ID_ENEMY);

    let e_trooper = entity_manager.create_entity("Stormtrooper" + name);
    let c_trooper_transform = e_trooper.get_component("Transform");
    c_trooper_transform.position = position.add(new THREE.Vector3(0.0, 0.0, 0.0));
    c_trooper_transform.rotation = rotation;
    e_trooper.add_component(component_physics.CapsuleCollider, {
      physics_state: c_physics_state,
      transform: c_trooper_transform,
      offset: new THREE.Vector3(0.0, -1.0, 0.0),
      mass: 0,
      height: 1.5,
      radius: 0.15,
      body_type: component_physics.eBodyType.BT_Static,
      collision_group: eCollisionGroup.CG_Enemy,
      collision_mask: eCollisionGroup.CG_All,
      is_contact_listener: false,
    });
    e_trooper.add_component(component_navigation.NavAgentComponent, {
      scene: scene,
      agent_radius: 0.4,
      agent_height: 1.8,
    });
    e_trooper.add_component(component_enemy_movement.EnemyMovementComponent);
    e_trooper.add_component(component_animation.AnimationController, {
      mesh: model_data.scene,
      animations: model_data.animations,
      initial_state: "01_Idle",
      parameters: [
        ["idle", 0],
        ["turn_left45", false],
        ["turn_left90", false],
        ["turn_left135", false],
        ["turn_left180", false],
        ["turn_right45", false],
        ["turn_right90", false],
        ["turn_right135", false],
        ["turn_right180", false],
        ["walk", false],
        ["alarm_idle", false],
        ["alarm_walk", false],
        ["alarm_turn_left", false],
        ["alarm_turn_right", false],
        ["alarm_turn180", false],
        ["fight_idle", false],
        ["fight_shoot", false],
        ["fight_shoot_rapid", false],
        ["fight_walk_shoot", false],
        ["fight_run_shoot", false],
        ["fight_run_forward", false],
        ["fight_run_backward", false],
        ["fight_run_left", false],
        ["fight_run_right", false],
        ["is_dead_shot", false],
        ["is_dead_strike0", false],
        ["is_dead_strike1", false],
        ["is_dead_strike2", false],

      ],
      animation_config: new Map([
        [
          "02_IdleAlt", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
          },
        ],
        [
          "03_IdleAlt2", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
          },
        ],
        // Death
        [
          "27_DeathShot", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_enemy = entity.get_component("EnemyBehaviorComponent");
              c_enemy.behavior.on_death_enter();
            },
            onfinish_event_handler: (entity) => {
              let c_enemy = entity.get_component("EnemyBehaviorComponent");
              c_enemy.behavior.on_death_exit();
            },
            keyframe_event_handlers: [
              {
                event_id: "bodyfall_event",
                keyframes: [36],
                callback: (entity) => {
                  let e_audio = entity.manager.get_entity(entity.name + "Audio_Body");
                  let c_emitter = e_audio.get_component("PositionalAudioEmitterComponent");
                  c_emitter.stop();
                  c_emitter.set_audio(`bodyfall${THREE.MathUtils.randInt(1, 4)}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "28_DeathStrikeRight", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_enemy = entity.get_component("EnemyBehaviorComponent");
              c_enemy.behavior.on_death_enter();
            },
            onfinish_event_handler: (entity) => {
              let c_enemy = entity.get_component("EnemyBehaviorComponent");
              c_enemy.behavior.on_death_exit();
            },
            keyframe_event_handlers: [
              {
                event_id: "bodyfall_event",
                keyframes: [36],
                callback: (entity) => {
                  let e_audio = entity.manager.get_entity(entity.name + "Audio_Body");
                  let c_emitter = e_audio.get_component("PositionalAudioEmitterComponent");
                  c_emitter.stop();
                  c_emitter.set_audio(`bodyfall${THREE.MathUtils.randInt(1, 4)}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "29_DeathStrike", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_enemy = entity.get_component("EnemyBehaviorComponent");
              c_enemy.behavior.on_death_enter();
            },
            onfinish_event_handler: (entity) => {
              let c_enemy = entity.get_component("EnemyBehaviorComponent");
              c_enemy.behavior.on_death_exit();
            },
            keyframe_event_handlers: [
              {
                event_id: "bodyfall_event",
                keyframes: [38],
                callback: (entity) => {
                  let e_audio = entity.manager.get_entity(entity.name + "Audio_Body");
                  let c_emitter = e_audio.get_component("PositionalAudioEmitterComponent");
                  c_emitter.stop();
                  c_emitter.set_audio(`bodyfall${THREE.MathUtils.randInt(1, 4)}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "30_DeathStrike2", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            onplay_event_handler: (entity) => {
              let c_enemy = entity.get_component("EnemyBehaviorComponent");
              c_enemy.behavior.on_death_enter();
            },
            onfinish_event_handler: (entity) => {
              let c_enemy = entity.get_component("EnemyBehaviorComponent");
              c_enemy.behavior.on_death_exit();
            },
            keyframe_event_handlers: [
              {
                event_id: "bodyfall_event",
                keyframes: [36, 68],
                callback: (entity) => {
                  let e_audio = entity.manager.get_entity(entity.name + "Audio_Body");
                  let c_emitter = e_audio.get_component("PositionalAudioEmitterComponent");
                  c_emitter.stop();
                  c_emitter.set_audio(`bodyfall${THREE.MathUtils.randInt(1, 4)}`);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        // Fighting
        [
          "21_ShootStanding", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
            keyframe_event_handlers: [
              {
                event_id: "shoot_event",
                keyframes: [5],
                callback: (entity) => {
                  let c_blaster = entity.get_component("BlasterSpawner");
                  c_blaster.spawn();

                  let e_audio = entity.manager.get_entity(entity.name + "Audio_Shoot");
                  let c_emitter = e_audio.get_component("PositionalAudioEmitterComponent");
                  c_emitter.stop();
                  c_emitter.set_pitch(THREE.MathUtils.randInt(-1, 1) * 100);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "32_ShootStandingRapid", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
            keyframe_event_handlers: [
              {
                event_id: "shoot_rapid_event",
                keyframes: [3],
                callback: (entity) => {
                  let c_blaster = entity.get_component("BlasterSpawner");
                  c_blaster.spawn();

                  let e_audio = entity.manager.get_entity(entity.name + "Audio_Shoot");
                  let c_emitter = e_audio.get_component("PositionalAudioEmitterComponent");
                  c_emitter.stop();
                  c_emitter.set_pitch(THREE.MathUtils.randInt(-1, 1) * 100);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "22_ShootRapidWalkForward", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
            keyframe_event_handlers: [
              {
                event_id: "shoot_walk_event",
                keyframes: [3, 11, 20, 28, 37, 46, 54, 61, 70, 79, 88, 97],
                callback: (entity) => {
                  let c_blaster = entity.get_component("BlasterSpawner");
                  c_blaster.spawn();

                  let e_audio = entity.manager.get_entity(entity.name + "Audio_Shoot");
                  let c_emitter = e_audio.get_component("PositionalAudioEmitterComponent");
                  c_emitter.stop();
                  c_emitter.set_pitch(THREE.MathUtils.randInt(-1, 1) * 100);
                  c_emitter.play();
                },
              },
            ],
          },
        ],
        [
          "33_ShootRapidRunForward", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
            keyframe_event_handlers: [
              {
                event_id: "shoot_run_event",
                keyframes: [3, 10, 17, 25],
                callback: (entity) => {
                  let c_blaster = entity.get_component("BlasterSpawner");
                  c_blaster.spawn();
                },
              },
            ],
          },
        ],
        // Turn right
        [
          "05_TurnRight45", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        [
          "10_TurnRight90", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        [
          "09_TurnRight135", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        [
          "06_TurnRight180", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        // Turn Left
        [
          "11_TurnLeft45", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        [
          "08_TurnLeft90", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        [
          "07_TurnLeft135", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        [
          "31_TurnLeft180", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        // Alarm Turn
        [
          "34_AlarmTurn180", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        [
          "35_AlarmTurnRight", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
        [
          "36_AlarmTurnLeft", 
          {
            loop: false,
            apply_root_translation: true,
            apply_root_rotation: true,
          },
        ],
      ]),
      state_transitions: [
        // Idle
        {
          from_state: "01_Idle",
          to_state: "02_IdleAlt",
          interrupt_current_state: true,
          fade_duration: 0.3,
          conditions: [
            ["idle", fsm.eConditionType.CT_Eq, 1],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "03_IdleAlt2",
          interrupt_current_state: true,
          fade_duration: 0.8,
          conditions: [
            ["idle", fsm.eConditionType.CT_Eq, 2],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "04_Walk",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["walk", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "11_TurnLeft45",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left45", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "08_TurnLeft90",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left90", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "07_TurnLeft135",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left135", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "31_TurnLeft180",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left180", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "05_TurnRight45",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right45", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "10_TurnRight90",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right90", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "09_TurnRight135",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right135", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "06_TurnRight180",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right180", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "04_Walk",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["walk", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "11_TurnLeft45",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left45", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "08_TurnLeft90",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left90", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "07_TurnLeft135",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left135", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "31_TurnLeft180",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left180", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "05_TurnRight45",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right45", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "10_TurnRight90",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right90", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "09_TurnRight135",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right135", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "06_TurnRight180",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right180", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "04_Walk",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["walk", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "11_TurnLeft45",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left45", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "08_TurnLeft90",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left90", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "07_TurnLeft135",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left135", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "31_TurnLeft180",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_left180", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "05_TurnRight45",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right45", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "10_TurnRight90",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right90", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "09_TurnRight135",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right135", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "06_TurnRight180",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["turn_right180", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "01_Idle",
          to_state: "38_InvestigateIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["alarm_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "38_InvestigateIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["alarm_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "38_InvestigateIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["alarm_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "02_IdleAlt",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.3,
          conditions: []
        },
        {
          from_state: "03_IdleAlt2",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.8,
          conditions: []
        },
        // Alarm Idle
        {
          from_state: "38_InvestigateIdle",
          to_state: "37_InvestigateWalk",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["alarm_walk", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "38_InvestigateIdle",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "38_InvestigateIdle",
          to_state: "34_AlarmTurn180",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["alarm_turn180", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "38_InvestigateIdle",
          to_state: "35_AlarmTurnRight",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["alarm_turn_right", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "38_InvestigateIdle",
          to_state: "36_AlarmTurnLeft",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["alarm_turn_left", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "38_InvestigateIdle",
          to_state: "01_Idle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["alarm_idle", fsm.eConditionType.CT_Eq, false],
          ]
        },
        // Alarm Walk
        {
          from_state: "37_InvestigateWalk",
          to_state: "38_InvestigateIdle",
          interrupt_current_state: true,
          fade_duration: 0.3,
          conditions: [
            ["alarm_walk", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "37_InvestigateWalk",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Alarm Turn
        {
          from_state: "34_AlarmTurn180",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "35_AlarmTurnRight",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "36_AlarmTurnLeft",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "34_AlarmTurn180",
          to_state: "38_InvestigateIdle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "35_AlarmTurnRight",
          to_state: "38_InvestigateIdle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "36_AlarmTurnLeft",
          to_state: "38_InvestigateIdle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        // Fight Idle
        {
          from_state: "20_FightIdle",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "20_FightIdle",
          to_state: "14_RunForward",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["fight_run_forward", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "20_FightIdle",
          to_state: "19_RunBack",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["fight_run_backward", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "20_FightIdle",
          to_state: "17_RunLeft",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["fight_run_left", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "20_FightIdle",
          to_state: "18_RunRight",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["fight_run_right", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // TODO: ADD ALL DEATH STATE TRANSITIONS (e.g. fight run)
        // TODO: Make transitions from idle and run separately??
        // {
        //   from_state: "20_FightIdle",
        //   to_state: "21_ShootStanding",
        //   interrupt_current_state: true,
        //   fade_duration: 0.2,
        //   conditions: [
        //     ["fight_shoot", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        {
          from_state: "20_FightIdle",
          to_state: "32_ShootStandingRapid",
          interrupt_current_state: true,
          fade_duration: 0.2,
          conditions: [
            ["fight_shoot_rapid", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "20_FightIdle",
          to_state: "22_ShootRapidWalkForward",
          interrupt_current_state: true,
          fade_duration: 0.3,
          conditions: [
            ["fight_walk_shoot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // {
        //   from_state: "20_FightIdle",
        //   to_state: "33_ShootRapidRunForward",
        //   interrupt_current_state: true,
        //   fade_duration: 0.3,
        //   conditions: [
        //     ["fight_run_shoot", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        {
          from_state: "20_FightIdle",
          to_state: "27_DeathShot",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "20_FightIdle",
          to_state: "28_DeathStrikeRight",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "20_FightIdle",
          to_state: "29_DeathStrike",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "20_FightIdle",
          to_state: "30_DeathStrike2",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Fight Run
        {
          from_state: "14_RunForward",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["fight_run_forward", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "19_RunBack",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["fight_run_backward", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "17_RunLeft",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["fight_run_left", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "18_RunRight",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["fight_run_right", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "14_RunForward",
          to_state: "27_DeathShot",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "14_RunForward",
          to_state: "28_DeathStrikeRight",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "14_RunForward",
          to_state: "29_DeathStrike",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "14_RunForward",
          to_state: "30_DeathStrike2",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
          ]
        },

        {
          from_state: "19_RunBack",
          to_state: "27_DeathShot",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "19_RunBack",
          to_state: "28_DeathStrikeRight",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "19_RunBack",
          to_state: "29_DeathStrike",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "19_RunBack",
          to_state: "30_DeathStrike2",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "17_RunLeft",
          to_state: "27_DeathShot",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "17_RunLeft",
          to_state: "28_DeathStrikeRight",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "17_RunLeft",
          to_state: "29_DeathStrike",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "17_RunLeft",
          to_state: "30_DeathStrike2",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "18_RunRight",
          to_state: "27_DeathShot",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "18_RunRight",
          to_state: "28_DeathStrikeRight",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "18_RunRight",
          to_state: "29_DeathStrike",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "18_RunRight",
          to_state: "30_DeathStrike2",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Fight Shoot
        // {
        //   from_state: "21_ShootStanding",
        //   to_state: "20_FightIdle",
        //   interrupt_current_state: true,
        //   fade_duration: 0.3,
        //   conditions: [
        //     ["fight_shoot", fsm.eConditionType.CT_Eq, false],
        //   ]
        // },
        {
          from_state: "32_ShootStandingRapid",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.3,
          conditions: [
            ["fight_shoot_rapid", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "22_ShootRapidWalkForward",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.4,
          conditions: [
            ["fight_walk_shoot", fsm.eConditionType.CT_Eq, false],
          ]
        },
        // {
        //   from_state: "33_ShootRapidRunForward",
        //   to_state: "20_FightIdle",
        //   interrupt_current_state: true,
        //   fade_duration: 0.4,
        //   conditions: [
        //     ["fight_run_shoot", fsm.eConditionType.CT_Eq, false],
        //   ]
        // },
        // {
        //   from_state: "21_ShootStanding",
        //   to_state: "27_DeathShot",
        //   interrupt_current_state: true,
        //   fade_duration: 0.25,
        //   conditions: [
        //     ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        // {
        //   from_state: "21_ShootStanding",
        //   to_state: "28_DeathStrikeRight",
        //   interrupt_current_state: true,
        //   fade_duration: 0.25,
        //   conditions: [
        //     ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        // {
        //   from_state: "21_ShootStanding",
        //   to_state: "29_DeathStrike",
        //   interrupt_current_state: true,
        //   fade_duration: 0.25,
        //   conditions: [
        //     ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        // {
        //   from_state: "21_ShootStanding",
        //   to_state: "30_DeathStrike2",
        //   interrupt_current_state: true,
        //   fade_duration: 0.25,
        //   conditions: [
        //     ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        {
          from_state: "32_ShootStandingRapid",
          to_state: "27_DeathShot",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "32_ShootStandingRapid",
          to_state: "28_DeathStrikeRight",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "32_ShootStandingRapid",
          to_state: "29_DeathStrike",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "32_ShootStandingRapid",
          to_state: "30_DeathStrike2",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "22_ShootRapidWalkForward",
          to_state: "27_DeathShot",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "22_ShootRapidWalkForward",
          to_state: "28_DeathStrikeRight",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "22_ShootRapidWalkForward",
          to_state: "29_DeathStrike",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "22_ShootRapidWalkForward",
          to_state: "30_DeathStrike2",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // {
        //   from_state: "33_ShootRapidRunForward",
        //   to_state: "27_DeathShot",
        //   interrupt_current_state: true,
        //   fade_duration: 0.25,
        //   conditions: [
        //     ["is_dead_shot", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        // {
        //   from_state: "33_ShootRapidRunForward",
        //   to_state: "28_DeathStrikeRight",
        //   interrupt_current_state: true,
        //   fade_duration: 0.25,
        //   conditions: [
        //     ["is_dead_strike0", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        // {
        //   from_state: "33_ShootRapidRunForward",
        //   to_state: "29_DeathStrike",
        //   interrupt_current_state: true,
        //   fade_duration: 0.25,
        //   conditions: [
        //     ["is_dead_strike1", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        // {
        //   from_state: "33_ShootRapidRunForward",
        //   to_state: "30_DeathStrike2",
        //   interrupt_current_state: true,
        //   fade_duration: 0.25,
        //   conditions: [
        //     ["is_dead_strike2", fsm.eConditionType.CT_Eq, true],
        //   ]
        // },
        // Walk
        {
          from_state: "04_Walk",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "04_Walk",
          to_state: "01_Idle",
          interrupt_current_state: true,
          fade_duration: 0.6,
          conditions: [
            ["walk", fsm.eConditionType.CT_Eq, false],
          ]
        },
        {
          from_state: "04_Walk",
          to_state: "38_InvestigateIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["alarm_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Turn Left
        {
          from_state: "11_TurnLeft45",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "08_TurnLeft90",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "07_TurnLeft135",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "31_TurnLeft180",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "11_TurnLeft45",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "08_TurnLeft90",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "07_TurnLeft135",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "31_TurnLeft180",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        // Turn Right
        {
          from_state: "05_TurnRight45",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "10_TurnRight90",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "09_TurnRight135",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "06_TurnRight180",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        {
          from_state: "05_TurnRight45",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "10_TurnRight90",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "09_TurnRight135",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "06_TurnRight180",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.25,
          conditions: [
            ["fight_idle", fsm.eConditionType.CT_Eq, true],
          ]
        },
      ]
    });
    let c_skinned_mesh = e_trooper.add_component(component_mesh.SkinnedMeshComponent, {
      scene: scene,
      model: model_data.scene,
      cast_shadow: true,
      receive_shadow: true,
    });
    c_skinned_mesh.setup_stormtrooper(materials);
    e_trooper.add_component(component_enemy_behavior.EnemyBehaviorComponent, {
      scene: scene,
      behavior_id: behavior_id,
      behavior_params: behavior_params,
    });
    e_trooper.add_component(component_blaster.BlasterSpawner, {
      scene: scene,
      size: 64,
      lifetime: 20.0,
    });
    e_trooper.add_component(component_physics.CylinderTrigger, {
      physics_state: e_singletons.get_component("PhysicsState"),
      transform: c_trooper_transform,
      radius: 0.4,
      height: 1.8,
      collision_group: eCollisionGroup.CG_EnemyHitBox,
      collision_mask: eCollisionGroup.CG_All & ~eCollisionGroup.CG_EnemyHitBox,
    });
    e_trooper.add_component(component_health.HealthComponent, {
      total_health: 100.0,
      health: 100.0,
    });
    e_trooper.add_component(component_enemy_sensors.EnemySensorsComponent, {
      agent_height: 1.5,
      scene: scene,
      sense_distance: 5.0,
      view_angle_close_degrees: 90.0,
      view_distance_close: 17.5,
      view_angle_far_degrees: 120.0,
      view_distance_far: 20.0,
    });

    let e_trooper_audio_shoot = entity_manager.create_entity("Stormtrooper" + name + "Audio_Shoot", e_trooper);
    let c_emitter1 = e_trooper_audio_shoot.add_component(component_audio.PositionalAudioEmitterComponent, {
      listener: audio_listener,
      mesh: c_skinned_mesh.mesh_,
      audio_key: 'fire',
      audio_lut: new Map([
        ['fire', resources.ResourceManager.get_audio('effects/blaster/fire')],
        ['alt_fire', resources.ResourceManager.get_audio('effects/blaster/alt_fire')],
      ]),
      is_looping: false,
      autoplay: false,
      volume: 1.0,
    });
    c_emitter1.set_ref_distance(4.0);
    c_emitter1.set_rolloff_factor(1.5);

    let e_trooper_audio_reflect = entity_manager.create_entity("Stormtrooper" + name + "Audio_Reflect", e_trooper);
    let c_emitter2 = e_trooper_audio_reflect.add_component(component_audio.AudioEmitterComponent, {
      listener: audio_listener,
      audio_key: 'reflect1',
      audio_lut: new Map([
        ['reflect1', resources.ResourceManager.get_audio('effects/blaster/reflect1')],
        ['reflect2', resources.ResourceManager.get_audio('effects/blaster/reflect2')],
        ['reflect3', resources.ResourceManager.get_audio('effects/blaster/reflect3')],
      ]),
      is_looping: false,
      autoplay: false,
      volume: 1.0,
    });

    let e_trooper_audio_voice = entity_manager.create_entity("Stormtrooper" + name + "Audio_Voice", e_trooper);
    let c_emitter3 = e_trooper_audio_voice.add_component(component_audio.PositionalAudioEmitterComponent, {
      listener: audio_listener,
      mesh: c_skinned_mesh.mesh_,
      audio_key: 'death1',
      audio_lut: new Map([
        ['death1', resources.ResourceManager.get_audio('effects/trooper/type1/death1')],
        ['death2', resources.ResourceManager.get_audio('effects/trooper/type1/death2')],
        ['death3', resources.ResourceManager.get_audio('effects/trooper/type1/death3')],
        ['pain25', resources.ResourceManager.get_audio('effects/trooper/type1/pain25')],
        ['pain50', resources.ResourceManager.get_audio('effects/trooper/type1/pain50')],
        ['pain75', resources.ResourceManager.get_audio('effects/trooper/type1/pain75')],
        ['pain100', resources.ResourceManager.get_audio('effects/trooper/type1/pain100')],
        ['victory1', resources.ResourceManager.get_audio('effects/trooper/type1/victory1')],
        ['victory2', resources.ResourceManager.get_audio('effects/trooper/type1/victory2')],
        ['victory3', resources.ResourceManager.get_audio('effects/trooper/type1/victory3')],
      ]),
      is_looping: false,
      autoplay: false,
      volume: 1.0,
    });
    c_emitter3.set_ref_distance(3.0);

    let e_trooper_audio_body = entity_manager.create_entity("Stormtrooper" + name + "Audio_Body", e_trooper);
    let c_emitter4 = e_trooper_audio_body.add_component(component_audio.PositionalAudioEmitterComponent, {
      listener: audio_listener,
      mesh: c_skinned_mesh.mesh_,
      audio_key: 'death1',
      audio_lut: new Map([
        ['bodyfall1', resources.ResourceManager.get_audio('effects/trooper/bodyfall_trooper1')],
        ['bodyfall2', resources.ResourceManager.get_audio('effects/trooper/bodyfall_trooper2')],
        ['bodyfall3', resources.ResourceManager.get_audio('effects/trooper/bodyfall_trooper3')],
        ['bodyfall4', resources.ResourceManager.get_audio('effects/trooper/bodyfall_trooper4')],
      ]),
      is_looping: false,
      autoplay: false,
      volume: 1.0,
    });
    c_emitter4.set_ref_distance(2.0);

    return e_trooper;
  }

  return {
    spawn_player: spawn_player,
    spawn_enemy: spawn_enemy,
  };

})();
