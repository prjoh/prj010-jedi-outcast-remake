import * as THREE from 'three';

import { world_base } from '../World';
import { ASSET_ID_ENEMY, ASSET_ID_KYLE, NUM_ENEMIES, eCollisionGroup } from '../Config';
import { env } from '../Env';
import { resources } from '../ResourceManager';
import { eBehaviorID } from '../Enemy/EnemyBehavior';
import { spawner } from '../Spawner';
import { log } from '../Log';

import { ecs_manager } from '../ECS/EntityManager';

import { system_camera } from '../Systems/CameraSystem';
import { system_renderer } from '../Systems/RenderSystem';
import { system_physics } from '../Systems/PhysicsSystem';
import { system_input } from '../Systems/InputSystem';
import { system_player_movement } from '../Systems/PlayerMovementSystem';
import { system_animation } from '../Systems/Animation';
import { system_enemy_behavior } from '../Systems/EnemyBehaviorSystem';
import { system_enemy_movement } from '../Systems/EnemyMovementSystem';
import { system_interact } from '../Systems/InteractionSystem';
import { system_player_behavior } from '../Systems/PlayerBehaviorSystem';
import { system_audio } from '../Systems/Audio';
import { system_game_state } from '../Systems/GameStateSystem';

import { component_renderer } from '../Components/RenderState';
import { component_camera } from '../Components/Camera';
import { component_lights } from '../Components/SceneLights';
import { component_mesh } from '../Components/Mesh';
import { component_physics } from '../Components/Physics';
import { component_input } from '../Components/Input';
import { component_navigation } from '../Components/Navigation';
import { component_editor } from '../Components/Editor';
import { component_interact } from '../Components/Interactable';
import { component_health } from '../Components/Health';
import { component_debug } from '../Components/Debug';
import { component_game_menu } from '../Components/GameMenu';
import { component_audio } from '../Components/Audio';
import { component_combat_manager } from '../Components/CombatManager';


export const game_world = (() => {

  class World extends world_base.World
  {
    constructor()
    {
      super();

      this.entity_manager_ = new ecs_manager.EntityManager();

      this.scene_ = new THREE.Scene();
    }

    get quit_state()
    {
      return this.entity_manager_.quit_state;
    }

    // TODO: Refactor
    load()
    {
      /*
       * Load resources
       */
      resources.ResourceManager.load_cube_map('sky');

      resources.ResourceManager.load_static_model_gltf('skybox');
      resources.ResourceManager.load_static_model_gltf('level_01');
      resources.ResourceManager.load_static_model_gltf('level_01_dc');
      resources.ResourceManager.load_static_model_gltf('level_01_instanced');
      resources.ResourceManager.load_skinned_model_gltf('kyle2_anim_comp2');
      resources.ResourceManager.load_skinned_model_gltf('stormtrooper_anim2');
      resources.ResourceManager.load_texture('Grid');
      resources.ResourceManager.load_texture('Grid_N');
      resources.ResourceManager.load_binary_file('NavMesh/level_01_wb_nav');

      resources.ResourceManager.load_texture('kyle/Kyle_Clothes_Belt_OcclusionRoughnessMetallic', false);
      resources.ResourceManager.load_texture('kyle/Kyle_Clothes_Boots_OcclusionRoughnessMetallic', false);
      resources.ResourceManager.load_texture('kyle/Kyle_Clothes_Gauntlets_OcclusionRoughnessMetallic', false);
      resources.ResourceManager.load_texture('kyle/Kyle_Clothes_Pants_OcclusionRoughnessMetallic', false);
      resources.ResourceManager.load_texture('kyle/Kyle_Clothes_Pauldron_OcclusionRoughnessMetallic', false);
      resources.ResourceManager.load_texture('kyle/Kyle_Clothes_Shirt_OcclusionRoughnessMetallic', false);
      resources.ResourceManager.load_texture('kyle/Kyle_Clothes_Tshirt_OcclusionRoughnessMetallic', false);
      
      resources.ResourceManager.load_texture('stormtrooper/m_face_diffuse', false);
      resources.ResourceManager.load_texture('stormtrooper/m_face_metalness', false);
      resources.ResourceManager.load_texture('stormtrooper/m_face_normal', false);
      resources.ResourceManager.load_texture('stormtrooper/m_face_roughness', false);
      resources.ResourceManager.load_texture('stormtrooper/m_face_specular', false);

      resources.ResourceManager.load_texture('stormtrooper/m_body_diffuse', false);
      resources.ResourceManager.load_texture('stormtrooper/m_body_metalness', false);
      resources.ResourceManager.load_texture('stormtrooper/m_body_normal', false);
      resources.ResourceManager.load_texture('stormtrooper/m_body_roughness', false);
      resources.ResourceManager.load_texture('stormtrooper/m_body_specular', false);

      resources.ResourceManager.load_texture('stormtrooper/m_blaster_diffuse', false);
      resources.ResourceManager.load_texture('stormtrooper/m_blaster_metalness', false);
      resources.ResourceManager.load_texture('stormtrooper/m_blaster_normal', false);
      resources.ResourceManager.load_texture('stormtrooper/m_blaster_roughness', false);

      resources.ResourceManager.load_audio('effects/blaster/alt_fire', 'mp3');
      resources.ResourceManager.load_audio('effects/blaster/fire', 'mp3');
      resources.ResourceManager.load_audio('effects/blaster/hit_wall', 'mp3');
      resources.ResourceManager.load_audio('effects/blaster/reflect1', 'mp3');
      resources.ResourceManager.load_audio('effects/blaster/reflect2', 'mp3');
      resources.ResourceManager.load_audio('effects/blaster/reflect3', 'mp3');

      resources.ResourceManager.load_audio('effects/footsteps/boot1', 'wav');
      resources.ResourceManager.load_audio('effects/footsteps/boot2', 'wav');
      resources.ResourceManager.load_audio('effects/footsteps/boot3', 'wav');
      resources.ResourceManager.load_audio('effects/footsteps/boot4', 'wav');

      resources.ResourceManager.load_audio('effects/player/bodyfall_human1', 'mp3');
      resources.ResourceManager.load_audio('effects/player/bodyfall_human2', 'mp3');
      resources.ResourceManager.load_audio('effects/player/bodyfall_human3', 'mp3');
      resources.ResourceManager.load_audio('effects/player/death1', 'mp3');
      resources.ResourceManager.load_audio('effects/player/death2', 'mp3');
      resources.ResourceManager.load_audio('effects/player/death3', 'mp3');
      resources.ResourceManager.load_audio('effects/player/pain25', 'mp3');
      resources.ResourceManager.load_audio('effects/player/pain50', 'mp3');
      resources.ResourceManager.load_audio('effects/player/pain75', 'mp3');
      resources.ResourceManager.load_audio('effects/player/pain100', 'mp3');
      resources.ResourceManager.load_audio('effects/player/falling1', 'mp3');
      
      resources.ResourceManager.load_audio('effects/ambient/kejim_ext', 'wav');

      resources.ResourceManager.load_audio('effects/trooper/bodyfall_trooper1', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/bodyfall_trooper2', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/bodyfall_trooper3', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/bodyfall_trooper4', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/death1', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/death2', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/death3', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/pain25', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/pain50', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/pain75', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/pain100', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/victory1', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/victory2', 'mp3');
      resources.ResourceManager.load_audio('effects/trooper/type1/victory3', 'mp3');
      
      resources.ResourceManager.load_audio('effects/lightsaber/saberon', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhum4', 'wav');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup1', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup2', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup3', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup4', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup5', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup6', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup7', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup8', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhup9', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhit', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhit1', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhit2', 'mp3');
      resources.ResourceManager.load_audio('effects/lightsaber/saberhit3', 'mp3');
      
      resources.ResourceManager.load_audio('music/explore/impbaseb_explore', 'mp3');
      resources.ResourceManager.load_audio('music/action/impbaseb_action', 'mp3');
      resources.ResourceManager.load_audio('music/death_music', 'mp3');
    }

    async init_async()
    {
      let mesh_requests = [];
      mesh_requests.push(ASSET_ID_KYLE);
      mesh_requests.push(...new Array(NUM_ENEMIES).fill(ASSET_ID_ENEMY));

      // Wait for all the promises to resolve
      try
      {
        await resources.ResourceManager.create_skinned_model_cache(mesh_requests);

        log.info("Skinned mesh cache creation successful.");
      }
      catch (error)
      {
        log.error(`Error creating skinned mesh cache: ${error}`);
      }
    }

    // TODO: We should have a separate load screen for data init phase
    init()
    {
      resources.ResourceManager.reset_skinned_model_cache();

      /*
       * Setup entities
       */

      const directional_light_target = new THREE.Object3D();

      /** Singletons */ 
      let e_singletons = this.entity_manager_.create_entity("Singletons");
      
      const player_camera = new THREE.PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.01, 
        1000.0,
      );

      // RenderState
      if (env.DEBUG_MODE)
      {
        e_singletons.add_component(component_editor.EditorComponent);
        e_singletons.add_component(component_debug.DebugDrawer, { scene: this.scene_ });
      }
      e_singletons.add_component(component_input.InputComponent);
      e_singletons.add_component(component_physics.PhysicsState);
      e_singletons.add_component(component_renderer.RenderState, {
        scene: this.scene_,
        camera: player_camera,
      });
      e_singletons.add_component(component_lights.SceneLights, {
        scene: this.scene_,
        player: directional_light_target,
      });
      e_singletons.add_component(component_camera.PerspectiveCamera, {
        scene: this.scene_,
        camera: player_camera,
      });
      e_singletons.add_component(component_combat_manager.CombatManager);
      e_singletons.add_component(component_health.UI_HealthBar);
      e_singletons.add_component(component_game_menu.UI_GameMenu);
      const c_audio_listener = e_singletons.add_component(component_audio.AudioListenerComponent, {
        camera: player_camera,
      });

      if (env.DEBUG_MODE)
      {
        let c_physics_state = e_singletons.get_component("PhysicsState");
        c_physics_state.create_debug_drawer(this.scene_);
      }

      /** Game Entities */

      // Sky
      let e_sky = this.entity_manager_.create_entity("Sky");
      e_sky.add_component(component_mesh.StaticMeshComponent, {
        scene: this.scene_,
        model: resources.ResourceManager.get_static_model('skybox'),
        cast_shadow: false,
        receive_shadow: false,
      });

      // Level
      let e_level = this.entity_manager_.create_entity("Level");
      const c_level_mesh = e_level.add_component(component_mesh.StaticMeshComponent, {
        scene: this.scene_,
        model: resources.ResourceManager.get_static_model('level_01'),
        cast_shadow: true,
        receive_shadow: true,
      });
      e_level.add_component(component_navigation.NavMeshComponent, {
        scene: this.scene_,
        nav_mesh_id: 'NavMesh/level_01_wb_nav',
        mesh: c_level_mesh.mesh_
      });
      let i = 0;
      c_level_mesh.mesh_.traverse((c) => {
        if (c.name.startsWith("ColConcave_"))
        {
          c.visible = false;
          let e_level_col = this.entity_manager_.create_entity(`Level_Collider${i}`, e_level);
          let c_level_col_transform = e_level.get_component("Transform");
          let c_level_collider = e_level_col.add_component(component_physics.ConcaveMeshCollider, {
            transform: c_level_col_transform,
            physics_state: e_singletons.get_component("PhysicsState"),
            body_type: component_physics.eBodyType.BT_Static,
            mesh: c,
            mass: 0,
            traverse: false,
            collision_group: eCollisionGroup.CG_Default,
            collision_mask: eCollisionGroup.CG_All,
            is_contact_listener: false,
          });
          c_level_collider.set_friction(0.8);
          c_level_collider.set_rolling_friction(0.4);
          i += 1;
        }
        else if (c.name.startsWith("Col_Death"))
        {
          c.visible = false;
          let e_level_col = this.entity_manager_.create_entity(`Level_DeathTrigger`, e_level);
          let c_level_col_transform = e_level.get_component("Transform");
          e_level_col.add_component(component_physics.ConvexMeshTrigger, {
            transform: c_level_col_transform,
            physics_state: e_singletons.get_component("PhysicsState"),
            mesh: c,
            traverse: false,
            collision_group: eCollisionGroup.CG_Default,
            collision_mask: eCollisionGroup.CG_Player,
            is_contact_listener: false,
          });
          i += 1;
        }
        else if (c.name.startsWith("Col_"))
        {
          c.visible = false;
          let e_level_col = this.entity_manager_.create_entity(`Level_Collider${i}`, e_level);
          let c_level_col_transform = e_level.get_component("Transform");
          let c_level_collider = e_level_col.add_component(component_physics.ConvexMeshCollider, {
            transform: c_level_col_transform,
            physics_state: e_singletons.get_component("PhysicsState"),
            body_type: component_physics.eBodyType.BT_Static,
            mesh: c,
            mass: 0,
            traverse: false,
            collision_group: eCollisionGroup.CG_Default,
            collision_mask: eCollisionGroup.CG_All,
            is_contact_listener: false,
          });
          c_level_collider.set_friction(0.8);
          c_level_collider.set_rolling_friction(0.4);
          i += 1;
        }
      });
      const level_model_instanced = resources.ResourceManager.get_static_model('level_01_instanced', false);
      i = 0;
      for (const c of level_model_instanced.children[0].children)
      {
        let e_level_instanced = this.entity_manager_.create_entity(`Level_Instanced${i}`, e_level);
        let c_instanced_mesh = e_level_instanced.add_component(component_mesh.InstancedMeshComponent, {
          scene: this.scene_,
          model: c.clone(),
          cast_shadow: true,
          receive_shadow: true,
        });
        i += 1;
      }
      const level_model_dynamic_collider = resources.ResourceManager.get_static_model('level_01_dc', false);
      i = 0;
      const group = level_model_dynamic_collider.children[0].children[0];
      for (const c of group.children)
      {
        let e_level_object_dynamic = this.entity_manager_.create_entity(`Level_Object_Dynamic${i}`);
        let c_level_object_dynamic_transform = e_level_object_dynamic.get_component("Transform");
        c_level_object_dynamic_transform.position = c.position;
        c_level_object_dynamic_transform.rotation = c.quaternion;
        c_level_object_dynamic_transform.scale = c.scale;

        let mass = 0.0;
        let size = new THREE.Vector3(0.0, 0.0, 0.0);
        let friction = 1.0;
        let rolling_friction = 0.0;

        let impulse_magnitude = 10.0;
        let impulse_offset = new THREE.Vector3(0.0, 0.0, 0.0);

        if (c.name.startsWith("Flask"))
        {
          mass = 10.0;
          size.set(0.43, 1.45, 0.43);
          friction = 0.5;
          rolling_friction = 0.1;
          impulse_magnitude = 10.0;
          impulse_offset.set(0.5, 1.0, 0.0);
        }
        else if (c.name.startsWith("BarrelL"))
        {
          mass = 10.0;
          size.set(0.6, 1.125, 0.6);
          friction = 0.9;
          rolling_friction = 0.2;
          impulse_magnitude = 10.0;
          impulse_offset.set(0.5, 1.5, 0.0);
        }
        else if (c.name.startsWith("BarrelXL"))
        {
          mass = 12.0;
          size.set(0.7, 1.225, 0.7);
          friction = 0.9;
          rolling_friction = 0.2;
          impulse_magnitude = 10.0;
          impulse_offset.set(0.5, 2.5, 0.0);
        }

        let c_dynamic_collider = e_level_object_dynamic.add_component(component_physics.CylinderCollider, {
          physics_state: e_singletons.get_component("PhysicsState"),
          transform: c_level_object_dynamic_transform,
          mass: mass,
          size: size,
          body_type: component_physics.eBodyType.BT_Dynamic,
          collision_group: eCollisionGroup.CG_Default,
          collision_mask: eCollisionGroup.CG_All,
          is_contact_listener: false,
        });
        c_dynamic_collider.set_friction(friction);
        c_dynamic_collider.set_rolling_friction(rolling_friction);
        e_level_object_dynamic.add_component(component_interact.PushableComponent, {
          impulse_magnitude: impulse_magnitude,
          impulse_offset: impulse_offset,
        });

        let e_level_object_dynamic_mesh = this.entity_manager_.create_entity(`Level_Object_Dynamic_Mesh${i}`, e_level_object_dynamic);
        let c_level_object_dynamic_mesh_transform = e_level_object_dynamic_mesh.get_component("Transform");
        c_level_object_dynamic_mesh_transform.local_position = new THREE.Vector3(0.0, -(size.y/(2.0 * c.scale.y)), 0.0);
        e_level_object_dynamic_mesh.add_component(component_mesh.StaticMeshComponent, {
          scene: this.scene_,
          model: c.clone(),
          cast_shadow: true,
          receive_shadow: true,
        });

        i += 1;
      }

      // Player
      spawner.spawn_player(
        this.entity_manager_, 
        this.scene_, 
        directional_light_target, 
        new THREE.Vector3(-2.5, 0.0, 7.5), 
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, 0)),
        c_audio_listener.listener_
      );

      // Global Audio
      let e_audio_music = this.entity_manager_.create_entity("Audio_Music");
      e_audio_music.add_component(component_audio.AudioEmitterComponent, {
        listener: c_audio_listener.listener_,
        audio_key: 'explore',
        audio_lut: new Map([
          ['explore', resources.ResourceManager.get_audio('music/explore/impbaseb_explore')],
          ['action', resources.ResourceManager.get_audio('music/action/impbaseb_action')],
          ['death', resources.ResourceManager.get_audio('music/death_music')],
        ]),
        volume: 1.0,
        is_looping: true,
        autoplay: true,
      });

      let e_audio_ambient = this.entity_manager_.create_entity("Audio_Ambient");
      e_audio_ambient.add_component(component_audio.AudioEmitterComponent, {
        listener: c_audio_listener.listener_,
        audio_key: 'exterior',
        audio_lut: new Map([
          ['exterior', resources.ResourceManager.get_audio('effects/ambient/kejim_ext')],
        ]),
        volume: 0.25,
        is_looping: true,
        autoplay: true,
      });

      // Stormtrooper
      let face_diffuse_map = resources.ResourceManager.get_texture('stormtrooper/m_face_diffuse', false);
      let face_metalness_map = resources.ResourceManager.get_texture('stormtrooper/m_face_metalness', false);
      let face_normal_map = resources.ResourceManager.get_texture('stormtrooper/m_face_normal', false);
      let face_roughness_map = resources.ResourceManager.get_texture('stormtrooper/m_face_roughness', false);
      let face_specular_map = resources.ResourceManager.get_texture('stormtrooper/m_face_specular', false);

      let body_diffuse_map = resources.ResourceManager.get_texture('stormtrooper/m_body_diffuse', false);
      // body_diffuse_map.anisotropy = c_render_state.get_max_anisotropy();
      // body_diffuse_map.wrapS = THREE.RepeatWrapping;
      // body_diffuse_map.wrapT = THREE.RepeatWrapping;
      // body_diffuse_map.encoding = THREE.sRGBEncoding;
      let body_metalness_map = resources.ResourceManager.get_texture('stormtrooper/m_body_metalness', false);
      let body_normal_map = resources.ResourceManager.get_texture('stormtrooper/m_body_normal', false);
      let body_roughness_map = resources.ResourceManager.get_texture('stormtrooper/m_body_roughness', false);
      let body_specular_map = resources.ResourceManager.get_texture('stormtrooper/m_body_specular', false);

      let blaster_diffuse_map = resources.ResourceManager.get_texture('stormtrooper/m_blaster_diffuse', false);
      let blaster_metalness_map = resources.ResourceManager.get_texture('stormtrooper/m_blaster_metalness', false);
      let blaster_normal_map = resources.ResourceManager.get_texture('stormtrooper/m_blaster_normal', false);
      let blaster_roughness_map = resources.ResourceManager.get_texture('stormtrooper/m_blaster_roughness', false);

      const stormtrooper_material_head = new THREE.MeshPhysicalMaterial({
        map: face_diffuse_map,
        normalMap: face_normal_map,
        metalnessMap: face_metalness_map,
        roughnessMap: face_roughness_map,
        specularIntensityMap: face_specular_map,
      });

      const stormtrooper_material_body = new THREE.MeshPhysicalMaterial({
        map: body_diffuse_map,
        normalMap: body_normal_map,
        metalnessMap: body_metalness_map,
        roughnessMap: body_roughness_map,
        specularIntensityMap: body_specular_map,
      });

      const stormtrooper_material_blaster = new THREE.MeshStandardMaterial({
        map: blaster_diffuse_map,
        normalMap: blaster_normal_map,
        metalnessMap: blaster_metalness_map,
        roughnessMap: blaster_roughness_map,
      });

      const stormtrooper_materials = {
        head: stormtrooper_material_head,
        body: stormtrooper_material_body,
        blaster: stormtrooper_material_blaster,
      };

      const enemy_spawns = [
        {
          position: new THREE.Vector3(-15.5, 0.0, -45.0),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 1.15, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
        {
          position: new THREE.Vector3(-13.0, 0.0, -44.4),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 0.8, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
        {
          position: new THREE.Vector3(1.0, 0.0, -33.5),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper02,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            path: [
              new THREE.Vector3(1.0, 0.0, -70.0),
              new THREE.Vector3(1.0, 0.0, -33.5),
            ],
          },
        },
        {
          position: new THREE.Vector3(-0.45, 0.0, -31.25),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 0.75, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
        {
          position: new THREE.Vector3(8.85, 0.0, -66.1),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
        {
          position: new THREE.Vector3(9.6, 0.0, -68.2),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
        {
          position: new THREE.Vector3(10.65, 0.0, -66.05),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
        {
          position: new THREE.Vector3(11.35, 0.0, -69.23),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
        {
          position: new THREE.Vector3(12.25, 0.0, -67.6),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
        {
          position: new THREE.Vector3(13.6, 0.0, -69.2),
          rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI * 0.5, 0)),
          behavior_id: eBehaviorID.BID_Stormtrooper01,
          behavior_params: {
            distance_danger: 3.0,
            distance_follow: 12.0,
            animation_param_id: "idle",
          },
        },
      ];

      for (let i = 0; i < enemy_spawns.length; ++i)
      {
        const { position, rotation, behavior_id, behavior_params } = enemy_spawns[i];
        spawner.spawn_enemy(
          this.entity_manager_, 
          this.scene_, 
          stormtrooper_materials, 
          position,
          rotation,
          "Stormtrooper" + i,
          behavior_id,
          behavior_params,
          c_audio_listener.listener_,
        );
      }

      /*
       * Setup systems
       */
      this.entity_manager_.register_system(system_game_state.GameStateSystem);
      this.entity_manager_.register_system(system_audio.AudioSystem);
      this.entity_manager_.register_system(system_input.InputSystem);
      this.entity_manager_.register_system(system_player_behavior.PlayerBehaviorSystem);
      this.entity_manager_.register_system(system_player_movement.PlayerMovementSystem);
      this.entity_manager_.register_system(system_enemy_behavior.EnemyBehaviorSystem);
      this.entity_manager_.register_system(system_enemy_movement.EnemyMovementSystem);
      this.entity_manager_.register_system(system_physics.PhysicsSystem);
      this.entity_manager_.register_system(system_camera.CameraController);
      this.entity_manager_.register_system(system_interact.InteractionSystem);
      this.entity_manager_.register_system(system_animation.AnimationSystem);
      this.entity_manager_.register_system(system_renderer.RenderSystem);

      /*
       * Init ECS
       */
      this.entity_manager_.init();
      this.entity_manager_.post_init();
    }

    destroy()
    {
      this.entity_manager_.destroy();

      this.scene_.clear();
    }

    pre_update()
    {
      this.entity_manager_.pre_update();
    }

    fixed_update(fixed_delta_time_s)
    {
      this.entity_manager_.fixed_update(fixed_delta_time_s);
    }

    update(delta_time_s)
    {
      this.entity_manager_.update(delta_time_s);
    }
    
    late_update(delta_time_s)
    {
      this.entity_manager_.late_update(delta_time_s);
    }
  };

  return {
    World: World,
  };

})();
