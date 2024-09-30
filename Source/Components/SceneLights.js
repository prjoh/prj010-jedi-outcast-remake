import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { env } from '../Env';
import { resources } from '../ResourceManager';
import { component_editor } from './Editor';

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

      /////////////////////
      // Environment Map //
      /////////////////////
      
      let sky_cube_map = resources.ResourceManager.get_cube_map('sky');
      // this.scene_.background = sky_cube_map;  // Debug
      this.scene_.environment = sky_cube_map;
      this.scene_.environmentIntensity = 0.15;

      /////////
      // Fog //
      /////////

      // this.scene_.fog = new THREE.Fog( 0xDFE9F3, 0.1, 200 );
      // this.scene_.fog = new THREE.FogExp2(0xDFE9F3, 0.00075);

      //////////////////////
      // Hemisphere Light //
      //////////////////////

      // this.hemisphere_light = new THREE.HemisphereLight( 0xFFACAC, 0x8890BA, 0.3 );
      // this.hemisphere_light = new THREE.HemisphereLight( 0xd5dcff, 0xc58282, 0.1 );
      // this.scene_.add( this.hemisphere_light );

      ///////////////////////
      // Directional Light //
      ///////////////////////

      this.directional_light_position = new THREE.Vector3(-15, 25, 15);

      this.directional_light = new THREE.DirectionalLight( 0xffe2e2, 0.15);
      this.directional_light.position.copy(this.directional_light_position);
      this.directional_light.target = params.player;

      //Set up shadow properties for the light
      this.directional_light.castShadow = true;
      this.directional_light.shadow.bias = -0.0007;
      this.directional_light.shadow.mapSize.width = 2048;
      this.directional_light.shadow.mapSize.height = 2048;
      this.directional_light.shadow.camera.near = -64.0;
      this.directional_light.shadow.camera.far = 256.0;
      this.directional_light.shadow.camera.left = 64;
      this.directional_light.shadow.camera.right = -64;
      this.directional_light.shadow.camera.top = 64;
      this.directional_light.shadow.camera.bottom = -64;

      this.scene_.add( this.directional_light );

      //////////////////
      // Point Lights //
      //////////////////

      this.point_light1 = new THREE.PointLight( 0xffffff, 1.0, 2.5, 1.0 );
      this.point_light1.position.set( -13.3, 2.0, 12.0 );
      this.scene_.add( this.point_light1 );
      
      this.point_light2 = new THREE.PointLight( 0xffffff, 1.25, 6.0, 1.0 );
      this.point_light2.position.set( -29.5, 2.0, -14.0 );
      this.scene_.add( this.point_light2 );

      /////////////////
      // Spot Lights //
      /////////////////

      this.spot_light = new THREE.SpotLight(0xffffff, 25.0, 0, Math.PI/4, 0.2);
      this.spot_light.position.set(2.85, 0.2, -11.15);
      this.spot_light.target.position.set(-8, 2.5, -25);

      //Set up shadow properties for the light
      this.spot_light.castShadow = true;
      this.spot_light.shadow.bias = -0.02;
      this.spot_light.shadow.mapSize.width = 512;
      this.spot_light.shadow.mapSize.height = 512;
      this.spot_light.shadow.camera.near = 0.2;
      this.spot_light.shadow.camera.far = 10.0;

      this.spot_light2 = new THREE.SpotLight(0xffffff, 25.0, 0, Math.PI/4, 0.2);
      this.spot_light2.position.set(-18.85, 0.2, -11.15);
      this.spot_light2.target.position.set(-8, 2.5, -25);

      //Set up shadow properties for the light
      this.spot_light2.castShadow = true;
      this.spot_light2.shadow.bias = -0.02;
      this.spot_light2.shadow.mapSize.width = 512;
      this.spot_light2.shadow.mapSize.height = 512;
      this.spot_light2.shadow.camera.near = 0.2;
      this.spot_light2.shadow.camera.far = 10.0;

      this.spot_light3 = new THREE.SpotLight(0xffffff, 75.0, 0, Math.PI/4, 0.4);
      this.spot_light3.position.set(-26.5, 5.0, 7.6);
      this.spot_light3.target.position.set(-23.0, 0.0, -1.0);
      
      this.spot_light3.castShadow = true;
      this.spot_light3.shadow.bias = -0.0001;
      this.spot_light3.shadow.mapSize.width = 1024;
      this.spot_light3.shadow.mapSize.height = 1024;
      this.spot_light3.shadow.camera.near = 0.01;
      this.spot_light3.shadow.camera.far = 25.0;
      
      this.scene_.add( this.spot_light );
      this.scene_.add( this.spot_light2 );
      this.scene_.add( this.spot_light3 );

      ///////////
      // Debug //
      ///////////

      this.debug_light_helpers_ = null;
      this.draw_debug_lights = null;
      this.lighting_pos_dir = null;
      this.lighting_col_dir = null;
      this.spot_lights = null;
      this.spot_lights_enable = null;
      this.spot_lights_shadow = null;
      this.spot_light_shadow_bias = null;

      if (env.DEBUG_MODE)
      {
        this.draw_debug_lights = false;

        this.debug_light_helpers_ = [];
        this.debug_light_helpers_.push(new THREE.DirectionalLightHelper( this.directional_light ));
        this.debug_light_helpers_.push(new THREE.SpotLightHelper( this.spot_light ));
        this.debug_light_helpers_.push(new THREE.SpotLightHelper( this.spot_light2 ));
        this.debug_light_helpers_.push(new THREE.SpotLightHelper( this.spot_light3 ));

        for (const light of this.debug_light_helpers_)
        {
          light.visible = this.draw_debug_lights;
          this.scene_.add( light );
        }

        this.lighting_pos_dir = { 
          x: this.directional_light_position.x, 
          y: this.directional_light_position.y, 
          z: this.directional_light_position.z 
        };
        this.lighting_col_dir = '#ffe2e2';

        this.spot_lights_enable = true;
        this.spot_lights_shadow = true;
        this.spot_light_shadow_bias = -0.02;

        this.spot_lights = [];
        this.spot_lights.push(this.spot_light);
        this.spot_lights.push(this.spot_light2);
        this.spot_lights.push(this.spot_light3);
      }
    }

    destroy()
    {
      this.scene_.environment.dispose();
      this.directional_light.dispose();
      this.point_light1.dispose();
      this.point_light2.dispose();
      this.spot_light.dispose();
      this.spot_light2.dispose();
      this.spot_light3.dispose();

      if (env.DEBUG_MODE)
      {
        for (let helper of this.debug_light_helpers_)
        {
          helper.dispose();
        }
      }

      super.destroy();
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
    
        let c_editor = e_singletons.get_component("EditorComponent");
  
        let debug_draw_page = c_editor.get_page(component_editor.eEditorPage.EP_DebugDraw);

        debug_draw_page.add_binding(this, 'draw_debug_lights', "Lights", null, (value) => {
          for (let light of this.debug_light_helpers_)
          {
            light.visible = value;
          }
        });

        let debug_lighting_page = c_editor.get_page(component_editor.eEditorPage.EP_Lighting);

        debug_lighting_page.add_binding(this.scene_, 'environmentIntensity', "Env Intensity", { min: 0.0, max: 3.0 });

        debug_lighting_page.create_folder("Directional Light");
        debug_lighting_page.add_folder_binding("Directional Light", this.directional_light, 'visible', "Enable");
        debug_lighting_page.add_folder_binding("Directional Light", this, 'lighting_pos_dir', "Pos", null, (value) => {
          this.directional_light_position.set(value.x, value.y, value.z);
        });
        debug_lighting_page.add_folder_binding("Directional Light", this.directional_light, 'intensity', "Intensity", { min: 0.0, max: 3.0 });
        debug_lighting_page.add_folder_binding("Directional Light", this, 'lighting_col_dir', "Color", { view: 'color' }, (value) => {
          this.directional_light.color.setHex(Number(`0x${value.substr(1)}`));
        });
        debug_lighting_page.add_folder_binding("Directional Light", this.directional_light, 'castShadow', "Shadows");
        debug_lighting_page.add_folder_binding("Directional Light", this.directional_light.shadow, 'bias', "Shadow Bias", { min: -0.002, max: 0.0, step: 0.0001 });

        debug_lighting_page.create_folder("Spot Lights");
        debug_lighting_page.add_folder_binding("Spot Lights", this, 'spot_lights_enable', "Enable", null, (value) => {
          for (let light of this.spot_lights)
          {
            light.visible = value;
          }
        });
        debug_lighting_page.add_folder_binding("Spot Lights", this, 'spot_lights_shadow', "Shadows", null, (value) => {
          for (let light of this.spot_lights)
          {
            light.castShadow = value;
          }
        });
        debug_lighting_page.add_folder_binding("Spot Lights", this, 'spot_light_shadow_bias', "Shadow Bias", { min: -0.05, max: 0.00, step: 0.0001 }, (value) => {
          for (let light of this.spot_lights)
            {
              light.shadow.bias = value;
            }
        });

      }
    }
  };

  return {
    SceneLights: SceneLights,
  };

})();
