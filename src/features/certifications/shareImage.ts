// Renders a square (1200×1200) social image of a certificate for LinkedIn posts.
// Drawn on a canvas so it works offline and needs no extra libraries.
import type { CertificateView } from '@/types/domain';
import { ISSUER_NAME } from '@/lib/brand';

const AMBER = '#f5a524';
const INK = '#0b0f15';
const WHITE = '#e6edf3';
const MUTED = '#8b98a8';
const PAPER = '#fbf8f1';
const GOLD = '#c8922a';
const TEXT = '#1a1d23';
const SUB = '#6b6f78';
const SANS = 'Inter, ui-sans-serif, system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';
const SIZE = 1200;

/** Largest font size (≤ max) at which `text` fits in `width`. */
function fit(g: CanvasRenderingContext2D, text: string, font: (px: number) => string, max: number, width: number, min = 18) {
  let px = max;
  for (; px > min; px -= 2) {
    g.font = font(px);
    if (g.measureText(text).width <= width) break;
  }
  g.font = font(px);
  return px;
}

function sun(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.fillStyle = AMBER;
  for (let i = 0; i < 8; i++) {
    g.save();
    g.translate(x, y);
    g.rotate((i * Math.PI) / 4 + Math.PI / 8);
    g.beginPath();
    g.moveTo(-r * 0.25, -r * 1.35);
    g.lineTo(r * 0.25, -r * 1.35);
    g.lineTo(0, -r * 2.2);
    g.closePath();
    g.fill();
    g.restore();
  }
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function mark(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.fillStyle = '#11161e';
  g.beginPath();
  g.roundRect(x, y, 32 * s, 32 * s, 7 * s);
  g.fill();
  g.strokeStyle = AMBER;
  g.lineWidth = 3 * s;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x + 7 * s, y + 22 * s);
  g.lineTo(x + 13 * s, y + 15 * s);
  g.lineTo(x + 17 * s, y + 19 * s);
  g.lineTo(x + 25 * s, y + 9 * s);
  g.stroke();
  g.fillStyle = AMBER;
  g.beginPath();
  g.arc(x + 25 * s, y + 9 * s, 2.2 * s, 0, Math.PI * 2);
  g.fill();
}

export async function renderShareImage(c: CertificateView, verifyUrl: string): Promise<Blob> {
  try {
    await Promise.all([
      document.fonts.load(`700 40px Inter`),
      document.fonts.load(`500 20px Inter`),
      document.fonts.load(`600 20px "JetBrains Mono"`),
    ]);
  } catch {
    /* fall back to system fonts */
  }
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const g = canvas.getContext('2d')!;

  // Background: ink, grid, amber glow, sun.
  g.fillStyle = INK;
  g.fillRect(0, 0, SIZE, SIZE);
  const glow = g.createRadialGradient(1020, 150, 10, 1020, 150, 650);
  glow.addColorStop(0, 'rgba(245,165,36,0.25)');
  glow.addColorStop(1, 'rgba(245,165,36,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, SIZE, SIZE);
  g.strokeStyle = 'rgba(255,255,255,0.045)';
  g.lineWidth = 2;
  for (let p = 0; p <= SIZE; p += 48) {
    g.beginPath();
    g.moveTo(p, 0);
    g.lineTo(p, SIZE);
    g.stroke();
    g.beginPath();
    g.moveTo(0, p);
    g.lineTo(SIZE, p);
    g.stroke();
  }
  sun(g, 1050, 150, 44);

  // Header.
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillStyle = AMBER;
  g.font = `600 30px ${MONO}`;
  if ('letterSpacing' in g) g.letterSpacing = '10px';
  g.fillText(ISSUER_NAME, 80, 120);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  const headline = c.issue_type === 'admin_award' ? 'Certificate awarded' : c.kind === 'competition' ? 'Competition result' : 'Certificate earned';
  g.fillStyle = WHITE;
  g.font = `700 68px ${SANS}`;
  g.fillText(headline, 80, 200);

  // The certificate "paper".
  const px = 80;
  const py = 270;
  const pw = SIZE - 160;
  const ph = 740;
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.5)';
  g.shadowBlur = 40;
  g.shadowOffsetY = 16;
  g.fillStyle = PAPER;
  g.beginPath();
  g.roundRect(px, py, pw, ph, 10);
  g.fill();
  g.restore();
  g.strokeStyle = GOLD;
  g.lineWidth = 4;
  g.strokeRect(px + 22, py + 22, pw - 44, ph - 44);
  g.strokeStyle = 'rgba(200,146,42,0.5)';
  g.lineWidth = 2;
  g.strokeRect(px + 34, py + 34, pw - 68, ph - 68);

  const cx = SIZE / 2;
  const inner = pw - 160;
  mark(g, cx - 120, py + 70, 1.6);
  g.textAlign = 'left';
  g.font = `600 34px ${MONO}`;
  g.fillStyle = TEXT;
  g.fillText('FIN', cx - 60, py + 108);
  const finW = g.measureText('FIN').width;
  g.fillStyle = GOLD;
  g.fillText('LAB', cx - 60 + finW, py + 108);

  g.textAlign = 'center';
  g.fillStyle = SUB;
  g.font = `500 20px ${SANS}`;
  if ('letterSpacing' in g) g.letterSpacing = '6px';
  const kindLabel =
    c.issue_type === 'admin_award' && !c.program
      ? 'CERTIFICATE OF RECOGNITION'
      : c.kind === 'competition'
        ? 'COMPETITION CERTIFICATE'
        : c.kind === 'track'
          ? 'LEARNING TRACK CERTIFICATE'
          : 'PROFESSIONAL CERTIFICATION';
  g.fillText(kindLabel, cx, py + 165);
  g.fillText('THIS CERTIFIES THAT', cx, py + 250);
  if ('letterSpacing' in g) g.letterSpacing = '0px';

  g.fillStyle = TEXT;
  fit(g, c.recipient_name, (n) => `italic 400 ${n}px ${SERIF}`, 76, inner);
  g.fillText(c.recipient_name, cx, py + 340);
  g.strokeStyle = 'rgba(200,146,42,0.6)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx - inner / 3, py + 372);
  g.lineTo(cx + inner / 3, py + 372);
  g.stroke();

  g.fillStyle = SUB;
  g.font = `500 24px ${SANS}`;
  const verb = c.kind === 'competition' ? 'achieved the following result in' : c.issue_type === 'admin_award' ? 'has been awarded' : 'has successfully completed all requirements of';
  g.fillText(verb, cx, py + 425);
  g.fillStyle = TEXT;
  fit(g, c.title, (n) => `700 ${n}px ${SANS}`, 50, inner);
  g.fillText(c.title, cx, py + 490);
  const detail =
    c.kind === 'competition'
      ? c.subtitle
      : [c.details.modules && `${c.details.modules} modules`, c.details.estimated_hours && `~${Number(c.details.estimated_hours)} hours`, c.details.average_score && `average score ${Math.round(Number(c.details.average_score))}`]
          .filter(Boolean)
          .join('  ·  ');
  if (detail) {
    g.fillStyle = SUB;
    fit(g, detail, (n) => `500 ${n}px ${SANS}`, 24, inner);
    g.fillText(detail, cx, py + 540);
  }

  // Footer of the paper: date, seal, code.
  const fy = py + ph - 90;
  g.textAlign = 'left';
  g.fillStyle = SUB;
  g.font = `500 18px ${SANS}`;
  g.fillText('ISSUED', px + 80, fy);
  g.fillStyle = TEXT;
  g.font = `700 22px ${SANS}`;
  g.fillText(new Date(c.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), px + 80, fy + 32);
  g.textAlign = 'right';
  g.fillStyle = SUB;
  g.font = `500 18px ${SANS}`;
  g.fillText('VERIFICATION CODE', px + pw - 80, fy);
  g.fillStyle = TEXT;
  g.font = `600 24px ${MONO}`;
  g.fillText(c.code, px + pw - 80, fy + 32);
  g.textAlign = 'center';
  g.strokeStyle = GOLD;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(cx, fy + 6, 30, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - 13, fy + 6);
  g.lineTo(cx - 3, fy + 16);
  g.lineTo(cx + 15, fy - 6);
  g.stroke();
  g.fillStyle = SUB;
  g.font = `500 16px ${SANS}`;
  g.fillText(`VERIFIED BY ${ISSUER_NAME}`, cx, fy + 62);

  if (c.issue_type === 'test') {
    g.save();
    g.translate(cx, py + ph / 2);
    g.rotate(-0.24);
    g.strokeStyle = 'rgba(217,119,6,0.6)';
    g.fillStyle = 'rgba(217,119,6,0.6)';
    g.lineWidth = 8;
    g.font = `700 60px ${SANS}`;
    const label = 'TEST · NOT A CREDENTIAL';
    const w = g.measureText(label).width + 60;
    g.strokeRect(-w / 2, -55, w, 100);
    g.fillText(label, 0, 18);
    g.restore();
  }

  // Bottom line: verify link.
  g.textAlign = 'left';
  g.fillStyle = MUTED;
  g.font = `500 26px ${SANS}`;
  const shortUrl = verifyUrl.replace(/^https?:\/\//, '');
  fit(g, `Verify: ${shortUrl}`, (n) => `500 ${n}px ${SANS}`, 26, SIZE - 160);
  g.fillText(`Verify: ${shortUrl}`, 80, 1110);
  g.fillStyle = AMBER;
  g.font = `700 26px ${SANS}`;
  g.fillText('#FINLABPH', 80, 1152);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image'))), 'image/png'));
}

export function shareImageFileName(c: CertificateView) {
  return `finlab-ph-certificate-${c.code}.png`;
}
