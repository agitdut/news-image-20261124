// News in one image — Tuesday 24 November 2026.
//
// A Node 22 program, standard library only. It draws a 1024x1024 PNG that
// sums up the world's news of Tuesday 24 November 2026: six stories, each
// with a pictogram, a headline and one factual sub-line, under a masthead
// that names the day. No network, no clock, no randomness: the same bytes
// come out of every run, so the two grading runs are byte-identical.
//
// Run it:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// It writes out/entry.png (PNG, 1024x1024, well under 1 MiB).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- palette
const PAPER: RGB = [246, 241, 231];
const INK: RGB = [20, 33, 61];
const NAVY: RGB = [20, 33, 61];
const RED: RGB = [178, 44, 32];
const WHITE: RGB = [255, 255, 255];
const MUTED: RGB = [90, 96, 110];
const PANEL: RGB = [255, 255, 255];
const LINE: RGB = [203, 196, 180];

type RGB = [number, number, number];

// ------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows; each row is 5 bits, bit 4 = leftmost column.
// Uppercase, digits and the punctuation the headlines need.
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  '3': [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ',': [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ':': [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ';': [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '-': [0, 0, 0, 0x0e, 0, 0, 0],
  '/': [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  '?': [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  '&': [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  '"': [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  '+': [0, 0x04, 0x04, 0x0e, 0x04, 0x04, 0],
  '=': [0, 0, 0x1f, 0, 0x1f, 0, 0],
  '%': [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
};

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const px = new Uint8Array(W * H * 3);

function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) setPx(i, j, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPx(x, y, c);
    }
  }
}

function ring(cx: number, cy: number, r: number, t: number, c: RGB): void {
  for (let y = cy - r - t; y <= cy + r + t; y++) {
    for (let x = cx - r - t; x <= cx + r + t; x++) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (Math.abs(d - r) <= t / 2) setPx(x, y, c);
    }
  }
}

// Bresenham line, thickness 1..3.
function drawLine(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    for (let a = 0; a < t; a++) {
      for (let b = 0; b < t; b++) setPx(x + a, y + b, c);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minX = Math.min(x0, x1, x2);
  const maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2);
  const maxY = Math.max(y0, y1, y2);
  const d = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((x1 - x) * (y2 - y) - (y1 - y) * (x2 - x)) / d;
      const b = ((x2 - x) * (y0 - y) - (y2 - y) * (x0 - x)) / d;
      const g = 1 - a - b;
      if (a >= 0 && b >= 0 && g >= 0) setPx(x, y, c);
    }
  }
}

// -------------------------------------------------------------- text
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] ?? FONT['?'];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if ((g[r] >> (4 - col)) & 1) {
          fillRect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

// Greedy word wrap to at most maxChars per line.
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur === '') {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxChars) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

// ------------------------------------------------------------ PNG encode
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePng(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------- pictograms
// Each icon draws inside a 96x96 box whose top-left is (x, y).
type Icon = (x: number, y: number, c: RGB) => void;

const iconScales: Icon = (x, y, c) => {
  // Scales of justice: post, beam, two pans, base.
  drawLine(x + 48, y + 14, x + 48, y + 78, c, 4);
  drawLine(x + 14, y + 22, x + 82, y + 22, c, 4);
  drawLine(x + 14, y + 22, x + 6, y + 52, c, 3);
  drawLine(x + 14, y + 22, x + 22, y + 52, c, 3);
  drawLine(x + 82, y + 22, x + 74, y + 52, c, 3);
  drawLine(x + 82, y + 22, x + 90, y + 52, c, 3);
  fillTriangle(x + 2, y + 52, x + 26, y + 52, x + 14, y + 66, c);
  fillTriangle(x + 70, y + 52, x + 94, y + 52, x + 82, y + 66, c);
  fillRect(x + 30, y + 78, 36, 6, c);
  fillCircle(x + 48, y + 12, 6, c);
};

const iconGlobeCrack: Icon = (x, y, c) => {
  // Globe with a crack: circle, latitude lines, jagged red-brown crack.
  ring(x + 48, y + 48, 34, 4, c);
  drawLine(x + 16, y + 38, x + 80, y + 38, c, 3);
  drawLine(x + 16, y + 58, x + 80, y + 58, c, 3);
  drawLine(x + 48, y + 14, x + 48, y + 82, c, 3);
  const crack: RGB = [178, 44, 32];
  drawLine(x + 52, y + 16, x + 44, y + 34, crack, 4);
  drawLine(x + 44, y + 34, x + 56, y + 50, crack, 4);
  drawLine(x + 56, y + 50, x + 46, y + 66, crack, 4);
  drawLine(x + 46, y + 66, x + 54, y + 82, crack, 4);
};

const iconShip: Icon = (x, y, c) => {
  // Warship on waves, listing, with smoke.
  fillTriangle(x + 12, y + 52, x + 84, y + 52, x + 72, y + 70, c);
  fillRect(x + 12, y + 52, 72, 8, c);
  fillRect(x + 30, y + 30, 8, 22, c);
  fillRect(x + 52, y + 38, 6, 14, c);
  drawLine(x + 30, y + 30, x + 52, y + 30, c, 3);
  fillCircle(x + 62, y + 22, 6, c);
  fillCircle(x + 72, y + 14, 5, c);
  const wave: RGB = [31, 111, 139];
  drawLine(x + 4, y + 80, x + 30, y + 80, wave, 3);
  drawLine(x + 36, y + 86, x + 62, y + 86, wave, 3);
  drawLine(x + 68, y + 80, x + 92, y + 80, wave, 3);
};

const iconChip: Icon = (x, y, c) => {
  // Processor chip with pins.
  fillRect(x + 26, y + 26, 44, 44, c);
  fillRect(x + 38, y + 38, 20, 20, PAPER);
  fillRect(x + 43, y + 43, 10, 10, c);
  for (let i = 0; i < 4; i++) {
    const o = 30 + i * 12;
    fillRect(x + o, y + 12, 5, 12, c);
    fillRect(x + o, y + 72, 5, 12, c);
    fillRect(x + 12, y + o, 12, 5, c);
    fillRect(x + 72, y + o, 12, 5, c);
  }
};

const iconSatellite: Icon = (x, y, c) => {
  // Satellite on an orbit arc.
  ring(x + 48, y + 48, 40, 3, [120, 130, 145]);
  fillRect(x + 40, y + 40, 18, 16, c);
  fillRect(x + 12, y + 34, 24, 26, c);
  fillRect(x + 62, y + 36, 24, 26, c);
  drawLine(x + 48, y + 40, x + 48, y + 24, c, 3);
  fillCircle(x + 48, y + 22, 4, c);
  fillRect(x + 16, y + 42, 16, 3, PAPER);
  fillRect(x + 66, y + 44, 16, 3, PAPER);
};

const iconCuffs: Icon = (x, y, c) => {
  // Handcuffs: two rings joined by a short chain.
  ring(x + 28, y + 48, 20, 6, c);
  ring(x + 68, y + 48, 20, 6, c);
  drawLine(x + 44, y + 40, x + 52, y + 40, c, 4);
  drawLine(x + 44, y + 56, x + 52, y + 56, c, 4);
  fillCircle(x + 48, y + 48, 5, c);
};

// -------------------------------------------------------------- stories
interface Story {
  tag: string;
  accent: RGB;
  headline: string;
  sub: string;
  fact: string;
  icon: Icon;
}

const STORIES: Story[] = [
  {
    tag: 'COURT - THE HAGUE',
    accent: [20, 33, 61],
    headline: 'ICJ: MYANMAR GUILTY OF ROHINGYA GENOCIDE',
    sub: 'FIRST STATE GENOCIDE RULING; 14 NATIONS BACK IT',
    fact: '9-6 RULING; FIRST OF ITS KIND',
    icon: iconScales,
  },
  {
    tag: 'CLIMATE - ANTALYA',
    accent: [30, 107, 74],
    headline: 'COP31 TALKS COLLAPSE OVER FOSSIL FUELS',
    sub: '90+ NATIONS REJECT DRAFT AFTER 50-HOUR OVERTIME',
    fact: 'HOST TURKEY; NO FOSSIL FUEL TEXT',
    icon: iconGlobeCrack,
  },
  {
    tag: 'CONFLICT - LIBYA',
    accent: [180, 85, 45],
    headline: 'UKRAINE DRONES SINK RUSSIAN WARSHIP',
    sub: 'CORVETTE MERKURY HIT AT BENGHAZI; UN SEEKS PROBE',
    fact: 'KYIV CLAIMS 7 NAVAL DRONES; SHIP SUNK',
    icon: iconShip,
  },
  {
    tag: 'TECH - NVIDIA',
    accent: [15, 118, 110],
    headline: 'NVIDIA REINSTATES JENSEN HUANG AS CEO',
    sub: 'BOARD ACTS DAYS AFTER RESIGNATION; TRUMP WEIGHED IN',
    fact: 'BACK LESS THAN 2 WEEKS AFTER EXIT',
    icon: iconChip,
  },
  {
    tag: 'SECURITY - NATO',
    accent: [91, 75, 138],
    headline: 'NATO WARNS OF RUSSIAN NUCLEAR SATELLITE',
    sub: 'MOSCOW MAY LAUNCH WITHIN 60 DAYS, ALLIES SAY',
    fact: 'RUTTE: ALLIANCE WILL DEFEND SPACE',
    icon: iconSatellite,
  },
  {
    tag: 'AMERICAS - MEXICO',
    accent: [122, 74, 33],
    headline: "US DRONE HELPS CATCH 'EL CHAPO ISIDRO'",
    sub: 'MEXICO TO TRY DRUG LORD FAUSTO ISIDRO MEZA FLORES',
    fact: 'CAPTURED IN SINALOA OVER THE WEEKEND',
    icon: iconCuffs,
  },
];

// -------------------------------------------------------------- compose
function drawPanel(s: Story, x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, PANEL);
  // Accent top strip with the tag.
  fillRect(x, y, w, 34, s.accent);
  drawText(s.tag, x + 14, y + 9, 2, WHITE);
  // Story number, right side of the strip.
  const n = String(STORIES.indexOf(s) + 1);
  drawText(n, x + w - 14 - textWidth(n, 2), y + 9, 2, WHITE);
  // Thin rule under the strip.
  fillRect(x, y + 34, w, 2, LINE);
  // Pictogram on the left.
  s.icon(x + 16, y + 52, s.accent);
  // Headline, wrapped, scale 3 (18 px per char, ~19 chars a line).
  const tx = x + 128;
  const tw = w - 128 - 16;
  const maxChars = Math.floor(tw / 18);
  const lines = wrap(s.headline, maxChars);
  let ty = y + 56;
  for (const ln of lines) {
    drawText(ln, tx, ty, 3, INK);
    ty += 24;
  }
  // Sub-line, scale 2 (12 px per char, ~28 chars a line).
  const subMax = Math.floor(tw / 12);
  const subLines = wrap(s.sub, subMax);
  ty += 8;
  for (const ln of subLines) {
    drawText(ln, tx, ty, 2, MUTED);
    ty += 18;
  }
  // Key fact, scale 2, in the panel accent colour.
  const factLines = wrap(s.fact, subMax);
  ty += 10;
  for (const ln of factLines) {
    drawText(ln, tx, ty, 2, s.accent);
    ty += 18;
  }
}

function main(): void {
  // Paper background.
  fillRect(0, 0, W, H, PAPER);

  // Masthead: navy band, date large, strapline, red rule.
  fillRect(0, 0, W, 148, NAVY);
  drawTextCentered('TUESDAY 24 NOVEMBER 2026', W / 2, 26, 4, WHITE);
  drawTextCentered('THE WORLD IN ONE IMAGE', W / 2, 78, 3, [232, 196, 120]);
  fillRect(312, 122, 400, 4, RED);

  // Six panels: 2 columns x 3 rows.
  const px0 = 16;
  const py0 = 164;
  const pw = 488;
  const ph = 258;
  const gx = 16;
  const gy = 14;
  for (let i = 0; i < STORIES.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawPanel(STORIES[i], px0 + col * (pw + gx), py0 + row * (ph + gy), pw, ph);
  }

  // Footer: one line that says what the day was.
  drawTextCentered('SIX STORIES THAT DEFINED THE DAY', W / 2, 972, 2, MUTED);
  drawTextCentered('MAKE.FUN - NEWS-IMAGE-20261124', W / 2, 996, 2, MUTED);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  const png = encodePng();
  writeFileSync(join(outDir, 'entry.png'), png);
  console.log(`wrote ${png.length} bytes to ${join(outDir, 'entry.png')}`);
}

main();
