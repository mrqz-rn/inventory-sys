import React, { useEffect, useState } from 'react';
import { Item, Warehouse, Category, ItemStatus } from '../types';
import {
  X, MapPin, Layers, Calendar, Package,
  Truck, ShieldAlert, ReceiptText, TrendingUp,
  Info, Zap
} from 'lucide-react';

interface ItemDetailsModalProps {
  item: Item;
  onClose: () => void;
  warehouse?: Warehouse;
  category?: Category;
  allCategories: Category[];
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item, onClose, warehouse, category, allCategories
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const getFullCategoryPath = (catId?: string) => {
    if (!catId) return 'N/A';
    const cat = allCategories.find(c => c.id === catId);
    if (!cat) return 'N/A';
    const parent = allCategories.find(p => p.id === cat.parentId);
    return parent ? `${parent.name} › ${cat.name}` : cat.name;
  };

  const statusConfig: Record<ItemStatus, { label: string; pill: string; dot: string }> = {
    [ItemStatus.RAW]:         { label: 'Raw',         pill: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',      dot: 'bg-slate-400'   },
    [ItemStatus.FINISHED]:    { label: 'Finished',    pill: 'bg-violet-50 text-violet-600 ring-1 ring-violet-200',    dot: 'bg-violet-500'  },
    [ItemStatus.GOOD_AS_NEW]: { label: 'Good as New', pill: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
    [ItemStatus.OLD_USED]:    { label: 'Old / Used',  pill: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',       dot: 'bg-amber-400'   },
  };

  const st = statusConfig[item.status];

  /**
   * COST COMPUTATIONS
   * ─────────────────────────────────────────────────────────────────────────
   * trueUnitCost  = per-unit landed cost = sum of all per-unit cost components
   *                 (baseCost + freight + duties + taxes)
   *
   * totalInventoryValue = trueUnitCost × quantity
   *                       = total capitalized value of all units on hand
   */
  const trueUnitCost       = item.baseCost + item.freight + item.duties + item.taxes;
  const totalInventoryValue = trueUnitCost * item.quantity;

  const costBreakdown = [
    { label: 'Base Cost', value: item.baseCost, icon: Package,     bar: 'bg-violet-400' },
    { label: 'Freight',   value: item.freight,  icon: Truck,       bar: 'bg-sky-400'    },
    { label: 'Duties',    value: item.duties,   icon: ShieldAlert, bar: 'bg-rose-400'   },
    { label: 'Taxes',     value: item.taxes,    icon: ReceiptText, bar: 'bg-emerald-400'},
  ];

  return (
    <div
      onClick={handleClose}
      className={`
        fixed inset-0 z-[110] flex items-end md:items-center md:justify-center
        transition-all duration-300
        ${visible
          ? 'bg-stone-900/40 backdrop-blur-sm'
          : 'bg-transparent backdrop-blur-none pointer-events-none'}
      `}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`
          relative w-full md:max-w-3xl
          bg-stone-50 border border-stone-200 shadow-2xl
          rounded-t-[2rem] md:rounded-[2rem]
          max-h-[92dvh] overflow-y-auto
          transition-all duration-300 ease-out
          ${visible
            ? 'translate-y-0 opacity-100 md:scale-100'
            : 'translate-y-full opacity-0 md:translate-y-4 md:scale-[0.97]'}
        `}
        style={{ scrollbarWidth: 'none' }}
      >

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-10 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] text-stone-400 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md tracking-wide">
                {item.barcode}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${st.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>
            <h2 className="text-lg font-black text-stone-900 leading-snug tracking-tight truncate">
              {item.name}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="shrink-0 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 md:p-8 space-y-8">

          {/* ── Hero: Costs ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-8 shadow-lg">
            <span className="pointer-events-none select-none absolute -right-4 -top-4 text-[11rem] font-black text-white/10 leading-none">
              ₱
            </span>

            <div className="relative z-10 flex flex-col gap-6">
              {/* Top row: per-unit + stock badge */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">
                    True Unit Cost · Landed
                  </p>
                  <p className="text-6xl font-black text-white leading-none tracking-tighter">
                    ₱{trueUnitCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/50 mt-2">
                    Per unit · base + freight + duties + taxes
                  </p>
                </div>

                <div className="flex items-center gap-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 w-fit shrink-0">
                  <Package size={14} className="text-white/70" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">Stock</p>
                    <p className="text-sm font-black text-white">{item.quantity} units</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/20" />

              {/* Bottom row: total inventory value */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">
                    Total Inventory Value
                  </p>
                  <p className="text-3xl font-black text-white/90 leading-none tracking-tight">
                    ₱{totalInventoryValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/40 mt-1 font-mono">
                    ₱{trueUnitCost.toFixed(2)} × {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Cost Breakdown ── */}
          <div>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-4">
              <TrendingUp size={10} />
              Cost Breakdown
              <span className="text-[8px] font-medium normal-case tracking-normal text-stone-300">(per unit)</span>
              <span className="flex-1 h-px bg-stone-200" />
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {costBreakdown.map(({ label, value, icon: Icon, bar }) => {
                const pct = trueUnitCost > 0 ? Math.round((value / trueUnitCost) * 100) : 0;
                return (
                  <div
                    key={label}
                    className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-stone-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon size={11} className="text-stone-400 shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{label}</span>
                    </div>
                    <p className="font-mono text-base font-semibold text-stone-800">₱{value.toFixed(2)}</p>
                    <div className="mt-2.5 h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[9px] text-stone-300 mt-1 font-mono">{pct}% of unit cost</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Item Info Grid ── */}
          <div>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-4">
              <Zap size={10} />
              Item Info
              <span className="flex-1 h-px bg-stone-200" />
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-stone-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin size={10} className="text-stone-300" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">Location</span>
                </div>
                <p className="text-sm font-bold text-stone-800 leading-snug">{warehouse?.name || 'Unknown Hub'}</p>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-stone-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Layers size={10} className="text-stone-300" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">Category</span>
                </div>
                <p className="text-sm font-bold text-stone-800 leading-snug">{getFullCategoryPath(item.categoryId)}</p>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-stone-300 hover:shadow-sm transition-all col-span-2 md:col-span-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Calendar size={10} className="text-stone-300" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">Last Entry</span>
                </div>
                <p className="text-sm font-bold text-stone-800 leading-snug">
                  {new Date(item.lastUpdated).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* ── Audit Note ── */}
          <div className="flex gap-3.5 items-start bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
              <Info size={13} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500 mb-1">Audit Note</p>
              <p className="text-xs text-blue-700/70 leading-relaxed">
                Valued via <span className="font-bold text-blue-700">Landed Cost</span> methodology.
                True unit cost of <span className="font-bold text-blue-700">₱{trueUnitCost.toFixed(2)}</span> reflects
                all per-unit cost components. Total inventory value of{' '}
                <span className="font-bold text-blue-700">₱{totalInventoryValue.toFixed(2)}</span> is
                computed across <span className="font-bold text-blue-700">{item.quantity} {item.quantity === 1 ? 'unit' : 'units'}</span> on hand.
              </p>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-stone-50/90 backdrop-blur-md border-t border-stone-200 px-6 py-4 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-stone-600 bg-white border border-stone-200 shadow-sm hover:bg-stone-100 hover:text-stone-900 transition-all active:scale-95"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};

export default ItemDetailsModal;