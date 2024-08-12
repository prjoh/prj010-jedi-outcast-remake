import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { env } from '../Env';

export const component_lights = (() => {

  class SceneLights extends ecs_component.Component
  {
    static CLASS_NAME = 'SceneLights';

    get NAME() {
      return SceneLights.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene_ = params.scene;

      // this.scene_.fog = new THREE.Fog( 0xDFE9F3, 0.1, 200 );
      // this.scene_.fog = new THREE.FogExp2(0xDFE9F3, 0.00075);

      // this.hemisphere_light = new THREE.HemisphereLight( 0xFFACAC, 0x8890BA, 0.3 );
      // this.hemisphere_light = new THREE.HemisphereLight( 0xd5dcff, 0xc58282, 0.1 );
      // this.scene_.add( this.hemisphere_light );

      // this.directional_light = new THREE.DirectionalLight( 0xBBC8FF, 1.0);
      this.directional_light = new THREE.DirectionalLight( 0xffdddd, 0.5);
      this.directional_light.position.set(-15, 25, 15);
      this.directional_light.target = params.player;
      // this.directional_light = new THREE.DirectionalLight( 0xBBC8FF, 10.0 );
      // this.directional_light.position.set(-15, 50, 100);
      // this.directional_light.target.position.set(100, 0, -105);
      this.scene_.add( this.directional_light );

      //Set up shadow properties for the light
      this.directional_light.castShadow = true;
      this.directional_light.shadow.bias = -0.0001;
      this.directional_light.shadow.mapSize.width = 4096; // default
      this.directional_light.shadow.mapSize.height = 4096; // default
      this.directional_light.shadow.camera.near = -100.0;
      this.directional_light.shadow.camera.far = 500.0;
      this.directional_light.shadow.camera.left = 50;
      this.directional_light.shadow.camera.right = -50;
      this.directional_light.shadow.camera.top = 50;
      this.directional_light.shadow.camera.bottom = -50;

      // this.directional_light.shadow.camera.left = 5;
      // this.directional_light.shadow.camera.right = -5;
      // this.directional_light.shadow.camera.top = 5;
      // this.directional_light.shadow.camera.bottom = -5;

      this.directional_light_helper = new THREE.CameraHelper( this.directional_light.shadow.camera );
      this.scene_.add( this.directional_light_helper );

      const spot_light = new THREE.SpotLight(0xffffff, 100.0, 0, Math.PI/4, 0.2);
      spot_light.position.set(2.85, 0.2, -11.15);
      spot_light.target.position.set(-8, 2.5, -25);

      //Set up shadow properties for the light
      spot_light.castShadow = true;
      // spot_light.shadow.bias = -0.0001;
      spot_light.shadow.mapSize.width = 2048; // default
      spot_light.shadow.mapSize.height = 2048; // default
      spot_light.shadow.camera.near = 0.2;
      spot_light.shadow.camera.far = 500.0;

      const spot_light2 = new THREE.SpotLight(0xffffff, 100.0, 0, Math.PI/4, 0.2);
      spot_light2.position.set(-18.85, 0.2, -11.15);
      spot_light2.target.position.set(-8, 2.5, -25);

      //Set up shadow properties for the light
      spot_light2.castShadow = true;
      // spot_light2.shadow.bias = -0.0001;
      spot_light2.shadow.mapSize.width = 2048; // default
      spot_light2.shadow.mapSize.height = 2048; // default
      spot_light2.shadow.camera.near = 0.2;
      spot_light2.shadow.camera.far = 500.0;
      
      this.scene_.add( spot_light );
      this.scene_.add( spot_light2 );

      this.debug_light_helpers_ = null;
      this.debug_dynamic_lights_ = null;

      if (env.DEBUG_MODE)
      {
        this.debug_light_helpers_ = [];
        this.debug_light_helpers_.push(new THREE.DirectionalLightHelper( this.directional_light ));
        this.debug_light_helpers_.push(new THREE.SpotLightHelper( spot_light ));
        this.debug_light_helpers_.push(new THREE.SpotLightHelper( spot_light2 ));

        for (const light of this.debug_light_helpers_)
        {
          this.scene_.add( light );
        }

        this.debug_dynamic_lights_ = [];
        this.debug_dynamic_lights_.push(spot_light);
        this.debug_dynamic_lights_.push(spot_light2);
      }

      // let point_light = new THREE.PointLight(0xffffff, 5.0);
      // point_light.position.set(-6, 2, -3);
      // this.scene_.add( point_light );

      // /*
      //  * SHADOW SETTINGS
      //  */
      // this.directional_light.castShadow = true;
      // this.directional_light.shadow.bias = -0.001;
      // this.directional_light.shadow.mapSize.width = 4096;
      // this.directional_light.shadow.mapSize.height = 4096;
      // this.directional_light.shadow.camera.near = 1.0;
      // this.directional_light.shadow.camera.far = 50.0;
      // this.directional_light.shadow.camera.left = 10;
      // this.directional_light.shadow.camera.right = -10;
      // this.directional_light.shadow.camera.top = 10;
      // this.directional_light.shadow.camera.bottom = -10;
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
      
        let c_debug = e_singletons.get_component("DebugComponent");
  
        for (const helper of this.debug_light_helpers_)
        {
          c_debug.debug_lights.push(helper);
        }

        // c_debug.hemisphere_light = this.hemisphere_light;
        c_debug.directional_light = this.directional_light;

        for (const light of this.debug_dynamic_lights_)
        {
          c_debug.dynamic_lights.push(light);
        }
      }
    }
  };

  return {
    SceneLights: SceneLights,
  };

})();
