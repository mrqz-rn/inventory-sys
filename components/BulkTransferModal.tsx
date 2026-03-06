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

  const alreadyThere = targetWhId
    ? selectedItems.filter(i => i.warehouseId === targetWhId)
    : [];
  const willMove = selectedItems.filter(i => i.warehouseId !== targetWhId);

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
        fixed inset-0 z-[120] flex items-center justify-center p-4
        transition-all duration-300
        ${visible
          ? 'bg-slate-900/40 backdrop-blur-sm'
          : 'bg-transparent backdrop-blur-none pointer-events-none'}
      `}
    >
      <form
        onSubmit={handleConfirm}
        onClick={e => e.stopPropagation()}
        className={`
          relative w-full max-w-lg
          bg-white border border-slate-200 shadow-2xl
          rounded-3xl
          max-h-[90dvh] flex flex-col
          transition-all duration-300 ease-out
          ${visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-4 opacity-0 scale-[0.97]'}
        `}
      >

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
              <ArrowRightLeft size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Bulk Operation</p>
              <h2 className="text-lg font-black text-slate-900 leading-snug tracking-tight">Hub Relocation</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'none' }}>

          {/* ── Summary chips ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Items</p>
              <p className="text-xl font-black text-slate-900">{selectedItems.length}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Units</p>
              <p className="text-xl font-black text-slate-900">{totalUnits.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Value</p>
              <p className="text-lg font-black text-slate-900">
                ₱{totalValue.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* ── Destination select ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
              <MapPin size={9} /> Destination Warehouse
            </label>
            <select
              required
              value={targetWhId}
              onChange={e => { setTargetWhId(e.target.value); setError(null); }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Select target location…</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} · {w.prefix}</option>
              ))}
            </select>

            {/* Already-there warning */}
            {alreadyThere.length > 0 && willMove.length > 0 && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 mt-1">
                <AlertCircle size={12} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700">
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
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Box size={9} /> Transfer Manifest
              <span className="flex-1 h-px bg-slate-200" />
            </p>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-100" style={{ scrollbarWidth: 'none' }}>
                {selectedItems.map(it => {
                  const sourceWh = warehouses.find(w => w.id === it.warehouseId);
                  const isSkipped = targetWhId && it.warehouseId === targetWhId;
                  return (
                    <div
                      key={it.id}
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${isSkipped ? 'opacity-40' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Box size={12} className="text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{it.name}</p>
                          <p className="text-[9px] font-mono text-slate-400">{it.quantity} units · {sourceWh?.name ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isSkipped
                          ? <span className="text-[9px] font-black uppercase tracking-wider text-blue-400">Skip</span>
                          : (
                            <>
                              <ArrowRight size={11} className="text-slate-300" />
                              <span className="text-[9px] font-bold text-slate-400 max-w-[72px] truncate">
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
        <div className="shrink-0 border-t border-slate-100 px-6 py-4 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!!targetWhId && willMove.length === 0}
            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-200 hover:shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
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