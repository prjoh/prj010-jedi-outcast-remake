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


export const spawner = (() => {

  function spawn_player(entity_manager, scene, directional_light_target, position, rotation)
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
      ],
      animation_config: new Map([
        [
          "06_OneHandCombo01", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            attack_frames: [19, 26],
          },
        ],
        [
          "06_OneHandCombo02", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            attack_frames: [7, 13],
          },
        ],
        [
          "06_OneHandCombo03", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            attack_frames: [5, 13],
          },
        ],
        [
          "17_Block", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
            keyframe_event_handlers: [
              {
                event_id: "block_event1",
                // keyframes: [6],
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
            keyframe_event_handlers: [
              {
                event_id: "block_event2",
                // keyframes: [5],
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
        // Running Forward
        {
          from_state: "03_RunningArmed",
          to_state: "01_IdleArmed",
          interrupt_current_state: true,
          fade_duration: 0.15,
          conditions: [
            ["is_run_forward", fsm.eConditionType.CT_Eq, false],
          ]
        },            {
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
        // Blocking
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
          from_state: "03_RunningArmed",
          to_state: "17_Block",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
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
          from_state: "09_RunRight",
          to_state: "17_Block",
          interrupt_current_state: true,
          fade_duration: 0.1,
          conditions: [
            ["is_blocking0", fsm.eConditionType.CT_Eq, true],
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
          from_state: "17_Block",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.1,
          conditions: []
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
          from_state: "03_RunningArmed",
          to_state: "18_Block2",
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
          from_state: "09_RunRight",
          to_state: "18_Block2",
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
          from_state: "18_Block2",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.1,
          conditions: []
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
          from_state: "03_RunningArmed",
          to_state: "19_Block3",
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
          from_state: "09_RunRight",
          to_state: "19_Block3",
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
          from_state: "19_Block3",
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.1,
          conditions: []
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
    // e_player_mesh.add_component(component_player_blocker.PlayerBlocker, {
    //   scene: scene,
    // });
    e_player_mesh.add_component(component_player_blocker.PlayerBlocker);


    // let e_player_trigger = entity_manager.create_entity("PlayerSwordTrigger", e_player_mesh);
    // let c_player_trigger_transform = e_player_trigger.get_component("Transform");
    // c_player_trigger_transform.position = new THREE.Vector3(0.0, 1.5, -0.5);
    // e_player_trigger.add_component(component_physics.BoxTrigger, {
    //   physics_state: e_singletons.get_component("PhysicsState"),
    //   transform: c_player_trigger_transform,
    //   size: new THREE.Vector3(0.05, 0.05, 1.0),
    //   collision_group: eCollisionGroup.CG_Player,
    //   collision_mask: eCollisionGroup.CG_All & ~eCollisionGroup.CG_Player,
    //   is_contact_listener: true,
    // });

    // let e_player_deflector = entity_manager.create_entity("PlayerDeflector", e_player_mesh);
    // let e_player_deflector_transform = e_player_deflector.get_component("Transform");
    // e_player_deflector.add_component(component_player_blocker.PlayerBlocker);
    // e_player_deflector.add_component(component_physics.CylinderTrigger, {
    //   physics_state: e_singletons.get_component("PhysicsState"),
    //   transform: e_player_deflector_transform,
    //   radius: 2.0,
    //   height: 2.0,
    //   collision_group: eCollisionGroup.CG_PlayerDeflector,
    //   collision_mask: eCollisionGroup.CG_All & ~eCollisionGroup.CG_PlayerDeflector,
    // });

    // let e_player_deflector_child = entity_manager.create_entity("PlayerDeflectorChild", e_player_deflector);
    // let e_player_deflector_child_transform = e_player_deflector.get_component("Transform");
    // e_player_deflector_child.add_component(component_physics.CylinderTrigger, {
    //   physics_state: e_singletons.get_component("PhysicsState"),
    //   transform: e_player_deflector_child_transform,
    //   radius: 0.75,
    //   height: 2.0,
    //   collision_group: eCollisionGroup.CG_PlayerDeflector,
    //   collision_mask: eCollisionGroup.CG_All & ~eCollisionGroup.CG_PlayerDeflector,
    // });

    let e_camera_target = entity_manager.create_entity("PlayerCameraTarget", e_player);
    let c_camera_target_transform = e_camera_target.get_component("Transform");
    c_camera_target_transform.local_position = new THREE.Vector3(0.0, 1.25, 0.0);

    let e_player_camera = entity_manager.create_entity("Player_Camera", e_player);
    e_player_camera.add_component(component_camera.CameraController, c_camera.camera, c_camera_target_transform);

    return e_player;
  }

  function spawn_enemy(entity_manager, scene, materials, position, rotation, name, behavior_id, behavior_params)
  {
    const e_singletons = entity_manager.get_entity("Singletons");

    const c_physics_state = e_singletons.get_component("PhysicsState");

    const model_data = resources.ResourceManager.get_cached_skinned_model(ASSET_ID_ENEMY);

    let e_trooper = entity_manager.create_entity("Stormtrooper_" + name);
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
        ["fight_idle", false],
        ["fight_shoot", false],
        ["fight_shoot_rapid", false],
        ["fight_walk_shoot", false],
        ["fight_run_shoot", false],
        ["fight_run_forward", false],
        ["fight_run_backward", false],
        ["fight_run_left", false],
        ["fight_run_right", false],
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
        // Fighting
        [
          "20_FightIdle", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
          },
        ],
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
        [
          "14_RunForward", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
          },
        ],
        [
          "19_RunBack", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
          },
        ],
        [
          "17_RunLeft", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
          },
        ],
        [
          "18_RunRight", 
          {
            loop: true,
            apply_root_translation: false,
            apply_root_rotation: false,
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
        // Fight Idle
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
        // Fight Shoot
        {
          from_state: "20_FightIdle",
          to_state: "21_ShootStanding",
          interrupt_current_state: true,
          fade_duration: 0.2,
          conditions: [
            ["fight_shoot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "21_ShootStanding",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.3,
          conditions: [
            ["fight_shoot", fsm.eConditionType.CT_Eq, false],
          ]
        },
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
          from_state: "32_ShootStandingRapid",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.3,
          conditions: [
            ["fight_shoot_rapid", fsm.eConditionType.CT_Eq, false],
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
        {
          from_state: "22_ShootRapidWalkForward",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.4,
          conditions: [
            ["fight_walk_shoot", fsm.eConditionType.CT_Eq, false],
          ]
        },

        {
          from_state: "20_FightIdle",
          to_state: "33_ShootRapidRunForward",
          interrupt_current_state: true,
          fade_duration: 0.3,
          conditions: [
            ["fight_run_shoot", fsm.eConditionType.CT_Eq, true],
          ]
        },
        {
          from_state: "33_ShootRapidRunForward",
          to_state: "20_FightIdle",
          interrupt_current_state: true,
          fade_duration: 0.4,
          conditions: [
            ["fight_run_shoot", fsm.eConditionType.CT_Eq, false],
          ]
        },

        // Walk
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
          from_state: "04_Walk",
          to_state: "01_Idle",
          interrupt_current_state: true,
          fade_duration: 0.6,
          conditions: [
            ["walk", fsm.eConditionType.CT_Eq, false],
          ]
        },
        // Turn Left
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
          from_state: "11_TurnLeft45",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
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
          from_state: "08_TurnLeft90",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
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
          from_state: "07_TurnLeft135",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
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
          from_state: "31_TurnLeft180",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
        },
        // Turn Right
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
          from_state: "05_TurnRight45",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
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
          from_state: "10_TurnRight90",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
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
          from_state: "09_TurnRight135",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
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
          from_state: "06_TurnRight180",
          to_state: "01_Idle",
          interrupt_current_state: false,
          fade_duration: 0.0,  // TODO: This is as far as we get with the root motion hack.
          conditions: []
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
      behavior_id: behavior_id,
      behavior_params: behavior_params,
    });
    e_trooper.add_component(component_blaster.BlasterSpawner, {
      scene: scene,
      size: 64,
      lifetime: 20.0,
    });

    return e_trooper;
  }

  return {
    spawn_player: spawn_player,
    spawn_enemy: spawn_enemy,
  };

})();
