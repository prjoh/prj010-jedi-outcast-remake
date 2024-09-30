

const ANIM_FPS = 30.0;
const PLAYER_HEIGHT = 1.5; // Used for AI raycasts

const BT_FIXED_TIME_STEP = 1.0 / 60.0;
const BT_GRAVITY = -9.81;
const BT_COLLISION_MARGIN = 0.01;
const BT_MAX_DEBUG_VERTICES = (1 << 18);

const RC_MAX_PATH_LENGTH = 1024;

const AUDIO_DELAY = 5.0;

const eCollisionGroup = Object.freeze({
  CG_None: 0,
  CG_Default: (1 << 0),
  CG_Environment: (1 << 1),
  CG_Player: (1 << 2),
  CG_PlayerDeflector: (1 << 3),
  CG_Enemy: (1 << 4),
  CG_EnemyHitBox: (1 << 5),
  CG_All: -1,
});

const NUM_ENEMIES = 10;

const ASSET_ID_KYLE = "kyle2_anim_comp2";
const ASSET_ID_ENEMY = "stormtrooper_anim2";

export { 
  BT_FIXED_TIME_STEP,
  BT_COLLISION_MARGIN,
  BT_GRAVITY,
  BT_MAX_DEBUG_VERTICES,
  RC_MAX_PATH_LENGTH,
  eCollisionGroup,
  NUM_ENEMIES,
  ASSET_ID_KYLE,
  ASSET_ID_ENEMY,
  ANIM_FPS,
  PLAYER_HEIGHT,
  AUDIO_DELAY,
};
