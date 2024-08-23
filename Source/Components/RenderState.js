import Stats from 'stats.js';
import * as THREE from 'three';
import * as PPROC from 'postprocessing';
import { N8AOPostPass } from 'n8ao'

import { ecs_component } from '../ECS/Component';
// import { LuminosityHighPassShader } from '../Shaders/LuminosityShader.js';
import { env } from '../Env';
import { component_editor } from './Editor';
import { resources } from '../ResourceManager';
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

      // Ambient Occlusion
      this.ao_pass = new N8AOPostPass(
        new THREE.Scene(),
        this.camera,
        window.innerWidth,
        window.innerHeight
      );
      this.ao_pass.configuration.halfRes = true;
      this.ao_pass.configuration.aoSamples = 16;
      this.ao_pass.configuration.denoiseSamples = 8;
      this.ao_pass.configuration.aoRadius = 0.54;
      this.ao_pass.configuration.denoiseRadius = 15.0;
      this.ao_pass.configuration.intensity = 2.5;
      this.ao_pass.configuration.distanceFalloff = 1.0;

      // Bloom
      this.bloom_effect = new PPROC.SelectiveBloomEffect(this.scene, this.camera, {
        intensity: 10.0,
        mipmapBlur: true,
        luminanceThreshold: 0,
        luminanceSmoothing: 0.2,
        radius : 0.618,
        resolutionScale: 4
      });

      // Tone Mapping
      this.tone_mapping_effect = new PPROC.ToneMappingEffect({
        mode: PPROC.ToneMappingMode.REINHARD2_ADAPTIVE,
        resolution: 256,
        whitePoint: 16.0,
        middleGrey: 0.6,
        minLuminance: 0.01,
        averageLuminance: 0.01,
        adaptationRate: 1.0
      });
      this.renderer.toneMappingExposure = 2.0;
  
      // SMAA
      this.smaa_effect = new PPROC.SMAAEffect({
        edgeDetectionMode: PPROC.EdgeDetectionMode.COLOR,
        preset: PPROC.SMAAPreset.ULTRA,
        predicationMode: PPROC.PredicationMode.DEPTH,
      });

      this.smaa_effect.edgeDetectionMaterial.edgeDetectionThreshold = 0.02;
      this.smaa_effect.edgeDetectionMaterial.predicationThreshold = 0.002;
      this.smaa_effect.edgeDetectionMaterial.predicationScale = 1.0;

      // Setup passes
      this.opaque_pass = new PPROC.RenderPass(this.scene, this.camera);
      this.smaa_pass = new PPROC.EffectPass(this.camera, this.smaa_effect);
      this.bloom_pass = new PPROC.EffectPass(this.camera, this.bloom_effect);
      this.tone_mapping_pass = new PPROC.EffectPass(this.camera, this.tone_mapping_effect);

      this.composer.addPass(this.opaque_pass);
      this.composer.addPass(this.smaa_pass);
      this.composer.addPass(this.ao_pass);
      this.composer.addPass(this.bloom_pass);
      this.composer.addPass(this.tone_mapping_pass);

      ///////////
      // Debug //
      ///////////

      this.stats = null;
      this.stats_mode = null;

      if (env.DEBUG_MODE)
      {
        this.stats = new Stats();
        this.stats_mode = 0; // 0: fps, 1: ms, 2: mb, 3+: custom
        const canvas_parent = document.getElementById('scene');
        canvas_parent.appendChild(this.stats.dom);
      }
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
    
        let c_editor = e_singletons.get_component("EditorComponent");
  
        let profiling_page = c_editor.get_page(component_editor.eEditorPage.EP_Profiling);
  
        profiling_page.add_binding(
          this, 
          'stats_mode', 
          "Stats", 
          { 
            options: {
              fps: 0,
              ms: 1,
              memory: 2,
              disable: 3,
            }
          },
          (value) => {
            this.stats.showPanel(value);
          }
        );

        profiling_page.add_binding(
          this.renderer.info.memory, 
          'geometries', 
          "Geometries (MB)", 
          {
            readonly: true,
            format: (v) => v.toFixed(1),
          }
        );
        profiling_page.add_binding(
          this.renderer.info.memory, 
          'textures', 
          "Textures (MB)'", 
          {
            readonly: true,
            format: (v) => v.toFixed(1),
          }
        );
        profiling_page.add_binding(
          this.renderer.info.render, 
          'calls', 
          "Draw Calls", 
          {
            readonly: true,
            format: (v) => Math.trunc(v),
          }
        );
        profiling_page.add_binding(
          this.renderer.info.render, 
          'triangles', 
          "Triangles", 
          {
            readonly: true,
            format: (v) => Math.trunc(v),
          }
        );

        let postfx_page = c_editor.get_page(component_editor.eEditorPage.EP_PostFX);

        postfx_page.create_folder("SMAA", false);
        postfx_page.create_folder("Ambient Occlusion", false);
        postfx_page.create_folder("Bloom", false);
        postfx_page.create_folder("Tonemapping", false);

        postfx_page.add_folder_binding("SMAA", this.smaa_pass, 'enabled', "Enable");

        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass, 'enabled', "Enable");
        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass.configuration, 'halfRes', "Half Res");
        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass.configuration, 'aoSamples', "AO Samples", { min: 1, max: 64, step: 1 });
        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass.configuration, 'denoiseSamples', "Denoise Samples", { min: 1, max: 64, step: 1 });
        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass.configuration, 'aoRadius', "AO Radius", { min: 0.0, max: 10.0 });
        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass.configuration, 'denoiseRadius', "Denoise Radius", { min: 0.0, max: 24.0 });
        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass.configuration, 'intensity', "Intensity", { min: 0.0, max: 10.0 });
        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass.configuration, 'distanceFalloff', "Distance Falloff", { min: 0.0, max: 10.0 });
        postfx_page.add_folder_binding("Ambient Occlusion", this.ao_pass.configuration, 'transparencyAware', "Transparency Aware");

        postfx_page.add_folder_binding("Bloom", this.bloom_pass, 'enabled', "Enable");
        postfx_page.add_folder_binding("Bloom", this.bloom_effect, 'intensity', "Intensity", { min: 0.0, max: 20.0 });
        postfx_page.add_folder_binding("Bloom", this.bloom_effect.mipmapBlurPass, 'radius', "Radius", { min: 0.0, max: 1.0 });
        postfx_page.add_folder_binding("Bloom", this.bloom_effect.luminanceMaterial, 'threshold', "Luminence Threshold", { min: 0.0, max: 1.0 });
        postfx_page.add_folder_binding("Bloom", this.bloom_effect.luminanceMaterial, 'smoothing', "Luminence Smoothing", { min: 0.0, max: 1.0 });

        let adaptiveLuminancePass = this.tone_mapping_effect.adaptiveLuminancePass;
        let adaptiveLuminanceMaterial = adaptiveLuminancePass.fullscreenMaterial;

        postfx_page.add_folder_binding("Tonemapping", this.renderer, 'toneMappingExposure', "Exposure", { min: 0.0, max: 4.0 });
        postfx_page.add_folder_binding("Tonemapping", this.tone_mapping_effect, 'whitePoint', "White Point", { min: 0.0, max: 32.0 });
        postfx_page.add_folder_binding("Tonemapping", this.tone_mapping_effect, 'middleGrey', "Middle Grey", { min: 0.0, max: 1.0 });
        postfx_page.add_folder_binding("Tonemapping", this.tone_mapping_effect, 'averageLuminance', "Avg Luminence", { min: 0.0, max: 1.0 });
        postfx_page.add_folder_binding("Tonemapping", adaptiveLuminanceMaterial, 'minLuminance', "Min Luminence", { min: 0.0, max: 1.0 });
        postfx_page.add_folder_binding("Tonemapping", adaptiveLuminanceMaterial, 'adaptationRate', "Adapt Rate", { min: 0.0, max: 3.0 });
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
  };

  return {
    RenderState: RenderState,
  };

})();
