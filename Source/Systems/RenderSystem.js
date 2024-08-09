import * as THREE from 'three';

import { Time } from '../Time';
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
        if (c_mesh.bone_)
        {
          let pos = new THREE.Vector3();
          pos.copy(c_mesh.bone_.position);
          pos.z -= 18.0;
          pos.applyMatrix4(c_mesh.bone_.matrixWorld);
          
          let rot = new THREE.Quaternion();
          // c_mesh.bone_.getWorldPosition(pos);
          c_mesh.bone_.getWorldQuaternion(rot);

          const e_mesh_collider = this.get_entity("PlayerSwordTrigger");
          let c_box_collider = e_mesh_collider.get_component("BoxTrigger");
          let col_pos = c_box_collider.body_.getWorldTransform().getOrigin();
          let col_rot = c_box_collider.body_.getWorldTransform().getRotation();
          col_pos.setValue(pos.x, pos.y, pos.z);
          col_rot.setValue(rot.x, rot.y, rot.z, rot.w);
          c_box_collider.body_.getWorldTransform().setOrigin(col_pos);
          c_box_collider.body_.getWorldTransform().setRotation(col_rot);
        }
      }

      const e_singletons = this.get_entity("Singletons");
      let c_render_state = e_singletons.get_component("RenderState");
      let c_camera = e_singletons.get_component("PerspectiveCamera");

      if (c_render_state.has_resized)
      {
        const [canvas_width, canvas_height] = c_render_state.canvas_size;
        c_camera.camera.aspect = canvas_width / canvas_height;
        c_camera.camera.updateProjectionMatrix();
        c_render_state.renderer.setSize(canvas_width, canvas_height);
        c_render_state.has_resized = false;
      }

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

      c_render_state.renderer.render(c_render_state.scene, c_camera.camera);
    }

    late_update(delta_time_s) {}
  };

  return {
    RenderSystem: RenderSystem,
  };

})();
