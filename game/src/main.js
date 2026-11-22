// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. Screens:
// title, play, paused, level-clear, game over and win.
// ?seed=N is accepted for compatibility. ?shot=start|play|chase|end
// (with &seed=N) stages that scene instead of running the loop, paints
// it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createWorld, EVENT_CAUGHT, EVENT_EMP, EVENT_LASER, EVENT_LEVEL, EVENT_PEBBLE, EVENT_RELIC, EVENT_SMOKE, EVENT_SPOTTED, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_LEVEL, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode */ }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, world);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) { status.textContent = message; }
  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Crack every safe, dodge guards, cameras and lasers, then reach the getaway exit unseen. E fires the EMP.');
  }
  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) { best = world.state.score; saveBest(best); }
    announce(`Caught. Score ${world.state.score}. Best ${best}.`);
  }
  function winGame() {
    screen = SCREEN_WIN;
    if (world.state.score > best) { best = world.state.score; saveBest(best); }
    announce(`Clean getaway. Score ${world.state.score}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) startGame();
      else if (screen === SCREEN_LEVEL) { world.nextLevel(); screen = SCREEN_PLAY; announce(`Level ${world.state.levelIndex + 1}.`); }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
      else if (screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; announce('Playing.'); }
    }
  }

  function step() {
    const dir = input.direction();
    const click = input.takeClick();
    let pebble = null;
    if (click) {
      // Convert the click from CSS pixels to field coordinates.
      const v = renderer.view;
      const scale = Math.min(canvas.clientWidth / FIELD.width, canvas.clientHeight / FIELD.height);
      const ox = (canvas.clientWidth - FIELD.width * scale) / 2;
      const oy = (canvas.clientHeight - FIELD.height * scale) / 2;
      pebble = { x: (click.clientX - ox) / scale, y: (click.clientY - oy) / scale };
    }
    const emp = input.takeEmp();
    const smoke = input.takeSmoke();
    const events = world.step(STEP, { dx: dir.dx, dy: dir.dy, sneak: dir.sneak, pebble, emp, smoke });
    if (events & EVENT_RELIC) { audio.relic(); announce('Safe cracked. Loot grabbed.'); }
    if (events & EVENT_EMP) { audio.pebble(); announce('EMP fired. Cameras blind for six seconds.'); }
    if (events & EVENT_SMOKE) { audio.pebble(); announce('Smoke bomb dropped. You are hidden inside the cloud.'); }
    if (events & EVENT_LASER) { audio.spotted(); announce('Laser tripped! Get out of the beam!'); }
    if (events & EVENT_PEBBLE) { audio.pebble(); announce('Coin thrown. A guard goes to look.'); }
    if (events & EVENT_SPOTTED) { audio.spotted(); announce('Spotted! Alarm! Break line of sight!'); }
    if (events & EVENT_CAUGHT) {
      audio.caught();
      if (world.state.lives <= 0) endGame();
      else announce(`Caught! ${world.state.lives} ${world.state.lives === 1 ? 'life' : 'lives'} left. Back to the start.`);
    }
    if (events & EVENT_LEVEL) { audio.level(); screen = SCREEN_LEVEL; announce('Level cleared.'); }
    if (events & EVENT_WIN) { audio.win(); winGame(); }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        if (screen === SCREEN_PLAY) step();
        else world.step(STEP, { dx: 0, dy: 0, sneak: false, pebble: null });
        accumulator -= STEP;
      }
    } else accumulator = 0;
    renderer.draw(world.state, screen, best, world);
  }

  // Leaving the tab pauses a running game rather than letting guards close in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
  });
  announce('Midnight Vault. Press Space or click to start the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
