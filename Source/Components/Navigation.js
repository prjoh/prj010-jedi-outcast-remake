import * as THREE from 'three';

import { env } from '../Env';
import { RC_MAX_PATH_LENGTH } from '../Config';
import { ecs_component } from '../ECS/Component';
import { resources } from '../ResourceManager';

import { NavMeshQuery, importNavMesh } from 'recast-navigation';
import { NavMeshHelper } from 'recast-navigation/three';
import { log } from '../Log';
import { assert } from '../Assert';
import { component_editor } from './Editor';

export const component_navigation = (() => {

  class NavMeshWaypoint
  {
    constructor()
    {
      this.position = new THREE.Vector3(0.0, 0.0, 0.0);
      this.is_endpoint = false;
    }
  };

  class NavAgentComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'NavAgentComponent';

    static editor_initialized = false;
    static draw_nav_agent = false;
    static debug_meshes = [];

    get NAME() {
      return NavAgentComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.height = params.agent_height;
      this.radius = params.agent_radius;

      this.path_ = null;
      this.path_index_ = 0;
      this.waypoint = new NavMeshWaypoint();

      // this.direction_buffer = new THREE.Vector3();
      // this.speed = 0.8;
      // this.waypoint_threshold = Math.pow(0.25, 2);

      this.debug_path_geometry_ = null;

      if (env.DEBUG_MODE)
      {
        const geometry = new THREE.CapsuleGeometry( this.radius, this.height - this.radius * 2.0, 4, 16 ); 
        const material = new THREE.MeshBasicMaterial( {color: 0xf58742, wireframe: true} ); 
        this.debug_mesh_ = new THREE.Mesh( geometry, material );

        params.scene.add(this.debug_mesh_);

        this.debug_path_geometry_ = new THREE.BufferGeometry();
        this.debug_path_vertices_ = new Float32Array( RC_MAX_PATH_LENGTH * 3 ); // 3 vertices per point
        this.debug_path_geometry_.setAttribute( 'position', new THREE.BufferAttribute( this.debug_path_vertices_, 3 ) );
        this.debug_path_geometry_.setDrawRange( 0, 0 );
        this.debug_path_index_ = 0;

        const path_material = new THREE.LineBasicMaterial( { color: 'magenta' } );
        let debug_path = new THREE.Line( this.debug_path_geometry_,  path_material );
        debug_path.frustumCulled = false;

        params.scene.add(debug_path);
      
        NavAgentComponent.debug_meshes.push(this.debug_mesh_);
        NavAgentComponent.debug_meshes.push(debug_path);

        this.debug_mesh_.visible = NavAgentComponent.draw_nav_agent;
        debug_path.visible = NavAgentComponent.draw_nav_agent;
      }
    }

    destroy()
    {
      if (env.DEBUG_MODE)
      {
        for (let mesh of NavAgentComponent.debug_meshes)
        {
          mesh.material.dispose();
          mesh.geometry.dispose();
        }

        NavAgentComponent.debug_meshes = [];
        NavAgentComponent.editor_initialized = false;
        NavAgentComponent.draw_ai_behaviors = false;
      }

      super.destroy();
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE && NavAgentComponent.editor_initialized === false)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
    
        let c_editor = e_singletons.get_component("EditorComponent");
  
        let debug_draw_page = c_editor.get_page(component_editor.eEditorPage.EP_DebugDraw);

        debug_draw_page.add_binding(NavAgentComponent, 'draw_nav_agent', "NavAgent", null, (value) => {
          for (let mesh of NavAgentComponent.debug_meshes)
          {
            mesh.visible = value;
          }
        });

        NavAgentComponent.editor_initialized = true;
      }
    }

    acquire_path(path)
    {
      this.path_ = path;
      this.path_index_ = 0;

      assert(this.path_ !== null, "Tried to get waypoint from null path!");
      assert(this.path_index_ < this.path_.length, "Out-of-bounds path index!");

      const position = this.path_[this.path_index_];
      this.waypoint.position.x = position.x;
      this.waypoint.position.y = position.y - 0.1; // TODO: HACK
      this.waypoint.position.z = position.z;
      this.waypoint.is_endpoint = this.path_index_ === (this.path_.length - 1);

      if (env.DEBUG_MODE)
      {
        if (this.path_.length >= RC_MAX_PATH_LENGTH)
        {
          log.error(`Maximum path length of ${RC_MAX_PATH_LENGTH} reached. Increase limit!`);
          return;
        }

        for (let i = 0; i < this.path_.length; ++i)
        {
          this.debug_path_vertices_[i * 3] = this.path_[i].x;
          this.debug_path_vertices_[i * 3 + 1] = this.path_[i].y;
          this.debug_path_vertices_[i * 3 + 2] = this.path_[i].z;
        }

        this.debug_path_geometry_.setDrawRange( 0, this.path_.length );
        this.debug_path_geometry_.attributes.position.needsUpdate = true;
      }
    }

    reset_path()
    {
      this.path_ = null;
      this.path_index_ = 0;
    }

    set_next_waypoint()
    {
      assert(this.path_ !== null, "Tried to get waypoint from null path!");

      this.path_index_ += 1;

      assert(this.path_index_ < this.path_.length, "Out-of-bounds path index!");

      const position = this.path_[this.path_index_];
      this.waypoint.position.x = position.x;
      this.waypoint.position.y = position.y - 0.1; // TODO: HACK
      this.waypoint.position.z = position.z;
      this.waypoint.is_endpoint = this.path_index_ === (this.path_.length - 1);
    }
  };

  class NavMeshComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'NavMeshComponent';

    static editor_initialized = false;
    static draw_nav_mesh = false;
    static debug_meshes = [];

    get NAME() {
      return NavMeshComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      const nav_mesh_bin = resources.ResourceManager.get_binary_data(params.nav_mesh_id);
      const import_result = importNavMesh(nav_mesh_bin);
      this.nav_mesh = import_result.navMesh;

      // NavMeshHelper
      if (env.DEBUG_MODE)
      {
        const nav_mesh_mat = new THREE.MeshBasicMaterial({
          color: 'green',
          transparent: true,
          opacity: 0.35,
        });
        const nav_mesh_mat2 = new THREE.MeshBasicMaterial({
          color: 'green',
          wireframe: true,
        });
        let debug_nav_mesh = new NavMeshHelper({
          navMesh: this.nav_mesh,
          navMeshMaterial: nav_mesh_mat,
        });
        let debug_nav_mesh2 = new NavMeshHelper({
          navMesh: this.nav_mesh,
          navMeshMaterial: nav_mesh_mat2,
        });

        // update the helper when the navmesh changes
        // nav_mesh_debug.update();

        params.scene.add(debug_nav_mesh);
        params.scene.add(debug_nav_mesh2);

        debug_nav_mesh.visible = NavMeshComponent.draw_nav_mesh;
        debug_nav_mesh2.visible = NavMeshComponent.draw_nav_mesh;

        NavMeshComponent.debug_meshes.push(debug_nav_mesh);
        NavMeshComponent.debug_meshes.push(debug_nav_mesh2);
      }

      // this.nav_mesh_query_pool_ = new NavMeshQueryPool(this.nav_mesh, RC_QUERY_POOL_SIZE);
      this.nav_mesh_query_ = new NavMeshQuery(this.nav_mesh);
    }

    destroy()
    {
      if (env.DEBUG_MODE)
      {
        for (let mesh of NavMeshComponent.debug_meshes)
        {
          mesh.geometry.dispose();
          mesh.mesh.geometry.dispose();
          mesh.mesh.material.dispose();
        }

        NavMeshComponent.debug_meshes = [];
        NavMeshComponent.editor_initialized = false;
        NavMeshComponent.draw_ai_behaviors = false;
      }

      this.nav_mesh.destroy();

      super.destroy();
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE && NavMeshComponent.editor_initialized === false)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
    
        let c_editor = e_singletons.get_component("EditorComponent");
  
        let debug_draw_page = c_editor.get_page(component_editor.eEditorPage.EP_DebugDraw);

        debug_draw_page.add_binding(NavMeshComponent, 'draw_nav_mesh', "NavMesh", null, (value) => {
          for (let mesh of NavMeshComponent.debug_meshes)
          {
            mesh.visible = value;
          }
        });

        NavMeshComponent.editor_initialized = true;
      }
    }

    find_path(from_world, to_world)
    {
      const start = this.find_closest_point(from_world);
      const end = this.find_closest_point(to_world);
      const { success, error, path } = this.nav_mesh_query_.computePath(start, end);

      if (success === false)
      {
        log.error(error);
      }
      
      return path;
    }

    find_closest_point(position_world)
    {
      const position = { x: position_world.x, y: position_world.y, z: position_world.z };
      const { success, status, point, polyRef, isPointOverPoly } = this.nav_mesh_query_.findClosestPoint(position);

      if (success === false)
      {
        log.error("Failed to find closest point.");
      }

      return point;
    }

    find_random_point_circle(position, radius)
    {
      const attempts = 10;

      for (let i = 0; i < attempts; ++i)
      {
        const p = this.find_closest_point(position);
        const { success, status, randomPolyRef, randomPoint } = this.nav_mesh_query_.findRandomPointAroundCircle(p, radius);
        
        if (success === false)
        {
          log.error("Failed to find closest point.");
          continue;
        }

        const check_radius = (p1, p2, r) => {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dz = p2.z - p1.z;
          const distanceSquared = dx * dx + dy * dy + dz * dz;
          const radiusSquared = r * r;
          return distanceSquared <= radiusSquared;
        };

        if (check_radius(p, randomPoint, radius) === false)
        {
          continue;
        }

        return { success: true, point: randomPoint };
      }
      
      return { success: false, point: null };
    }
  };

  return {
    NavMeshComponent: NavMeshComponent,
    NavAgentComponent: NavAgentComponent,
  };

})();
