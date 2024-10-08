import * as THREE from 'three';

import { env } from '../Env';
import { ecs_system } from '../ECS/System';
import { ecs_component } from '../ECS/Component';

import { component_mesh } from '../Components/Mesh';
import { component_transform } from '../Components/Transform';


export const system_renderer = (() => {

  class RenderSystem extends ecs_system.System
  {
    constructor(entity_manager)
    {
      super(entity_manager);

      this.render_system_tuples_ = new ecs_component.ComponentContainer(
        component_mesh.SkinnedMeshComponent.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
      );
      this.render_system_tuples_2_ = new ecs_component.ComponentContainer(
        component_mesh.InstancedMeshComponent.CLASS_NAME,
      );
      this.render_system_tuples_3_ = new ecs_component.ComponentContainer(
        component_mesh.StaticMeshComponent.CLASS_NAME,
        component_transform.Transform.CLASS_NAME,
      );

      window.onresize = this.on_window_resize_.bind(this);
    }

    init() {}

    post_init() {}

    pre_update()
    {
      this.entity_manager_.update_component_container(this.render_system_tuples_);
      this.entity_manager_.update_component_container(this.render_system_tuples_2_);
      this.entity_manager_.update_component_container(this.render_system_tuples_3_);
    }

    fixed_update(fixed_delta_time_s) {}

    update(delta_time_s)
    {
      const [static_meshes, transforms2] = this.render_system_tuples_3_.component_tuples;
      const static_mesh_tuples_size = this.render_system_tuples_3_.size;

      for (let i = 0; i < static_mesh_tuples_size; ++i)
      {
        let c_mesh = static_meshes[i];
        const c_transform = transforms2[i];
        // TODO
        if (c_mesh.mesh_ !== null)
        {
          c_mesh.set_transform(c_transform);
        }
      }

      const [meshes, transforms] = this.render_system_tuples_.component_tuples;
      const size = this.render_system_tuples_.size;

      for (let i = 0; i < size; ++i)
      {
        let c_mesh = meshes[i];
        const c_transform = transforms[i];
        // TODO
        if (c_mesh.mesh_ !== null && c_transform.is_animation_root === false)
        {
          c_mesh.set_transform(c_transform);
        }
        // TODO
        // if (c_mesh.mixer_ !== null)
        // {
        //   c_mesh.mixer_.update(delta_time_s);
        // }
        // if (c_mesh.bone_)
        // {
        //   let pos = new THREE.Vector3();
        //   pos.copy(c_mesh.bone_.position);
        //   pos.z -= 18.0;
        //   pos.applyMatrix4(c_mesh.bone_.matrixWorld);
          
        //   let rot = new THREE.Quaternion();
        //   // c_mesh.bone_.getWorldPosition(pos);
        //   c_mesh.bone_.getWorldQuaternion(rot);

        //   const e_mesh_collider = this.get_entity("PlayerSwordTrigger");
        //   let c_box_collider = e_mesh_collider.get_component("BoxTrigger");
        //   let col_pos = c_box_collider.body_.getWorldTransform().getOrigin();
        //   let col_rot = c_box_collider.body_.getWorldTransform().getRotation();
        //   col_pos.setValue(pos.x, pos.y, pos.z);
        //   col_rot.setValue(rot.x, rot.y, rot.z, rot.w);
        //   c_box_collider.body_.getWorldTransform().setOrigin(col_pos);
        //   c_box_collider.body_.getWorldTransform().setRotation(col_rot);
        // }
      }

      const e_singletons = this.get_entity("Singletons");
      let c_render_state = e_singletons.get_component("RenderState");
      let c_camera = e_singletons.get_component("PerspectiveCamera");

      if (env.DEBUG_MODE)
      {
        let c_debug_drawer = e_singletons.get_component("DebugDrawer");
        c_debug_drawer.tick(delta_time_s);
      }

      // if (c_render_state.has_resized)
      // {
      //   const [canvas_width, canvas_height] = c_render_state.canvas_size;
      //   c_camera.camera.aspect = canvas_width / canvas_height;
      //   c_camera.camera.updateProjectionMatrix();
      //   c_render_state.renderer.setSize(canvas_width, canvas_height);
      //   c_render_state.has_resized = false;
      // }

      // Instanced Mesh Frustum Culling
      const [instanced_meshes] = this.render_system_tuples_2_.component_tuples;
      const instanced_meshes_size = this.render_system_tuples_2_.size;
      const matrix_stride = 16; // Each instance matrix has 16 entries
      const camera_frustum = c_camera.frustum;
      let bounding_sphere = c_render_state.instanced_bounding_sphere;

      for (let i = 0; i < instanced_meshes_size; ++i)
      {
        let c_instanced_mesh = instanced_meshes[i];

        const radius = c_instanced_mesh.bounding_sphere_radius;
        let positions = c_instanced_mesh.instance_positions;
        let matrix_array = c_instanced_mesh.matrix_array;
        let last_visible_index = c_instanced_mesh.instance_count - 1;

        for (let j = 0; j <= last_visible_index; )
        {
          bounding_sphere.set(positions[j], radius);

          if (!camera_frustum.intersectsSphere(bounding_sphere))
          {
            // Move the instance matrix at index j to the end of the array
            for (let k = 0; k < matrix_stride; ++k)
            {
              const temp = matrix_array[j * matrix_stride + k];
              matrix_array[j * matrix_stride + k] = matrix_array[last_visible_index * matrix_stride + k];
              matrix_array[last_visible_index * matrix_stride + k] = temp;
            }
        
            // Move the instance position to the end of the array
            const temp_position = positions[j];
            positions[j] = positions[last_visible_index];
            positions[last_visible_index] = temp_position;
        
            // Decrease the last visible index
            --last_visible_index;
          }
          else
          {
            // Move to the next matrix if it's not culled
            ++j;
          }
        }

        c_instanced_mesh.set_draw_count(last_visible_index + 1);
      }

      let c_scene_lights = e_singletons.get_component("SceneLights");
      const e_player = this.entity_manager_.get_entity("Player");
      const c_player_transform = e_player.get_component("Transform");

      let directional_light = c_scene_lights.directional_light;
      const directional_light_position = c_scene_lights.directional_light_position;

      directional_light.position.copy(c_player_transform.position)
        .add(directional_light_position);

      const e_player_mesh = this.entity_manager_.get_entity("PlayerMesh");
      let c_glow = e_player_mesh.get_component("LightsaberGlow");
      c_glow.update_point_light();

      c_render_state.composer.render();

      if (env.DEBUG_MODE)
      {
        c_render_state.stats.update();
      }

      // c_render_state.renderer.render(c_render_state.scene, c_camera.camera);

      // this.csm_.update(this.camera_.matrix);

      // c_render_state.opaque_pass.clearColor = new THREE.Color(0x000000);
      // // c_render_state.opaque_pass.renderToScreen = true;
      // c_render_state.opaque_pass.clearAlpha = 0.0;
      // c_render_state.opaque_pass.render(
      //   c_render_state.renderer, 
      //   c_render_state.write_buffer, 
      //   c_render_state.read_buffer, 
      //   delta_time_s, 
      //   false
      // );

      // // VIDEO HACK
      // c_render_state.bloom_pass.renderToScreen = true;
      // c_render_state.bloom_pass.render(
      //   c_render_state.renderer, 
      //   c_render_state.write_buffer, 
      //   c_render_state.read_buffer, 
      //   delta_time_s, 
      //   false
      // );
      // // this.uiPass_.render(this.threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);

      // // this.radialBlur_.uniforms.center.value.set(window.innerWidth * 0.5, window.innerHeight * 0.5);
      // // this.radialBlur_.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
      // // // VIDEO HACK
      // // this.radialBlur_.render(this.threejs_, this.writeBuffer_, this.readBuffer_, timeElapsedS, false);
      // c_render_state.swap_buffers();

      // c_render_state.fxaa_pass.render(
      //   c_render_state.renderer, 
      //   c_render_state.write_buffer, 
      //   c_render_state.read_buffer, 
      //   delta_time_s, 
      //   false
      // );
      // c_render_state.swap_buffers();

      // c_render_state.gamma_pass.renderToScreen = true;
      // c_render_state.gamma_pass.render(
      //   c_render_state.renderer, 
      //   c_render_state.write_buffer, 
      //   c_render_state.read_buffer, 
      //   delta_time_s, 
      //   false
      // );
    }

    late_update(delta_time_s) {}

    on_window_resize_(e)
    {
      const e_singletons = this.get_entity("Singletons");
      let c_render_state = e_singletons.get_component("RenderState");
      let c_camera = e_singletons.get_component("PerspectiveCamera");

      c_camera.camera.aspect = window.innerWidth / window.innerHeight;
      c_camera.camera.updateProjectionMatrix();

      c_render_state.set_size(window.innerWidth, window.innerHeight);

      // this.csm_.updateFrustums();
    }
  };

  return {
    RenderSystem: RenderSystem,
  };

})();
