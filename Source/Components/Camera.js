import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { env } from '../Env';

export const component_camera = (() => {

  class PerspectiveCamera extends ecs_component.Component
  {
    static CLASS_NAME = 'PerspectiveCamera';

    get NAME() {
      return PerspectiveCamera.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.scene_ = params.scene;

      this.camera = new THREE.PerspectiveCamera(
        params.fov, 
        params.aspect, 
        params.near, 
        params.far
      );

      this.view_projection_matrix_ = new THREE.Matrix4();
      this.frustum_ = new THREE.Frustum();
    }

    get frustum()
    {
      this.camera.updateWorldMatrix(true, true);
      this.view_projection_matrix_.multiplyMatrices( this.camera.projectionMatrix, this.camera.matrixWorldInverse );
      this.frustum_.setFromProjectionMatrix(this.view_projection_matrix_);
      return this.frustum_;
    }

    // on_initialized()
    // {
    //   super.on_initialized();

    //   if (env.DEBUG_MODE)
    //   {
    //     const e_singletons = this.entity.manager.get_entity("Singletons");
      
    //     let c_debug = e_singletons.get_component("DebugComponent");
  
    //     c_debug.editor_camera = new THREE.PerspectiveCamera(
    //       this.camera.fov,
    //       this.camera.aspect,
    //       this.camera.near,
    //       this.camera.far,
    //     );
    //     c_debug.camera_helper = new THREE.CameraHelper(c_debug.editor_camera);

    //     this.scene_.add(c_debug.editor_camera);
    //     this.scene_.add(c_debug.camera_helper);
    //   }
    // }
  };

  class CameraController extends ecs_component.Component
  {
    static CLASS_NAME = 'CameraController';

    get NAME() {
      return CameraController.CLASS_NAME;
    }

    constructor(camera, target_transform)
    {
      super();

      this.camera = camera;
      this.target_transform = target_transform;

      this.position_offset_local = new THREE.Vector3(0, 0.0, -2.5);

      this.position_offset_buffer = new THREE.Vector3();
      this.current_position_offset = new THREE.Vector3();
    }
  };

  return {
    PerspectiveCamera: PerspectiveCamera,
    CameraController: CameraController,
  };

})();
