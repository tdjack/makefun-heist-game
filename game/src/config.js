// Every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window.
export const FIELD = { width: 1280, height: 720 };
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 175,
  sneakSpeed: 98,
  // A guard that gets this close spots you even in the dark.
  proximitySpot: 52,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 72,
  chaseSpeed: 148,
  investigateSpeed: 110,
  // Vision cone: half-angle and range in pixels.
  coneHalfAngle: 0.62,
  coneRange: 235,
  coneRangeLit: 285,
  // Detection fills per second while the player is seen.
  detectRate: 78,
  detectRateBush: 22,
  detectRateLit: 105,
  detectDrain: 26,
  // Seconds of no sight before a chasing guard gives up.
  loseSightTime: 3,
  investigateTime: 3.5,
};

export const LIVES = 3;
export const PEBBLES_PER_LEVEL = 3;
export const COINS_PER_LEVEL = 3;

// Wall-mounted security cameras: fixed position, sweeping vision cone.
export const CAMERA = {
  coneHalfAngle: 0.48,
  coneRange: 260,
  detectRate: 95,
  sweepSpeed: 0.55,
};

export const PALETTE = {
  backdrop: '#070a12',
  floorA: '#1a2233',
  floorB: '#161d2c',
  floorLine: '#232c40',
  wall: '#3a4663',
  wallTop: '#55648c',
  crate: '#8a6a3b',
  crateTop: '#b08d4f',
  bush: '#1e4d2e',
  bushTop: '#2f7a44',
  lamp: '#f2c94c',
  lampGlow: 'rgba(242,201,76,0.13)',
  cone: 'rgba(242,201,76,0.28)',
  coneEdge: 'rgba(242,201,76,0.55)',
  coneAlert: 'rgba(229,83,75,0.34)',
  coneAlertEdge: 'rgba(229,83,75,0.65)',
  player: '#f2c94c',
  playerSneak: '#7dd3a8',
  camera: '#ff5a7a',
  cameraCone: 'rgba(255,90,122,0.26)',
  cameraConeEdge: 'rgba(255,90,122,0.6)',
  guard: '#e5534b',
  guardBody: '#c94a3f',
  relic: '#ffd94d',
  exit: '#39d98a',
  exitLocked: '#5a6b7a',
  text: '#eef1f5',
  muted: '#9aa5b8',
  panel: '#141a28',
  danger: '#e5534b',
  gold: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'midnight-vault.best';
