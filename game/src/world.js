// The game's rules and state, with no drawing and no browser in it:
// the thief, patrolling guards with vision cones, sweeping security
// cameras, the alarm meter, loot stashes, coin distractions, lives and
// the getaway exit. step() advances one fixed step and returns what
// happened as bit flags.
import { CAMERA, COLS, FIELD, GUARD, LIVES, PEBBLES_PER_LEVEL, PLAYER, ROWS, TILE } from './config.js';
import { LEVELS, parseLevel } from './levels.js';

export const EVENT_RELIC = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_LEVEL = 8;
export const EVENT_WIN = 16;
export const EVENT_PEBBLE = 32;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createWorld() {
  const state = {
    levelIndex: 0,
    level: null,
    player: { x: 60, y: 60, vx: 0, vy: 0, sneaking: false, moving: false },
    guards: [],
    cameras: [],
    relics: [],
    exit: { x: 0, y: 0 },
    start: { x: 60, y: 60 },
    detection: 0,
    alarm: false,
    lives: LIVES,
    score: 0,
    elapsed: 0,
    pebbles: PEBBLES_PER_LEVEL,
    pebble: null,
    pebbleTimer: 0,
    lastSeen: null,
    loseSight: 0,
    caughtTimer: 0,
    won: false,
    levelDone: false,
  };

  function loadLevel(index) {
    const def = LEVELS[index % LEVELS.length];
    const parsed = parseLevel(def);
    state.levelIndex = index;
    state.level = { def, ...parsed };
    state.player.x = parsed.start.x;
    state.player.y = parsed.start.y;
    state.start = parsed.start;
    state.exit = parsed.exit;
    state.relics = parsed.relics.map((r) => ({ x: r.cx * TILE + TILE / 2, y: r.cy * TILE + TILE / 2, taken: false }));
    state.cameras = (def.cameras || []).map((c) => ({
      x: c.x * TILE + TILE / 2, y: c.y * TILE + TILE / 2,
      base: c.base, sweep: c.sweep, facing: c.base, seeing: false,
    }));
    state.guards = def.guards.map((g) => ({
      x: g.x * TILE + TILE / 2,
      y: g.y * TILE + TILE / 2,
      patrol: g.patrol.map(([cx, cy]) => ({ x: cx * TILE + TILE / 2, y: cy * TILE + TILE / 2 })),
      patrolIndex: 1,
      facing: 0,
      mode: 'patrol',
      investigate: null,
      investigateTimer: 0,
      pauseTimer: 0,
    }));
    state.detection = 0;
    state.alarm = false;
    state.pebbles = PEBBLES_PER_LEVEL;
    state.pebble = null;
    state.lastSeen = null;
    state.loseSight = 0;
    state.levelDone = false;
  }

  function solidAtPixel(x, y) {
    const cx = Math.floor(x / TILE);
    const cy = Math.floor(y / TILE);
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return true;
    const k = `${cx},${cy}`;
    return state.level.walls.has(k) || state.level.crates.has(k);
  }

  function blocked(x, y, radius) {
    return solidAtPixel(x - radius, y - radius) || solidAtPixel(x + radius, y - radius)
      || solidAtPixel(x - radius, y + radius) || solidAtPixel(x + radius, y + radius)
      || solidAtPixel(x, y - radius) || solidAtPixel(x, y + radius);
  }

  // Line of sight: true when no wall or cabinet sits between the two points.
  function lineOfSight(x0, y0, x1, y1) {
    const d = dist(x0, y0, x1, y1);
    const steps = Math.max(1, Math.ceil(d / 6));
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      if (solidAtPixel(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
    }
    return true;
  }

  function tileKindAt(x, y) {
    const cx = Math.floor(x / TILE);
    const cy = Math.floor(y / TILE);
    const k = `${cx},${cy}`;
    if (state.level.bushes.has(k)) return 'bush';
    if (state.level.lamps.has(k)) return 'lamp';
    return 'floor';
  }

  function guardSees(guard) {
    const p = state.player;
    const d = dist(guard.x, guard.y, p.x, p.y);
    const range = tileKindAt(p.x, p.y) === 'lamp' ? GUARD.coneRangeLit : GUARD.coneRange;
    if (d > range) return { seen: false, rate: 0 };
    if (d < PLAYER.proximitySpot && lineOfSight(guard.x, guard.y, p.x, p.y)) return { seen: true, rate: GUARD.detectRate * 1.4 };
    const toPlayer = Math.atan2(p.y - guard.y, p.x - guard.x);
    if (Math.abs(angleDiff(toPlayer, guard.facing)) > GUARD.coneHalfAngle) return { seen: false, rate: 0 };
    if (!lineOfSight(guard.x, guard.y, p.x, p.y)) return { seen: false, rate: 0 };
    const kind = tileKindAt(p.x, p.y);
    const rate = kind === 'bush' ? GUARD.detectRateBush : kind === 'lamp' ? GUARD.detectRateLit : GUARD.detectRate;
    return { seen: true, rate };
  }

  // A camera is fixed to the wall and sweeps its cone back and forth.
  // It cannot chase, but it fills the alarm meter just like a guard.
  function cameraSees(cam) {
    const p = state.player;
    const d = dist(cam.x, cam.y, p.x, p.y);
    if (d > CAMERA.coneRange) return { seen: false, rate: 0 };
    const toPlayer = Math.atan2(p.y - cam.y, p.x - cam.x);
    if (Math.abs(angleDiff(toPlayer, cam.facing)) > CAMERA.coneHalfAngle) return { seen: false, rate: 0 };
    if (!lineOfSight(cam.x, cam.y, p.x, p.y)) return { seen: false, rate: 0 };
    const rate = tileKindAt(p.x, p.y) === 'bush' ? CAMERA.detectRate * 0.3 : CAMERA.detectRate;
    return { seen: true, rate };
  }

  function moveGuard(guard, tx, ty, speed, dt) {
    const dx = tx - guard.x;
    const dy = ty - guard.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return true;
    const stepLen = speed * dt;
    const nx = guard.x + (dx / d) * Math.min(stepLen, d);
    const ny = guard.y + (dy / d) * Math.min(stepLen, d);
    if (!blocked(nx, guard.y, GUARD.radius - 2)) guard.x = nx;
    if (!blocked(guard.x, ny, GUARD.radius - 2)) guard.y = ny;
    guard.facing = Math.atan2(dy, dx);
    return d <= stepLen + 2;
  }

  function step(dt, input) {
    let events = 0;
    if (state.won || state.levelDone) return events;
    state.elapsed += dt;
    const p = state.player;
    const speed = input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    p.sneaking = !!input.sneak;
    const len = Math.hypot(input.dx, input.dy) || 1;
    p.moving = input.dx !== 0 || input.dy !== 0;
    const nx = p.x + (input.dx / len) * speed * dt * (p.moving ? 1 : 0);
    const ny = p.y + (input.dy / len) * speed * dt * (p.moving ? 1 : 0);
    if (!blocked(nx, p.y, PLAYER.radius)) p.x = clamp(nx, PLAYER.radius, FIELD.width - PLAYER.radius);
    if (!blocked(p.x, ny, PLAYER.radius)) p.y = clamp(ny, PLAYER.radius, FIELD.height - PLAYER.radius);

    if (input.pebble && state.pebbles > 0) {
      state.pebbles -= 1;
      state.pebble = { x: clamp(input.pebble.x, 0, FIELD.width), y: clamp(input.pebble.y, 0, FIELD.height), timer: 1.2 };
      state.pebbleTimer = GUARD.investigateTime;
      for (const g of state.guards) {
        if (g.mode !== 'chase') { g.mode = 'investigate'; g.investigate = { ...state.pebble }; g.investigateTimer = GUARD.investigateTime; }
      }
      events |= EVENT_PEBBLE;
    }
    if (state.pebble) {
      state.pebble.timer -= dt;
      if (state.pebble.timer <= 0) state.pebble = null;
    }

    // Loot stashes.
    for (const r of state.relics) {
      if (!r.taken && dist(p.x, p.y, r.x, r.y) < 26) {
        r.taken = true;
        state.score += 100;
        events |= EVENT_RELIC;
      }
    }
    const relicsLeft = state.relics.filter((r) => !r.taken).length;

    // Cameras: sweep, and fill the alarm meter when the thief is in frame.
    let anySeen = false;
    let seenRate = 0;
    for (const cam of state.cameras) {
      cam.facing = cam.base + Math.sin(state.elapsed * CAMERA.sweepSpeed) * cam.sweep;
      const s = cameraSees(cam);
      cam.seeing = s.seen;
      if (s.seen) { anySeen = true; seenRate = Math.max(seenRate, s.rate); state.lastSeen = { x: p.x, y: p.y }; }
    }

    // Guards: see, chase, investigate, patrol.
    for (const g of state.guards) {
      const s = guardSees(g);
      if (s.seen) { anySeen = true; seenRate = Math.max(seenRate, s.rate); state.lastSeen = { x: p.x, y: p.y }; }
      if (g.mode === 'chase') {
        if (state.lastSeen) moveGuard(g, state.lastSeen.x, state.lastSeen.y, GUARD.chaseSpeed, dt);
        if (!anySeen) {
          state.loseSight += dt;
          if (state.loseSight > GUARD.loseSightTime) { g.mode = 'patrol'; state.alarm = false; }
        } else state.loseSight = 0;
      } else if (g.mode === 'investigate' && g.investigate) {
        const arrived = moveGuard(g, g.investigate.x, g.investigate.y, GUARD.investigateSpeed, dt);
        g.investigateTimer -= dt;
        if (arrived || g.investigateTimer <= 0) { g.mode = 'patrol'; g.investigate = null; }
      } else {
        const target = g.patrol[g.patrolIndex % g.patrol.length];
        if (g.pauseTimer > 0) { g.pauseTimer -= dt; }
        else if (moveGuard(g, target.x, target.y, GUARD.patrolSpeed, dt)) {
          g.patrolIndex = (g.patrolIndex + 1) % g.patrol.length;
          g.pauseTimer = 0.7;
        }
      }
      // Caught: a guard touches the thief.
      if (dist(g.x, g.y, p.x, p.y) < GUARD.radius + PLAYER.radius - 2) {
        state.lives -= 1;
        state.detection = 0;
        state.alarm = false;
        state.loseSight = 0;
        p.x = state.start.x; p.y = state.start.y;
        for (const gg of state.guards) { gg.mode = 'patrol'; gg.investigate = null; }
        events |= EVENT_CAUGHT;
        if (state.lives <= 0) state.caughtTimer = 1;
        return events;
      }
    }

    if (anySeen) {
      const wasAlarmed = state.alarm;
      state.detection = clamp(state.detection + seenRate * dt, 0, 100);
      state.loseSight = 0;
      if (state.detection >= 100 && !wasAlarmed) {
        state.alarm = true;
        for (const g of state.guards) g.mode = 'chase';
        events |= EVENT_SPOTTED;
      }
    } else {
      state.detection = clamp(state.detection - GUARD.detectDrain * dt, 0, 100);
      if (state.detection < 40) state.alarm = false;
    }

    // The getaway exit opens only once every loot stash is taken.
    if (relicsLeft === 0 && dist(p.x, p.y, state.exit.x, state.exit.y) < 30) {
      state.score += 250;
      if (state.levelIndex + 1 >= LEVELS.length) {
        state.won = true;
        events |= EVENT_WIN;
      } else {
        state.levelDone = true;
        events |= EVENT_LEVEL;
      }
    }
    return events;
  }

  function nextLevel() {
    loadLevel(state.levelIndex + 1);
    state.levelDone = false;
  }

  function reset() {
    state.lives = LIVES;
    state.score = 0;
    state.elapsed = 0;
    state.won = false;
    state.caughtTimer = 0;
    loadLevel(0);
  }

  loadLevel(0);
  return { state, step, loadLevel, nextLevel, reset, lineOfSight, tileKindAt };
}
