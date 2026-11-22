// The screenshot scenes behind ?shot=start|play|chase|end. Each one stages
// a real position in the real level, with guards, cameras, cones, loot and
// the thief placed so the frame shows the heist game at a glance:
// the room, the thief, guard cones, camera cones, loot and alarm meter.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

export function stageShot(name, world) {
  const s = world.state;
  world.reset();
  if (name === 'play') {
    // Mid-heist: sneaking behind a cabinet, one loot taken, a guard cone
    // sweeping just past the thief, a camera cone sweeping the vault,
    // alarm meter half full.
    s.player.x = 560; s.player.y = 300; s.player.sneaking = true;
    s.relics[0].taken = true; s.score = 100; s.detection = 46;
    s.guards[0].x = 620; s.guards[0].y = 180; s.guards[0].facing = Math.PI / 2;
    s.guards[1].x = 340; s.guards[1].y = 460; s.guards[1].facing = 0;
    s.guards[2].x = 1020; s.guards[2].y = 300; s.guards[2].facing = Math.PI;
    if (s.cameras[0]) { s.cameras[0].facing = 1.4; }
    if (s.cameras[1]) { s.cameras[1].facing = 2.2; }
    return { screen: SCREEN_PLAY, best: 100 };
  }
  if (name === 'chase') {
    // Alarm: spotted by a camera, alarm meter full, guards converging.
    s.player.x = 700; s.player.y = 380;
    s.relics[0].taken = true; s.relics[1].taken = true; s.score = 200;
    s.detection = 96; s.alarm = true; s.lives = 2;
    for (const g of s.guards) { g.mode = 'chase'; }
    s.guards[0].x = 620; s.guards[0].y = 300; s.guards[0].facing = Math.PI / 3;
    s.guards[1].x = 800; s.guards[1].y = 300; s.guards[1].facing = Math.PI * 0.7;
    s.guards[2].x = 700; s.guards[2].y = 520; s.guards[2].facing = -Math.PI / 2;
    if (s.cameras[0]) { s.cameras[0].facing = 1.9; s.cameras[0].seeing = true; }
    if (s.cameras[1]) { s.cameras[1].facing = 3.1; }
    s.lastSeen = { x: s.player.x, y: s.player.y };
    return { screen: SCREEN_PLAY, best: 200 };
  }
  if (name === 'end') {
    // Victory: every loot taken, thief at the open getaway exit.
    for (const r of s.relics) r.taken = true;
    s.score = 550; s.detection = 0;
    s.player.x = s.exit.x; s.player.y = s.exit.y;
    s.guards[0].x = 620; s.guards[0].y = 180; s.guards[0].facing = Math.PI / 2;
    s.guards[1].x = 340; s.guards[1].y = 460; s.guards[1].facing = 0;
    return { screen: SCREEN_WIN, best: 550 };
  }
  // start: title over level 1, guards on patrol, cones sweeping.
  s.guards[0].x = 620; s.guards[0].y = 180; s.guards[0].facing = Math.PI / 2;
  s.guards[1].x = 340; s.guards[1].y = 460; s.guards[1].facing = -Math.PI / 2;
  s.guards[2].x = 1020; s.guards[2].y = 300; s.guards[2].facing = Math.PI;
  return { screen: SCREEN_TITLE, best: 0 };
}
