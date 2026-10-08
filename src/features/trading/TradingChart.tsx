import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CandlestickSeries, CrosshairMode, HistogramSeries, LineSeries, LineStyle, createChart, createSeriesMarkers,
  type IChartApi, type IPriceLine, type ISeriesApi, type ISeriesMarkersPluginApi, type SeriesMarker, type Time, type UTCTimestamp,
} from 'lightweight-charts';
import { Eraser, GitCommitHorizontal, Minus, MoveUpRight, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bollinger, ema, FIB_LEVELS, macd, rsi, sma, supportResistance, vwap, type Candle } from './indicators';

export type IndicatorId = 'sma20' | 'ema50' | 'bb' | 'vwap' | 'rsi' | 'macd' | 'sr';
const INDICATORS: { id: IndicatorId; label: string; title: string }[] = [
  { id: 'sma20', label: 'SMA 20', title: 'Simple moving average of the last 20 closes' },
  { id: 'ema50', label: 'EMA 50', title: 'Exponential moving average, 50 candles' },
  { id: 'bb', label: 'Bollinger', title: 'Bollinger Bands (20, 2): volatility envelope' },
  { id: 'vwap', label: 'VWAP', title: 'Volume-weighted average price' },
  { id: 'rsi', label: 'RSI', title: 'Relative Strength Index (14): above 70 overbought, below 30 oversold' },
  { id: 'macd', label: 'MACD', title: 'MACD (12, 26, 9): momentum and trend changes' },
  { id: 'sr', label: 'Auto S/R', title: 'Automatic support and resistance from swing highs and lows' },
];

type Tool = 'none' | 'hline' | 'trend' | 'fib';
type Pt = { time: number; price: number };
type Drawing = { kind: 'hline'; price: number } | { kind: 'trend'; a: Pt; b: Pt } | { kind: 'fib'; a: Pt; b: Pt };

export interface ChartFill { time: number; side: 'buy' | 'sell'; price: number; reason: string }
export interface ChartPosition { qty: number; avg: number; stop?: number | null; take?: number | null }

const COLORS = { up: '#22c55e', down: '#f43f5e', accent: '#f5a524', violet: '#a78bfa', sky: '#38bdf8', text: '#8b98a8', grid: 'rgba(255,255,255,0.04)', border: '#1c2430' };
const t = (x: number) => x as UTCTimestamp;
const line = (times: number[], values: (number | null)[]) => values.map((v, i) => (v === null ? { time: t(times[i]) } : { time: t(times[i]), value: v }));

function loadDrawings(key: string): Drawing[] {
  try {
    return JSON.parse(localStorage.getItem(`finlab:drawings:${key}`) ?? '[]');
  } catch {
    return [];
  }
}

/** Candles, volume, indicators, drawing tools and trade markers. Everything shown comes from candles already revealed. */
export function TradingChart({
  candles, storageKey, hourly, fills = [], position, height = 460,
}: {
  candles: Candle[];
  storageKey: string;
  hourly?: boolean;
  fills?: ChartFill[];
  position?: ChartPosition | null;
  height?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<{
    chart: IChartApi;
    candle: ISeriesApi<'Candlestick'>;
    volume: ISeriesApi<'Histogram'>;
    lines: Partial<Record<string, ISeriesApi<'Line'> | ISeriesApi<'Histogram'>>>;
    markers: ISeriesMarkersPluginApi<Time>;
  } | null>(null);
  const [indicators, setIndicators] = useState<Set<IndicatorId>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('finlab:indicators') ?? '["sma20","sr"]'));
    } catch {
      return new Set<IndicatorId>(['sma20', 'sr']);
    }
  });
  const [tool, setTool] = useState<Tool>('none');
  const [pending, setPending] = useState<Pt | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>(() => loadDrawings(storageKey));
  const [version, setVersion] = useState(0);
  const indKey = [...indicators].sort().join(',');

  useEffect(() => setDrawings(loadDrawings(storageKey)), [storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem(`finlab:drawings:${storageKey}`, JSON.stringify(drawings));
    } catch {
      /* ignore */
    }
  }, [drawings, storageKey]);
  useEffect(() => {
    try {
      localStorage.setItem('finlab:indicators', JSON.stringify([...indicators]));
    } catch {
      /* ignore */
    }
  }, [indicators]);

  // ---------------------------------------------------------------- build the chart (again when panes change)
  useEffect(() => {
    if (!box.current) return;
    const chart = createChart(box.current, {
      autoSize: true,
      layout: { background: { color: '#0b0f15' }, textColor: COLORS.text, fontFamily: 'Inter, system-ui, sans-serif', panes: { separatorColor: COLORS.border } },
      grid: { vertLines: { color: COLORS.grid }, horzLines: { color: COLORS.grid } },
      rightPriceScale: { borderColor: COLORS.border },
      timeScale: { borderColor: COLORS.border, timeVisible: !!hourly, secondsVisible: false, rightOffset: 6 },
      crosshair: { mode: CrosshairMode.Normal },
    });
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.up, downColor: COLORS.down, borderVisible: false, wickUpColor: COLORS.up, wickDownColor: COLORS.down,
    });
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '', lastValueVisible: false, priceLineVisible: false });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    const quiet = { lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false, lineWidth: 1 as const };
    const lines: NonNullable<typeof api.current>['lines'] = {};
    if (indicators.has('sma20')) lines.sma20 = chart.addSeries(LineSeries, { ...quiet, color: COLORS.accent, lineWidth: 2 });
    if (indicators.has('ema50')) lines.ema50 = chart.addSeries(LineSeries, { ...quiet, color: COLORS.sky, lineWidth: 2 });
    if (indicators.has('bb')) {
      lines.bbU = chart.addSeries(LineSeries, { ...quiet, color: 'rgba(167,139,250,0.8)' });
      lines.bbM = chart.addSeries(LineSeries, { ...quiet, color: 'rgba(167,139,250,0.45)', lineStyle: LineStyle.Dashed });
      lines.bbL = chart.addSeries(LineSeries, { ...quiet, color: 'rgba(167,139,250,0.8)' });
    }
    if (indicators.has('vwap')) lines.vwap = chart.addSeries(LineSeries, { ...quiet, color: '#f472b6', lineWidth: 2 });
    let pane = 1;
    if (indicators.has('rsi')) {
      lines.rsi = chart.addSeries(LineSeries, { ...quiet, color: COLORS.violet, lineWidth: 2, lastValueVisible: true }, pane);
      lines.rsi.createPriceLine({ price: 70, color: 'rgba(244,63,94,0.5)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: '' });
      lines.rsi.createPriceLine({ price: 30, color: 'rgba(34,197,94,0.5)', lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: '' });
      pane++;
    }
    if (indicators.has('macd')) {
      lines.macdH = chart.addSeries(HistogramSeries, { lastValueVisible: false, priceLineVisible: false }, pane);
      lines.macdL = chart.addSeries(LineSeries, { ...quiet, color: COLORS.sky, lineWidth: 2 }, pane);
      lines.macdS = chart.addSeries(LineSeries, { ...quiet, color: COLORS.accent }, pane);
      pane++;
    }
    // Price pane gets most of the room; each indicator pane a fixed share (the container grows 120px per pane).
    chart.panes().forEach((p, i) => p.setStretchFactor(i === 0 ? 3.5 : 1));
    const markers = createSeriesMarkers(candle, []);
    api.current = { chart, candle, volume, lines, markers };
    setVersion((x) => x + 1);
    return () => {
      api.current = null;
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indKey, hourly]);

  // ---------------------------------------------------------------- data
  const lastLen = useRef(0);
  useEffect(() => {
    const a = api.current;
    if (!a || !candles.length) return;
    const times = candles.map((c) => c.time);
    const closes = candles.map((c) => c.c);
    a.candle.setData(candles.map((c) => ({ time: t(c.time), open: c.o, high: c.h, low: c.l, close: c.c })));
    a.volume.setData(candles.map((c) => ({ time: t(c.time), value: c.v, color: c.c >= c.o ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)' })));
    const L = a.lines;
    if (L.sma20) L.sma20.setData(line(times, sma(closes, 20)));
    if (L.ema50) L.ema50.setData(line(times, ema(closes, 50)));
    if (L.bbU) {
      const b = bollinger(closes);
      L.bbU.setData(line(times, b.upper));
      L.bbM!.setData(line(times, b.mid));
      L.bbL!.setData(line(times, b.lower));
    }
    if (L.vwap) L.vwap.setData(line(times, vwap(candles)));
    if (L.rsi) L.rsi.setData(line(times, rsi(closes)));
    if (L.macdL) {
      const m = macd(closes);
      L.macdL.setData(line(times, m.line));
      L.macdS!.setData(line(times, m.signal));
      L.macdH!.setData(m.hist.map((v, i) => (v === null ? { time: t(times[i]) } : { time: t(times[i]), value: v, color: v >= 0 ? 'rgba(34,197,94,0.6)' : 'rgba(244,63,94,0.6)' })));
    }
    const ts = a.chart.timeScale();
    if (lastLen.current === 0 || Math.abs(candles.length - lastLen.current) > 40) {
      // About one candle per 9px of width: ~45 on a phone, ~130 on a laptop.
      const fit = Math.max(40, Math.min(160, Math.floor((box.current?.clientWidth ?? 900) / 9)));
      ts.setVisibleLogicalRange({ from: Math.max(0, candles.length - fit), to: candles.length + 4 });
    } else if (candles.length > lastLen.current) {
      ts.scrollToRealTime();
    }
    lastLen.current = candles.length;
  }, [candles, version]);
  useEffect(() => {
    lastLen.current = 0;
  }, [storageKey]);

  // ---------------------------------------------------------------- trade markers
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const ms: SeriesMarker<Time>[] = fills.map((f) => ({
      time: t(f.time),
      position: f.side === 'buy' ? 'belowBar' : 'aboveBar',
      color: f.reason === 'stop' ? COLORS.down : f.reason === 'take' ? COLORS.up : f.side === 'buy' ? COLORS.up : COLORS.down,
      shape: f.side === 'buy' ? 'arrowUp' : 'arrowDown',
      text: f.reason === 'stop' ? 'Stop' : f.reason === 'take' ? 'Target' : f.side === 'buy' ? 'Buy' : 'Sell',
    }));
    a.markers.setMarkers(ms.sort((x, y) => (x.time as number) - (y.time as number)));
  }, [fills, version]);

  // ---------------------------------------------------------------- price lines: position, auto S/R, drawings
  const srLevels = useMemo(() => (indicators.has('sr') ? supportResistance(candles, 150, 3, 2) : []), [candles, indicators]);
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const made: IPriceLine[] = [];
    const extra: ISeriesApi<'Line'>[] = [];
    const add = (price: number, color: string, title: string, style = LineStyle.Dashed, width: 1 | 2 = 1) =>
      made.push(a.candle.createPriceLine({ price, color, lineStyle: style, lineWidth: width, axisLabelVisible: true, title }));
    for (const l of srLevels) add(l.price, l.kind === 'support' ? 'rgba(34,197,94,0.7)' : 'rgba(244,63,94,0.7)', `${l.kind === 'support' ? 'S' : 'R'} ×${l.touches}`, LineStyle.LargeDashed);
    if (position && position.qty !== 0) {
      add(position.avg, COLORS.sky, `Entry ${position.qty > 0 ? 'long' : 'short'}`, LineStyle.Dotted, 2);
      if (position.stop) add(position.stop, COLORS.down, 'Stop', LineStyle.Solid, 2);
      if (position.take) add(position.take, COLORS.up, 'Target', LineStyle.Solid, 2);
    }
    const last = candles.at(-1)?.c ?? 0;
    for (const d of drawings) {
      if (d.kind === 'hline') add(d.price, COLORS.accent, d.price < last ? 'Support' : 'Resistance', LineStyle.Solid, 2);
      else if (d.kind === 'fib') {
        const hi = Math.max(d.a.price, d.b.price);
        const lo = Math.min(d.a.price, d.b.price);
        for (const f of FIB_LEVELS) add(hi - (hi - lo) * f, 'rgba(56,189,248,0.75)', `Fib ${(f * 100).toFixed(1)}%`, LineStyle.Dotted);
      } else if (d.a.time !== d.b.time) {
        const s = a.chart.addSeries(LineSeries, { color: COLORS.accent, lineWidth: 2, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
        s.setData([d.a, d.b].sort((x, y) => x.time - y.time).map((p) => ({ time: t(p.time), value: p.price })));
        extra.push(s);
      }
    }
    return () => {
      if (api.current !== a) return;
      made.forEach((pl) => a.candle.removePriceLine(pl));
      extra.forEach((s) => a.chart.removeSeries(s));
    };
  }, [srLevels, position?.qty, position?.avg, position?.stop, position?.take, drawings, candles, version]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- drawing by clicking the chart
  const toolRef = useRef({ tool, pending });
  toolRef.current = { tool, pending };
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const onClick = (param: { time?: Time; point?: { x: number; y: number } }) => {
      const { tool: tl, pending: pd } = toolRef.current;
      if (tl === 'none' || !param.point) return;
      const price = a.candle.coordinateToPrice(param.point.y);
      const time = (param.time as number | undefined) ?? (a.chart.timeScale().coordinateToTime(param.point.x) as number | null);
      if (price === null || time === null || time === undefined) return;
      const pt = { time, price: +price.toFixed(price < 10 ? 3 : 2) };
      if (tl === 'hline') {
        setDrawings((d) => [...d, { kind: 'hline', price: pt.price }]);
        setTool('none');
      } else if (!pd) setPending(pt);
      else {
        setDrawings((d) => [...d, { kind: tl, a: pd, b: pt }]);
        setPending(null);
        setTool('none');
      }
    };
    a.chart.subscribeClick(onClick);
    return () => {
      if (api.current === a) a.chart.unsubscribeClick(onClick);
    };
  }, [version]);

  const toggle = (id: IndicatorId) =>
    setIndicators((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const pickTool = (x: Tool) => {
    setPending(null);
    setTool((cur) => (cur === x ? 'none' : x));
  };
  const hint =
    tool === 'hline' ? 'Click a price to draw a support or resistance line.'
      : tool === 'trend' ? (pending ? 'Click the second point of the trend line.' : 'Click the first point of the trend line.')
        : tool === 'fib' ? (pending ? 'Click the other end of the move.' : 'Click the start of the move (a swing high or low).') : '';

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0b0f15]">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-2 py-2">
        {INDICATORS.map((i) => (
          <button
            key={i.id}
            onClick={() => toggle(i.id)}
            title={i.title}
            className={cn('rounded-md border px-2 py-1 text-[0.7rem] font-medium', indicators.has(i.id) ? 'border-accent/60 bg-accent-muted text-accent' : 'border-border-strong text-fg-muted hover:text-fg')}
          >
            {i.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-border-strong" />
        {([
          ['hline', Minus, 'Support / resistance line'],
          ['trend', MoveUpRight, 'Trend line'],
          ['fib', Ruler, 'Fibonacci retracement'],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => pickTool(id)}
            title={label}
            aria-label={label}
            className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.7rem] font-medium', tool === id ? 'border-sky-400/70 bg-sky-400/10 text-sky-300' : 'border-border-strong text-fg-muted hover:text-fg')}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{id === 'hline' ? 'S/R line' : id === 'trend' ? 'Trend' : 'Fib'}</span>
          </button>
        ))}
        {drawings.length > 0 && (
          <button onClick={() => setDrawings([])} className="inline-flex items-center gap-1 rounded-md border border-border-strong px-2 py-1 text-[0.7rem] text-fg-muted hover:text-down" title="Remove your drawings">
            <Eraser className="h-3.5 w-3.5" /> Clear
          </button>
        )}
        {hint && (
          <span className="ml-auto inline-flex items-center gap-1 text-[0.7rem] text-sky-300">
            <GitCommitHorizontal className="h-3.5 w-3.5" /> {hint}
          </span>
        )}
      </div>
      <div
        ref={box}
        style={{ height: height + 120 * ((indicators.has('rsi') ? 1 : 0) + (indicators.has('macd') ? 1 : 0)) }}
        className={cn('w-full', tool !== 'none' && 'cursor-crosshair')}
      />
    </div>
  );
}
