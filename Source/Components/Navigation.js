import * as THREE from 'three';

import { env } from '../Env';
import { RC_MAX_PATH_LENGTH } from '../Config';
import { ecs_component } from '../ECS/Component';
import { resources } from '../ResourceManager';

import { NavMeshQuery, importNavMesh } from 'recast-navigation';
import { NavMeshHelper } from 'recast-navigation/three';
import { log } from '../Log';
import { assert } from '../Assert';

export const component_navigation = (() => {

  // class NavMeshQueryObject
  // {
  //   constructor(pool, nav_mesh, handle)
  //   {
  //       this.query_ = new NavMeshQuery(nav_mesh);
  //       this.pool_ = pool;
  //       this.is_active_ = false;
  //       this.handle_ = handle;
  //       this.next_ = handle + 1;
  //   }
  // }

  // class NavMeshQueryPool
  // {
  //     constructor(nav_mesh, size)
  //     {
  //         this.available_query_ = 0;
  //         this.num_active_ = 0;
  //         this.pool_size_ = size;
  //         this.queries_ = new Array(size).fill(new NavMeshQueryObject(this, nav_mesh));

  //         for (let i = 0; i < this.pool_size_; ++i)
  //         {
  //             this.queries_.push(new NavMeshQueryObject(this, nav_mesh, i));
  //         }
  //     }

  //     create()
  //     {
  //         if (this.available_query_ >= this.pool_size_)
  //         {
  //             throw new Error("Overflow when creating pooled object. Increase size.");
  //         }

  //         this.num_active_ += 1;

  //         const query = this.queries_[this.available_query_];
  //         this.available_query_ = query.next_;
  //         query.is_active_ = true;

  //         return query;
  //     }

  //     destroy(query)
  //     {
  //         query.next_ = this.available_query_;
  //         query.is_active_ = false;
  //         this.available_query_ = query.handle_;
  //         this.num_active_ -= 1;
  //     }

  //     clear()
  //     {
  //         this.num_active_ = 0;
  //         this.available_query_ = 0;

  //         for (let i = 0; i < this.pool_size_; ++i)
  //         {
  //             this.queries_[i].next_ = i + 1;
  //             this.queries_[i].is_active_ = false;
  //         }
  //     }
  // }

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

      this.debug_mesh_ = null;
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
        this.debug_path_ = new THREE.Line( this.debug_path_geometry_,  path_material );
        this.debug_path_.frustumCulled = false;

        params.scene.add(this.debug_path_);
      }
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
      
        let c_debug = e_singletons.get_component("DebugComponent");
  
        c_debug.debug_nav_agents.push(this.debug_mesh_);
        c_debug.debug_nav_agents.push(this.debug_path_);
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
      this.waypoint.position.y = position.y;
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
      this.waypoint.position.y = position.y;
      this.waypoint.position.z = position.z;
      this.waypoint.is_endpoint = this.path_index_ === (this.path_.length - 1);
    }
  };

  class NavMeshComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'NavMeshComponent';

    get NAME() {
      return NavMeshComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      const nav_mesh_bin = resources.ResourceManager.get_binary_data(params.nav_mesh_id);
      const import_result = importNavMesh(nav_mesh_bin);
      this.nav_mesh = import_result.navMesh;

      this.debug_nav_mesh = null;
      this.debug_nav_mesh2 = null;

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
        this.debug_nav_mesh = new NavMeshHelper({
          navMesh: this.nav_mesh,
          navMeshMaterial: nav_mesh_mat,
        });
        this.debug_nav_mesh2 = new NavMeshHelper({
          navMesh: this.nav_mesh,
          navMeshMaterial: nav_mesh_mat2,
        });
        params.scene.add(this.debug_nav_mesh);
        params.scene.add(this.debug_nav_mesh2);

        // update the helper when the navmesh changes
        // nav_mesh_debug.update();
      }

      // this.nav_mesh_query_pool_ = new NavMeshQueryPool(this.nav_mesh, RC_QUERY_POOL_SIZE);
      this.nav_mesh_query_ = new NavMeshQuery(this.nav_mesh);
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
      
        let c_debug = e_singletons.get_component("DebugComponent");
  
        c_debug.debug_nav_meshes.push(this.debug_nav_mesh);
        c_debug.debug_nav_meshes.push(this.debug_nav_mesh2);
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
  };

  return {
    NavMeshComponent: NavMeshComponent,
    NavAgentComponent: NavAgentComponent,
  };

})();
