import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Clock, NotebookPen, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/form';
import { InlineError } from '@/components/ui/states';
import { fmtMoney, fmtNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface PendingLimit { side: 'buy' | 'sell'; qty: number; price: number }

/**
 * Market or limit orders, a journal note, and stop-loss / take-profit for the open position.
 * Used by rounds (with limits) and the live market. No leverage: the server rejects anything over 100% of equity.
 */
export function OrderTicket({
  price, qty, equity, stop, take, disabled, busy, error, onOrder, onExits, onLimit, pendingLimit, onCancelLimit,
}: {
  price: number;
  qty: number;
  equity: number;
  stop: number | null;
  take: number | null;
  disabled?: boolean;
  busy?: boolean;
  error?: string | null;
  onOrder: (side: 'buy' | 'sell', qty: number, note?: string) => void;
  onExits: (stop: number | null, take: number | null) => void;
  /** When given, the ticket offers limit orders too. */
  onLimit?: (side: 'buy' | 'sell', qty: number, price: number) => void;
  pendingLimit?: PendingLimit | null;
  onCancelLimit?: () => void;
}) {
  const [type, setType] = useState<'market' | 'limit'>('market');
  const [shares, setShares] = useState('');
  const [limitIn, setLimitIn] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [stopIn, setStopIn] = useState(stop?.toString() ?? '');
  const [takeIn, setTakeIn] = useState(take?.toString() ?? '');
  useEffect(() => setStopIn(stop?.toString() ?? ''), [stop]);
  useEffect(() => setTakeIn(take?.toString() ?? ''), [take]);

  // Shares you could add in one direction without going over 100% of equity (small buffer for the fee).
  const room = (side: 'buy' | 'sell', at = price) => {
    const max = Math.floor((equity * 0.997) / at);
    const sameWay = side === 'buy' ? qty > 0 : qty < 0;
    return Math.max(0, sameWay ? max - Math.abs(qty) : max + Math.abs(qty));
  };
  const n = Number(shares);
  const validQty = Number.isInteger(n) && n >= 1;
  const limitPrice = Number(limitIn);
  const validLimit = limitIn.trim() !== '' && limitPrice > 0;
  const long = qty > 0;
  const fmt = (x: number) => (price < 10 ? x.toFixed(3) : x.toFixed(2));
  const parse = (s: string) => (s.trim() === '' ? null : Number(s));
  const submit = (side: 'buy' | 'sell') => {
    if (type === 'limit' && onLimit) onLimit(side, n, limitPrice);
    else {
      onOrder(side, n, note);
      setNote('');
      setShowNote(false);
    }
  };

  return (
    <div className="space-y-4">
      {onLimit && (
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-border-strong text-xs">
          {(['market', 'limit'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={cn('py-1.5 font-medium', type === t ? 'bg-accent-muted text-accent' : 'text-fg-muted hover:text-fg')}>
              {t === 'market' ? 'Market' : 'Limit'}
            </button>
          ))}
        </div>
      )}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-fg-muted">
          <span>Shares</span>
          <span className="font-mono">≈ {fmtMoney(validQty ? n * (type === 'limit' && validLimit ? limitPrice : price) : 0, 'PHP', 0)}</span>
        </div>
        <Input value={shares} onChange={(e) => setShares(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" className="font-mono" aria-label="Number of shares" disabled={disabled} />
        <div className="mt-1.5 flex gap-1">
          {[0.25, 0.5, 1].map((f) => (
            <button
              key={f}
              disabled={disabled}
              onClick={() => setShares(String(Math.max(1, Math.floor(room(qty < 0 ? 'sell' : 'buy', type === 'limit' && validLimit ? limitPrice : price) * f))))}
              className="flex-1 rounded border border-border-strong py-1 text-[0.7rem] text-fg-muted hover:text-fg disabled:opacity-40"
            >
              {f * 100}%
            </button>
          ))}
        </div>
      </div>
      {type === 'limit' && onLimit && (
        <label className="block text-xs text-fg-muted">
          Limit price
          <Input value={limitIn} onChange={(e) => setLimitIn(e.target.value)} inputMode="decimal" placeholder={fmt(price)} className="mt-1 font-mono" disabled={disabled} />
          <span className="mt-1 block text-[0.7rem] text-fg-subtle">Buy limits go below {fmt(price)}, sell limits above it. They fill when a candle reaches your price.</span>
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" className="justify-center bg-up text-black hover:bg-up/90" disabled={disabled || !validQty || (type === 'limit' && !validLimit)} loading={busy} onClick={() => submit('buy')}>
          <ArrowUpRight className="h-4 w-4" /> {type === 'limit' ? 'Buy limit' : qty < 0 ? 'Buy / cover' : 'Buy'}
        </Button>
        <Button className="justify-center border-down/50 bg-down/90 text-white hover:bg-down" disabled={disabled || !validQty || (type === 'limit' && !validLimit)} loading={busy} onClick={() => submit('sell')}>
          <ArrowDownRight className="h-4 w-4" /> {type === 'limit' ? 'Sell limit' : qty > 0 ? 'Sell' : 'Sell / short'}
        </Button>
      </div>
      {type === 'market' &&
        (showNote ? (
          <Textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} rows={2} placeholder="Why this trade? e.g. bounce off support, RSI oversold" aria-label="Trade note" />
        ) : (
          <button onClick={() => setShowNote(true)} className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg" disabled={disabled}>
            <NotebookPen className="h-3.5 w-3.5" /> Add a note to your journal
          </button>
        ))}
      {pendingLimit && (
        <div className="flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-400/5 px-3 py-2 text-xs">
          <Clock className="h-3.5 w-3.5 shrink-0 text-sky-300" />
          <span className="flex-1">
            Pending {pendingLimit.side} limit: {fmtNumber(pendingLimit.qty, 0)} at <span className="font-mono">{fmt(pendingLimit.price)}</span>
          </span>
          {onCancelLimit && (
            <button onClick={onCancelLimit} className="text-fg-subtle hover:text-down" aria-label="Cancel limit order" disabled={disabled}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {qty !== 0 && (
        <Button size="sm" variant="outline" className="w-full justify-center" disabled={disabled} onClick={() => onOrder(qty > 0 ? 'sell' : 'buy', Math.abs(qty))}>
          <X className="h-4 w-4" /> Close position ({fmtNumber(Math.abs(qty), 0)} {long ? 'long' : 'short'})
        </Button>
      )}

      <div className={cn('rounded-lg border border-border p-3', qty === 0 && 'opacity-50')}>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
          <Shield className="h-3.5 w-3.5" /> Exits {qty === 0 && <span className="font-normal">(open a position first)</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[0.7rem] text-fg-subtle">
            Stop-loss
            <Input value={stopIn} onChange={(e) => setStopIn(e.target.value)} inputMode="decimal" placeholder={long ? 'below price' : 'above price'} className="mt-1 h-8 font-mono text-xs" disabled={disabled || qty === 0} />
          </label>
          <label className="text-[0.7rem] text-fg-subtle">
            Take-profit
            <Input value={takeIn} onChange={(e) => setTakeIn(e.target.value)} inputMode="decimal" placeholder={long ? 'above price' : 'below price'} className="mt-1 h-8 font-mono text-xs" disabled={disabled || qty === 0} />
          </label>
        </div>
        <div className="mt-2 flex gap-1">
          <button
            disabled={disabled || qty === 0}
            onClick={() => {
              const s = long ? price * 0.97 : price * 1.03;
              const t = long ? price * 1.06 : price * 0.94;
              setStopIn(fmt(s));
              setTakeIn(fmt(t));
            }}
            className="flex-1 rounded border border-border-strong py-1 text-[0.7rem] text-fg-muted hover:text-fg disabled:opacity-40"
            title="Risk 3% to make 6% (a 1:2 risk/reward)"
          >
            3% / 6%
          </button>
          <Button size="xs" variant="outline" disabled={disabled || qty === 0} onClick={() => onExits(parse(stopIn), parse(takeIn))}>
            Set exits
          </Button>
          {(stop !== null || take !== null) && (
            <Button size="xs" variant="ghost" disabled={disabled} onClick={() => onExits(null, null)}>
              Clear
            </Button>
          )}
        </div>
      </div>
      <InlineError message={error ?? null} />
      <p className="text-[0.7rem] leading-relaxed text-fg-subtle">Market orders fill at the last price. 0.1% fee per trade. No leverage: positions can be at most 100% of your equity.</p>
    </div>
  );
}
