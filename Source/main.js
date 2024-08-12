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
