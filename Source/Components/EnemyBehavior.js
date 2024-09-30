import * as THREE from 'three';
import { ecs_component } from '../ECS/Component';
import { EnemyBehaviorFactory } from '../Enemy/EnemyBehaviorFactory';
import { env } from '../Env';
import { component_editor } from './Editor';
import { Goal_CombatMoveAttackPosition } from '../Enemy/Goal/Goal_CombatMoveAttackPosition';


export const component_enemy_behavior = (() => {

  class EnemyBehaviorComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'EnemyBehaviorComponent';

    static editor_initialized = false;
    static draw_ai_behaviors = false;
    static debug_meshes = [];

    get NAME() {
      return EnemyBehaviorComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.behavior_id_ = params.behavior_id;
      this.behavior_params_ = params.behavior_params;

      this.behavior = null;

      if (env.DEBUG_MODE)
      {
        this.debug_mesh_ = new THREE.Mesh(
          new THREE.CircleGeometry( this.behavior_params_.distance_danger, 32 ),
          new THREE.MeshBasicMaterial( { color: 0xff00ff, opacity: 0.15, transparent: true } )
        );
        this.debug_mesh_.rotateX(THREE.MathUtils.DEG2RAD * -90.0);
  
        this.debug_mesh2_ = new THREE.Mesh(
          new THREE.CircleGeometry( this.behavior_params_.distance_follow, 32 ),
          new THREE.MeshBasicMaterial( { color: 0x00ff00, opacity: 0.15, transparent: true } )
        );
        this.debug_mesh2_.rotateX(THREE.MathUtils.DEG2RAD * -90.0);
  
        this.debug_mesh_behavior_state_ = new THREE.Mesh(
          new THREE.SphereGeometry( 0.2, 8, 8 ),
          new THREE.MeshBasicMaterial( { color: 0xffffff } )
        );
  
        // TODO: Add debug spheres for finding optimal attack position
        this.debug_random_positions_ = [];
        for (let i = 0; i < Goal_CombatMoveAttackPosition.k_num_of_points; ++i)
        {
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry( 0.2, 8, 8 ),
            new THREE.MeshBasicMaterial( { color: 0xffffff } )
          );
          this.debug_random_positions_.push(mesh);

          params.scene.add(mesh);
        
          EnemyBehaviorComponent.debug_meshes.push( mesh );
        }

        params.scene.add( this.debug_mesh_ );
        params.scene.add( this.debug_mesh2_ );
        params.scene.add( this.debug_mesh_behavior_state_ );

        EnemyBehaviorComponent.debug_meshes.push( this.debug_mesh_ );
        EnemyBehaviorComponent.debug_meshes.push( this.debug_mesh2_ );
        EnemyBehaviorComponent.debug_meshes.push( this.debug_mesh_behavior_state_ );

        for (let mesh of EnemyBehaviorComponent.debug_meshes)
        {
          mesh.visible = EnemyBehaviorComponent.draw_ai_behaviors;
        }
      }
    }

    destroy()
    {
      if (env.DEBUG_MODE)
      {
        for (let mesh of EnemyBehaviorComponent.debug_meshes)
        {
          mesh.material.dispose();
          mesh.geometry.dispose();
        }

        EnemyBehaviorComponent.debug_meshes = [];
        EnemyBehaviorComponent.editor_initialized = false;
        EnemyBehaviorComponent.draw_ai_behaviors = false;
      }

      super.destroy();
    }

    on_initialized()
    {
      super.on_initialized();

      this.behavior = EnemyBehaviorFactory.create(this.behavior_id_, this.entity, this.behavior_params_);

      if (env.DEBUG_MODE && EnemyBehaviorComponent.editor_initialized === false)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
    
        let c_editor = e_singletons.get_component("EditorComponent");
  
        let debug_draw_page = c_editor.get_page(component_editor.eEditorPage.EP_DebugDraw);

        debug_draw_page.add_binding(EnemyBehaviorComponent, 'draw_ai_behaviors', "AIBehaviors", null, (value) => {
          for (let mesh of EnemyBehaviorComponent.debug_meshes)
          {
            mesh.visible = value;
          }
        });

        EnemyBehaviorComponent.editor_initialized = true;
      }
    }
  };

  return {
    EnemyBehaviorComponent: EnemyBehaviorComponent,
  };

})();
