import * as THREE from 'three';
import * as PPROC from 'postprocessing';

import { ecs_component } from '../ECS/Component';
// import { LuminosityHighPassShader } from '../Shaders/LuminosityShader.js';
import { env } from '../Env';
// import * as config from '../Config';

// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
// import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
// import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
// import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';


export const component_renderer = (() => {

  class RenderState extends ecs_component.Component
  {
    static CLASS_NAME = 'RenderState';

    get NAME() {
      return RenderState.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene = params.scene;
      this.camera = params.camera;

      // this.canvas_size = [window.innerWidth, window.innerHeight];
      // this.has_resized = false;

      const webgl_params = 
      {
        powerPreference: "high-performance",
        antialias: false,
        stencil: false,
        depth: false
      };
      const webgl_options = 
      {
        outputColorSpace: THREE.SRGBColorSpace,
        shadowMap_enabled: true,
        shadowMap_type: THREE.PCFSoftShadowMap,
        toneMapping: THREE.NoToneMapping,
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

      // Bounding sphere used for culling instanced meshes
      this.instanced_bounding_sphere = new THREE.Sphere();

      // Cascade Shadow mapping
      // this.csm_ = new CSM( {
      //   maxFar: this.camera_.far,
      //   cascades: 4,
      //   mode: 'logarithmic',
      //   parent: this.scene_,
      //   shadowMapSize: 4096,
      //   lightDirection: lightDir,
      //   camera: this.camera_,
      //   lightNear: 1.0,
      //   lightFar: 1000.0,
      // });
      // this.csm_.fade = true;

      this.composer = new PPROC.EffectComposer(this.renderer, {
        frameBufferType: THREE.HalfFloatType
      });

      this.bloom_effect = new PPROC.SelectiveBloomEffect(this.scene, this.camera, {
        intensity: 7,
        mipmapBlur: true,
        luminanceThreshold: 0,
        luminanceSmoothing: 0.2,
        radius : 0.618,
        resolutionScale: 4
      });

      const tone_mapping_effect = new PPROC.ToneMappingEffect({
        mode: PPROC.ToneMappingMode.REINHARD2_ADAPTIVE,
        resolution: 256,
        whitePoint: 16.0,
        middleGrey: 0.6,
        minLuminance: 0.01,
        averageLuminance: 0.01,
        adaptationRate: 1.0
      });
      this.renderer.toneMappingExposure = 2.0;
  
      this.opaque_pass = new PPROC.RenderPass(this.scene, this.camera);
      this.bloom_pass = new PPROC.EffectPass(this.camera, this.bloom_effect);
      this.tone_mapping_pass = new PPROC.EffectPass(this.camera, tone_mapping_effect);

      this.composer.addPass(this.opaque_pass);
      this.composer.addPass(this.bloom_pass);
      this.composer.addPass(this.tone_mapping_pass);

      // const parameters = {
      //   minFilter: THREE.NearestFilter,
      //   magFilter: THREE.NearestFilter,
      //   format: THREE.RGBAFormat,
      //   type: THREE.FloatType,
      //   // stencilBuffer: false,
      // };

      // // const render_target = new THREE.WebGLRenderTarget(
      // //     window.innerWidth, window.innerHeight, parameters);
      // // this.write_buffer = render_target;
      // // this.read_buffer = render_target.clone();

      // this.composer = new EffectComposer(this.renderer);
      // this.composer.setPixelRatio(window.devicePixelRatio);
      // this.composer.setSize(window.innerWidth, window.innerHeight);
  
      // // this.fxaa_pass = new ShaderPass(FXAAShader);
      // // this.gtao_pass = new GTAOPass(this.scene, this.camera);
      // this.bloom_pass = new UnrealBloomPass(
      //     new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
      // this.bloom_pass.radius = 0.0;
      // this.bloom_pass.strength = 1.0;
      // this.bloom_pass.materialHighPassFilter = new THREE.ShaderMaterial({
      //   uniforms: this.bloom_pass.highPassUniforms,
      //   vertexShader: LuminosityHighPassShader.vertexShader,
      //   fragmentShader: LuminosityHighPassShader.fragmentShader,
      //   defines: {}
      // });

      // this.opaque_pass = new RenderPass(this.scene, this.camera);
      // // this.gamma_pass = new ShaderPass(GammaCorrectionShader);

      // this.composer.addPass(this.opaque_pass);
      // // this.composer.addPass(this.motionBlurPass_);
      // // this.composer.addPass(this.gtao_pass);
      // this.composer.addPass(this.bloom_pass);
      // // this.composer.addPass(this.uiPass_);
      // // this.composer.addPass(this.gamma_pass);
      // // this.composer.addPass(this.fxaa_pass);
      // this.composer.addPass( new OutputPass() );

      // TODO: hack
      // window.onresize = (event) => { this.on_window_resize(); };
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

    add_to_bloom_pass(object_3d)
    {
      this.bloom_effect.selection.add(object_3d);
    }

    // TODO: Move to RenderSystem
    // on_window_resize()
    // {
    //   this.canvas_size[0] = window.innerWidth;
    //   this.canvas_size[1] = window.innerHeight;
    //   this.has_resized = true;
    // }

    // swap_buffers()
    // {
    //   const tmp = this.write_buffer;
    //   this.write_buffer = this.read_buffer;
    //   this.read_buffer = tmp;
    // }

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
