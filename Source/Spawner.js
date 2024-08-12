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
import { component_fighting } from './Components/FightingState';
import { component_navigation } from './Components/Navigation';
import { component_enemy_behavior } from './Components/EnemyBehavior';
import { component_enemy_movement } from './Components/EnemyMovement';
import { component_lightsaber_glow } from './Components/LightsaberGlow';


export const spawner = (() => {

  function spawn_player(entity_manager, scene, directional_light_target, position, rotation)
  {
    const e_singletons = entity_manager.get_entity("Singletons");

    const c_physics_state = e_singletons.get_component("PhysicsState");
    const c_camera = e_singletons.get_component("PerspectiveCamera");

    const model_data = resources.ResourceManager.get_cached_skinned_model(ASSET_ID_KYLE);

    let e_player = entity_manager.create_entity("Player");
    let c_player_transform = e_player.get_component("Transform");
    c_player_transform.position = position.add(new THREE.Vector3(0.0, 0.85, 0.0));
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
    c_player_mesh_transform.position = new THREE.Vector3(0.0, 0.0, 0.0);
    e_player_mesh.add_component(component_command.PlayerCommander);
    e_player_mesh.add_component(component_fighting.FightingState);
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
      ],
      animation_config: new Map([
        [
          "06_OneHandCombo01", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
          },
        ],
        [
          "06_OneHandCombo02", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
          },
        ],
        [
          "06_OneHandCombo03", 
          {
            loop: false,
            apply_root_translation: false,
            apply_root_rotation: false,
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
          to_state: "01_IdleArmed",
          interrupt_current_state: false,
          fade_duration: 0.3,
          conditions: []
        },
      ]
    })
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

    let e_player_trigger = entity_manager.create_entity("PlayerSwordTrigger", e_player_mesh);
    let c_player_trigger_transform = e_player_trigger.get_component("Transform");
    c_player_trigger_transform.position = new THREE.Vector3(0.0, 1.5, -0.5);
    e_player_trigger.add_component(component_physics.BoxTrigger, {
      physics_state: e_singletons.get_component("PhysicsState"),
      transform: c_player_trigger_transform,
      size: new THREE.Vector3(0.05, 0.05, 1.0),
      collision_group: eCollisionGroup.CG_Player,
      collision_mask: eCollisionGroup.CG_All & ~eCollisionGroup.CG_Player,
      is_contact_listener: true,
    });

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

if (true)
{
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
      collision_group: eCollisionGroup.CG_Default,
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

    return e_trooper;
}

if (false)
{
    let e_trooper = entity_manager.create_entity("Stormtrooper_" + name);
    let c_trooper_transform = e_trooper.get_component("Transform");
    c_trooper_transform.position = position;
    c_trooper_transform.rotation = rotation;
    e_trooper.add_component(component_navigation.NavAgentComponent, {
      scene: scene,
      agent_radius: 0.4,
      agent_height: 1.8,
    });
    e_trooper.add_component(component_enemy_movement.EnemyMovementComponent);
    let c_trooper_animation_controller = e_trooper.add_component(component_animation.AnimationController, {
      animated_mesh: null,
      animations: null,
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
    e_trooper.add_component(component_mesh.SkinnedMeshComponent, {
      scene: scene,
      model_id: 'stormtrooper_anim2',
      materials: materials,
      animation_controller: c_trooper_animation_controller, 
    });
    e_trooper.add_component(component_enemy_behavior.EnemyBehaviorComponent, {
      behavior_id: behavior_id,
      behavior_params: behavior_params,
    });

    let e_trooper_collider = entity_manager.create_entity("Stormtrooper_" + name + "_Collider", e_trooper);
    let c_trooper_collider_transform = e_trooper_collider.get_component("Transform");
    c_trooper_collider_transform.local_position = new THREE.Vector3(0.0, 1.0, 0.0);
    e_trooper_collider.add_component(component_physics.CapsuleCollider, {
      physics_state: c_physics_state,
      transform: c_trooper_collider_transform,
      mass: 0,
      height: 1.5,
      radius: 0.15,
      body_type: component_physics.eBodyType.BT_Static,
      collision_group: eCollisionGroup.CG_Default,
      collision_mask: eCollisionGroup.CG_All,
      is_contact_listener: false,
    });
}
  }

  return {
    spawn_player: spawn_player,
    spawn_enemy: spawn_enemy,
  };

})();
