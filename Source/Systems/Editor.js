import { ecs_system } from '../ECS/System';


export const system_editor = (() => {

  class EditorSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);
    }

    init() {}

    post_init()
    {
      super.post_init();

      const e_singletons = this.get_entity("Singletons");
    
      let c_debug = e_singletons.get_component("DebugComponent");
      let c_editor = e_singletons.get_component("EditorComponent");

      const copy_vec3 = (from_three_v3, to_obj_v3) => {
        to_obj_v3.x = from_three_v3.x;
        to_obj_v3.y = from_three_v3.y;
        to_obj_v3.z = from_three_v3.z;
      };

      c_editor.params.lighting_hemi_intensity = c_debug.hemisphere_light.intensity;
      copy_vec3(c_debug.hemisphere_light.position, c_editor.params.lighting_hemi_pos);
      c_editor.params.lighting_hemi_color_sky = `#${c_debug.hemisphere_light.color.getHexString()}`;
      c_editor.params.lighting_hemi_color_ground = `#${c_debug.hemisphere_light.groundColor.getHexString()}`;

      c_editor.params.lighting_dir_intensity = c_debug.directional_light.intensity;
      copy_vec3(c_debug.directional_light.position, c_editor.params.lighting_dir_pos);
      c_editor.params.lighting_dir_color = `#${c_debug.directional_light.color.getHexString()}`;

      c_editor.refresh();
    }

    pre_update() {}

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const e_singletons = this.get_entity("Singletons");

      const c_editor = e_singletons.get_component("EditorComponent");
      const c_debug = e_singletons.get_component("DebugComponent");

      // Editor Mode

      // if (c_editor.params.editor_mode_enable)
      // {
      //   if (!c_debug.is_previous_frame_enabled)
      //   {
      //     c_debug.is_previous_frame_enabled = true;

      //     const c_camera = e_singletons.get_component("PerspectiveCamera");
      //     c_debug.editor_camera.position.copy(c_camera.camera.position);
      //     c_debug.editor_camera.rotation.copy(c_camera.camera.rotation);
      //   }

      //   c_debug.editor_camera.updateProjectionMatrix();
      //   c_debug.camera_helper.update();
      // }
      // else
      // {
      //   c_debug.is_previous_frame_enabled = false;
      // }

      // Profiling

      c_debug.stats.showPanel(c_editor.params.stats_mode);

      c_debug.stats.update();

      c_editor.params.render_info_geometries = c_debug.renderer_info.memory.geometries;
      c_editor.params.render_info_textures = c_debug.renderer_info.memory.textures;

      c_editor.params.render_info_draw_calls = c_debug.renderer_info.render.calls;
      c_editor.params.render_info_triangles = c_debug.renderer_info.render.triangles;

      // Debug Draw

      // c_debug.camera_helper.visible = c_editor.params.debug_draw_camera;

      for (const obj of c_debug.debug_lights)
      {
        obj.visible = c_editor.params.debug_draw_lights;
      }

      if (c_debug.physics_debug_drawer)
      {
        if (c_editor.params.debug_draw_physics)
        {
          c_debug.physics_debug_drawer.enable();
        }
        else
        {
          c_debug.physics_debug_drawer.disable();
        }
      }

      for (const obj of c_debug.debug_nav_meshes)
      {
        obj.visible = c_editor.params.debug_draw_navmesh;
      }

      for (const obj of c_debug.debug_nav_agents)
      {
        obj.visible = c_editor.params.debug_draw_navagent;
      }

      for (const obj of c_debug.debug_instanced_bounding_spheres)
      {
        obj.visible = c_editor.params.debug_draw_instanced_bs;
      }

      // Lighting

      const copy_color = (editor_color, three_color) => {
        three_color.setHex(Number(`0x${editor_color.substr(1)}`));
      };

      const copy_pos = (editor_pos, three_pos) => {
        three_pos.set(editor_pos.x, editor_pos.y, editor_pos.y);
      };

      c_debug.hemisphere_light.visible = c_editor.params.lighting_hemi_enable;
      copy_pos(c_editor.params.lighting_hemi_pos, c_debug.hemisphere_light.position);
      c_debug.hemisphere_light.intensity = c_editor.params.lighting_hemi_intensity;
      copy_color(c_editor.params.lighting_hemi_color_sky, c_debug.hemisphere_light.color);
      copy_color(c_editor.params.lighting_hemi_color_ground, c_debug.hemisphere_light.groundColor);

      c_debug.directional_light.visible = c_editor.params.lighting_dir_enable;
      copy_pos(c_editor.params.lighting_dir_pos, c_debug.directional_light.position);
      c_debug.directional_light.intensity = c_editor.params.lighting_dir_intensity;
      copy_color(c_editor.params.lighting_dir_color, c_debug.directional_light.color);

      for (const obj of c_debug.dynamic_lights)
      {
        obj.visible = c_editor.params.lighting_dynamic_enable;
      }
    }

    late_update(delta_time_s) {}
  };

  return {
    EditorSystem: EditorSystem,
  };

})();
