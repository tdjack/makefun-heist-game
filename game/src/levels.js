// Three hand-built heist levels. Legend:
//   # wall   . floor   C vault cabinet (cover, blocks sight and movement)
//   B shadow (hide in it: detection fills slowly)   L spotlight floor
//   R loot  S thief start  E getaway exit  G guard spawn (patrols below)
//   Cameras are listed per level: wall-mounted, sweeping vision cones.
export const LEVELS = [
  {
    name: 'The Meridian Bank',
    subtitle: 'Three loot stashes. Slip past the guards and cameras, unseen.',
    cameras: [
      { x: 10, y: 1, base: 0.9, sweep: 0.9 },
      { x: 25, y: 8, base: 2.6, sweep: 0.8 },
    ],
    lasers: [
      { x1: 13, y1: 5, x2: 13, y2: 12, period: 2.4, on: 1.6 },
      { x1: 20, y1: 2, x2: 28, y2: 2, period: 3.2, on: 2.0 },
      { x1: 6, y1: 14, x2: 6, y2: 16, period: 2.0, on: 1.2 },
    ],
    map: [
      '################################',
      '#S....C.........L.....R........#',
      '#.....C....B....L....###.......#',
      '#..B..C.........L....#E#...B...#',
      '#.....#####......L...###....C..#',
      '#.....#...#..C........C....C...#',
      '#..R..#...#..C....B........C...#',
      '#.....#...#.......#####........#',
      '#.....#...#..B....#...#....R...#',
      '#..C..#...#.......#...#....C...#',
      '#..C..#####....C..#...#........#',
      '#..C........B.....#...#...B....#',
      '#.....C....L......#####....C...#',
      '#..B..C....L....C..........C...#',
      '#.....C....L....C....B.........#',
      '#..............................#',
      '#..............................#',
      '################################',
    ],
    guards: [
      { x: 15, y: 3, patrol: [[15, 3], [15, 10], [24, 10], [24, 3]] },
      { x: 8, y: 8, patrol: [[8, 8], [8, 14], [20, 14], [20, 8]] },
      { x: 26, y: 6, patrol: [[26, 6], [26, 13], [18, 13]] },
    ],
  },
  {
    name: 'The Gilded Gallery',
    subtitle: 'Gold on every wall. The cameras never blink.',
    cameras: [
      { x: 16, y: 1, base: 1.2, sweep: 1.0 },
      { x: 6, y: 16, base: -0.6, sweep: 0.9 },
      { x: 27, y: 10, base: 2.8, sweep: 0.8 },
    ],
    lasers: [
      { x1: 10, y1: 4, x2: 10, y2: 11, period: 2.8, on: 1.8 },
      { x1: 18, y1: 15, x2: 26, y2: 15, period: 3.0, on: 1.9 },
      { x1: 24, y1: 3, x2: 24, y2: 9, period: 2.2, on: 1.4 },
      { x1: 5, y1: 8, x2: 9, y2: 8, period: 2.6, on: 1.5 },
    ],
    map: [
      '################################',
      '#S...B....C.......L.....R......#',
      '#....B....C....####....###.....#',
      '#.........C....#..#....#E#..B..#',
      '#..####...C....#..#....###.....#',
      '#..#..#........#..#.....C...C..#',
      '#..#..#..R.....#..#.....C...C..#',
      '#..#..#........####.....C......#',
      '#..####...B..........C......B..#',
      '#.........C....L.....C.........#',
      '#....C....C....L..####....C....#',
      '#....C.........L..#..#....C.R..#',
      '#..B......C.......#..#....C....#',
      '#.........C....B..####....C....#',
      '#....R....C....L...........B...#',
      '#..............................#',
      '#..............................#',
      '################################',
    ],
    guards: [
      { x: 12, y: 2, patrol: [[12, 2], [12, 9], [22, 9], [22, 2]] },
      { x: 6, y: 10, patrol: [[6, 10], [6, 15], [16, 15]] },
      { x: 24, y: 5, patrol: [[24, 5], [24, 12], [17, 12]] },
      { x: 19, y: 15, patrol: [[19, 15], [28, 15], [28, 8]] },
    ],
  },
  {
    name: 'The Diamond Vault',
    subtitle: 'One last vault, five watchmen, cameras everywhere.',
    cameras: [
      { x: 12, y: 1, base: 1.0, sweep: 1.0 },
      { x: 28, y: 1, base: 2.2, sweep: 0.9 },
      { x: 4, y: 16, base: -0.4, sweep: 0.9 },
      { x: 20, y: 16, base: 4.0, sweep: 0.8 },
    ],
    lasers: [
      { x1: 9, y1: 3, x2: 9, y2: 12, period: 2.4, on: 1.5 },
      { x1: 17, y1: 6, x2: 25, y2: 6, period: 3.4, on: 2.2 },
      { x1: 27, y1: 10, x2: 27, y2: 15, period: 2.0, on: 1.3 },
      { x1: 13, y1: 16, x2: 21, y2: 16, period: 2.8, on: 1.7 },
      { x1: 4, y1: 5, x2: 4, y2: 9, period: 2.2, on: 1.4 },
    ],
    map: [
      '################################',
      '#S....C.....L....B......R......#',
      '#.....C.....L....B....####.....#',
      '#..B..C.....L..........#E#..B..#',
      '#.....#####..C........###...C..#',
      '#.....#...#..C....B.........C..#',
      '#..R..#...#..C....#####.....C..#',
      '#.....#...#.......#...#.....C..#',
      '#..C..#...#...B...#...#..R.....#',
      '#..C..#...#.......#...#.....C..#',
      '#..C..#####...C...#...#.....C..#',
      '#..C.......B......#...#..B.....#',
      '#.....C....L......#####....C...#',
      '#..B..C....L....C......C...C...#',
      '#.....C....L....C..B...........#',
      '#..............................#',
      '#..............................#',
      '################################',
    ],
    guards: [
      { x: 14, y: 3, patrol: [[14, 3], [14, 9], [23, 9], [23, 3]] },
      { x: 7, y: 8, patrol: [[7, 8], [7, 14], [18, 14]] },
      { x: 26, y: 6, patrol: [[26, 6], [26, 13], [19, 13]] },
      { x: 10, y: 13, patrol: [[10, 13], [24, 13], [24, 10]] },
      { x: 21, y: 15, patrol: [[21, 15], [28, 15], [28, 5]] },
    ],
  },
  {
    name: 'The Royal Mint',
    subtitle: 'The crown jewels. Every eye in the building is on them.',
    cameras: [
      { x: 8, y: 1, base: 0.7, sweep: 1.1 },
      { x: 24, y: 1, base: 2.4, sweep: 1.0 },
      { x: 16, y: 16, base: -1.2, sweep: 0.9 },
      { x: 29, y: 9, base: 3.1, sweep: 0.8 },
      { x: 3, y: 9, base: 0.0, sweep: 0.9 },
    ],
    lasers: [
      { x1: 11, y1: 2, x2: 11, y2: 13, period: 2.6, on: 1.6 },
      { x1: 19, y1: 4, x2: 27, y2: 4, period: 3.0, on: 1.9 },
      { x1: 7, y1: 15, x2: 15, y2: 15, period: 2.4, on: 1.5 },
      { x1: 22, y1: 11, x2: 22, y2: 16, period: 2.2, on: 1.3 },
      { x1: 15, y1: 7, x2: 15, y2: 10, period: 2.8, on: 1.7 },
    ],
    map: [
      '################################',
      '#S..B.....C....L....B.....R....#',
      '#....B....C....L....####.......#',
      '#.........C.........##E#....B..#',
      '#..C..#####....B...###.....C...#',
      '#..C..#...#....C......C....C...#',
      '#..R..#...#..L...B........C...#',
      '#.....#...#..L....#####........#',
      '#..B..#...#.......#...#..R.....#',
      '#.....#...#...B...#...#....C...#',
      '#..C..#####....C..#...#........#',
      '#..C.......B......#...#...B....#',
      '#.....C....L......#####....C...#',
      '#..B..C....L....C......C...C...#',
      '#.....C....L....C..B....R......#',
      '#..............................#',
      '#..............................#',
      '################################',
    ],
    guards: [
      { x: 13, y: 2, patrol: [[13, 2], [13, 8], [22, 8], [22, 2]] },
      { x: 6, y: 7, patrol: [[6, 7], [6, 14], [17, 14]] },
      { x: 25, y: 5, patrol: [[25, 5], [25, 12], [18, 12]] },
      { x: 9, y: 12, patrol: [[9, 12], [23, 12], [23, 9]] },
      { x: 20, y: 15, patrol: [[20, 15], [29, 15], [29, 6]] },
      { x: 17, y: 4, patrol: [[17, 4], [17, 10], [10, 10]] },
    ],
  },
];

// Parse a level map into tiles, loot stashes, start, exit and guard spawns.
export function parseLevel(def) {
  const walls = new Set();
  const crates = new Set();
  const bushes = new Set();
  const lamps = new Set();
  const relics = [];
  let start = { x: 60, y: 60 };
  let exit = { x: 1200, y: 100 };
  const key = (cx, cy) => `${cx},${cy}`;
  def.map.forEach((row, cy) => {
    for (let cx = 0; cx < row.length; cx += 1) {
      const ch = row[cx];
      if (ch === '#') walls.add(key(cx, cy));
      else if (ch === 'C') crates.add(key(cx, cy));
      else if (ch === 'B') bushes.add(key(cx, cy));
      else if (ch === 'L') lamps.add(key(cx, cy));
      else if (ch === 'R') relics.push({ cx, cy, taken: false });
      else if (ch === 'S') start = { x: cx * 40 + 20, y: cy * 40 + 20 };
      else if (ch === 'E') exit = { x: cx * 40 + 20, y: cy * 40 + 20 };
    }
  });
  return { walls, crates, bushes, lamps, relics, start, exit, key };
}

export function tileAt(level, cx, cy) {
  if (cx < 0 || cy < 0 || cx >= 32 || cy >= 18) return '#';
  return level.map[cy][cx] || '#';
}
