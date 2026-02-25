import React, { useEffect, useState } from 'react';
import { Item, Warehouse } from '../types';
import { X, Printer, Info, Tag } from 'lucide-react';

interface BarcodeLabelModalProps {
  items: Item[];
  warehouses: Warehouse[];
  onClose: () => void;
}

// ── Minimal Code39 SVG barcode renderer ──────────────────────────────────────
// Code 39 encodes A-Z, 0-9 and a few symbols. Each char = 9 elements (5 bars,
// 4 spaces), each element is either narrow (1 unit) or wide (3 units).
const CODE39: Record<string, string> = {
  '0':'000110100','1':'100100001','2':'001100001','3':'101100000',
  '4':'000110001','5':'100110000','6':'001110000','7':'000100101',
  '8':'100100100','9':'001100100','A':'100001001','B':'001001001',
  'C':'101001000','D':'000011001','E':'100011000','F':'001011000',
  'G':'000001101','H':'100001100','I':'001001100','J':'000011100',
  'K':'100000011','L':'001000011','M':'101000010','N':'000010011',
  'O':'100010010','P':'001010010','Q':'000000111','R':'100000110',
  'S':'001000110','T':'000010110','U':'110000001','V':'011000001',
  'W':'111000000','X':'010010001','Y':'110010000','Z':'011010000',
  '-':'010000101','.':"110000100",' ':'011000100','*':'010010100',
};

function renderCode39(text: string, barH = 56): React.ReactNode {
  const encoded = ('*' + text.toUpperCase().replace(/[^0-9A-Z\-. ]/g, '') + '*')
    .split('')
    .map(c => CODE39[c] ?? CODE39[' ']);

  // Build bar widths: pattern = bars and spaces alternating, narrow=2px wide=5px
  const NARROW = 2, WIDE = 5, GAP = 3;
  const bars: { x: number; w: number; bar: boolean }[] = [];
  let x = 0;

  encoded.forEach((pattern, ci) => {
    pattern.split('').forEach((bit, i) => {
      const w = bit === '1' ? WIDE : NARROW;
      const isBar = i % 2 === 0; // even indices = bar, odd = space
      bars.push({ x, w, bar: isBar });
      x += w;
    });
    if (ci < encoded.length - 1) x += GAP; // inter-character gap
  });

  const totalW = x;
  return (
    <svg viewBox={`0 0 ${totalW} ${barH}`} width="100%" height={barH} xmlns="http://www.w3.org/2000/svg" className="print:fill-black">
      {bars.filter(b => b.bar).map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={barH} fill="currentColor" />
      ))}
    </svg>
  );
}

// ── Label card ───────────────────────────────────────────────────────────────
const LabelCard: React.FC<{ item: Item; warehouseName: string }> = ({ item, warehouseName }) => {
  const statusLabel = item.status.replace('_', ' ');
  const statusColors: Record<string, string> = {
    RAW: 'bg-slate-100 text-slate-600',
    FINISHED: 'bg-violet-100 text-violet-700',
    GOOD_AS_NEW: 'bg-emerald-100 text-emerald-700',
    OLD_USED: 'bg-amber-100 text-amber-700',
  };
  const pill = statusColors[item.status] ?? 'bg-stone-100 text-stone-600';

  return (
    <div className="
      bg-white border-2 border-stone-900
      print:border-black print:rounded-none print:shadow-none
      rounded-xl shadow-sm
      p-4 flex flex-col justify-between
      h-[190px] print:h-[2in] print:w-[4in]
      break-inside-avoid
    ">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400 print:text-black">
            Nexus Pro Registry
          </p>
          <p className="text-sm font-black text-stone-900 print:text-black leading-tight truncate">
            {item.name}
          </p>
          <p className="text-[9px] text-stone-400 print:text-black mt-0.5">
            Hub: <span className="font-bold">{warehouseName}</span>
            &nbsp;·&nbsp;
            Qty: <span className="font-bold">{item.quantity}</span>
          </p>
        </div>
        <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${pill} print:bg-transparent print:border print:border-black print:text-black`}>
          {statusLabel}
        </span>
      </div>

      {/* Barcode */}
      <div className="text-stone-900 print:text-black my-1">
        {renderCode39(item.barcode, 65)}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between border-t border-stone-200 print:border-black pt-2">
        <span className="font-mono text-[9px] font-bold text-stone-500 print:text-black tracking-widest">
          {item.barcode}
        </span>
        <div className="text-right">
          <span className="text-[8px] font-black text-stone-400 print:text-black uppercase tracking-wider block">
            PH-SKU-{item.id.replace('it-', '')}
          </span>
          <span className="text-[8px] text-stone-300 print:text-black">
            {new Date().toLocaleDateString('en-PH')}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Main modal ───────────────────────────────────────────────────────────────
const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({ items, warehouses, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const getWarehouseName = (id: string) =>
    warehouses.find(w => w.id === id)?.name ?? 'N/A';

  return (
    <>
      {/* Print-only global reset */}
      <style>{`
        @media print {
          body > *:not(.print-root) { display: none !important; }
          .no-print { display: none !important; }
          .print-root { display: block !important; position: static !important; }
        }
      `}</style>

      <div
        onClick={handleClose}
        className={`
          no-print fixed inset-0 z-[150] flex items-end md:items-center md:justify-center
          transition-all duration-300
          ${visible
            ? 'bg-stone-900/40 backdrop-blur-sm'
            : 'bg-transparent backdrop-blur-none pointer-events-none'}
        `}
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`
            relative w-full md:max-w-4xl
            bg-stone-50 border border-stone-200 shadow-2xl
            rounded-t-[2rem] md:rounded-[2rem]
            max-h-[92dvh] flex flex-col
            transition-all duration-300 ease-out
            ${visible
              ? 'translate-y-0 opacity-100 md:scale-100'
              : 'translate-y-full opacity-0 md:translate-y-4 md:scale-[0.97]'}
          `}
        >

          {/* ── Header ── */}
          <div className="shrink-0  border-b border-stone-200 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                <Tag size={15} className="text-stone-600" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Print Queue</p>
                <h2 className="text-lg font-black text-stone-900 leading-snug tracking-tight">
                  Label Manifest
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <Printer size={14} /> Print {items.length} {items.length === 1 ? 'Label' : 'Labels'}
              </button>
              <button
                onClick={handleClose}
                className="shrink-0 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Print hint ── */}
          <div className="shrink-0 px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2.5">
            <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700/80 leading-relaxed">
              Formatted for <span className="font-bold text-amber-800">4″ × 2″</span> thermal labels.
              Enable <span className="font-bold text-amber-800">Background Graphics</span> in your browser's print settings.
              Barcodes use <span className="font-bold text-amber-800">Code 39</span> encoding and are scanner-ready.
            </p>
          </div>

          {/* ── Label grid ── */}
          <div
            className="flex-1 overflow-y-auto p-6 md:p-8 bg-stone-200/40 print:bg-white print:p-0"
            style={{ scrollbarWidth: 'none' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-0">
              {items.map(item => (
                <LabelCard
                  key={item.id}
                  item={item}
                  warehouseName={getWarehouseName(item.warehouseId)}
                />
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="shrink-0 border-t border-stone-200 px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-[10px] text-stone-400 font-mono">
              {items.length} label{items.length !== 1 ? 's' : ''} · Code 39 · {new Date().toLocaleDateString('en-PH')}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-stone-600 bg-white border border-stone-200 shadow-sm hover:bg-stone-100 hover:text-stone-900 transition-all active:scale-95"
            >
              Close
            </button>
          </div>

        </div>
      </div>

      {/* Print-only label sheet — always in DOM, hidden on screen */}
      <div className="print-root hidden print:block">
        <div className="grid grid-cols-2">
          {items.map(item => (
            <LabelCard
              key={item.id}
              item={item}
              warehouseName={getWarehouseName(item.warehouseId)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default BarcodeLabelModal;