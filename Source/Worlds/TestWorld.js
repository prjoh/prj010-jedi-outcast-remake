import * as THREE from 'three';
import * as PPROC from 'postprocessing';

import { world_base } from '../World';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import * as Sponza from '../Test/Sponza/Sponza';


export const test_world = (() => {

  class World extends world_base.World
  {
    constructor()
    {
      super(false);

      this.renderer = new THREE.WebGLRenderer({
        powerPreference: "high-performance",
        antialias: false,
        stencil: false,
        depth: false
      });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setClearColor(0x000000, 0.0);
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // this.renderer.shadowMap.autoUpdate = false;
      this.renderer.shadowMap.needsUpdate = true;
      this.renderer.shadowMap.enabled = true;
      this.renderer.info.autoReset = false;

      this.renderer.setPixelRatio(window.devicePixelRatio);

      this.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);

      const canvas = document.getElementById('canvas');
      canvas.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.01, 
        1000.0,
      );
      this.camera.position.set(-10.0, 2.0, -1.0);

      this.assets = new Map();

      this.controls = new OrbitControls( this.camera, this.renderer.domElement );


      this.composer = new PPROC.EffectComposer(this.renderer, {
        frameBufferType: THREE.HalfFloatType
      });

      this.bloom_effect = new PPROC.SelectiveBloomEffect(this.scene, this.camera, {
        intensity: 5,
        mipmapBlur: true,
        luminanceThreshold: 0,
        luminanceSmoothing: 0.2,
        radius : 0.618,
        resolutionScale: 4
      });

      const tone_mapping_effect = new PPROC.ToneMappingEffect({
        mode: PPROC.ToneMappingMode.AGX,
        resolution: 256,
        whitePoint: 16.0,
        middleGrey: 0.6,
        minLuminance: 0.01,
        averageLuminance: 0.01,
        adaptationRate: 1.0
      });
  
      this.opaque_pass = new PPROC.RenderPass(this.scene, this.camera);
      this.bloom_pass = new PPROC.EffectPass(this.camera, this.bloom_effect);
      this.tone_mapping_pass = new PPROC.EffectPass(this.camera, tone_mapping_effect);

      this.composer.addPass(this.opaque_pass);
      // this.composer.addPass(this.bloom_pass);
      this.composer.addPass(this.tone_mapping_pass);


      window.onresize = this.on_window_resize_.bind(this);
    }

    // TODO: This is the routine that loads files from the server into local memory
    load()
    {
    }

    async init_async()
    {
      return new Promise((resolve, reject) => {
        const loading_manager = new THREE.LoadingManager();
        loading_manager.onLoad = () => {
          resolve();
        };
        loading_manager.onError = (url) => {
          reject(`There was an error loading ${url}`);
        };
        Sponza.load(this.assets, loading_manager, this.anisotropy);
      });
    }

    // TODO: We should have a separate load screen for data init phase
    init()
    {
      // Sky
      this.scene.background = new THREE.Color(0xeeeeee);
      // Lights
      this.scene.add(...Sponza.createLights());
      // Sponza
      let sponza = this.assets.get('sponza');
      this.scene.add(sponza);
    }

    pre_update()
    {
    }

    fixed_update(fixed_delta_time_s)
    {
    }

    update(delta_time_s)
    {
      // this.renderer.render(this.scene, this.camera);
      this.composer.render();
    }
    
    late_update(delta_time_s)
    {
    }

    on_window_resize_(e)
    {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  return {
    World: World,
  };

})();
