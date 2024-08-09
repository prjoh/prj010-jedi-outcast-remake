

// const POINTER_LOCK_TIMEOUT = 1500;

const BT_GRAVITY = -9.81;
const BT_COLLISION_MARGIN = 0.01;
const BT_MAX_DEBUG_VERTICES = (1 << 16);

// const RC_QUERY_POOL_SIZE = 16;
const RC_MAX_PATH_LENGTH = 1024;

const eCollisionGroup = Object.freeze({
  CG_None: 0,
  CG_Default: (1 << 0),
  CG_Environment: (1 << 1),
  CG_Player: (1 << 2),
  CG_Enemy: (1 << 3),
  CG_All: -1,
});

const NUM_ENEMIES = 10;

const ASSET_ID_KYLE = "kyle2_anim_comp2";
const ASSET_ID_ENEMY = "stormtrooper_anim2";

export { 
  // POINTER_LOCK_TIMEOUT, 
  BT_COLLISION_MARGIN,
  BT_GRAVITY,
  BT_MAX_DEBUG_VERTICES,
  // RC_QUERY_POOL_SIZE,
  RC_MAX_PATH_LENGTH,
  eCollisionGroup,
  NUM_ENEMIES,
  ASSET_ID_KYLE,
  ASSET_ID_ENEMY,
};
