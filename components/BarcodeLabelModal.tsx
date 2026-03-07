import React, { useEffect, useState } from 'react';
import { Item, Warehouse } from '../types';
import { X, Printer, Info, Tag, Minus, Plus } from 'lucide-react';

interface BarcodeLabelModalProps {
  items: Item[];
  warehouses: Warehouse[];
  onClose: () => void;
}

// ── Minimal Code39 SVG barcode renderer ──────────────────────────────────────
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

  const NARROW = 2, WIDE = 5, GAP = 3;
  const bars: { x: number; w: number; bar: boolean }[] = [];
  let x = 0;

  encoded.forEach((pattern, ci) => {
    pattern.split('').forEach((bit, i) => {
      const w = bit === '1' ? WIDE : NARROW;
      const isBar = i % 2 === 0;
      bars.push({ x, w, bar: isBar });
      x += w;
    });
    if (ci < encoded.length - 1) x += GAP;
  });

  const totalW = x;
  return (
    <svg viewBox={`0 0 ${totalW} ${barH}`} width="100%" height={barH} xmlns="http://www.w3.org/2000/svg">
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
  const pill = statusColors[item.status] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="
      bg-white border-2 border-slate-900
      rounded-xl shadow-sm
      p-4 flex flex-col justify-between
      h-[190px]
      break-inside-avoid
    ">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
            Nexus IMS Registry
          </p>
          <p className="text-sm font-black text-slate-900 leading-tight truncate">{item.name}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">
            Hub: <span className="font-bold">{warehouseName}</span>
            &nbsp;·&nbsp;
            Qty: <span className="font-bold">{item.quantity}</span>
          </p>
        </div>
        <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${pill}`}>
          {statusLabel}
        </span>
      </div>

      <div className="text-slate-900 my-1">
        {renderCode39(item.barcode, 65)}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-2">
        <span className="font-mono text-[9px] font-bold text-slate-500 tracking-widest">{item.barcode}</span>
        <div className="text-right">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">
            PH-SKU-{item.id.replace('it-', '')}
          </span>
          <span className="text-[8px] text-slate-300">{new Date().toLocaleDateString('en-PH')}</span>
        </div>
      </div>
    </div>
  );
};

// ── Copy count stepper ────────────────────────────────────────────────────────
const CopyStepper: React.FC<{
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}> = ({ value, onChange, min = 1, max = 99 }) => (
  <div className="flex items-center gap-1.5">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-colors active:scale-90"
    >
      <Minus size={11} className="text-slate-600" />
    </button>
    <span className="w-8 text-center text-sm font-black text-slate-800 tabular-nums">{value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-colors active:scale-90"
    >
      <Plus size={11} className="text-slate-600" />
    </button>
  </div>
);

// ── Main modal ───────────────────────────────────────────────────────────────
const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({ items, warehouses, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [copies, setCopies] = useState<Record<string, number>>(
    () => Object.fromEntries(items.map(i => [i.id, 1]))
  );

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

  const setCopy = (itemId: string, val: number) =>
    setCopies(prev => ({ ...prev, [itemId]: Math.max(1, Math.min(99, val)) }));

  const setAllCopies = (val: number) =>
    setCopies(Object.fromEntries(items.map(i => [i.id, val])));

  const totalLabels = items.reduce((sum, i) => sum + (copies[i.id] ?? 1), 0);

  const allSame = items.length > 0 && items.every(i => (copies[i.id] ?? 1) === (copies[items[0].id] ?? 1));
  const globalVal = allSame ? (copies[items[0]?.id] ?? 1) : -1;

  // Expanded list for print: repeat each item N times
  const printItems = items.flatMap(item =>
    Array.from({ length: copies[item.id] ?? 1 }, (_, idx) => ({ ...item, _printKey: `${item.id}-${idx}` }))
  );

  return (
    <>
      <style>{`
        @media screen {
          .print-root { display: none !important; }
        }
        @media print {
          body * { visibility: hidden; }
          .print-root, .print-root * { visibility: visible; }
          .print-root {
            display: block !important;
            position: fixed !important;
            top: 0; left: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        onClick={handleClose}
        className={`
          no-print fixed inset-0 z-[150] flex items-center justify-center p-4
          transition-all duration-300
          ${visible
            ? 'bg-slate-900/40 backdrop-blur-sm'
            : 'bg-transparent backdrop-blur-none pointer-events-none'}
        `}
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`
            relative w-full max-w-4xl
            bg-white border border-slate-200 shadow-2xl
            rounded-3xl max-h-[90dvh] flex flex-col
            transition-all duration-300 ease-out
            ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-[0.97]'}
          `}
        >

          {/* ── Header ── */}
          <div className="shrink-0 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                <Tag size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Print Queue</p>
                <h2 className="text-lg font-black text-slate-900 leading-snug tracking-tight">Label Manifest</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-200 hover:shadow-lg active:scale-95 transition-all"
              >
                <Printer size={14} />
                Print
                {/* Print {totalLabels} {totalLabels === 1 ? 'Label' : 'Labels'} */}
              </button>
              <button
                onClick={handleClose}
                className="shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Print hint ── */}
          <div className="shrink-0 px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-2.5">
            <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700/80 leading-relaxed">
              Formatted for <span className="font-bold text-blue-800">4″ × 2″</span> thermal labels.
              Enable <span className="font-bold text-blue-800">Background Graphics</span> in your browser's print settings.
              Barcodes use <span className="font-bold text-blue-800">Code 39</span> encoding and are scanner-ready.
            </p>
          </div>

          {/* ── Global copies toolbar ── */}
          <div className="shrink-0 px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Set all copies:
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5, 10].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAllCopies(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-black border transition-all active:scale-90 ${
                      globalVal === n
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-slate-400">Total:</span>
              <span className="text-sm font-black text-blue-600 tabular-nums">{totalLabels}</span>
              <span className="text-[10px] font-mono text-slate-400">{totalLabels === 1 ? 'label' : 'labels'}</span>
            </div>
          </div>

          {/* ── Label list with per-item stepper ── */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-col gap-3">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-stretch">

                  {/* Stepper panel */}
                  <div className="shrink-0 w-32 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">
                      Copies
                    </p>
                    {/* <CopyStepper
                      value={copies[item.id] ?? 1}
                      onChange={v => setCopy(item.id, v)}
                    /> */}
                    {/* Direct input */}
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={copies[item.id] ?? 1}
                      onChange={e => setCopy(item.id, parseInt(e.target.value) || 1)}
                      className="w-14 text-center text-sm font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Label preview */}
                  <div className="flex-1">
                    <LabelCard item={item} warehouseName={getWarehouseName(item.warehouseId)} />
                    {(copies[item.id] ?? 1) > 1 && (
                      <p className="mt-1.5 px-1 text-[9px] font-mono text-slate-400">
                        Will print <span className="font-bold text-blue-600">{copies[item.id]}</span> copies of this label
                      </p>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          {/* <div className="shrink-0 border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-[10px] text-slate-400 font-mono">
              {totalLabels} label{totalLabels !== 1 ? 's' : ''} · Code 39 · {new Date().toLocaleDateString('en-PH')}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
            >
              Close
            </button>
          </div> */}

        </div>
      </div>

      {/* Print-only label sheet — expanded by copy counts */}
      <div className="print-root">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {printItems.map((item) => (
            <LabelCard
              key={(item as any)._printKey}
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