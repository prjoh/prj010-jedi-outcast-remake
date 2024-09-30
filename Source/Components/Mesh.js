import * as THREE from 'three';

import { resources } from '../ResourceManager';

import { ecs_component } from '../ECS/Component';
import { env } from '../Env';
import { assert } from '../Assert';
import { component_editor } from './Editor';

export const component_mesh = (() => {

  function setup_shadows(root, cast_shadow, receive_shadow)
  {
    root.traverse((c) => {
      c.receiveShadow = receive_shadow;
      c.castShadow = cast_shadow;
    });
  }

  class InstancedMeshComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'InstancedMeshComponent';

    static editor_initialized = false;
    static draw_instanced = false;
    static debug_meshes = [];

    get NAME() {
      return InstancedMeshComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene_ = params.scene;

      assert(params.model && params.model.children.length > 0, "No model children detected for instance creation.");

      this.geometry_ = params.model.children[0].geometry;
      this.material_ = params.model.children[0].material;
      this.instance_count = params.model.children.length;
      this.instanced_mesh_ = new THREE.InstancedMesh(this.geometry_, this.material_, this.instance_count);
      this.instance_positions = [];
      this.bounding_sphere_radius = 0.0;

      // if (params.bounding_radius)
      // {
      //   this.bounding_sphere_radius = params.bounding_radius;
      // }
      // else
      // {
      this.geometry_.computeBoundingSphere();
      this.bounding_sphere_radius = this.geometry_.boundingSphere.radius;
      // }

      let i = 0;
      params.model.traverse((c) => {
        if (c.geometry)
        {
          c.updateWorldMatrix(true);
          this.instanced_mesh_.setMatrixAt(i, c.matrixWorld);
          this.instance_positions.push(new THREE.Vector3().copy(c.position));
          i += 1;
        }
      });

      this.instanced_mesh_.computeBoundingSphere();
      this.scene_.add( this.instanced_mesh_ );

      setup_shadows(this.instanced_mesh_, params.cast_shadow, params.receive_shadow);

      if (env.DEBUG_MODE)
      {
        for (let i = 0; i < this.instance_count; ++i)
        {
          const geometry = new THREE.SphereGeometry( this.bounding_sphere_radius, 16, 8 ); 
          const material = new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: true } ); 
          let sphere = new THREE.Mesh( geometry, material );
          sphere.position.copy(this.instance_positions[i]);
          InstancedMeshComponent.debug_meshes.push(sphere);
          sphere.visible = InstancedMeshComponent.draw_instanced;
          this.scene_.add(sphere);
        }
      }
    }   

    get matrix_array()
    {
      return this.instanced_mesh_.instanceMatrix.array;
    }

    destroy()
    {
      if (env.DEBUG_MODE)
      {
        for (let mesh of InstancedMeshComponent.debug_meshes)
        {
          mesh.material.dispose();
          mesh.geometry.dispose();
        }

        InstancedMeshComponent.debug_meshes = [];
        InstancedMeshComponent.editor_initialized = false;
        InstancedMeshComponent.draw_ai_behaviors = false;
      }

      this.geometry_.dispose();
      this.material_.dispose();
      this.instanced_mesh_.dispose();

      super.destroy();
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE && InstancedMeshComponent.editor_initialized === false)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
    
        let c_editor = e_singletons.get_component("EditorComponent");
  
        let debug_draw_page = c_editor.get_page(component_editor.eEditorPage.EP_DebugDraw);

        debug_draw_page.add_binding(InstancedMeshComponent, 'draw_instanced', "Instanced", null, (value) => {
          for (let mesh of InstancedMeshComponent.debug_meshes)
          {
            mesh.visible = value;
          }
        });

        InstancedMeshComponent.editor_initialized = true;
      }
    }

    set_draw_count(count)
    {
      // We need to update bounding sphere whenever setMatrixAt is called
      this.instanced_mesh_.computeBoundingSphere();
      this.instanced_mesh_.count = count;
      this.instanced_mesh_.instanceMatrix.needsUpdate = true;
    }
  };

  class StaticMeshComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'StaticMeshComponent';

    get NAME() {
      return StaticMeshComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene_ = params.scene;
      this.mesh_ = params.model;

      this.scene_.add( this.mesh_ );

      setup_shadows(this.mesh_, params.cast_shadow, params.receive_shadow);
    }

    destroy()
    {
      this.mesh_.traverse((c) => {
        if (c.material)
        {
          c.material.dispose();
        }
        if (c.geometry)
        {
          c.geometry.dispose();
        }
      });

      super.destroy();
    }

    set_transform(t)
    {
      if (this.mesh_ === null) return;
      this.mesh_.position.copy(t.position);
      this.mesh_.quaternion.copy(t.rotation);
      this.mesh_.scale.copy(t.scale);
    }
  };

  class SkinnedMeshComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'SkinnedMeshComponent';

    get NAME() {
      return SkinnedMeshComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene_ = params.scene;

      this.mesh_ = params.model;

      this.scene_.add( this.mesh_ );

      setup_shadows(this.mesh_, params.cast_shadow, params.receive_shadow);

      // // TODO
      // this.bone_ = null;
    }

    destroy()
    {
      this.mesh_.traverse((c) => {
        if (c.material)
        {
          c.material.dispose();
        }
        if (c.geometry)
        {
          c.geometry.dispose();
        }
      });

      super.destroy();
    }

    find_child(name)
    {
      let child = null;
      this.mesh_.traverse((c) => {
        if (c.name === name)
        {
          child = c;
          return;
        }
      });
      return child;
    }

    set_transform(t)
    {
      if (this.mesh_ === null) return;
      this.mesh_.position.copy(t.position);
      this.mesh_.quaternion.copy(t.rotation);
      this.mesh_.scale.copy(t.scale);
    }

    setup_kyle()
    {
        const kyle_belt_rgb_map = resources.ResourceManager.get_texture('kyle/Kyle_Clothes_Belt_OcclusionRoughnessMetallic', false);
        const kyle_boots_rgb_map = resources.ResourceManager.get_texture('kyle/Kyle_Clothes_Boots_OcclusionRoughnessMetallic', false);
        const kyle_gauntlets_rgb_map = resources.ResourceManager.get_texture('kyle/Kyle_Clothes_Gauntlets_OcclusionRoughnessMetallic', false);
        const kyle_pants_rgb_map = resources.ResourceManager.get_texture('kyle/Kyle_Clothes_Pants_OcclusionRoughnessMetallic', false);
        const kyle_pauldron_rgb_map = resources.ResourceManager.get_texture('kyle/Kyle_Clothes_Pauldron_OcclusionRoughnessMetallic', false);
        const kyle_shirt_rgb_map = resources.ResourceManager.get_texture('kyle/Kyle_Clothes_Shirt_OcclusionRoughnessMetallic', false);
        const kyle_tshirt_rgb_map = resources.ResourceManager.get_texture('kyle/Kyle_Clothes_Tshirt_OcclusionRoughnessMetallic', false);

        this.mesh_.traverse((o) => {
          // // TODO: Debug
          // if (o.name === "P1_low_Cylinder008")
          // {
          //   this.bone_ = o;
          // }

          switch(o.name)
          {
            case "Belt":
              o.material.aoMap = kyle_belt_rgb_map;
              o.material.metalnessMap = kyle_belt_rgb_map;
              o.material.roughnessMap = kyle_belt_rgb_map;
              o.material.roughness = 1.0;
              break;
            case "Belt_Holster":
              o.material.aoMap = kyle_belt_rgb_map;
              o.material.metalnessMap = kyle_belt_rgb_map;
              o.material.roughnessMap = kyle_belt_rgb_map;
              o.material.roughness = 1.0;
              break;
            case "Boots":
              o.material.aoMap = kyle_boots_rgb_map;
              o.material.metalnessMap = kyle_boots_rgb_map;
              o.material.roughnessMap = kyle_boots_rgb_map;
              o.material.roughness = 1.0;
              break;
            case "Gauntlets":
              o.material.aoMap = kyle_gauntlets_rgb_map;
              o.material.metalnessMap = kyle_gauntlets_rgb_map;
              o.material.roughnessMap = kyle_gauntlets_rgb_map;
              o.material.roughness = 1.0;
              break;
            case "Pants":
              o.material.aoMap = kyle_pants_rgb_map;
              o.material.metalnessMap = kyle_pants_rgb_map;
              o.material.roughnessMap = kyle_pants_rgb_map;
              o.material.roughness = 0.9;
              break;
            case "Pouldron":
              o.material.aoMap = kyle_pauldron_rgb_map;
              o.material.metalnessMap = kyle_pauldron_rgb_map;
              o.material.roughnessMap = kyle_pauldron_rgb_map;
              o.material.roughness = 0.7;
              break;
            case "Shirt":
              o.material.aoMap = kyle_shirt_rgb_map;
              o.material.metalnessMap = kyle_shirt_rgb_map;
              o.material.roughnessMap = kyle_shirt_rgb_map;
              o.material.roughness = 0.65;
              break;
            case "TShirt":
              o.material.aoMap = kyle_tshirt_rgb_map;
              o.material.metalnessMap = kyle_tshirt_rgb_map;
              o.material.roughnessMap = kyle_tshirt_rgb_map;
              break;
          }
        });
    }

    setup_stormtrooper(materials)
    {
      this.mesh_.traverse((o) => {
        // o.receiveShadow = false;
        switch(o.name)
        {
          case "TrooperHead":
            o.material = materials.head;
            break;
          case "TrooperBody":
            o.material = materials.body;
            break;
          case "BlasterBody":
            o.material = materials.blaster;
        }
      });
    }
  };

  return {
    SkinnedMeshComponent: SkinnedMeshComponent,
    StaticMeshComponent: StaticMeshComponent,
    InstancedMeshComponent: InstancedMeshComponent,
  };

})();
