import { init } from 'recast-navigation';
import { game } from './Game'

let start_menu = document.getElementById('start-menu');
let start_button = document.getElementById('start-button');
let canvas = document.getElementById('canvas');

start_button.addEventListener('click', async () => {

  start_menu.classList.add('hidden');

  canvas.requestPointerLock({
    unadjustedMovement: true,
  });

  start();

});

let game_instance = null;
window.AmmoLoader = Ammo;

async function start()
{
  await init();

  game_instance = new game.Game();
  game_instance.run();
}
