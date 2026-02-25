import React, { useEffect, useState } from 'react';
import { Item, Warehouse } from '../types';
import { X, ArrowRightLeft, MapPin, Box, ArrowRight, AlertCircle } from 'lucide-react';

interface BulkTransferModalProps {
  selectedItems: Item[];
  warehouses: Warehouse[];
  onClose: () => void;
  onConfirm: (targetWarehouseId: string) => void;
}

const BulkTransferModal: React.FC<BulkTransferModalProps> = ({
  selectedItems, warehouses, onClose, onConfirm
}) => {
  const [visible, setVisible]       = useState(false);
  const [targetWhId, setTargetWhId] = useState('');
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const targetWarehouse = warehouses.find(w => w.id === targetWhId);

  /**
   * FIX: the original allowed selecting any warehouse including ones
   * some items already live in. We warn when all selected items already
   * belong to the target (a no-op transfer). We also surface which items
   * would effectively not move so the user is informed.
   */
  const alreadyThere = targetWhId
    ? selectedItems.filter(i => i.warehouseId === targetWhId)
    : [];
  const willMove = selectedItems.filter(i => i.warehouseId !== targetWhId);

  // Aggregate stats
  const totalUnits = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const totalValue = selectedItems.reduce((s, i) => s + i.trueUnitCost * i.quantity, 0);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWhId) {
      setError('Please select a destination warehouse.');
      return;
    }
    if (willMove.length === 0) {
      setError('All selected items are already in this warehouse.');
      return;
    }
    onConfirm(targetWhId);
  };

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
        onSubmit={handleConfirm}
        onClick={e => e.stopPropagation()}
        className={`
          relative w-full md:max-w-lg
          bg-stone-50 border border-stone-200 shadow-2xl
          rounded-[2rem] md:rounded-[2rem]
          max-h-[92dvh] flex flex-col
          transition-all duration-300 ease-out
          ${visible
            ? 'translate-y-0 opacity-100 md:scale-100'
            : 'translate-y-full opacity-0 md:translate-y-4 md:scale-[0.97]'}
        `}
      >

        {/* ── Header ── */}
        <div className="shrink-0 order-b border-stone-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <ArrowRightLeft size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Bulk Operation</p>
              <h2 className="text-lg font-black text-stone-900 leading-snug tracking-tight">Hub Relocation</h2>
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

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'none' }}>

          {/* ── Summary chips ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-1">Items</p>
              <p className="text-xl font-black text-stone-900">{selectedItems.length}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-1">Units</p>
              <p className="text-xl font-black text-stone-900">{totalUnits.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-1">Value</p>
              <p className="text-lg font-black text-stone-900">
                ₱{totalValue.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
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
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} · {w.prefix}</option>
              ))}
            </select>

            {/* Already-there warning */}
            {alreadyThere.length > 0 && willMove.length > 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mt-1">
                <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700">
                  <span className="font-bold">{alreadyThere.length} {alreadyThere.length === 1 ? 'item' : 'items'}</span> already in this warehouse and will be skipped. <span className="font-bold">{willMove.length}</span> will move.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-1.5 text-rose-500 px-1 mt-1">
                <AlertCircle size={12} />
                <p className="text-[10px] font-bold">{error}</p>
              </div>
            )}
          </div>

          {/* ── Manifest list ── */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
              <Box size={9} /> Transfer Manifest
              <span className="flex-1 h-px bg-stone-200" />
            </p>
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <div className="max-h-52 overflow-y-auto divide-y divide-stone-100" style={{ scrollbarWidth: 'none' }}>
                {selectedItems.map(it => {
                  const sourceWh = warehouses.find(w => w.id === it.warehouseId);
                  const isSkipped = targetWhId && it.warehouseId === targetWhId;
                  return (
                    <div
                      key={it.id}
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${isSkipped ? 'opacity-40' : 'hover:bg-stone-50'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                          <Box size={12} className="text-stone-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">{it.name}</p>
                          <p className="text-[9px] font-mono text-stone-400">{it.quantity} units · {sourceWh?.name ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isSkipped
                          ? <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">Skip</span>
                          : (
                            <>
                              <ArrowRight size={11} className="text-stone-300" />
                              <span className="text-[9px] font-bold text-stone-400 max-w-[72px] truncate">
                                {targetWarehouse?.name ?? '—'}
                              </span>
                            </>
                          )
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-stone-200 px-6 py-4 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-stone-500 bg-white border border-stone-200 hover:bg-stone-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!!targetWhId && willMove.length === 0}
            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <ArrowRightLeft size={14} />
            {willMove.length > 0
              ? `Transfer ${willMove.length} ${willMove.length === 1 ? 'Item' : 'Items'}`
              : 'Initiate Bulk Transfer'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default BulkTransferModal;