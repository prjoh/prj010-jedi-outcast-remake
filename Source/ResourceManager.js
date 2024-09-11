import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { log } from './Log';
import { assert } from './Assert';
import { env } from './Env';



export const resources = (() => {

  const BASE_PATH = env.BASE_PATH;

  class SkinnedMeshCache
  {
    constructor(resource_manager)
    {
      this.resource_manager_ = resource_manager;
      this.mesh_instances_ = new Map();
    }

    async create(mesh_requests)
    {
      const init_skinned_mesh = (mesh_id) => {
        return new Promise((resolve, reject) => {
          resources.ResourceManager.get_skinned_model(mesh_id, (content) => {
            resolve(content);
          });
        });
      };

      const mesh_promises = mesh_requests.map(mesh_id => init_skinned_mesh(mesh_id)); // Create an array of promises

      // Wait for all the promises to resolve
      try
      {
        const keys = mesh_requests;
        const values = await Promise.all(mesh_promises);

        for (let i = 0; i < mesh_requests.length; ++i)
        {
          const k = keys[i];
          const v = values[i];

          if (this.mesh_instances_.has(k))
          {
            this.mesh_instances_.get(k).instances.push(v);
          }
          else
          {
            this.mesh_instances_.set(
              k, 
              {
                index: 0,
                instances: [v],
              }
            );
          }
        }
      }
      catch (error)
      {
        log.error(`Error loading files: ${error}`);
      }
    }

    get_instance(model_id)
    {
      const instances_object = this.mesh_instances_.get(model_id);

      if (instances_object === undefined)
      {
        log.error(`No entry found for '${model_id}'.`);
        return null;
      }

      assert(instances_object.index < instances_object.instances.length, `No free instance available for '${model_id}'. Please increase in config!`);

      const instance = instances_object.instances[instances_object.index];

      instances_object.index += 1;

      return instance;
    }
  }

  class ResourceManager
  {
    static loading_manager_ = new THREE.LoadingManager();

    static on_start_cb_ = (url, loaded, total) => {};
    static on_load_cb_ = () => {};
    static on_progress_cb_ = (url, loaded, total) => {};
    static on_error_cb_ = (url) => {};

    static loaded_binaries_ = {};
    static loaded_textures_ = {};
    static loaded_skinned_models_ = {};
    static loaded_static_models_ = {};
    static loaded_cube_maps_ = {};
    // static loaded_animations_ = {};

    static skinned_mesh_cache_ = new SkinnedMeshCache(this);

    static init(on_start_cb, on_progress_cb, on_load_cb, on_error_cb)
    {
      this.loading_manager_.onStart = on_start_cb ? on_start_cb : this.on_start_cb_;
      this.loading_manager_.onProgress = on_progress_cb ? on_progress_cb : this.on_progress_cb_;
      this.loading_manager_.onLoad = on_load_cb ? on_load_cb : this.on_load_cb_;
      this.loading_manager_.onError = on_error_cb ? on_error_cb : this.on_error_cb_;
    }

    static load_binary_file(resource_key)
    {
      if (resource_key in this.loaded_binaries_)
      {
        return;
      }

      const path = `${BASE_PATH}${resource_key}.bin`;

      this.loading_manager_.itemStart( path );

      const loader = new THREE.FileLoader( this.loading_manager_ );

      loader.setPath( "" );
      loader.setResponseType( 'arraybuffer' );
      loader.setRequestHeader( loader.requestHeader );
      loader.setWithCredentials( false );

      loader.load( path, ( data ) => {

        const byte_array = new Uint8Array(data);

        this.loaded_binaries_[resource_key] = byte_array;

        this.loading_manager_.itemEnd( path );

      });
    }

    static load_texture(resource_key, flipY = true)
    {
      if (resource_key in this.loaded_textures_)
      {
        return;
      }

      const path = `${BASE_PATH}Textures/${resource_key}.png`;
      const loader = new THREE.TextureLoader(this.loading_manager_);
      
      loader.load(path, (texture) => {
        this.loaded_textures_[resource_key] = texture;
        this.loaded_textures_[resource_key].flipY = flipY;
      });
    }

    static load_cube_map(resource_key)
    {
      if (resource_key in this.loaded_cube_maps_)
      {
        return;
      }

      const urls = [
        `${BASE_PATH}Textures/${resource_key}/px.png`,
        `${BASE_PATH}Textures/${resource_key}/nx.png`,
        `${BASE_PATH}Textures/${resource_key}/py.png`,
        `${BASE_PATH}Textures/${resource_key}/ny.png`,
        `${BASE_PATH}Textures/${resource_key}/pz.png`,
        `${BASE_PATH}Textures/${resource_key}/nz.png`,
      ];
      const cube_texture_loader = new THREE.CubeTextureLoader(this.loading_manager_);
      cube_texture_loader.load(urls, (texture) => {
        this.loaded_cube_maps_[resource_key] = texture;

        // this.loaded_cube_maps_.wrapS = THREE.RepeatWrapping;
        // this.loaded_cube_maps_.repeat.set(-1, 1);
      });
    }

    static load_static_model_gltf(resource_key)
    {
      if (resource_key in this.loaded_static_models_)
      {
        return;
      }

      const path = `${BASE_PATH}Models/${resource_key}.glb`;

      // Instantiate gltf loader
      const loader = new GLTFLoader( this.loading_manager_ );

      // Optional: Provide a DRACOLoader instance to decode compressed mesh data
      const dracoLoader = new DRACOLoader( this.loading_manager_ );
      // It is recommended to always pull your Draco JavaScript and WASM decoders
      // from this URL. Users will benefit from having the Draco decoder in cache
      // as more sites start using the static URL.
      const decoderPath = 'https://www.gstatic.com/draco/v1/decoders/';
      dracoLoader.setDecoderPath( decoderPath );
      dracoLoader.preload();
      loader.setDRACOLoader( dracoLoader );

      // Parse data blob
      loader.load(path, (gltf) => {
        const scene = gltf.scene;

        this.loaded_static_models_[resource_key] = scene;
      });
    }

    static load_skinned_model_gltf(resource_key)
    {
      if (resource_key in this.loaded_skinned_models_)
      {
        return;
      }

      const path = `${BASE_PATH}Models/${resource_key}.glb`;

      // // Instantiate gltf loader
      // const loader = new GLTFLoader();

      // // Optional: Provide a DRACOLoader instance to decode compressed mesh data
      // const dracoLoader = new DRACOLoader();
      // // It is recommended to always pull your Draco JavaScript and WASM decoders
      // // from this URL. Users will benefit from having the Draco decoder in cache
      // // as more sites start using the static URL.
      // const decoderPath = 'https://www.gstatic.com/draco/v1/decoders/';
      // dracoLoader.setDecoderPath( decoderPath );
      // dracoLoader.preload();
      // loader.setDRACOLoader( dracoLoader );

      // // Parse data blob
      // loader.load(path, (gltf) => {
      //   const scene = gltf.scene;
      // });

      this.loading_manager_.itemStart( path );

      const loader = new THREE.FileLoader( this.loading_manager_ );

      loader.setPath( "" );
      loader.setResponseType( 'arraybuffer' );
      loader.setRequestHeader( loader.requestHeader );
      loader.setWithCredentials( false );

      loader.load( path, ( data ) => {

        this.loaded_skinned_models_[resource_key] = data;

        this.loading_manager_.itemEnd( path );

      });
    }

    static get_binary_data(resource_key, copy_data = true)
    {
      if (!(resource_key in this.loaded_binaries_))
        {
          throw new Error(`Binary resource not found: ${resource_key}`);
        }
  
        if (copy_data)
        {
          return new Uint8Array(this.loaded_binaries_[resource_key]);
        }
        else
        {
          return this.loaded_binaries_[resource_key];
        }
    }

    static get_texture(resource_key, copy_data = true)
    {
      if (!(resource_key in this.loaded_textures_))
      {
        throw new Error(`Texture resource not found: ${resource_key}`);
      }

      if (copy_data)
      {
        return this.loaded_textures_[resource_key].clone();
      }
      else
      {
        return this.loaded_textures_[resource_key];
      }
    }

    static get_cube_map(resource_key, copy_data = true)
    {
      if (!(resource_key in this.loaded_cube_maps_))
      {
        throw new Error(`Cube map resource not found: ${resource_key}`);
      }

      if (copy_data)
      {
        return this.loaded_cube_maps_[resource_key].clone();
      }
      else
      {
        return this.loaded_cube_maps_[resource_key];
      }
    }

    static get_static_model(resource_key, copy_data = true)
    {
      if (!(resource_key in this.loaded_static_models_))
      {
        throw new Error(`Model resource not found: ${resource_key}`);
      }

      if (copy_data)
      {
        return this.loaded_static_models_[resource_key].clone();
      }
      else
      {
        return this.loaded_static_models_[resource_key];
      }
    }

    static get_skinned_model(resource_key, on_loaded)
    {
      if (!(resource_key in this.loaded_skinned_models_))
      {
        throw new Error(`Model resource not found: ${resource_key}`);
      }
      
      const data = this.loaded_skinned_models_[resource_key];

      this.parse_skinned_gltf_(data, on_loaded);

      // this.parse_skinned_gltf_(data, (gltf) => {
      //   const mesh = gltf.scene;
      //   const animations = gltf.animations;

      //   this.loaded_animations_[resource_key] = animations;

      //   on_loaded(gltf);
      // });
    }

    static async create_skinned_model_cache(mesh_requests)
    {
      await this.skinned_mesh_cache_.create(mesh_requests);
    }

    static get_cached_skinned_model(model_id)
    {
      return this.skinned_mesh_cache_.get_instance(model_id);
    }

    // static get_animations(resource_key, on_loaded)
    // {
    //   if (resource_key in this.loaded_animations_)
    //   {
    //     on_loaded(this.loaded_animations_[resource_key]);
    //   }
    //   else
    //   {
    //     if (!(resource_key in this.loaded_skinned_models_))
    //     {
    //       throw new Error(`Model resource not found: ${resource_key}`);
    //     }

    //     const data = this.loaded_skinned_models_[resource_key];

    //     this.parse_skinned_gltf_(data, (gltf) => {
    //       const animations = gltf.animations;
  
    //       this.loaded_animations_[resource_key] = animations;
  
    //       on_loaded(animations);
    //     });
    //   }
    // }

    static parse_skinned_gltf_(data, on_loaded)
    {
      // Instantiate gltf loader
      const loader = new GLTFLoader();

      // Optional: Provide a DRACOLoader instance to decode compressed mesh data
      const dracoLoader = new DRACOLoader();
      // It is recommended to always pull your Draco JavaScript and WASM decoders
      // from this URL. Users will benefit from having the Draco decoder in cache
      // as more sites start using the static URL.
      const decoderPath = 'https://www.gstatic.com/draco/v1/decoders/';
      dracoLoader.setDecoderPath( decoderPath );
      dracoLoader.preload();
      loader.setDRACOLoader( dracoLoader );

      // Parse data blob
      loader.parse(data, './', on_loaded);
    }
  };

  return {
    ResourceManager: ResourceManager,
  };

})();