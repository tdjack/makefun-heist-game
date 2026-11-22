// Tiny synthesised sounds: no audio files, everything is WebAudio.
// Sounds start only after the player's first key or click, as browsers require.
export function createAudio() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, gainValue, when = 0) {
    const c = ensure();
    if (!c || muted) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue, c.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + when);
    osc.stop(c.currentTime + when + dur);
  }
  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    relic() { tone(880, 0.12, 'sine', 0.12); tone(1320, 0.18, 'sine', 0.1, 0.09); },
    pebble() { tone(320, 0.07, 'square', 0.05); },
    spotted() { tone(220, 0.25, 'sawtooth', 0.12); tone(165, 0.35, 'sawtooth', 0.12, 0.12); },
    caught() { tone(140, 0.4, 'sawtooth', 0.14); tone(90, 0.5, 'sawtooth', 0.14, 0.15); },
    level() { tone(523, 0.12, 'sine', 0.12); tone(659, 0.12, 'sine', 0.12, 0.1); tone(784, 0.22, 'sine', 0.12, 0.2); },
    win() { tone(523, 0.15, 'sine', 0.12); tone(659, 0.15, 'sine', 0.12, 0.12); tone(784, 0.15, 'sine', 0.12, 0.24); tone(1046, 0.3, 'sine', 0.12, 0.36); },
  };
}
