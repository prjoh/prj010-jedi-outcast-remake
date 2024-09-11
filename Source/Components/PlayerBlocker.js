import * as THREE from 'three';

import { eCollisionGroup } from '../Config';
import { ecs_component } from '../ECS/Component';
import { component_physics } from './Physics';

export const component_player_blocker = (() => {

  class PlayerBlocker extends ecs_component.Component
  {
    static CLASS_NAME = 'PlayerBlocker';

    get NAME()
    {
      return PlayerBlocker.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      // const geometry = new THREE.CylinderGeometry( 2.0, 2.0, 3.3, 16 ); 
      // const material = new THREE.MeshBasicMaterial( {color: 0xffff00, wireframe: true } ); 
      // this.cylinder = new THREE.Mesh( geometry, material );

      // const geometry2 = new THREE.CylinderGeometry( 1.0, 1.0, 3.3, 16 ); 
      // const material2 = new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true } ); 
      // this.cylinder2 = new THREE.Mesh( geometry2, material2 );

      this.outer_trigger_ = null;
      this.inner_trigger_ = null;
    }

    on_initialized()
    {
      // const c_mesh = this.entity_.parent.get_component("SkinnedMeshComponent");
      // c_mesh.mesh_.add(this.cylinder);
      // c_mesh.mesh_.add(this.cylinder2);

      const e_singletons = this.entity_.manager.get_entity("Singletons");

      let e_player_deflector_transform = this.entity_.get_component("Transform");
      this.outer_trigger_ = this.entity_.add_component(component_physics.CylinderTrigger, {
        physics_state: e_singletons.get_component("PhysicsState"),
        transform: e_player_deflector_transform,
        radius: 2.0,
        height: 2.0,
        collision_group: eCollisionGroup.CG_PlayerDeflector,
        collision_mask: eCollisionGroup.CG_All & ~eCollisionGroup.CG_PlayerDeflector,
      });
  
      // let e_player_deflector_child = entity_manager.create_entity("PlayerDeflectorChild", this.entity_);
      // let e_player_deflector_child_transform = e_player_deflector.get_component("Transform");
      this.inner_trigger_ = this.entity_.add_component(component_physics.CylinderTrigger, {
        physics_state: e_singletons.get_component("PhysicsState"),
        transform: e_player_deflector_transform,
        radius: 0.5,
        height: 2.0,
        collision_group: eCollisionGroup.CG_PlayerDeflector,
        collision_mask: eCollisionGroup.CG_All & ~eCollisionGroup.CG_PlayerDeflector,
      });
    }
  };

  return {
    PlayerBlocker: PlayerBlocker,
  };

})();
