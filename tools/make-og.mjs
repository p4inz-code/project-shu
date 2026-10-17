// Generates site/og.png (1200x630) with no dependencies: a moonlit sky with drifting blossom petals.
// Run: node tools/make-og.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';

const W = 1200, H = 630;
const px = Buffer.alloc(W * H * 3);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
let seed = 5; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const top = [12, 9, 24], mid = [44, 33, 82], bot = [92, 52, 110];
const moon = { x: 880, y: 250, r: 120 };
const petals = Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * H, a: rnd() * Math.PI * 2, rx: 5 + Math.pow(rnd(), 2) * 22, ry: 3 + rnd() * 9, al: .35 + rnd() * .6 }));

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = y / H;
    let c = t < .6 ? [mix(top[0], mid[0], t / .6), mix(top[1], mid[1], t / .6), mix(top[2], mid[2], t / .6)] : [mix(mid[0], bot[0], (t - .6) / .4), mix(mid[1], bot[1], (t - .6) / .4), mix(mid[2], bot[2], (t - .6) / .4)];
    const d = Math.hypot(x - moon.x, y - moon.y);
    const glow = clamp(1 - d / 420); c = c.map((v, i) => v + glow * glow * [120, 100, 130][i]);
    if (d < moon.r) { const sh = clamp((x - (moon.x - moon.r * .4)) / (moon.r * 1.6)); c = [mix(252, 160, sh), mix(248, 150, sh), mix(255, 190, sh)]; }
    // faint stars
    if (((x * 73856093) ^ (y * 19349663)) % 2203 === 0) c = c.map(v => Math.min(255, v + 90));
    const o = (y * W + x) * 3; px[o] = clamp(c[0] / 255) * 255; px[o + 1] = clamp(c[1] / 255) * 255; px[o + 2] = clamp(c[2] / 255) * 255;
  }
}
for (const p of petals) {
  const R = Math.ceil(Math.max(p.rx, p.ry)) + 2, ca = Math.cos(p.a), sa = Math.sin(p.a);
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const X = Math.round(p.x) + dx, Y = Math.round(p.y) + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const u = (dx * ca + dy * sa) / p.rx, v = (-dx * sa + dy * ca) / p.ry, e = u * u + v * v; if (e > 1) continue;
    const a = p.al * clamp(1.15 - e), o = (Y * W + X) * 3, tint = [250, 188 + 40 * (1 - e), 205 + 30 * (1 - e)];
    for (let k = 0; k < 3; k++) px[o + k] = px[o + k] * (1 - a) + tint[k] * a;
  }
}
// PNG encode
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync('site/og.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote site/og.png');
