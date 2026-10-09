// Builds the finished beta videos: recordings/finlab-ph-beta-video[-<shape>][-teaser].mp4
//   shapes: wide 1920×1080, square 1080×1080 (LinkedIn feed), vertical 1080×1920 (Reels, TikTok, Stories, Shorts)
//   cuts:   full (~52s) and teaser (~15s)
// Inputs: recordings/00-intro, 01–08 app clips, 09-outro (+ -square/-vertical cards from record-cards.mjs).
// Needs a full ffmpeg (FFMPEG env var, or ~/finlab-tools/ffmpeg).
//
//   node scripts/build-video.mjs                     (every shape, both cuts)
//   node scripts/build-video.mjs vertical teaser     (one shape and/or one cut)
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REC = join(root, 'recordings');
const WORK = join(REC, 'build');
const tools = join(process.env.USERPROFILE ?? '', 'finlab-tools', 'ffmpeg');
const FFMPEG = process.env.FFMPEG ?? join(tools, readdirSync(tools).find((d) => d.startsWith('ffmpeg')), 'bin', 'ffmpeg.exe');
const FPS = 30;
const XFADE = 0.4;
const BAR = 6; // progress bar height
mkdirSync(WORK, { recursive: true });

// Keep WINDOW in sync with brand/video/frame.html.
// bar: where the progress bar goes (vertical keeps it under the window, clear of the apps' on-screen buttons).
const SHAPES = {
  wide: { W: 1920, H: 1080, suffix: '', window: { x: 240, y: 215, w: 1440, h: 810 }, bar: { x: 0, y: 1080 - BAR, w: 1920 } },
  square: { W: 1080, H: 1080, suffix: '-square', window: { x: 40, y: 300, w: 1000, h: 562 }, bar: { x: 0, y: 1080 - BAR, w: 1080 } },
  // Vertical shows a taller window, so each scene is first cropped to the window's shape around its key area.
  vertical: { W: 1080, H: 1920, suffix: '-vertical', window: { x: 40, y: 600, w: 1000, h: 880 }, bar: { x: 40, y: 1506, w: 1000 }, crop: true },
  // v3 landscape: the clip sits in a browser window (frame.html shape "cinema"); uses the wide intro/outro cards.
  cinema: { W: 1920, H: 1080, suffix: '', cardSuffix: '', window: { x: 240, y: 214, w: 1440, h: 810 }, bar: { x: 0, y: 1080 - BAR, w: 1920 } },
};

// Zoom tip: the zoomed view's left edge is cx - 0.5/z; keep it at ~0.2 so it lines up with the app's sidebar edge.
// Source window [start, end) in seconds (negative end = from the clip's end), playback speed, frozen hold at
// the end, and the zoom target: centre (fractions of the frame) and how far to push in.
const FULL = [
  { file: '00-intro', start: 0.4, end: -1.3, card: true },
  { file: '01-certifications', start: 2.4, end: 7.6, num: '01', eyebrow: 'Learn', title: 'Certifications for <em>real finance careers.</em>', zoom: { cx: 0.6, cy: 0.5, z: 1.25 } },
  { file: '02-lesson', start: 6.3, end: 12.3, speed: 1.2, num: '02', eyebrow: 'Learn', title: 'Short lessons. <em>Clear explanations.</em>', zoom: { cx: 0.54, cy: 0.45, z: 1.5 } },
  { file: '03-practice', start: 8.0, end: 16.0, speed: 1.6, hold: 0.9, num: '03', eyebrow: 'Practice', title: 'Practice it. <em>Get instant feedback.</em>', zoom: { cx: 0.52, cy: 0.55, z: 1.6 } },
  { file: '04-case', start: 4.5, end: 12.5, speed: 1.6, num: '04', eyebrow: 'Apply', title: 'Solve real-style cases. <em>Every answer is scored.</em>', zoom: { cx: 0.575, cy: 0.5, z: 1.35 } },
  { file: '05-leaderboards', start: 11.0, end: 16.0, num: '05', eyebrow: 'Compete', title: 'Climb the leaderboards, <em>every week.</em>', zoom: { cx: 0.545, cy: 0.38, z: 1.45 } },
  { file: '06-classes', start: 2.5, end: 12.0, speed: 1.9, num: '06', eyebrow: 'Compete', title: 'Your class. <em>Your own leaderboard.</em>', zoom: { cx: 0.535, cy: 0.38, z: 1.5 } },
  { file: '07-certificate', start: 5.0, end: 15.5, speed: 2.0, num: '07', eyebrow: 'Prove it', title: 'Earn certificates <em>anyone can verify.</em>', zoom: { cx: 0.5, cy: 0.45, z: 1.25, vx: 0.27, ax: 0.5 } },
  { file: '08-beta-checklist', start: 3.0, end: 9.5, speed: 1.3, num: '08', eyebrow: 'Closed beta', title: '5 tasks = a <em>Founding Beta Tester</em> certificate.', zoom: { cx: 0.8, cy: 0.42, z: 1.75, vx: 0.66, ax: 1 } },
  { file: '09-outro', start: 0.4, end: -2.0, card: true },
];

// The 15-second teaser: hook, four quick scenes, call to action. Each scene reuses the full cut's text and zoom.
const pick = (file, over) => ({ ...FULL.find((s) => s.file === file), ...over });
const TEASER = [
  { file: '00-intro', start: 0.4, end: 3.0, card: true },
  pick('03-practice', { start: 10.5, end: 16.0, speed: 2.2, hold: 0 }),
  pick('05-leaderboards', { start: 11.0, end: 13.5 }),
  pick('07-certificate', { start: 6.5, end: 12.5, speed: 2.4 }),
  pick('08-beta-checklist', { start: 3.5, end: 6.75, speed: 1.3 }),
  { file: '09-outro', start: 0.4, end: 6.2, card: true },
];
// v3: fresh clips from scripts/record-v3.mjs (recordings/v3). Every scene has an exact length (len); the playback
// speed is worked out from it. Lengths are 0.4s (the crossfade) plus whole beats at 100 BPM, so every cut lands on
// the beat. "transition" is the xfade used to enter the scene.
const V3 = [
  { file: '00-intro', start: 0.4, len: 7.6, card: true },
  { file: 'dashboard', start: 2.0, end: -3.0, len: 5.2, transition: 'circleopen', num: '01', eyebrow: 'Your desk', title: 'Pick up <em>right where you left off.</em>', zoom: { cx: 0.6, cy: 0.42, z: 1.2 } },
  { file: 'certifications', start: 2.2, end: -3.0, len: 4.0, num: '02', eyebrow: 'Learn', title: 'Certifications for <em>real finance careers.</em>', zoom: { cx: 0.6, cy: 0.5, z: 1.25 } },
  { file: 'practice', start: 7.0, end: -3.0, len: 5.2, num: '03', eyebrow: 'Practice', title: 'Learn it. <em>Then practice it.</em>', zoom: { cx: 0.52, cy: 0.55, z: 1.6 } },
  { file: 'case', start: 3.5, end: -3.0, len: 4.0, num: '04', eyebrow: 'Apply', title: 'Real-style cases, <em>scored instantly.</em>', zoom: { cx: 0.575, cy: 0.5, z: 1.35 } },
  { file: 'trading-play', start: 3.0, end: -3.5, len: 7.6, transition: 'circleopen', num: '05', eyebrow: 'Trading Floor', title: 'Trade on <em>real charts.</em>', zoom: { cx: 0.5, cy: 0.5, z: 1.06 } },
  { file: 'trading-order', start: 3.0, end: -3.0, len: 5.2, num: '06', eyebrow: 'Trading Floor', title: 'Set your stop. <em>Manage the risk.</em>', zoom: { cx: 0.5, cy: 0.5, z: 1.04 } },
  { file: 'ai-helper', start: 2.4, end: -3.0, len: 6.4, transition: 'circleopen', num: '07', eyebrow: 'AI study helper', title: 'Stuck? <em>Ask the helper.</em>', zoom: { cx: 0.82, cy: 0.62, z: 1.55 } },
  { file: 'planner', start: 2.0, end: -3.0, len: 5.2, num: '08', eyebrow: 'Tools', title: 'Plan a portfolio <em>for a real goal.</em>', zoom: { cx: 0.5, cy: 0.5, z: 1.1 } },
  { file: 'optimizer', start: 2.4, end: -3.0, len: 5.2, num: '09', eyebrow: 'Tools', title: 'Find the <em>efficient frontier.</em>', zoom: { cx: 0.42, cy: 0.5, z: 1.15 } },
  { file: 'leaderboard', start: 2.0, end: -3.0, len: 4.0, num: '10', eyebrow: 'Compete', title: 'Compete with everyone, <em>every week.</em>', zoom: { cx: 0.545, cy: 0.38, z: 1.45 } },
  { file: 'classes', start: 2.2, end: -3.0, len: 4.0, num: '11', eyebrow: 'Compete', title: 'Your class. <em>Your own leaderboard.</em>', zoom: { cx: 0.535, cy: 0.38, z: 1.5 } },
  { file: 'certificate', start: 4.5, end: -3.0, len: 5.2, num: '12', eyebrow: 'Prove it', title: 'Earn certificates <em>anyone can verify.</em>', zoom: { cx: 0.5, cy: 0.45, z: 1.2 } },
  { file: 'beta', start: 2.5, end: -3.0, len: 4.0, num: '13', eyebrow: 'Closed beta', title: '5 tasks = a <em>Founding Beta Tester</em> certificate.', zoom: { cx: 0.8, cy: 0.42, z: 1.75 } },
  { file: '09-outro', start: 0.4, len: 7.6, card: true, transition: 'fadeblack' },
];
const CUTS = {
  full: { segments: FULL, suffix: '' },
  teaser: { segments: TEASER, suffix: '-teaser' },
  v3: { segments: V3, suffix: '-v3', dir: 'v3', only: ['cinema'], defaultTransition: 'smoothleft', sfx: true },
};

const run = (args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
function duration(file) {
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: 'pipe' });
  } catch (e) {
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(e.stderr));
    if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];
  }
  throw new Error(`Could not read the length of ${file}`);
}
const n = (x) => +x.toFixed(3);

const args = process.argv.slice(2);
const shapes = args.filter((a) => SHAPES[a]);
const cuts = args.filter((a) => CUTS[a]);
const browser = await chromium.launch({ channel: 'chrome', headless: true });

for (const cutName of cuts.length ? cuts : Object.keys(CUTS))
for (const shapeName of shapes.length ? shapes : Object.keys(SHAPES)) {
  const cut = CUTS[cutName];
  if (cut.only ? !cut.only.includes(shapeName) : shapeName === 'cinema') continue;
  const S = SHAPES[shapeName];
  const SEGMENTS = cut.segments;
  const out = join(REC, `finlab-ph-beta-video${S.suffix}${cut.suffix}.mp4`);
  const win = S.window;
  const tag = `${shapeName}${cut.suffix}`;

  // ------------------------------------------------------------ 1. overlay layers (background + headline)
  const framePage = pathToFileURL(join(root, 'brand', 'video', 'frame.html')).href;
  for (const s of SEGMENTS.filter((x) => !x.card)) {
    for (const part of ['bg', 'title']) {
      const page = await browser.newPage({ viewport: { width: S.W, height: S.H } });
      const q = new URLSearchParams({ shape: shapeName, part, num: s.num, eyebrow: s.eyebrow, title: s.title });
      await page.goto(`${framePage}?${q}`);
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      await page.screenshot({ path: join(WORK, `${shapeName}-${part}-${s.file}.png`), omitBackground: true });
      await page.close();
    }
  }

  // ------------------------------------------------------------ 2. segment lengths and positions
  const plan = SEGMENTS.map((s) => {
    const src = s.card ? join(REC, `${s.file}${S.cardSuffix ?? S.suffix}.webm`) : join(REC, cut.dir ?? '', `${s.file}.webm`);
    const hold = s.hold ?? 0;
    if (s.len && s.card) return { ...s, src, end: s.start + s.len, speed: 1, hold, len: s.len };
    const end = s.end < 0 ? duration(src) + s.end : s.end;
    // With an exact length, speed the source up or down to fit it (never slower than 0.8x).
    const speed = s.len ? Math.max(0.8, (end - s.start) / (s.len - hold)) : s.speed ?? 1;
    return { ...s, src, end, speed: n(speed), hold, len: s.len ?? n((end - s.start) / speed + hold) };
  });
  const total = n(plan.reduce((a, p) => a + p.len, 0) - XFADE * (plan.length - 1));
  let at = 0;
  for (const p of plan) { p.offset = n(at); at += p.len - XFADE; }

  // ------------------------------------------------------------ 3. render each segment
  for (const p of plan) {
    const seg = join(WORK, `${tag}-seg-${p.file}.mp4`);
    const time = `setpts=(PTS-STARTPTS)/${p.speed},fps=${FPS}` + (p.hold ? `,tpad=stop_mode=clone:stop_duration=${p.hold}` : '');
    if (p.card) {
      run(['-ss', String(p.start), '-to', String(p.end), '-i', p.src, '-vf', `${time},scale=${S.W}:${S.H}:flags=lanczos,format=yuv420p`,
        '-t', String(p.len), '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', seg]);
    } else {
      // Smooth push-in: zoom eases from 1 to z between 0.6s and 2.4s, centred on the key area.
      const { cx, cy, z } = p.zoom;
      const ease = `min(1,max(0,(on/${FPS}-0.6)/1.8))`;
      const big = { w: win.w * 2, h: win.h * 2 };
      let zoom;
      if (S.crop) {
        // Crop the 16:9 clip to the window's shape, starting just right of the app sidebar (vx = left edge, 0..1);
        // the push-in then keeps the left edge (ax 0), the centre (0.5) or the right edge (1) fixed.
        const cw = Math.round((720 * win.w) / win.h / 2) * 2;
        const vx = p.zoom.vx ?? 0.2;
        const left = Math.round(Math.min(1280 - cw, vx * 1280));
        const zexpr = `1+${(z - 1) * 0.45}*(${ease})*(${ease})*(3-2*(${ease}))`;
        zoom = `crop=${cw}:720:${left}:0,scale=${big.w}:${big.h}:flags=lanczos,zoompan=z='${zexpr}':x='(iw-iw/zoom)*${p.zoom.ax ?? 0}':` +
          `y='max(0,min(ih-ih/zoom,${cy}*ih-ih/zoom/2))':d=1:s=${win.w}x${win.h}:fps=${FPS}`;
      } else {
        const zexpr = `1+${z - 1}*(${ease})*(${ease})*(3-2*(${ease}))`;
        zoom = `scale=${big.w}:${big.h}:flags=lanczos,zoompan=z='${zexpr}':x='max(0,min(iw-iw/zoom,${cx}*iw-iw/zoom/2))':` +
          `y='max(0,min(ih-ih/zoom,${cy}*ih-ih/zoom/2))':d=1:s=${win.w}x${win.h}:fps=${FPS}`;
      }
      const B = S.bar;
      const bar = `color=c=0xf5a524:s=${B.w}x${BAR}:r=${FPS}:d=${p.len}[pb];` +
        `[c]drawbox=x=${B.x}:y=${B.y}:w=${B.w}:h=${BAR}:color=white@0.06:t=fill[c2];` +
        `[c2][pb]overlay=x='${B.x}-w+w*(${p.offset}+t)/${total}':y=${B.y}:eval=frame:shortest=1`;
      run([
        '-ss', String(p.start), '-to', String(p.end), '-i', p.src,
        '-loop', '1', '-t', String(p.len), '-i', join(WORK, `${shapeName}-bg-${p.file}.png`),
        '-loop', '1', '-t', String(p.len), '-i', join(WORK, `${shapeName}-title-${p.file}.png`),
        '-filter_complex',
        `color=c=0x0b0f15:s=${S.W}x${S.H}:r=${FPS}:d=${p.len}[base];[0:v]${time},${zoom}[clip];` +
          `[base][clip]overlay=${win.x}:${win.y}:shortest=1[a];[a][1:v]overlay=0:0:shortest=1[b];` +
          `[2:v]format=rgba,fade=t=in:st=0.25:d=0.5:alpha=1[t];[b][t]overlay=x=0:y='20*max(0,1-(t-0.25)/0.5)':eval=frame:shortest=1[c];` +
          `${bar},crop=${S.W}:${S.H}:0:0,format=yuv420p[v]`,
        '-map', '[v]', '-t', String(p.len), '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-r', String(FPS), seg,
      ]);
    }
    console.log(`[${tag}] ${p.file}: ${p.len}s`);
  }
  console.log(`[${tag}] video length: ${total}s`);

  // ------------------------------------------------------------ 4. music, composed in code (no licence issues)
  const music = join(WORK, `${tag}-music.wav`);
  const page = await browser.newPage();
  const b64 = await page.evaluate(async ({ seconds, introEnd, outroStart, whooshes, hit }) => {
    const SR = 44100;
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * seconds), SR);
    const BPM = 100, BEAT = 60 / BPM, BARLEN = BEAT * 4;
    const hz = (m) => 440 * 2 ** ((m - 69) / 12);
    const CHORDS = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]; // Am F C G
    const ROOTS = [45, 41, 48, 43];
    const master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    const verb = ctx.createConvolver();
    const ir = ctx.createBuffer(2, SR * 2.8, SR);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3; }
    verb.buffer = ir;
    const verbGain = ctx.createGain(); verbGain.gain.value = 0.35; verb.connect(verbGain).connect(master);
    const noise = ctx.createBuffer(1, SR, SR); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const bars = Math.ceil(seconds / BARLEN);
    for (let b = 0; b < bars; b++) {
      const t0 = b * BARLEN, ci = b % 4;
      for (const m of CHORDS[ci]) for (const det of [-7, 7]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100; f.Q.value = 0.4;
        const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.022, t0 + 0.6); g.gain.setValueAtTime(0.022, t0 + BARLEN - 0.3); g.gain.linearRampToValueAtTime(0, t0 + BARLEN + 0.4);
        o.connect(f).connect(g); g.connect(master); g.connect(verb); o.start(t0); o.stop(t0 + BARLEN + 0.5);
      }
      for (let i = 0; i < 8; i++) {
        const t = t0 + i * BEAT / 2, m = CHORDS[ci][[0, 1, 2, 1, 0, 2, 1, 2][i]] + 12;
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g); g.connect(master); g.connect(verb); o.start(t); o.stop(t + 0.4);
      }
      if (t0 < introEnd - BARLEN * 0.5 || t0 >= outroStart + BARLEN) continue;
      for (let beat = 0; beat < 4; beat++) {
        const t = t0 + beat * BEAT;
        const k = ctx.createOscillator(); k.frequency.setValueAtTime(140, t); k.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        const kg = ctx.createGain(); kg.gain.setValueAtTime(0.75, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        k.connect(kg).connect(master); k.start(t); k.stop(t + 0.4);
        const bo = ctx.createOscillator(); bo.type = 'sine'; bo.frequency.value = hz(ROOTS[ci]);
        const bg = ctx.createGain(); bg.gain.setValueAtTime(0.0001, t + 0.02); bg.gain.exponentialRampToValueAtTime(0.22, t + 0.06); bg.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 0.9);
        bo.connect(bg).connect(master); bo.start(t); bo.stop(t + BEAT);
        if (beat % 2 === 1) {
          const nz = ctx.createBufferSource(); nz.buffer = noise;
          const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 0.8;
          const g = ctx.createGain(); g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          nz.connect(f).connect(g); g.connect(master); g.connect(verb); nz.start(t); nz.stop(t + 0.2);
        }
        const h = ctx.createBufferSource(); h.buffer = noise;
        const hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 7500;
        const hg = ctx.createGain(); hg.gain.setValueAtTime(0.09, t + BEAT / 2); hg.gain.exponentialRampToValueAtTime(0.001, t + BEAT / 2 + 0.05);
        h.connect(hf).connect(hg).connect(master); h.start(t + BEAT / 2); h.stop(t + BEAT / 2 + 0.06);
      }
    }
    // Sound design: a soft filtered-noise whoosh on every cut, and a low hit when the logo lands.
    const sfx = ctx.createGain(); sfx.gain.value = 0.55; sfx.connect(comp);
    for (const t0 of whooshes) {
      const w = ctx.createBufferSource(); w.buffer = noise;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(400, Math.max(0, t0 - 0.25)); f.frequency.exponentialRampToValueAtTime(3200, t0 + 0.2);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, Math.max(0, t0 - 0.25)); g.gain.exponentialRampToValueAtTime(0.35, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
      w.connect(f).connect(g).connect(sfx); w.start(Math.max(0, t0 - 0.25)); w.stop(t0 + 0.4);
    }
    if (hit !== null) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(90, hit); o.frequency.exponentialRampToValueAtTime(38, hit + 0.6);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.9, hit); g.gain.exponentialRampToValueAtTime(0.001, hit + 1.2);
      o.connect(g).connect(sfx); g.connect(verb); o.start(hit); o.stop(hit + 1.3);
    }
    master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(0.9, 1.0);
    master.gain.setValueAtTime(0.9, seconds - 2.5); master.gain.linearRampToValueAtTime(0, seconds);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0; for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const k = 0.89 / (peak || 1);
    const bytes = new Uint8Array(44 + L.length * 4), dv = new DataView(bytes.buffer);
    const w = (o, s) => [...s].forEach((ch, i) => dv.setUint8(o + i, ch.charCodeAt(0)));
    w(0, 'RIFF'); dv.setUint32(4, 36 + L.length * 4, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
    dv.setUint16(22, 2, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true);
    w(36, 'data'); dv.setUint32(40, L.length * 4, true);
    for (let i = 0, o = 44; i < L.length; i++, o += 4) {
      dv.setInt16(o, Math.max(-1, Math.min(1, L[i] * k)) * 32767, true);
      dv.setInt16(o + 2, Math.max(-1, Math.min(1, R[i] * k)) * 32767, true);
    }
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, { seconds: total, introEnd: plan[0].len, outroStart: plan.at(-1).offset, whooshes: cut.sfx ? plan.slice(1).map((p) => p.offset) : [], hit: cut.sfx ? 3.75 : null });
  writeFileSync(music, Buffer.from(b64, 'base64'));
  await page.close();

  // ------------------------------------------------------------ 5. crossfade, add music, export
  const inputs = plan.flatMap((p) => ['-i', join(WORK, `${tag}-seg-${p.file}.mp4`)]);
  let graph = '', prev = '[0:v]';
  for (let i = 1; i < plan.length; i++) {
    const label = i === plan.length - 1 ? '[v]' : `[x${i}]`;
    graph += `${prev}[${i}:v]xfade=transition=${plan[i].transition ?? cut.defaultTransition ?? 'fade'}:duration=${XFADE}:offset=${plan[i].offset}${label};`;
    prev = `[x${i}]`;
  }
  graph += `[${plan.length}:a]atrim=0:${total},loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${n(total - 2)}:d=2[a]`;
  run([...inputs, '-i', music, '-filter_complex', graph, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', String(total), out]);
  console.log(`[${tag}] done: ${out} (${duration(out).toFixed(1)}s)`);
}
await browser.close();
