// import * as THREE from 'three';
// import Stats from 'stats.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
// import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';


// const vs_sky = `
// varying vec3 vWorldPosition;

// void main() {
//   vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
//   vWorldPosition = worldPosition.xyz;

//   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
// }`;

// const fs_sky = `
// uniform vec3 topColor;
// uniform vec3 bottomColor;
// uniform float offset;
// uniform float exponent;

// varying vec3 vWorldPosition;

// void main() {
//   float h = normalize( vWorldPosition + offset ).y;
//   gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
// }`;


// function set_event_handlers() {
//   window.onfocus = (event) => { set_request_update(true); };
//   window.onblur = (event) => { set_request_update(false); };
//   window.onresize = (event) => { on_window_resize(); };
//   document.onmousemove = (event) => { on_mouse_move(event); };
//   document.onwheel = (event) => { on_wheel(event); };
//   document.onmousedown = (event) => { on_mouse_down(event); };
//   document.onkeydown = (event) => { on_key_down(event); };
//   document.onkeyup = (event) => { on_key_up(event); };
//   document.onpointerlockchange = (event) => { on_pointer_lock_change() };
// }
// set_event_handlers();


// const canvas = document.getElementById('canvas');
// const renderer = new THREE.WebGLRenderer({
//   powerPreference: "high-performance",
//   antialias: true,
// });
// renderer.gammaFactor = 2.2;
// renderer.outputEncoding = THREE.sRGBEncoding;
// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// renderer.domElement.onclick = (event) => {
//   renderer.domElement.requestPointerLock().catch(() => {
//     setTimeout(() => { renderer.domElement.requestPointerLock(); }, lock_timeout);
//   });
// };
// canvas.appendChild(renderer.domElement);


// const canvas_parent = document.getElementById('scene');
// const stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
// canvas_parent.appendChild(stats.dom)


// const fov = 60;
// const aspect = window.innerWidth / window.innerHeight;
// const near = 1.0;
// const far = 5000.0;
// const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// camera.position.set(0, 30, 30);


// const loading_manger = new THREE.LoadingManager();
// loading_manger.onStart = (path, items_loaded, items_total) => {
//   console.log("Started loading file: " + path + ".\nLoaded " + items_loaded + " of " + items_total + " files.");
// };
// loading_manger.onProgress = (path, items_loaded, items_total) => {
//   console.log("Loading file: " + path + ".\nLoaded " + items_loaded + " of " + items_total + " files.");
// };
// loading_manger.onLoad = () => {
//   console.log("Loading complete!");
//   set_event_handlers();
//   set_request_update(true);
// };
// loading_manger.onError = (path) => {
//   console.log("There was an error loading " + path);
// };

// /*
//  * Creating Mesh objects
//  */
// const gltf_loader = new GLTFLoader(loading_manger);
// function load_gltf_model(path, model_instance, interactable) {
//   gltf_loader.load(path, (gltf) => {

//     gltf.scene.traverse(c => {
//       if (c.material) {
//         if (interactable)
//           raycast_objects.push(c);
//       //   else
//       //   {
//       //     let materials = c.material;
//       //     if (!(c.material instanceof Array)) {
//       //       materials = [c.material];
//       //     }
//       //
//       //     for (let m of materials) {
//       //       if (m) {
//       //         if (m.map)
//       //           c.material = new MeshBasicMaterial({ map: m.map });
//       //         else
//       //           c.material = new MeshBasicMaterial({ color: m.color });
//       //       }
//       //     }
//       //   }
//       }
//     });

//     model_instance.obj = gltf.scene;
//     model_instance.obj.position.copy(model_instance.spawn.position);
//     model_instance.obj.rotation.copy(model_instance.spawn.rotation);
//     model_instance.obj.scale.copy(model_instance.spawn.scale);
//     scene.add(gltf.scene);
//   });
// }

// function Transform(position, rotation, scale) {
//   this.position = position;
//   this.rotation = rotation;
//   this.scale = scale;
// }

// function Model(path, transform, interactable) {
//   this.obj = null;
//   this.spawn = transform;

//   load_gltf_model(path, this, interactable);
// }

// /*
//  * Creating SVG objects
//  */
// const svg_loader = new SVGLoader(loading_manger);
// function load_svg(url, shape_instance, interactable)
// {
//   svg_loader.load(url, (data) => {
//     const paths = data.paths;
//     const group = new THREE.Group();

//     for (let i = 0; i < paths.length; i++) {
//       const path = paths[i];
//       const material = new THREE.MeshBasicMaterial({
//         color: path.color,
//         side: THREE.DoubleSide,
//         depthWrite: false
//       });

//       const shapes = SVGLoader.createShapes(path);
//       for (let j = 0; j < shapes.length; j++) {
//         const shape = shapes[j];
//         const geometry = new THREE.ShapeGeometry(shape);
//         const mesh = new THREE.Mesh(geometry, material);
//         mesh.rotation.x = Math.PI;
//         group.add(mesh);

//         if (interactable)
//           raycast_objects.push(mesh);
//       }
//     }

//     scene.add(group);

//     shape_instance.obj = group;
//     shape_instance.obj.position.copy(shape_instance.spawn.position);
//     shape_instance.obj.rotation.copy(shape_instance.spawn.rotation);
//     shape_instance.obj.scale.copy(shape_instance.spawn.scale);
//   });
// }

// function SVGShape(path, transform, interactable) {
//   this.obj = null;
//   this.spawn = transform;

//   load_svg(path, this, interactable);
// }

// /*
//  * Creating Text objects
//  */
// const font_loader = new FontLoader(loading_manger);
// function load_font(font_name, text_obj_instance)
// {
//   font_loader.load(font_paths[font_name], (font) => {
//     fonts[font_name] = font;
//     text_obj_instance.obj = create_text_mesh(text_obj_instance.text,
//                                              font,
//                                              text_obj_instance.color1,
//                                              text_obj_instance.color2,
//                                              text_obj_instance.spawn,
//                                              text_obj_instance.parameters);
//   });
// }

// function create_text_mesh(text, font, color1, color2, transform, parameters) {
//   let textGeo = new TextGeometry( text, {
//     font: font,
//     size: parameters.size,
//     height: parameters.height,
//     curveSegments: parameters.curve_segments,
//     bevelEnabled: parameters.bevel,
//     bevelThickness: parameters.bevel_thickness,
//     bevelSize: parameters.bevel_size,
//   });

//   textGeo.computeBoundingBox();

//   const center_offset = - 0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

//   let materials = [
//     // new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true, transparent: true, opacity: 0.1 } ), // front
//     // new THREE.MeshPhongMaterial( { color: 0xffffff, transparent: true, opacity: 0.1  } ) // side
//     new THREE.MeshBasicMaterial( { color: color1 } ), // front
//     new THREE.MeshBasicMaterial( { color: color2 } ) // side
//   ];
//   let textMesh1 = new THREE.Mesh( textGeo, materials );
//   textMesh1.position.x = center_offset;

//   let group = new THREE.Group();
//   group.position.copy(transform.position);
//   group.rotation.copy(transform.rotation);
//   group.scale.copy(transform.scale);
//   group.add( textMesh1 );

//   if (parameters.mirror) {
//     let textMesh2 = new THREE.Mesh( textGeo, materials );

//     textMesh2.position.x = centerOffset;
//     textMesh2.position.z = parameters.height;

//     textMesh2.rotation.x = Math.PI;
//     textMesh2.rotation.y = Math.PI * 2;

//     group.add(textMesh2);
//   }
//   scene.add(group);
//   return group
// }

// function TextObject(text, font, color1, color2, transform, parameters) {
//   this.obj = null;
//   this.text = text;
//   this.color1 = color1;
//   this.color2 = color2;
//   this.spawn = transform;
//   this.parameters = parameters;

//   if (font in fonts)
//     this.obj = create_text_mesh(text, fonts[font], transform, parameters)
//   else
//     load_font(font, this)
// }


// let raycast_objects = [];
// const scene = new THREE.Scene();
// function init_scene() {
//   scene.background = new THREE.Color().setHex(0xffffff);
//   // scene.fog = new THREE.Fog( scene.background, 1, 1500 );
//   scene.fog = new THREE.FogExp2(scene.background, 0.001);

//   /*
//    * SCENE LIGHTING
//    */
//   const hemiLight = new THREE.HemisphereLight( 0xfefae0, 0x3c6e71, 0.6 );
//   scene.add( hemiLight );

//   const dirLight = new THREE.DirectionalLight( 0xfefae0, 1.0 );
//   dirLight.position.set( -1, 1.75, 1 );
//   scene.add( dirLight );
//   // const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
//   // scene.add( dirLightHelper );

//   /*
//    * SHADOW SETTINGS
//    */
//   dirLight.castShadow = true;
//   // Shadow resolution
//   dirLight.shadow.mapSize.width = 2048;
//   dirLight.shadow.mapSize.height = 2048;
//   // Orthographic camera to generate scene depth map
//   const d = 50;
//   dirLight.shadow.camera.left = -d;
//   dirLight.shadow.camera.right = d;
//   dirLight.shadow.camera.top = d;
//   dirLight.shadow.camera.bottom = -d;
//   dirLight.shadow.camera.near = 0.5;
//   dirLight.shadow.camera.far = 100;
//   // reduce artifacts in shadows
//   dirLight.shadow.bias = - 0.0001;

//   /*
//    * CREATE GROUND
//    */
//   const groundGeo = new THREE.PlaneGeometry( 10000, 10000 );
//   const groundMat = new THREE.MeshLambertMaterial( { color: 0x3c6e71 } );
//   const ground = new THREE.Mesh( groundGeo, groundMat );
//   ground.rotation.x = - Math.PI / 2;
//   ground.receiveShadow = true;
//   scene.add( ground );

//   /*
//    * CREATE SKY
//    */
//   const uniforms = {
//     "topColor": { value: new THREE.Color().copy(hemiLight.color) },
//     "bottomColor": { value: new THREE.Color().copy(scene.fog.color) },
//     "offset": { value: 33 },
//     "exponent": { value: 0.6 }
//   };
//   const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
//   const skyMat = new THREE.ShaderMaterial( {
//     uniforms: uniforms,
//     vertexShader: vs_sky,
//     fragmentShader: fs_sky,
//     side: THREE.BackSide
//   } );
//   const sky = new THREE.Mesh( skyGeo, skyMat );
//   scene.add( sky );

//   /*
//    * CREATE CUBE
//    */
//   const cube = new THREE.Mesh(
//     new THREE.BoxGeometry(10, 10, 10),
//     new THREE.MeshStandardMaterial({color: 0xd9d9d9})
//   );
//   cube.position.set(0, 20, -50);
//   cube.rotation.set(0, - Math.PI / 4, 0);
//   cube.castShadow = true;
//   cube.receiveShadow = true;
//   scene.add(cube);
//   raycast_objects.push(cube);
// }
// init_scene();


// /*
//  * Event handlers
//  */
// function on_window_resize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }

// const pointer = new THREE.Vector2();
// const pointer_delta = new THREE.Vector2();
// function on_mouse_move(event) {
//   pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
//   pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   pointer_delta.x = event.movementX;
//   pointer_delta.y = event.movementY;
// }

// function on_mouse_down(event) {

// }

// function on_wheel(event) {

// }

// function on_key_down(event) {
//   switch (event.keyCode) {
//     case 87: // w
//       camera_translation.z = 1;
//       break;
//     case 65: // a
//       camera_translation.x = -1;
//       break;
//     case 83: // s
//       camera_translation.z = -1;
//       break;
//     case 68: // d
//       camera_translation.x = 1;
//       break;
//     default:
//   }
// }

// function on_key_up(event) {
//   switch (event.keyCode) {
//     case 87: // w
//       camera_translation.z = 0;
//       break;
//     case 65: // a
//       camera_translation.x = 0;
//       break;
//     case 83: // s
//       camera_translation.z = 0;
//       break;
//     case 68: // d
//       camera_translation.x = 0;
//       break;
//     default:
//   }
// }

// let is_locked = false;
// let lock_timeout = 0;
// function on_pointer_lock_change() {
//   if (document.pointerLockElement === renderer.domElement)
//     is_locked = true;
//   else {
//     is_locked = false;
//     lock_timeout = 1500;
//   }
// }


// /*
//  * Core loop
//  */
// const raycaster = new THREE.Raycaster();
// let intersected;
// function check_pointer_intersection() {
//   raycaster.setFromCamera(pointer, camera);
//   const intersects = raycaster.intersectObjects(raycast_objects, false);
//   if (intersects.length > 0) {

//     if (intersected !== intersects[0].object) {
//       if (intersected)
//         intersected.material.emissive.setHex(intersected.originalHex);

//       intersected = intersects[0].object;
//       if (intersected)
//       {
//         intersected.originalHex = intersected.material.emissive.getHex();
//         intersected.material.emissive.setHex(0xff0000);
//       }
//     }
//   } else {
//     // Reset hex value of previous intersected, if it is not in selected state
//     if (intersected)
//       intersected.material.emissive.setHex(intersected.originalHex);

//     intersected = null;
//   }
// }

// let camera_rotation = new THREE.Euler(0, 0, 0, 'YXZ');
// let camera_translation = new THREE.Vector3();
// let camera_forward = new THREE.Vector3();
// let camera_right = new THREE.Vector3();
// function update_camera(delta) {
//   camera_rotation.setFromQuaternion(camera.quaternion);
//   camera_rotation.x -= pointer_delta.y * delta * 0.1;
//   camera_rotation.x = Math.max( Math.PI / 2 - Math.PI, Math.min( Math.PI / 2 - 0, camera_rotation.x ) );
//   camera_rotation.y -= pointer_delta.x * delta * 0.1;
//   camera.quaternion.setFromEuler(camera_rotation);

//   pointer_delta.x = 0
//   pointer_delta.y = 0

//   camera.getWorldDirection(camera_forward)
//   camera_right.setFromMatrixColumn(camera.matrix,0);
//   camera.position.addScaledVector(camera_right, camera_translation.x * 25.0 * delta);
//   camera.position.addScaledVector(camera_forward, camera_translation.z * 25.0 * delta);
// }

// let request_update;
// let request_update_id = null;
// function set_request_update(is_active) {
//   if (request_update_id !== null)
//     cancelAnimationFrame(request_update_id);

//   if (is_active)
//   {
//     request_update = true;
//     update();
//   }
//   else
//     request_update = false;
//   console.log("renderer_active=" + is_active)
// }

// const clock = new THREE.Clock();
// function update() {
//   if (request_update)
//     request_update_id = requestAnimationFrame(update);

//   const delta = clock.getDelta();

//   /*
//    * Update objects here
//    */
//   if (!is_locked)
//     check_pointer_intersection();
//   else
//     update_camera(delta);

//   stats.update();

//   renderer.render(scene, camera);
// }
// set_request_update(true);

import { init } from 'recast-navigation';
import { game } from './Game'

let game_instance = null;

window.addEventListener('DOMContentLoaded', async () => {
  const ammo_lib = await Ammo();
  Ammo = ammo_lib;

  await init();

  game_instance = new game.Game();
  game_instance.run();
});
