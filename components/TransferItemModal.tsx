import React, { useEffect, useState } from 'react';
import { Item, Warehouse } from '../types';
import { X, ArrowRightLeft, AlertCircle, Package, MapPin, ArrowRight } from 'lucide-react';

interface TransferItemModalProps {
  item: Item;
  warehouses: Warehouse[];
  onClose: () => void;
  onConfirm: (targetWarehouseId: string, quantity: number) => void;
}

const TransferItemModal: React.FC<TransferItemModalProps> = ({ item, warehouses, onClose, onConfirm }) => {
  const [visible, setVisible]     = useState(false);
  const [targetWhId, setTargetWhId] = useState('');
  const [rawQty, setRawQty]       = useState('1');   // keep as string to allow clearing
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const currentWarehouse = warehouses.find(w => w.id === item.warehouseId);
  const otherWarehouses  = warehouses.filter(w => w.id !== item.warehouseId);
  const targetWarehouse  = warehouses.find(w => w.id === targetWhId);

  // Safe parsed quantity — NaN collapses to 0
  const qty = parseInt(rawQty, 10) || 0;
  const remaining = item.quantity - qty;

  const validateAndConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWhId) {
      setError('Please select a destination warehouse.');
      return;
    }
    if (qty <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (qty > item.quantity) {
      setError(`Only ${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'} available.`);
      return;
    }
    onConfirm(targetWhId, qty);
  };

  // Quick-select buttons: 25 / 50 / 75 / 100 %
  const presets = [25, 50, 75, 100];

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
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Inter-Hub</p>
            <h2 className="text-lg font-black text-stone-900 leading-snug tracking-tight">Transfer Stock</h2>
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

          {/* ── Item + route card ── */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            {/* Item name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                <Package size={15} className="text-stone-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-stone-900 truncate">{item.name}</p>
                <p className="text-[10px] font-mono text-stone-400">{item.quantity} units in stock</p>
              </div>
            </div>

            {/* Route visualiser */}
            <div className="flex items-center gap-2">
              {/* From */}
              <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-0.5">From</p>
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} className="text-stone-400 shrink-0" />
                  <p className="text-xs font-bold text-stone-700 truncate">{currentWarehouse?.name ?? '—'}</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="shrink-0 w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                <ArrowRight size={12} className="text-amber-600" />
              </div>

              {/* To */}
              <div className={`flex-1 rounded-xl px-3 py-2.5 border transition-all ${
                targetWarehouse
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-stone-50 border-stone-200'
              }`}>
                <p className="text-[8px] font-black uppercase tracking-widest text-stone-300 mb-0.5">To</p>
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} className={targetWarehouse ? 'text-amber-500 shrink-0' : 'text-stone-300 shrink-0'} />
                  <p className={`text-xs font-bold truncate ${targetWarehouse ? 'text-amber-700' : 'text-stone-300'}`}>
                    {targetWarehouse?.name ?? 'Select below'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Destination select ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
              <MapPin size={9} /> Destination Warehouse
            </label>
            <select
              required
              value={targetWhId}
              onChange={e => { setTargetWhId(e.target.value); setError(null); }}
              className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Select target location…</option>
              {otherWarehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} · {w.prefix}</option>
              ))}
            </select>
          </div>

          {/* ── Quantity ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
              <ArrowRightLeft size={9} /> Transfer Quantity
            </label>

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2 mb-1">
              {presets.map(pct => {
                const val = Math.max(1, Math.round((item.quantity * pct) / 100));
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => { setRawQty(String(val)); setError(null); }}
                    className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                      qty === val
                        ? 'bg-amber-50 text-amber-600 border-amber-300 ring-2 ring-amber-200'
                        : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>

            {/* Number input */}
            <div className="relative">
              <input
                required
                type="number"
                min="1"
                max={item.quantity}
                value={rawQty}
                onChange={e => { setRawQty(e.target.value); setError(null); }}
                className={`
                  w-full bg-white border rounded-xl px-4 py-3 text-2xl font-black text-stone-900
                  focus:outline-none focus:ring-2 transition-all
                  ${error
                    ? 'border-rose-300 focus:ring-rose-200/50 focus:border-rose-400'
                    : 'border-stone-200 focus:ring-amber-400/40 focus:border-amber-400'}
                `}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-300">
                / {item.quantity} avail.
              </span>
            </div>

            {/* Remaining indicator */}
            {qty > 0 && qty <= item.quantity && (
              <div className="flex items-center justify-between mt-1 px-1">
                <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden mr-3">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (qty / item.quantity) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] font-mono text-stone-400 shrink-0">
                  {remaining} remaining after
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-1.5 text-rose-500 mt-1 px-1">
                <AlertCircle size={12} />
                <p className="text-[10px] font-bold">{error}</p>
              </div>
            )}
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
            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            <ArrowRightLeft size={14} />
            Confirm Transfer
          </button>
        </div>

      </form>
    </div>
  );
};

export default TransferItemModal;