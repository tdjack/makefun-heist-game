// Keyboard and pointer input. Held keys give a steering direction;
// Shift sneaks; a mouse click throws a pebble to that spot. One-shot
// presses (start, pause) are queued as bit flags and taken once.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(target) {
  const keys = new Set();
  let actions = 0;
  let click = null;
  let empQueued = false;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code) || RIGHT.has(event.code) || UP.has(event.code) || DOWN.has(event.code)) {
      keys.add(event.code);
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      keys.add(event.code);
    } else if (event.code === 'KeyE') {
      if (!event.repeat) empQueued = true;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => { keys.delete(event.code); });
  window.addEventListener('blur', () => { keys.clear(); });
  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    click = { clientX: event.clientX - rect.left, clientY: event.clientY - rect.top, width: rect.width, height: rect.height };
    actions |= ACTION_CONFIRM;
  });

  function has(set) { for (const c of set) if (keys.has(c)) return true; return false; }

  return {
    direction() {
      const dx = (has(RIGHT) ? 1 : 0) - (has(LEFT) ? 1 : 0);
      const dy = (has(DOWN) ? 1 : 0) - (has(UP) ? 1 : 0);
      return { dx, dy, sneak: keys.has('ShiftLeft') || keys.has('ShiftRight') };
    },
    takeClick() { const c = click; click = null; return c; },
    takeEmp() { const e = empQueued; empQueued = false; return e; },
    takeActions() { const taken = actions; actions = 0; return taken; },
  };
}
