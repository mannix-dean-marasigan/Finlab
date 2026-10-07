const CURRENCY_SYMBOL: Record<string, string> = { PHP: '₱', USD: '$' };

export function currencySymbol(code: string | null | undefined) {
  return CURRENCY_SYMBOL[code ?? ''] ?? (code ? `${code} ` : '');
}

export function fmtNumber(n: number | string | null | undefined, digits = 2): string {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtMoney(n: number | string | null | undefined, currency = 'PHP', digits = 2): string {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  return `${v < 0 ? '−' : ''}${currencySymbol(currency)}${Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

/** 1.23T / 456.7B / 12.3M */
export function fmtCompact(n: number | string | null | undefined, currency?: string): string {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  const abs = Math.abs(v);
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  const prefix = currency ? currencySymbol(currency) : '';
  for (const [size, suffix] of units) {
    if (abs >= size) return `${v < 0 ? '−' : ''}${prefix}${(abs / size).toFixed(abs / size >= 100 ? 0 : 1)}${suffix}`;
  }
  return `${prefix}${v.toFixed(0)}`;
}

export function fmtPct(n: number | string | null | undefined, digits = 2, signed = false): string {
  if (n === null || n === undefined || n === '' || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  const s = v.toFixed(digits);
  return `${signed && v > 0 ? '+' : ''}${s}%`;
}

export function fmtScore(n: number | string | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return Number(n).toFixed(1);
}

export function fmtDate(d: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDate(d);
}

export function fmtDuration(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return days > 0 ? `${days}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function fmtMinutes(min: number | null | undefined): string {
  if (!min) return '—';
  if (min < 60) return `${min} min`;
  if (min < 60 * 24) return `${Math.round(min / 60)} h`;
  return `${Math.round(min / 60 / 24)} days`;
}

/** Program length: "~30 min" under an hour, otherwise "~4.5 h". */
export function fmtProgramHours(hours: number | string | null | undefined): string {
  const h = Number(hours ?? 0);
  if (!h) return '—';
  return h < 1 ? `~${Math.round(h * 60)} min` : `~${h} h`;
}
