// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window. Guard and camera
// vision cones are raycast polygons, so cover really does cut them off.
import { COLS, FIELD, FONT, GUARD, PALETTE, ROWS, TILE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';
export const SCREEN_LEVEL = 'level';

function cachedLabel(prefix) {
  let value = -1; let text = '';
  return function label(next) { if (next !== value) { value = next; text = prefix + next; } return text; };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0, width: 0, height: 0 };
  const scoreLabel = cachedLabel('Score ');
  const levelLabel = cachedLabel('Level ');
  const relicLabel = cachedLabel('Relics ');
  const finalLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width; canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
    view.width = width; view.height = height;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }
  function plain(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawFloor(state) {
    for (let cy = 0; cy < ROWS; cy += 1) {
      for (let cx = 0; cx < COLS; cx += 1) {
        const k = `${cx},${cy}`;
        const x = cx * TILE; const y = cy * TILE;
        if (state.level.walls.has(k)) {
          context.fillStyle = PALETTE.wall; context.fillRect(x, y, TILE, TILE);
          context.fillStyle = PALETTE.wallTop; context.fillRect(x, y, TILE, 8);
          context.fillStyle = 'rgba(0,0,0,0.25)'; context.fillRect(x, y + TILE - 6, TILE, 6);
        } else if (state.level.crates.has(k)) {
          context.fillStyle = PALETTE.crate; context.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
          context.fillStyle = PALETTE.crateTop; context.fillRect(x + 3, y + 3, TILE - 6, 7);
          context.strokeStyle = 'rgba(0,0,0,0.35)'; context.lineWidth = 2;
          context.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
          context.beginPath(); context.moveTo(x + 3, y + 3); context.lineTo(x + TILE - 3, y + TILE - 3); context.moveTo(x + TILE - 3, y + 3); context.lineTo(x + 3, y + TILE - 3); context.stroke();
        } else {
          context.fillStyle = (cx + cy) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
          context.fillRect(x, y, TILE, TILE);
          if (state.level.bushes.has(k)) {
            context.fillStyle = PALETTE.bush;
            context.beginPath(); context.arc(x + 12, y + 14, 11, 0, Math.PI * 2); context.arc(x + 27, y + 12, 12, 0, Math.PI * 2); context.arc(x + 20, y + 27, 11, 0, Math.PI * 2); context.fill();
            context.fillStyle = PALETTE.bushTop;
            context.beginPath(); context.arc(x + 12, y + 12, 5, 0, Math.PI * 2); context.arc(x + 27, y + 10, 5, 0, Math.PI * 2); context.arc(x + 20, y + 25, 5, 0, Math.PI * 2); context.fill();
          }
          if (state.level.lamps.has(k)) {
            const g = context.createRadialGradient(x + 20, y + 20, 4, x + 20, y + 20, 46);
            g.addColorStop(0, PALETTE.lampGlow); g.addColorStop(1, 'rgba(242,201,76,0)');
            context.fillStyle = g; context.fillRect(x - 26, y - 26, TILE + 52, TILE + 52);
            context.fillStyle = PALETTE.lamp; context.beginPath(); context.arc(x + 20, y + 20, 5, 0, Math.PI * 2); context.fill();
          }
        }
      }
    }
    // Getaway exit door.
    const e = state.exit;
    const open = state.relics.every((r) => r.taken);
    context.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    context.fillRect(e.x - 18, e.y - 18, 36, 36);
    context.fillStyle = '#0b1f14';
    context.fillRect(e.x - 11, e.y - 18, 22, 36);
    if (open) { context.fillStyle = '#eafff3'; text('EXIT', e.x, e.y - 26, 15, PALETTE.exit, 'center'); }
    else { context.fillStyle = PALETTE.muted; text('LOCKED', e.x, e.y - 26, 12, PALETTE.muted, 'center'); }
    // Loot: glowing gold bars and diamonds.
    for (const r of state.relics) {
      if (r.taken) continue;
      const pulse = 1 + Math.sin(Date.now() / 300) * 0.12;
      const g = context.createRadialGradient(r.x, r.y, 2, r.x, r.y, 30 * pulse);
      g.addColorStop(0, 'rgba(255,217,77,0.5)'); g.addColorStop(1, 'rgba(255,217,77,0)');
      context.fillStyle = g; context.beginPath(); context.arc(r.x, r.y, 30 * pulse, 0, Math.PI * 2); context.fill();
      context.fillStyle = PALETTE.relic;
      context.beginPath();
      context.moveTo(r.x, r.y - 11); context.lineTo(r.x + 9, r.y); context.lineTo(r.x, r.y + 11); context.lineTo(r.x - 9, r.y);
      context.closePath(); context.fill();
      context.fillStyle = '#fff7cc'; context.beginPath(); context.moveTo(r.x, r.y - 11); context.lineTo(r.x + 9, r.y); context.lineTo(r.x, r.y); context.lineTo(r.x - 9, r.y); context.closePath(); context.fill();
    }
  }

  function conePolygon(guard, world) {
    const pts = [{ x: guard.x, y: guard.y }];
    const range = GUARD.coneRange;
    const steps = 24;
    for (let i = 0; i <= steps; i += 1) {
      const a = guard.facing - GUARD.coneHalfAngle + (2 * GUARD.coneHalfAngle * i) / steps;
      let r = range;
      // March out until a wall or cabinet blocks the ray.
      for (let d = 12; d <= range; d += 8) {
        const x = guard.x + Math.cos(a) * d; const y = guard.y + Math.sin(a) * d;
        const cx = Math.floor(x / TILE); const cy = Math.floor(y / TILE);
        const k = `${cx},${cy}`;
        if (world.state.level.walls.has(k) || world.state.level.crates.has(k)) { r = d; break; }
      }
      pts.push({ x: guard.x + Math.cos(a) * r, y: guard.y + Math.sin(a) * r });
    }
    return pts;
  }

  function drawLasers(state) {
    // Laser tripwires: bright red beams while live, faint dotted stubs
    // while they blink off, so the thief can time the crossing.
    for (const beam of state.lasers || []) {
      context.strokeStyle = beam.live ? '#ff2d55' : 'rgba(255,45,85,0.25)';
      context.lineWidth = beam.live ? 3 : 1.5;
      if (!beam.live) context.setLineDash([4, 6]);
      context.beginPath();
      context.moveTo(beam.x1, beam.y1);
      context.lineTo(beam.x2, beam.y2);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = beam.live ? '#ff2d55' : 'rgba(255,45,85,0.4)';
      context.beginPath(); context.arc(beam.x1, beam.y1, 4, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.arc(beam.x2, beam.y2, 4, 0, Math.PI * 2); context.fill();
      if (beam.live) {
        context.fillStyle = 'rgba(255,45,85,0.18)';
        context.beginPath(); context.arc(beam.x1, beam.y1, 10, 0, Math.PI * 2); context.fill();
        context.beginPath(); context.arc(beam.x2, beam.y2, 10, 0, Math.PI * 2); context.fill();
      }
    }
  }

  function drawCrackRing(state) {
    // Safe-cracking progress: a gold ring closing around the loot stash.
    if (!state.crackTarget) return;
    const target = state.crackTarget;
    const frac = Math.min(1, state.crackProgress / 1.4);
    context.strokeStyle = '#0d1320'; context.lineWidth = 6;
    context.beginPath(); context.arc(target.x, target.y, 22, 0, Math.PI * 2); context.stroke();
    context.strokeStyle = PALETTE.gold; context.lineWidth = 4;
    context.beginPath(); context.arc(target.x, target.y, 22, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); context.stroke();
    text('CRACKING', target.x, target.y - 30, 13, PALETTE.gold, 'center');
  }

  function drawCones(state, world) {
    // Camera cones: pink, sweeping, fixed to the wall.
    for (const cam of state.cameras || []) {
      const pts = [{ x: cam.x, y: cam.y }];
      const range = 260;
      const steps = 20;
      for (let i = 0; i <= steps; i += 1) {
        const a = cam.facing - 0.48 + (2 * 0.48 * i) / steps;
        let r = range;
        for (let d = 12; d <= range; d += 8) {
          const x = cam.x + Math.cos(a) * d; const y = cam.y + Math.sin(a) * d;
          const k = `${Math.floor(x / TILE)},${Math.floor(y / TILE)}`;
          if (world.state.level.walls.has(k) || world.state.level.crates.has(k)) { r = d; break; }
        }
        pts.push({ x: cam.x + Math.cos(a) * r, y: cam.y + Math.sin(a) * r });
      }
      context.beginPath();
      context.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) context.lineTo(pts[i].x, pts[i].y);
      context.closePath();
      context.fillStyle = state.empTimer > 0 ? 'rgba(120,130,150,0.12)' : cam.seeing ? 'rgba(255,90,122,0.42)' : PALETTE.cameraCone;
      context.fill();
      context.strokeStyle = state.empTimer > 0 ? 'rgba(120,130,150,0.4)' : PALETTE.cameraConeEdge;
      context.lineWidth = 1.5; context.stroke();
    }
    for (const g of state.guards) {
      const pts = conePolygon(g, world);
      const alert = g.mode === 'chase';
      context.beginPath();
      context.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) context.lineTo(pts[i].x, pts[i].y);
      context.closePath();
      context.fillStyle = alert ? PALETTE.coneAlert : PALETTE.cone;
      context.fill();
      context.strokeStyle = alert ? PALETTE.coneAlertEdge : PALETTE.coneEdge;
      context.lineWidth = 1.5; context.stroke();
    }
  }

  function drawActors(state) {
    // Coin target.
    if (state.pebble) {
      context.strokeStyle = PALETTE.gold; context.lineWidth = 2;
      context.beginPath(); context.arc(state.pebble.x, state.pebble.y, 10 + (1.2 - state.pebble.timer) * 8, 0, Math.PI * 2); context.stroke();
      context.fillStyle = PALETTE.gold; context.beginPath(); context.arc(state.pebble.x, state.pebble.y, 3, 0, Math.PI * 2); context.fill();
    }
    // Player: the thief in gold, arrow shows facing / movement.
    const p = state.player;
    context.fillStyle = 'rgba(0,0,0,0.35)'; context.beginPath(); context.ellipse(p.x, p.y + 12, 14, 5, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = p.sneaking ? PALETTE.playerSneak : PALETTE.player;
    context.beginPath(); context.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#0b2a3a'; context.beginPath(); context.arc(p.x, p.y - 3, 6, 0, Math.PI * 2); context.fill();
    if (p.sneaking) { text('···', p.x, p.y - 20, 13, PALETTE.playerSneak, 'center'); }
    // Guards: red watchmen with a white visor and a direction tick.
    for (const g of state.guards) {
      context.fillStyle = 'rgba(0,0,0,0.35)'; context.beginPath(); context.ellipse(g.x, g.y + 12, 15, 5, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = g.mode === 'chase' ? '#ff6b5e' : PALETTE.guardBody;
      context.beginPath(); context.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2); context.fill();
      context.strokeStyle = '#7a1f18'; context.lineWidth = 2; context.stroke();
      context.fillStyle = '#fff';
      context.beginPath(); context.arc(g.x + Math.cos(g.facing) * 5, g.y + Math.sin(g.facing) * 5, 4, 0, Math.PI * 2); context.fill();
      if (g.mode === 'chase') text('!', g.x, g.y - 22, 20, '#ff6b5e', 'center');
      else if (g.mode === 'investigate') text('?', g.x, g.y - 22, 18, PALETTE.gold, 'center');
    }
    // Cameras: small wall-mounted units with a red recording eye.
    for (const cam of state.cameras || []) {
      context.fillStyle = '#1c2436';
      context.beginPath(); context.arc(cam.x, cam.y, 10, 0, Math.PI * 2); context.fill();
      context.strokeStyle = PALETTE.camera; context.lineWidth = 2; context.stroke();
      context.fillStyle = cam.seeing ? '#ff2d55' : PALETTE.camera;
      context.beginPath(); context.arc(cam.x + Math.cos(cam.facing) * 4, cam.y + Math.sin(cam.facing) * 4, 4, 0, Math.PI * 2); context.fill();
    }
  }
  const PLAYER_RADIUS = 13;

  function drawHud(state) {
    context.textBaseline = 'top';
    text(scoreLabel(state.score), 24, 16, 24, PALETTE.text, 'left');
    text(levelLabel(state.levelIndex + 1), FIELD.width / 2 - 90, 16, 24, PALETTE.text, 'center');
    const taken = state.relics.filter((r) => r.taken).length;
    text(`◆ LOOT ${taken}/${state.relics.length}`, FIELD.width / 2 + 90, 16, 24, PALETTE.gold, 'center');
    // Alarm meter: fills while a guard or camera sees the thief.
    const barX = FIELD.width - 320; const barY = 20; const barW = 220; const barH = 18;
    const det = state.detection;
    plain(state.alarm ? 'ALARM!' : 'ALARM', barX - 12, barY, 18, det > 60 ? PALETTE.danger : PALETTE.muted, 'right');
    context.fillStyle = '#0d1320'; context.fillRect(barX, barY, barW, barH);
    context.fillStyle = det > 60 ? PALETTE.danger : PALETTE.gold; context.fillRect(barX, barY, barW * (det / 100), barH);
    context.strokeStyle = PALETTE.muted; context.lineWidth = 1; context.strokeRect(barX, barY, barW, barH);
    plain(`♥ ${state.lives}   ● ${state.pebbles} coins   ⚡ EMP ${state.empCharges}${state.empTimer > 0 ? ' — cameras blind ' + state.empTimer.toFixed(0) + 's' : ''}`, 24, 48, 16, PALETTE.muted, 'left');
    plain(state.level.def.name + ' — grab every loot, dodge guards and cameras, reach the getaway exit', FIELD.width / 2, 48, 15, PALETTE.muted, 'center');
  }

  function drawTitleBanner(title, lines, prompt) {
    // Title sits in a banner at the top so the level, cones and guards
    // stay visible behind it — the cover shot must show the game.
    const width = 760; const lineH = 28;
    const height = 96 + lines.length * lineH + 56;
    const x = (FIELD.width - width) / 2; const y = 36;
    context.fillStyle = 'rgba(10,14,24,0.88)'; context.fillRect(x, y, width, height);
    context.strokeStyle = PALETTE.gold; context.lineWidth = 2; context.strokeRect(x, y, width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 62, 42, PALETTE.text, 'center');
    for (let i = 0; i < lines.length; i += 1) plain(lines[i], FIELD.width / 2, y + 104 + i * lineH, 18, PALETTE.muted, 'center');
    text(prompt, FIELD.width / 2, y + height - 22, 20, PALETTE.gold, 'center');
  }

  function drawPanel(title, lines, prompt) {
    const width = 640; const lineH = 32;
    const height = 150 + lines.length * lineH + 70;
    const x = (FIELD.width - width) / 2; const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(4,6,12,0.45)'; context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel; context.fillRect(x, y, width, height);
    context.strokeStyle = PALETTE.gold; context.lineWidth = 2; context.strokeRect(x, y, width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 72, 44, PALETTE.text, 'center');
    for (let i = 0; i < lines.length; i += 1) plain(lines[i], FIELD.width / 2, y + 118 + i * lineH, 20, PALETTE.muted, 'center');
    text(prompt, FIELD.width / 2, y + height - 36, 22, PALETTE.gold, 'center');
  }

  function draw(state, screen, best, world) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    drawFloor(state);
    drawLasers(state);
    drawCones(state, world);
    drawActors(state);
    drawCrackRing(state);
    if (screen === SCREEN_TITLE) {
      drawTitleBanner('MIDNIGHT VAULT', [
        'One thief. Three vaults. Crack every safe, then reach the getaway exit.',
        'WASD / arrows to move · Shift to sneak · Click to throw a coin · E for EMP',
        'Dodge guard cones, camera cones and laser beams. Stand still by a safe to crack it.',
      ], 'Press Space or click to start the heist');
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) drawPanel('Paused', ['The guards will wait for you.'], 'Press P to resume');
    else if (screen === SCREEN_OVER) drawPanel('Caught!', [`Score ${state.score}`, `Best ${best}`], 'Press Space to try again');
    else if (screen === SCREEN_LEVEL) drawPanel(`${state.level.def.name} cleared!`, [`Score ${state.score}`, 'The next vault is darker still.'], 'Press Space for the next level');
    else if (screen === SCREEN_WIN) drawPanel('CLEAN GETAWAY — NEVER SEEN', [`You stole every loot and vanished. Score ${state.score}`, `Best ${best}`], 'Press Space to play again');
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, view };
}
