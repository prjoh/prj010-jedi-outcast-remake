import * as THREE from 'three';
import { ecs_component } from '../ECS/Component';
import { Time } from '../Time';
import { log } from '../Log';
import { env } from '../Env';
import { component_editor } from './Editor';


export const component_enemy_sensors = (() => {

  
  const eViewSensorState = Object.freeze({
    VSS_None:        0,
    VSS_Suspicious:  1,
    VSS_Detected:    2,
  });

  class EnemySensorsComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'EnemySensorsComponent';

    static editor_initialized = false;
    static draw_ai_sensors = false;
    static debug_meshes = [];

    get NAME() {
      return EnemySensorsComponent.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      // Check if player is in view cone
      //    Suspicious view distance --> investigate
      //    Detected view distance --> fight idle
      // Check if player is in sense circle (player can get only so far, maybe ~3m) --> fight idle

      this.agent_height = new THREE.Vector3(0.0, params.agent_height, 0.0);
      this.ray_from = new THREE.Vector3();
      this.ray_to = new THREE.Vector3();

      // TODO: We probably should add a timer for suspicous and detected!
      this.next_view_state_ = eViewSensorState.VSS_None;
      this.current_view_state_ = eViewSensorState.VSS_None;
      this.point_of_interest_ = new THREE.Vector3();
      this.view_state_update_cb_ = () => {};
      this.view_state_timer_ = Time.create_timer(5.0, () => {
        this.set_view_state_(this.next_view_state_); 
        this.view_state_update_cb_();
      }, false);

      // Check if player steps have been heard (distance) --> investigate
      // Investigation goal: point of interest
      //   - turn towards
      //   - navigate to point of interest

      this.sense_distance_ = params.sense_distance;

      this.view_angle_close_degrees_ = params.view_angle_close_degrees;
      this.view_angle_far_degrees_ = params.view_angle_far_degrees;
      this.view_distance_close_ = params.view_distance_close;
      this.view_distance_far_ = params.view_distance_far;

      if (env.DEBUG_MODE)
      {
        // this.cube1 = new THREE.Mesh(
        //   new THREE.BoxGeometry( 0.25, 0.25, 0.25 ),
        //   new THREE.MeshBasicMaterial( {color: 0x00ff00} )
        // ); 
        // this.cube2 = new THREE.Mesh(
        //   new THREE.BoxGeometry( 0.25, 0.25, 0.25 ),
        //   new THREE.MeshBasicMaterial( {color: 0xffff00} )
        // ); 
        // params.scene.add( this.cube1 );
        // params.scene.add( this.cube2 );

        const theta_start_close = (90.0 - this.view_angle_close_degrees_ * 0.5) * THREE.MathUtils.DEG2RAD;
        const theta_length_close = this.view_angle_close_degrees_ * THREE.MathUtils.DEG2RAD;
  
        const theta_start_far = (90.0 - this.view_angle_far_degrees_ * 0.5) * THREE.MathUtils.DEG2RAD;
        const theta_length_far = this.view_angle_far_degrees_ * THREE.MathUtils.DEG2RAD;
  
        this.debug_mesh_ = new THREE.Mesh(
          new THREE.CircleGeometry( this.view_distance_close_, 32, theta_start_close, theta_length_close ),
          new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.3, transparent: true } )
        );
        // this.debug_mesh_.add(new THREE.AxesHelper(1.0));
  
        this.debug_mesh2_ = new THREE.Mesh(
          new THREE.CircleGeometry( this.view_distance_far_, 32, theta_start_far, theta_length_far ),
          new THREE.MeshBasicMaterial( { color: 0x0000ff, opacity: 0.3, transparent: true } )
        );
  
        this.debug_mesh3_ = new THREE.Mesh(
          new THREE.CircleGeometry( this.sense_distance_, 32, 0.0, Math.PI * 2.0 ),
          new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: true } )
        );
        this.debug_mesh3_.rotateX(THREE.MathUtils.DEG2RAD * -90.0);
  
        this.debug_mesh_sensor_state_ = new THREE.Mesh(
          new THREE.SphereGeometry( 0.2, 8, 8 ),
          new THREE.MeshBasicMaterial( { color: 0xffffff } )
        );
  
        params.scene.add( this.debug_mesh_ );
        params.scene.add( this.debug_mesh2_ );
        params.scene.add( this.debug_mesh3_ );
        params.scene.add( this.debug_mesh_sensor_state_ );

        EnemySensorsComponent.debug_meshes.push( this.debug_mesh_ );
        EnemySensorsComponent.debug_meshes.push( this.debug_mesh2_ );
        EnemySensorsComponent.debug_meshes.push( this.debug_mesh3_ );
        EnemySensorsComponent.debug_meshes.push( this.debug_mesh_sensor_state_ );

        for (let mesh of EnemySensorsComponent.debug_meshes)
        {
          mesh.visible = EnemySensorsComponent.draw_ai_sensors;
        }
      }
    }

    destroy()
    {
      if (env.DEBUG_MODE)
      {
        for (let mesh of EnemySensorsComponent.debug_meshes)
        {
          mesh.material.dispose();
          mesh.geometry.dispose();
        }

        EnemySensorsComponent.debug_meshes = [];
        EnemySensorsComponent.editor_initialized = false;
        EnemySensorsComponent.draw_ai_behaviors = false;
      }

      super.destroy();
    }

    on_initialized()
    {
      super.on_initialized();

      if (env.DEBUG_MODE && EnemySensorsComponent.editor_initialized === false)
      {
        const e_singletons = this.entity.manager.get_entity("Singletons");
    
        let c_editor = e_singletons.get_component("EditorComponent");
  
        let debug_draw_page = c_editor.get_page(component_editor.eEditorPage.EP_DebugDraw);

        debug_draw_page.add_binding(EnemySensorsComponent, 'draw_ai_sensors', "AISensors", null, (value) => {
          for (let mesh of EnemySensorsComponent.debug_meshes)
          {
            mesh.visible = value;
          }
        });

        EnemySensorsComponent.editor_initialized = true;
      }
    }

    get current_view_state()
    {
      return this.current_view_state_;
    }

    get next_view_state()
    {
      return this.next_view_state_;
    }

    get point_of_interest()
    {
      return this.point_of_interest_;
    }

    set_view_state_(state)
    {
      this.current_view_state_ = state;

      log.debug(`${this.entity.name} view_state -> ${this.current_view_state_}`);

      switch (this.current_view_state_)
      {
        case eViewSensorState.VSS_None:
        {
          this.debug_mesh_sensor_state_.material.color.setHex(0xffffff);
          break;
        }
        case eViewSensorState.VSS_Suspicious:
        {
          this.debug_mesh_sensor_state_.material.color.setHex(0x0000ff);
          break;
        }
        case eViewSensorState.VSS_Detected:
        {
          this.debug_mesh_sensor_state_.material.color.setHex(0xff0000);
          break;
        }
      }
    }

    schedule_view_state_update(state, time_s, cb = () => {})
    {
      this.next_view_state_ = state;
      this.view_state_update_cb_ = cb;
      Time.reset_timer(this.view_state_timer_, time_s);
      Time.start_timer(this.view_state_timer_);
    }

    update_point_of_interest(position)
    {
      this.point_of_interest_.copy(position);
    }
  };

  return {
    EnemySensorsComponent: EnemySensorsComponent,
    eViewSensorState: eViewSensorState,
  };

})();
