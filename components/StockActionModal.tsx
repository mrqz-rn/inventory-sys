import React, { useEffect, useState } from 'react';
import { Item } from '../types';
import { X, ArrowUpCircle, ArrowDownCircle, AlertCircle, Package, Calculator } from 'lucide-react';

interface StockActionModalProps {
  item: Item;
  type: 'IN' | 'OUT';
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

const StockActionModal: React.FC<StockActionModalProps> = ({ item, type, onClose, onConfirm }) => {
  const [visible, setVisible] = useState(false);
  const [rawQty, setRawQty]   = useState('1');   // string to allow clearing without NaN
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const isInbound = type === 'IN';

  // Safe parsed qty — empty / non-numeric collapses to 0
  const qty = parseInt(rawQty, 10) || 0;

  // Projected stock after action
  const projected = isInbound ? item.quantity + qty : item.quantity - qty;

  // Value of adjustment at landed unit cost
  const adjustmentValue = qty * item.trueUnitCost;

  const validateAndConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (!isInbound && qty > item.quantity) {
      setError(`Only ${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'} available to stock out.`);
      return;
    }
    onConfirm(qty);
  };

  // Quick-select presets
  const inboundPresets  = [5, 10, 25, 50];
  const outboundPresets = [1, 5, 10, 25];
  const presets = isInbound ? inboundPresets : outboundPresets;

  // Colour tokens
  const accent = isInbound
    ? { ring: 'focus:ring-emerald-400/40 focus:border-emerald-400', btn: 'from-emerald-400 to-teal-500', bar: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-600 border-emerald-200', pillActive: 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-200', dot: 'bg-emerald-400' }
    : { ring: 'focus:ring-rose-400/40 focus:border-rose-400',       btn: 'from-rose-400 to-orange-500',  bar: 'bg-rose-400',    pill: 'bg-rose-50 text-rose-500 border-rose-200',       pillActive: 'bg-rose-50 text-rose-600 border-rose-300 ring-2 ring-rose-200',       dot: 'bg-rose-400'   };

  return (
    <div
      onClick={handleClose}
      className={`
        fixed inset-0 z-[120] flex items-end md:items-center md:justify-center
        transition-all duration-300
        ${visible
          ? 'bg-stone-900/40 backdrop-blur-sm'
          : 'bg-transparent backdrop-blur-none pointer-events-none'}
      `}
    >
      <form
        onSubmit={validateAndConfirm}
        onClick={e => e.stopPropagation()}
        className={`
          relative w-full md:max-w-md
          bg-stone-50 border border-stone-200 shadow-2xl
          rounded-t-[2rem] md:rounded-[2rem]
          overflow-hidden
          transition-all duration-300 ease-out
          ${visible
            ? 'translate-y-0 opacity-100 md:scale-100'
            : 'translate-y-full opacity-0 md:translate-y-4 md:scale-[0.97]'}
        `}
      >

        {/* ── Header ── */}
        <div className="bg-stone-50/90 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${isInbound ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {isInbound
                ? <ArrowUpCircle size={18} />
                : <ArrowDownCircle size={18} />}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Inventory Adjustment</p>
              <h2 className="text-lg font-black text-stone-900 leading-snug tracking-tight">
                {isInbound ? 'Stock Inbound' : 'Stock Outbound'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Item card ── */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
              <Package size={15} className="text-stone-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-stone-900 truncate">{item.name}</p>
              <p className="text-[10px] font-mono text-stone-400">{item.barcode}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Current</p>
              <p className="text-sm font-black text-stone-800">{item.quantity} <span className="text-stone-400 font-medium text-xs">units</span></p>
            </div>
          </div>

          {/* ── Quantity input ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">
              Adjustment Quantity
            </label>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setRawQty(String(p)); setError(null); }}
                  className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                    qty === p ? accent.pillActive : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  +{p}
                </button>
              ))}
            </div>

            {/* Number input */}
            <div className="relative">
              <input
                autoFocus
                required
                type="number"
                min="1"
                {...(!isInbound ? { max: item.quantity } : {})}
                value={rawQty}
                onChange={e => { setRawQty(e.target.value); setError(null); }}
                className={`
                  w-full bg-white border rounded-xl px-4 py-3.5 text-2xl font-black text-stone-900
                  focus:outline-none focus:ring-2 transition-all
                  ${error
                    ? 'border-rose-300 focus:ring-rose-200/50 focus:border-rose-400'
                    : `border-stone-200 ${accent.ring}`}
                `}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-300 uppercase">
                units
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-1.5 text-rose-500 px-1">
                <AlertCircle size={12} />
                <p className="text-[10px] font-bold">{error}</p>
              </div>
            )}
          </div>

          {/* ── Stock projection ── */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Projected Stock</p>

            {/* Before → After */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-[9px] text-stone-300 font-bold mb-0.5">Before</p>
                <p className="text-xl font-black text-stone-600">{item.quantity}</p>
              </div>
              <div className={`flex-1 h-px ${isInbound ? 'bg-emerald-200' : 'bg-rose-200'}`} />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 ${isInbound ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                {isInbound ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
              </div>
              <div className={`flex-1 h-px ${isInbound ? 'bg-emerald-200' : 'bg-rose-200'}`} />
              <div className="text-center">
                <p className="text-[9px] text-stone-300 font-bold mb-0.5">After</p>
                <p className={`text-xl font-black ${
                  projected < 0 ? 'text-rose-500' : isInbound ? 'text-emerald-600' : 'text-stone-900'
                }`}>
                  {projected < 0 ? '—' : projected}
                </p>
              </div>
            </div>

            {/* Bar */}
            {qty > 0 && projected >= 0 && (
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                {isInbound ? (
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (projected / (item.quantity + qty)) * 100)}%` }}
                  />
                ) : (
                  <div
                    className="h-full rounded-full bg-rose-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (qty / item.quantity) * 100)}%` }}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── Adjustment value ── */}
          <div className={`rounded-2xl border p-4 flex items-center justify-between ${
            isInbound ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
          }`}>
            <div className="flex items-center gap-2">
              <Calculator size={14} className={isInbound ? 'text-emerald-600' : 'text-rose-500'} />
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest ${isInbound ? 'text-emerald-700' : 'text-rose-600'}`}>
                  Adjustment Value
                </p>
                <p className={`text-[9px] mt-0.5 ${isInbound ? 'text-emerald-600/60' : 'text-rose-500/60'}`}>
                  @ ₱{item.trueUnitCost.toFixed(2)} / unit
                </p>
              </div>
            </div>
            <p className={`text-lg font-black ${isInbound ? 'text-emerald-700' : 'text-rose-600'}`}>
              {isInbound ? '+' : '-'}₱{adjustmentValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="border-t border-stone-200 bg-stone-50/90 backdrop-blur-md px-6 py-4 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-stone-500 bg-white border border-stone-200 hover:bg-stone-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-br shadow-md hover:shadow-lg active:scale-95 transition-all ${accent.btn}`}
          >
            {isInbound
              ? <><ArrowUpCircle size={14} /> Add to Inventory</>
              : <><ArrowDownCircle size={14} /> Confirm Stock Out</>}
          </button>
        </div>

      </form>
    </div>
  );
};

export default StockActionModal;