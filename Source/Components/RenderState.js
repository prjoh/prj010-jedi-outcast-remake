import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { env } from '../Env';
// import * as config from '../Config';


export const component_renderer = (() => {

  class RenderState extends ecs_component.Component
  {
    static CLASS_NAME = 'RenderState';

    get NAME() {
      return RenderState.CLASS_NAME;
    }

    constructor(scene)
    {
      super();

      this.scene = scene;

      this.canvas_size = [window.innerWidth, window.innerHeight];
      this.has_resized = false;

      const webgl_params = 
      {
        powerPreference: "high-performance",
        antialias: true,
      };
      const webgl_options = 
      {
        outputColorSpace: THREE.SRGBColorSpace,
        shadowMap_enabled: true,
        shadowMap_type: THREE.PCFSoftShadowMap,
        toneMapping: THREE.ReinhardToneMapping,
        toneMappingExposure: 1.0,
      };

      this.renderer = new THREE.WebGLRenderer(webgl_params);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.domElement.id = "threejs";

      if (webgl_options.outputColorSpace !== undefined) this.renderer.outputColorSpace = webgl_options.outputColorSpace;
      if (webgl_options.shadowMap_enabled !== undefined) this.renderer.shadowMap.enabled = webgl_options.shadowMap_enabled;
      if (webgl_options.shadowMap_type !== undefined) this.renderer.shadowMap.type = webgl_options.shadowMap_type;
      if (webgl_options.toneMapping !== undefined) this.renderer.toneMapping = webgl_options.toneMapping;
      if (webgl_options.toneMappingExposure !== undefined) this.renderer.toneMappingExposure = webgl_options.toneMappingExposure;

      const canvas = document.getElementById('canvas');
      canvas.appendChild(this.renderer.domElement);

      this.instanced_bounding_sphere = new THREE.Sphere();

      // TODO: hack
      window.onresize = (event) => { this.on_window_resize(); };
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
      
        let c_debug = e_singletons.get_component("DebugComponent");
  
        c_debug.renderer_info = this.renderer.info;
      }
    }

    get_max_anisotropy()
    {
      return this.renderer.capabilities.getMaxAnisotropy();
    }

    on_window_resize()
    {
      this.canvas_size[0] = window.innerWidth;
      this.canvas_size[1] = window.innerHeight;
      this.has_resized = true;
    }

    // TODO: THIS IS STILL BROKEN!
    // enable_pointer_lock()
    // {
    //   this.renderer.domElement.onclick = (event) => {
    //     this.renderer.domElement.requestPointerLock().catch(() => {
    //       setTimeout(() => { this.renderer.domElement.requestPointerLock(); }, config.POINTER_LOCK_TIMEOUT);
    //     });
    //   };
    // }

    // disable_pointer_lock()
    // {
    //   this.renderer.domElement.onclick = null;
    // }
  };

  return {
    RenderState: RenderState,
  };

})();
