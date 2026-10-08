// Builds the finished beta video: recordings/finlab-ph-beta-video.mp4 (1920×1080, 30 fps, H.264 + AAC).
// Inputs: recordings/00-intro, 01–08 (app clips), 09-outro. Needs a full ffmpeg (FFMPEG env var or ~/finlab-tools).
//
//   node scripts/build-video.mjs
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REC = join(root, 'recordings');
const WORK = join(REC, 'build');
const OUT = join(REC, 'finlab-ph-beta-video.mp4');
const tools = join(process.env.USERPROFILE ?? '', 'finlab-tools', 'ffmpeg');
const FFMPEG = process.env.FFMPEG ?? join(tools, readdirSync(tools).find((d) => d.startsWith('ffmpeg')), 'bin', 'ffmpeg.exe');
const FPS = 30;
const XFADE = 0.5;
mkdirSync(WORK, { recursive: true });

// file, start (s), end (s, negative = from the end), playback speed, frame text
const SEGMENTS = [
  { file: '00-intro', start: 0.5, end: -1.0 },
  { file: '01-certifications', start: 2.2, end: -3.0, num: '01', eyebrow: 'Learn', title: 'Certifications for <em>real finance careers.</em>' },
  { file: '02-lesson', start: 2.8, end: -3.0, speed: 1.3, num: '02', eyebrow: 'Learn', title: 'Short lessons. <em>Clear explanations.</em>' },
  { file: '03-practice-and-check', start: 2.2, end: -3.0, speed: 1.4, num: '03', eyebrow: 'Practice', title: 'Practice first, then <em>pass the check.</em>' },
  { file: '04-case', start: 2.2, end: -3.0, num: '04', eyebrow: 'Apply', title: 'Solve real-style cases. <em>Every answer is scored.</em>' },
  { file: '05-leaderboards', start: 2.2, end: -3.0, speed: 1.2, num: '05', eyebrow: 'Compete', title: 'Climb the leaderboards, <em>every week.</em>' },
  { file: '06-classes', start: 2.2, end: -3.0, num: '06', eyebrow: 'Compete', title: 'Your class. <em>Your own leaderboard.</em>' },
  { file: '07-certificate', start: 2.2, end: -3.0, num: '07', eyebrow: 'Prove it', title: 'A public Finance Passport <em>of your work.</em>' },
  { file: '08-beta-checklist', start: 3.0, end: -3.0, num: '08', eyebrow: 'Closed beta', title: '5 tasks = a <em>Founding Beta Tester</em> certificate.' },
  { file: '09-outro', start: 0.5, end: -0.5 },
];

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

// ---------------------------------------------------------------- 1. frame overlays
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const framePage = pathToFileURL(join(root, 'brand', 'video', 'frame.html')).href;
for (const s of SEGMENTS.filter((x) => x.title)) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const q = new URLSearchParams({ num: s.num, eyebrow: s.eyebrow, title: s.title });
  await page.goto(`${framePage}?${q}`);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  await page.screenshot({ path: join(WORK, `frame-${s.file}.png`), omitBackground: true });
  await page.close();
}
console.log('Frames rendered.');

// ---------------------------------------------------------------- 2. per-segment clips (same size, fps, format)
const lengths = [];
for (const s of SEGMENTS) {
  const src = join(REC, `${s.file}.webm`);
  const end = s.end < 0 ? duration(src) + s.end : s.end;
  const speed = s.speed ?? 1;
  const len = +((end - s.start) / speed).toFixed(3);
  lengths.push(len);
  const out = join(WORK, `seg-${s.file}.mp4`);
  const v = `setpts=(PTS-STARTPTS)/${speed},fps=${FPS}`;
  if (s.title) {
    run([
      '-ss', String(s.start), '-to', String(end), '-i', src, '-i', join(WORK, `frame-${s.file}.png`),
      '-filter_complex',
      `color=c=0x0b0f15:s=1920x1080:r=${FPS}:d=${len}[bg];[0:v]${v},scale=1440:810:flags=lanczos[clip];` +
        `[bg][clip]overlay=240:215:shortest=1[a];[a][1:v]overlay=0:0,format=yuv420p[v]`,
      '-map', '[v]', '-t', String(len), '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', out,
    ]);
  } else {
    run(['-ss', String(s.start), '-to', String(end), '-i', src, '-vf', `${v},scale=1920:1080:flags=lanczos,format=yuv420p`,
      '-t', String(len), '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', out]);
  }
  console.log(`Segment ${s.file}: ${len}s`);
}
const total = +(lengths.reduce((a, b) => a + b, 0) - XFADE * (lengths.length - 1)).toFixed(3);
console.log(`Video length: ${total}s`);

// ---------------------------------------------------------------- 3. original music, composed in code (no licence issues)
const page = await browser.newPage();
const b64 = await page.evaluate(async (seconds) => {
  const SR = 44100;
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * seconds), SR);
  const BPM = 100, BEAT = 60 / BPM, BAR = BEAT * 4;
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  const CHORDS = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]]; // Am F C G
  const ROOTS = [45, 41, 48, 43];
  const introEnd = 9.5, outroStart = seconds - 9;

  const master = ctx.createGain(); master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  // Reverb send made from decaying noise.
  const verb = ctx.createConvolver();
  const ir = ctx.createBuffer(2, SR * 2.8, SR);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3; }
  verb.buffer = ir;
  const verbGain = ctx.createGain(); verbGain.gain.value = 0.35; verb.connect(verbGain).connect(master);
  const noise = ctx.createBuffer(1, SR, SR); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

  const bars = Math.ceil(seconds / BAR);
  for (let b = 0; b < bars; b++) {
    const t0 = b * BAR, ci = b % 4;
    // Pad: detuned saws through a soft low-pass, swelling each bar.
    for (const m of CHORDS[ci]) for (const det of [-7, 7]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100; f.Q.value = 0.4;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.022, t0 + 0.6); g.gain.setValueAtTime(0.022, t0 + BAR - 0.3); g.gain.linearRampToValueAtTime(0, t0 + BAR + 0.4);
      o.connect(f).connect(g); g.connect(master); g.connect(verb); o.start(t0); o.stop(t0 + BAR + 0.5);
    }
    // Arpeggio: soft plucked triangle eighth notes.
    for (let i = 0; i < 8; i++) {
      const t = t0 + i * BEAT / 2, m = CHORDS[ci][[0, 1, 2, 1, 0, 2, 1, 2][i]] + 12;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(master); g.connect(verb); o.start(t); o.stop(t + 0.4);
    }
    const drums = t0 >= introEnd - 0.01 && t0 < outroStart + BAR * 2;
    if (!drums) continue;
    for (let beat = 0; beat < 4; beat++) {
      const t = t0 + beat * BEAT;
      // Kick on every beat.
      const k = ctx.createOscillator(); k.frequency.setValueAtTime(140, t); k.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      const kg = ctx.createGain(); kg.gain.setValueAtTime(0.75, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      k.connect(kg).connect(master); k.start(t); k.stop(t + 0.4);
      // Bass: root note, pulsing on the beat.
      const bo = ctx.createOscillator(); bo.type = 'sine'; bo.frequency.value = hz(ROOTS[ci]);
      const bg = ctx.createGain(); bg.gain.setValueAtTime(0.0001, t + 0.02); bg.gain.exponentialRampToValueAtTime(0.22, t + 0.06); bg.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 0.9);
      bo.connect(bg).connect(master); bo.start(t); bo.stop(t + BEAT);
      // Clap on 2 and 4.
      if (beat % 2 === 1) {
        const n = ctx.createBufferSource(); n.buffer = noise;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 0.8;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.28, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        n.connect(f).connect(g); g.connect(master); g.connect(verb); n.start(t); n.stop(t + 0.2);
      }
      // Hi-hat on the off-beats.
      const h = ctx.createBufferSource(); h.buffer = noise;
      const hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 7500;
      const hg = ctx.createGain(); hg.gain.setValueAtTime(0.09, t + BEAT / 2); hg.gain.exponentialRampToValueAtTime(0.001, t + BEAT / 2 + 0.05);
      h.connect(hf).connect(hg).connect(master); h.start(t + BEAT / 2); h.stop(t + BEAT / 2 + 0.06);
    }
  }
  // Fade in and out.
  master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(0.9, 1.2);
  master.gain.setValueAtTime(0.9, seconds - 3); master.gain.linearRampToValueAtTime(0, seconds);

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
}, total);
writeFileSync(join(WORK, 'music.wav'), Buffer.from(b64, 'base64'));
await browser.close();
console.log('Music composed.');

// ---------------------------------------------------------------- 4. crossfade everything, add music, export
const inputs = SEGMENTS.flatMap((s) => ['-i', join(WORK, `seg-${s.file}.mp4`)]);
let graph = '', prev = '[0:v]', offset = 0;
for (let i = 1; i < SEGMENTS.length; i++) {
  offset += lengths[i - 1] - XFADE;
  const label = i === SEGMENTS.length - 1 ? '[v]' : `[x${i}]`;
  graph += `${prev}[${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset.toFixed(3)}${label};`;
  prev = `[x${i}]`;
  offset = +offset.toFixed(3);
}
const m = SEGMENTS.length;
graph += `[${m}:a]atrim=0:${total},loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=${(total - 2.5).toFixed(2)}:d=2.5[a]`;
run([...inputs, '-i', join(WORK, 'music.wav'), '-filter_complex', graph, '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', String(total), OUT]);
console.log(`Done: ${OUT} (${duration(OUT).toFixed(1)}s)`);
if (!existsSync(OUT)) process.exit(1);
