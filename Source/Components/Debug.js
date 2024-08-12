import Stats from 'stats.js';

import { ecs_component } from '../ECS/Component';


export const component_debug = (() => {

  class DebugComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'DebugComponent';

    get NAME() {
      return DebugComponent.CLASS_NAME;
    }

    constructor()
    {
      super();

      // Editor Mode
      // this.is_previous_frame_enabled = false;
      // this.editor_camera = null;

      // Profiler
      this.stats = new Stats();
      const canvas_parent = document.getElementById('scene');
      canvas_parent.appendChild(this.stats.dom);
      this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

      // Renderer Info
      this.renderer_info = null;

      // Debug Draw
      this.camera_helper = null;
      this.debug_lights = [];
      this.physics_debug_drawer = null;
      this.debug_nav_meshes = [];
      this.debug_nav_agents = [];
      this.debug_instanced_bounding_spheres = [];

      // Lighting
      // this.hemisphere_light = null;
      this.directional_light = null;
      this.dynamic_lights = [];
    }
  };

  return {
    DebugComponent: DebugComponent,
  };

})();
