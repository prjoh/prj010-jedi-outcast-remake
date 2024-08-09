import { Pane } from 'tweakpane';

import { ecs_component } from '../ECS/Component';

export const component_editor = (() => {

  const eEditorPage = Object.freeze({
    // EP_EditorMode: 0,
    EP_Profiling: 0,
    EP_DebugDraw: 1,
    EP_Lighting: 2,
  });

  class EditorComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'EditorComponent';

    get NAME() {
      return EditorComponent.CLASS_NAME;
    }

    constructor()
    {
      super();

      this.params = {
        // Editor Mode
        // editor_mode_enable: false,
        // Profiling
        stats_mode: 0,
        render_info_geometries: 0,
        render_info_textures: 0,
        render_info_draw_calls: 0,
        render_info_triangles: 0,
        // Debug Draw
        debug_draw_all: true,
        debug_draw_camera: true,
        debug_draw_lights: true,
        debug_draw_physics: true,
        debug_draw_navmesh: true,
        debug_draw_navagent: true,
        debug_draw_instanced_bs: false,
        // Lighting
        lighting_hemi_enable: true,
        lighting_hemi_pos: { x: 0.0, y: 0.0, z: 0.0 },
        lighting_hemi_intensity: 0.0,
        lighting_hemi_color_sky: '#000000',
        lighting_hemi_color_ground: '#000000',
        lighting_dir_enable: true,
        lighting_dir_pos: { x: 0.0, y: 0.0, z: 0.0 },
        lighting_dir_intensity: 0.0,
        lighting_dir_color: '#000000',
        // lighting_spot_lights: [],
        lighting_dynamic_enable: true,
      };

      this.pane_ = new Pane({
        expanded: true,
        title: "Edit Pane",
      });

      let tab = this.pane_.addTab({
        pages: [
          // {title: 'Editor Mode'},
          {title: 'Profiling'},
          {title: 'Debug Draw'},
          {title: 'Lighting'},
        ],
      });

      // Editor Mode

      // let page_editor = tab.pages[eEditorPage.EP_EditorMode];

      // page_editor.addBinding(this.params, 'editor_mode_enable', { label: 'Enabled' });

      // Profiling

      let page_profiler = tab.pages[eEditorPage.EP_Profiling];

      page_profiler.addBinding(this.params, 'stats_mode', {
        label: 'Stats',
        options: {
          fps: 0,
          ms: 1,
          memory: 2,
          disable: 3,
        },
      });

      page_profiler.addBinding(this.params, 'render_info_geometries', {
        label: 'Geometries (MB)',
        readonly: true,
        format: (v) => v.toFixed(1),
      });
      page_profiler.addBinding(this.params, 'render_info_textures', {
        label: 'Textures (MB)',
        readonly: true,
        format: (v) => v.toFixed(1),
      });
      page_profiler.addBinding(this.params, 'render_info_draw_calls', {
        label: 'Draw Calls',
        readonly: true,
        format: (v) => Math.trunc(v),
      });
      page_profiler.addBinding(this.params, 'render_info_triangles', {
        label: 'Triangles',
        readonly: true,
        format: (v) => Math.trunc(v),
      });

      // Debug Draw

      let page_debug_draw = tab.pages[eEditorPage.EP_DebugDraw];

      page_debug_draw.addBinding(this.params, 'debug_draw_all', { label: 'All' })
        .on('change', (ev) => {
          this.params.debug_draw_camera = ev.value;
          this.params.debug_draw_lights = ev.value;
          this.params.debug_draw_physics = ev.value;
          this.params.debug_draw_navmesh = ev.value;
          this.params.debug_draw_navagent = ev.value;
          this.params.debug_draw_instanced_bs = ev.value;
          this.refresh();
        });
      page_debug_draw.addBlade({
        view: 'separator',
      });
      // page_debug_draw.addBinding(this.params, 'debug_draw_camera', { label: 'Camera' });
      page_debug_draw.addBinding(this.params, 'debug_draw_lights', { label: 'Lights' });
      page_debug_draw.addBinding(this.params, 'debug_draw_physics', { label: 'Physics' });
      page_debug_draw.addBinding(this.params, 'debug_draw_navmesh', { label: 'NavMesh' });
      page_debug_draw.addBinding(this.params, 'debug_draw_navagent', { label: 'NavAgent' });
      page_debug_draw.addBinding(this.params, 'debug_draw_instanced_bs', { label: 'InstancedBoundingSpheres' });

      // Lighting

      let page_lighting = tab.pages[eEditorPage.EP_Lighting];

      let folder_hemi_light = page_lighting.addFolder({
        title: "Hemisphere Light",
        expanded: true,
      });

      folder_hemi_light.addBinding(this.params, 'lighting_hemi_enable', { label: 'Enabled' });
      folder_hemi_light.addBinding(this.params, 'lighting_hemi_pos', { label: 'Position' });
      folder_hemi_light.addBinding(this.params, 'lighting_hemi_intensity', { label: 'Intensity' });
      folder_hemi_light.addBinding(this.params, 'lighting_hemi_color_sky', { label: 'Sky Color', view: 'color' });
      folder_hemi_light.addBinding(this.params, 'lighting_hemi_color_ground', { label: 'Ground Color', view: 'color' });

      let folder_dir_light = page_lighting.addFolder({
        title: "Directional Light",
        expanded: true,
      });

      folder_dir_light.addBinding(this.params, 'lighting_dir_enable', { label: 'Enabled' });
      folder_dir_light.addBinding(this.params, 'lighting_dir_pos', { label: 'Position' });
      folder_dir_light.addBinding(this.params, 'lighting_dir_intensity', { label: 'Intensity' });
      folder_dir_light.addBinding(this.params, 'lighting_dir_color', { label: 'Color', view: 'color' });

      page_lighting.addBinding(this.params, 'lighting_dynamic_enable', { label: 'Dynamic Lights' });
    }

    refresh()
    {
      this.pane_.refresh();
    }
  };

  return {
    EditorComponent: EditorComponent,
  };

})();
