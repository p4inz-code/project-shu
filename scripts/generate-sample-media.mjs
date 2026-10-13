import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const photosDir = path.join(rootDir, 'private-content', 'photos');
const audioDir = path.join(rootDir, 'private-content', 'audio');
const videoDir = path.join(rootDir, 'private-content', 'video');

fs.mkdirSync(photosDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(videoDir, { recursive: true });

const videoGitkeep = path.join(videoDir, '.gitkeep');
if (!fs.existsSync(videoGitkeep)) {
  fs.writeFileSync(
    videoGitkeep,
    '# Drop film-01.mp4 or film-01.webm in this directory before running npm run build.\n',
    'utf8',
  );
}

const placeholderSpecs = [
  {
    stem: 'memory-01',
    width: 900,
    height: 1125,
    plate: 'PLATE 01 // MOONLIGHT PORTRAIT',
    title: 'LUNAR HALO SILHOUETTE',
    subtitle: 'Drop memory-01.jpg in private-content/photos/',
    mood: 'You’re my moon — reserved for Atharva’s opening portrait of Shu',
    bgStart: '#0d0a1a',
    bgMid: '#1e1538',
    bgEnd: '#3b2459',
    accent: '#dfd4f7',
    ivory: '#f8f5fc',
    bloom: '#9f7aea',
  },
  {
    stem: 'memory-02',
    width: 1200,
    height: 900,
    plate: 'PLATE 02 // SUNSHINE CANDID',
    title: 'MORNING SUNLIGHT LAUGH',
    subtitle: 'Drop memory-02.jpg in private-content/photos/',
    mood: 'You’re my sunshine — reserved for a candid laugh in warm light',
    bgStart: '#fff9f5',
    bgMid: '#fde4ea',
    bgEnd: '#f9d4c2',
    accent: '#b86b7e',
    ivory: '#2b1623',
    bloom: '#f3a683',
  },
  {
    stem: 'memory-03',
    width: 1000,
    height: 1000,
    plate: 'PLATE 03 // TWILIGHT 6×6',
    title: 'LAVENDER DUSK WALK',
    subtitle: 'Drop memory-03.jpg in private-content/photos/',
    mood: 'Between moonlight and daylight — reserved for a quiet evening frame',
    bgStart: '#161029',
    bgMid: '#2d1e4a',
    bgEnd: '#593366',
    accent: '#e6d8fa',
    ivory: '#faf7ff',
    bloom: '#d68bad',
  },
  {
    stem: 'memory-04',
    width: 900,
    height: 1125,
    plate: 'PLATE 04 // GOLDEN DAYLIGHT',
    title: 'SIMPLY SHU IN SUNLIGHT',
    subtitle: 'Drop memory-04.jpg in private-content/photos/',
    mood: 'Warmth that fills the room — reserved for a solo portrait of Shu',
    bgStart: '#fffaf6',
    bgMid: '#f7e3f0',
    bgEnd: '#fde2d2',
    accent: '#a85d74',
    ivory: '#2a1621',
    bloom: '#e8a87c',
  },
  {
    stem: 'memory-05',
    width: 1200,
    height: 900,
    plate: 'PLATE 05 // STARLIGHT FRAME',
    title: 'UNDER THE SAME MOON',
    subtitle: 'Drop memory-05.jpg in private-content/photos/',
    mood: 'Reserved for a shared adventure or unhurried detour together',
    bgStart: '#0e0b1c',
    bgMid: '#1f173b',
    bgEnd: '#432757',
    accent: '#dcd0f5',
    ivory: '#f7f4fc',
    bloom: '#b794f4',
  },
  {
    stem: 'memory-06',
    width: 900,
    height: 1125,
    plate: 'PLATE 06 // KEEPSAKE PORTRAIT',
    title: 'MOONLIGHT & SUNSHINE',
    subtitle: 'Drop memory-06.jpg in private-content/photos/',
    mood: 'Reserved for Atharva’s favorite two-shot keepsake with Shu',
    bgStart: '#fff9f5',
    bgMid: '#f9e0ea',
    bgEnd: '#eddbf7',
    accent: '#9c5270',
    ivory: '#281521',
    bloom: '#e58ca8',
  },
  {
    stem: 'portrait-01',
    width: 900,
    height: 1125,
    plate: 'PORTRAIT 01 // HERO KEEPSAKE',
    title: 'OPENING PORTRAIT OF SHU',
    subtitle: 'Drop portrait-01.jpg in private-content/photos/',
    mood: 'You’re my moon — reserved for Shu’s featured portrait slot',
    bgStart: '#120d24',
    bgMid: '#241845',
    bgEnd: '#462b69',
    accent: '#e2d6fa',
    ivory: '#f8f5fc',
    bloom: '#b794f4',
  },
  {
    stem: 'film-01',
    width: 1280,
    height: 720,
    plate: 'FILM 01 // MOTION KEEPSAKE REEL',
    title: 'SHORT FILM POSTER FRAME',
    subtitle: 'Drop film-01.mp4 in private-content/video/',
    mood: 'Reserved for Atharva’s short video clip or motion memory with Shu',
    bgStart: '#16102b',
    bgMid: '#35204f',
    bgEnd: '#6e3b6b',
    accent: '#f0dcf7',
    ivory: '#fff8fc',
    bloom: '#e38ca9',
  },
  {
    stem: 'final-photo',
    width: 1200,
    height: 900,
    plate: 'FINAL PHOTO // EPILOGUE KEEPSAKE',
    title: 'ALWAYS YOUR CORNER',
    subtitle: 'Drop final-photo.jpg in private-content/photos/',
    mood: 'You’re my moon, and you’re my sunshine — closing keepsake frame',
    bgStart: '#191233',
    bgMid: '#4c2a5c',
    bgEnd: '#f2c6b6',
    accent: '#f7e6f2',
    ivory: '#fffaf7',
    bloom: '#e5989b',
  },
];

for (const [idx, spec] of placeholderSpecs.entries()) {
  const cx = Math.round(spec.width * 0.5);
  const cy = Math.round(spec.height * 0.42);
  const rOuter = Math.round(Math.min(spec.width, spec.height) * 0.23);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.width} ${spec.height}" width="${spec.width}" height="${spec.height}">
  <defs>
    <linearGradient id="bg-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${spec.bgStart}" />
      <stop offset="55%" stop-color="${spec.bgMid}" />
      <stop offset="100%" stop-color="${spec.bgEnd}" />
    </linearGradient>
    <radialGradient id="glow-${idx}" cx="50%" cy="42%" r="52%">
      <stop offset="0%" stop-color="${spec.bloom}" stop-opacity="0.42" />
      <stop offset="55%" stop-color="${spec.accent}" stop-opacity="0.14" />
      <stop offset="100%" stop-color="${spec.bgStart}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg-${idx})" />
  <rect width="100%" height="100%" fill="url(#glow-${idx})" />

  <!-- Delicate frame lines -->
  <rect x="34" y="34" width="${spec.width - 68}" height="${spec.height - 68}" rx="12" fill="none" stroke="${spec.accent}" stroke-opacity="0.32" stroke-width="1.3" />
  <rect x="50" y="50" width="${spec.width - 100}" height="${spec.height - 100}" rx="8" fill="none" stroke="${spec.ivory}" stroke-opacity="0.12" stroke-width="1" />

  <!-- Top metadata strip -->
  <text x="68" y="82" fill="${spec.accent}" font-family="monospace" font-size="13" letter-spacing="3" opacity="0.82">
    ${spec.plate}
  </text>
  <text x="${spec.width - 68}" y="82" text-anchor="end" fill="${spec.accent}" font-family="monospace" font-size="13" letter-spacing="2" opacity="0.72">
    SHU KEEPSAKE • 0${idx + 1}
  </text>

  <!-- Subtle orbital crosshairs -->
  <line x1="${cx - rOuter - 55}" y1="${cy}" x2="${cx + rOuter + 55}" y2="${cy}" stroke="${spec.accent}" stroke-opacity="0.2" stroke-width="1" />
  <line x1="${cx}" y1="${cy - rOuter - 55}" x2="${cx}" y2="${cy + rOuter + 55}" stroke="${spec.accent}" stroke-opacity="0.2" stroke-width="1" />

  <!-- Lunar / Solar halo rings -->
  <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="${spec.accent}" stroke-opacity="0.38" stroke-width="1.3" stroke-dasharray="5 7" />
  <circle cx="${cx}" cy="${cy}" r="${Math.round(rOuter * 0.72)}" fill="none" stroke="${spec.ivory}" stroke-opacity="0.26" stroke-width="1.1" />
  <circle cx="${cx}" cy="${cy}" r="${Math.round(rOuter * 0.44)}" fill="${spec.bloom}" fill-opacity="0.22" stroke="${spec.accent}" stroke-opacity="0.52" stroke-width="1.4" />

  <!-- Center focal emblem (Heart + Lunar/Solar motif) -->
  <path d="M ${cx} ${cy + 26}
           C ${cx - 6} ${cy + 20}, ${cx - 34} ${cy - 2}, ${cx - 34} ${cy - 20}
           C ${cx - 34} ${cy - 34}, ${cx - 22} ${cy - 42}, ${cx - 10} ${cy - 42}
           C ${cx - 2} ${cy - 42}, ${cx + 4} ${cy - 36}, ${cx} ${cy - 29}
           C ${cx - 4} ${cy - 36}, ${cx + 2} ${cy - 42}, ${cx + 10} ${cy - 42}
           C ${cx + 22} ${cy - 42}, ${cx + 34} ${cy - 34}, ${cx + 34} ${cy - 20}
           C ${cx + 34} ${cy - 2}, ${cx + 6} ${cy + 20}, ${cx} ${cy + 26} Z"
        fill="${spec.bloom}" fill-opacity="0.28" stroke="${spec.ivory}" stroke-opacity="0.78" stroke-width="1.6" />

  <!-- Editorial title lockup -->
  <text x="${cx}" y="${Math.round(spec.height * 0.71)}" text-anchor="middle" fill="${spec.ivory}" font-family="Georgia, 'Times New Roman', serif" font-size="29" letter-spacing="4" opacity="0.95">
    ${spec.title}
  </text>
  <text x="${cx}" y="${Math.round(spec.height * 0.765)}" text-anchor="middle" fill="${spec.accent}" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="20" opacity="0.9">
    ${spec.mood}
  </text>
  <text x="${cx}" y="${Math.round(spec.height * 0.835)}" text-anchor="middle" fill="${spec.ivory}" font-family="monospace" font-size="14" letter-spacing="1.5" opacity="0.68">
    ${spec.subtitle}
  </text>
  <text x="${cx}" y="${Math.round(spec.height * 0.885)}" text-anchor="middle" fill="${spec.accent}" font-family="sans-serif" font-size="12" letter-spacing="3" opacity="0.58">
    MOONLIGHT × SUNSHINE EDITION • FOR YASHVI POKAR
  </text>
</svg>`;

  fs.writeFileSync(path.join(photosDir, `${spec.stem}.svg`), svg, 'utf8');
}

// Generate a warm, gentle 16-second acoustic chime/piano WAV placeholder (`our-song.wav`)
const sampleRate = 22050;
const durationSeconds = 16;
const totalSamples = sampleRate * durationSeconds;
const pcmData = Buffer.alloc(totalSamples * 2);

const chords = [
  [174.61, 220.0, 261.63, 329.63, 440.0],
  [164.81, 196.0, 246.94, 293.66, 392.0],
  [146.83, 174.61, 220.0, 261.63, 349.23],
  [130.81, 164.81, 196.0, 246.94, 293.66],
];

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const chordIndex = Math.min(3, Math.floor(t / 4));
  const localT = t - chordIndex * 4;
  const freqs = chords[chordIndex];

  let sample = 0;
  for (let n = 0; n < freqs.length; n++) {
    const noteStart = n * 0.18;
    if (localT >= noteStart) {
      const noteTime = localT - noteStart;
      const env = Math.min(1, noteTime / 0.04) * Math.exp(-noteTime * 0.85);
      const fundamental = Math.sin(2 * Math.PI * freqs[n] * noteTime);
      const overtone =
        0.25 *
        Math.sin(2 * Math.PI * freqs[n] * 2 * noteTime) *
        Math.exp(-noteTime * 1.6);
      sample += (fundamental + overtone) * env * 0.16;
    }
  }

  const masterFade =
    Math.min(1, t / 0.4) * Math.min(1, (durationSeconds - t) / 0.8);
  const clamped = Math.max(-0.95, Math.min(0.95, sample * masterFade));
  pcmData.writeInt16LE(Math.round(clamped * 32767), i * 2);
}

const wavHeader = Buffer.alloc(44);
wavHeader.write('RIFF', 0);
wavHeader.writeUInt32LE(36 + pcmData.length, 4);
wavHeader.write('WAVE', 8);
wavHeader.write('fmt ', 12);
wavHeader.writeUInt32LE(16, 16);
wavHeader.writeUInt16LE(1, 20);
wavHeader.writeUInt16LE(1, 22);
wavHeader.writeUInt32LE(sampleRate, 24);
wavHeader.writeUInt32LE(sampleRate * 2, 28);
wavHeader.writeUInt16LE(2, 32);
wavHeader.writeUInt16LE(16, 34);
wavHeader.write('data', 36);
wavHeader.writeUInt32LE(pcmData.length, 40);

fs.writeFileSync(
  path.join(audioDir, 'our-song.wav'),
  Buffer.concat([wavHeader, pcmData]),
);

console.log(
  'Generated 6 Milestone 6 Moonlight × Sunshine SVG plates and 1 warm acoustic WAV placeholder in private-content/.',
);
