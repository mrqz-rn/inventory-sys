import React, { useEffect, useState } from 'react';
import { Item, Warehouse, Category, ItemStatus } from '../types';
import {
  X, Calculator, Save, Package, Truck,
  ShieldAlert, ReceiptText, RefreshCw, MapPin, Layers, Hash, AlertCircle
} from 'lucide-react';

interface EditItemModalProps {
  item: Item;
  onClose: () => void;
  onSave: (updatedItem: Item) => void;
  warehouses: Warehouse[];
  categories: Category[];
}

// ── Shared input styles ───────────────────────────────────────────────────────
const inputCls = (err?: string) =>
  'w-full bg-white border rounded-xl px-3.5 py-3 text-sm font-semibold text-stone-800 ' +
  'placeholder:text-stone-300 focus:outline-none focus:ring-2 transition-all ' +
  (err
    ? 'border-rose-300 focus:ring-rose-200/50 focus:border-rose-400'
    : 'border-stone-200 focus:ring-blue-400/40 focus:border-blue-400');

const selectCls = (err?: string) =>
  'w-full bg-white border rounded-xl px-3.5 py-3 text-sm font-semibold text-stone-800 ' +
  'focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ' +
  (err
    ? 'border-rose-300 focus:ring-rose-200/50 focus:border-rose-400'
    : 'border-stone-200 focus:ring-blue-400/40 focus:border-blue-400');

// ── Field wrapper with inline error ──────────────────────────────────────────
const Field = ({
  label, icon, error, children
}: {
  label: string; icon: React.ReactNode; error?: string; children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
      {icon}{label}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1 text-rose-500 px-0.5">
        <AlertCircle size={10} className="shrink-0" />
        <span className="text-[10px] font-semibold">{error}</span>
      </div>
    )}
  </div>
);

// ── Cost field ────────────────────────────────────────────────────────────────
const CostField = ({
  label, icon: Icon, accent, value, onChange, error
}: {
  label: string; icon: React.ElementType; accent: string;
  value: number; onChange: (v: number) => void; error?: string;
}) => (
  <div className={`bg-white border rounded-2xl p-4 hover:border-stone-300 transition-all ${error ? 'border-rose-300' : 'border-stone-200'}`}>
    <div className="flex items-center gap-1.5 mb-2">
      <Icon size={10} className="text-stone-400 shrink-0" />
      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{label}</span>
    </div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold select-none">₱</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className={
          'w-full bg-stone-50 border rounded-xl pl-7 pr-3 py-2.5 text-sm font-mono font-semibold text-stone-800 ' +
          'focus:outline-none focus:ring-2 transition-all ' +
          (error
            ? 'border-rose-300 focus:ring-rose-200/50 focus:border-rose-400'
            : 'border-stone-200 focus:ring-blue-400/40 focus:border-blue-400')
        }
      />
    </div>
    {/* <div className={`mt-3 h-0.5 rounded-full ${accent}`} /> */}
    {error && (
      <div className="flex items-center gap-1 text-rose-500 mt-2">
        <AlertCircle size={10} className="shrink-0" />
        <span className="text-[10px] font-semibold">{error}</span>
      </div>
    )}
  </div>
);

// ── Status meta ───────────────────────────────────────────────────────────────
const statusMeta: Record<ItemStatus, { label: string; active: string }> = {
  [ItemStatus.RAW]:         { label: 'Raw',         active: 'bg-slate-100 text-slate-600 ring-2 ring-slate-300'      },
  [ItemStatus.FINISHED]:    { label: 'Finished',    active: 'bg-violet-50 text-violet-600 ring-2 ring-violet-300'    },
  [ItemStatus.GOOD_AS_NEW]: { label: 'Good as New', active: 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-300' },
  [ItemStatus.OLD_USED]:    { label: 'Old / Used',  active: 'bg-amber-50 text-amber-600 ring-2 ring-amber-300'       },
};

// ── Error shape ───────────────────────────────────────────────────────────────
interface Errors {
  name?:        string;
  quantity?:    string;
  warehouseId?: string;
  categoryId?:  string;
  baseCost?:    string;
  freight?:     string;
  duties?:      string;
  taxes?:       string;
}

// ── Main component ────────────────────────────────────────────────────────────
const EditItemModal: React.FC<EditItemModalProps> = ({
  item, onClose, onSave, warehouses, categories
}) => {
  const [visible, setVisible] = useState(false);
  const [errors, setErrors]   = useState<Errors>({});

  const [form, setForm] = useState({
    name:        item.name,
    warehouseId: item.warehouseId,
    categoryId:  item.categoryId,
    rawQty:      String(item.quantity),   // string to prevent NaN on clear
    baseCost:    item.baseCost,
    freight:     item.freight,
    duties:      item.duties,
    taxes:       item.taxes,
    status:      item.status,
  });

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const set = (patch: Partial<typeof form>) => {
    setForm(f => ({ ...f, ...patch }));
    const key = Object.keys(patch)[0] as keyof Errors;
    if (key in errors) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const qty = parseInt(form.rawQty, 10);
  const safeQty = isNaN(qty) || qty < 1 ? 0 : qty;

  /**
   * TRUE LANDED COST (per unit)
   * = baseCost + freight + duties + taxes
   * Quantity is NOT part of this formula — each field is already per-unit.
   * Total inventory value = trueUnitCost × quantity
   */
  const trueUnitCost = form.baseCost + form.freight + form.duties + form.taxes;
  const totalValue   = safeQty * trueUnitCost;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Errors = {};

    if (!form.name.trim()) {
      errs.name = 'Item name is required.';
    }

    if (!form.rawQty.trim() || isNaN(qty) || qty < 1) {
      errs.quantity = 'Enter a valid quantity (min 1).';
    }

    if (!form.warehouseId) {
      errs.warehouseId = 'Select a warehouse.';
    }

    if (!form.categoryId) {
      errs.categoryId = 'Select a category.';
    }

    if (form.baseCost <= 0) {
      errs.baseCost = 'Base cost must be greater than 0.';
    }

    if(!form.baseCost) {
      errs.baseCost = 'Base cost is required.'
    }

    if (form.freight < 0 || isNaN(form.freight)) {
      errs.freight = 'Freight must be a valid integer (min 0).';
    }

    if (form.duties < 0 || isNaN(form.duties)) {
      errs.duties = 'Duties must be a valid integer (min 0).';
    }

    if (form.taxes < 0 || isNaN(form.taxes)) {
      errs.taxes = 'Taxes must be a valid integer (min 0).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const wh  = warehouses.find(w => w.id === form.warehouseId);
    const cat = categories.find(c => c.id === form.categoryId);
    onSave({
      ...item,
      name:         form.name.trim(),
      warehouseId:  form.warehouseId,
      categoryId:   form.categoryId,
      status:       form.status,
      barcode:      `${wh?.prefix ?? 'WH'}-${cat?.code ?? 'GEN'}-${item.id.replace('it-', '')}`,
      quantity:     qty,
      baseCost:     form.baseCost,
      freight:      form.freight,
      duties:       form.duties,
      taxes:        form.taxes,
      trueUnitCost,
      lastUpdated:  new Date().toISOString(),
    });
  };

  const bars = [
    { label: 'Base',    value: form.baseCost, bar: 'bg-violet-400' },
    { label: 'Freight', value: form.freight,  bar: 'bg-sky-400'    },
    { label: 'Duties',  value: form.duties,   bar: 'bg-rose-400'   },
    { label: 'Taxes',   value: form.taxes,    bar: 'bg-emerald-400'},
  ];

  const hasErrors = Object.values(errors).some(Boolean);

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
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className={`
          relative w-full md:max-w-2xl
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

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Editing SKU</p>
            <h2 className="text-lg font-black text-stone-900 leading-snug tracking-tight">{item.name}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 md:p-8 space-y-8">

          {/* Identity */}
          <div>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-4">
              <Hash size={10} /> Identity
              <span className="flex-1 h-px bg-stone-200" />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <Field label="Item Name" icon={<Package size={10} />} error={errors.name}>
                <input
                  type="text"
                  placeholder="e.g. Industrial Gear #4"
                  value={form.name}
                  onChange={e => set({ name: e.target.value })}
                  className={inputCls(errors.name)}
                />
              </Field>

              <Field label="Quantity in Stock" icon={<RefreshCw size={10} />} error={errors.quantity}>
                <input
                  type="number"
                  min="1"
                  value={form.rawQty}
                  onChange={e => set({ rawQty: e.target.value })}
                  className={inputCls(errors.quantity)}
                />
              </Field>

              <Field label="Warehouse" icon={<MapPin size={10} />} error={errors.warehouseId}>
                <select
                  value={form.warehouseId}
                  onChange={e => set({ warehouseId: e.target.value })}
                  className={selectCls(errors.warehouseId)}
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Category" icon={<Layers size={10} />} error={errors.categoryId}>
                <select
                  value={form.categoryId}
                  onChange={e => set({ categoryId: e.target.value })}
                  className={selectCls(errors.categoryId)}
                >
                  {categories.map(c => {
                    const parent = categories.find(p => p.id === c.parentId);
                    return (
                      <option key={c.id} value={c.id}>
                        {parent ? `${parent.name} › ${c.name}` : c.name}
                      </option>
                    );
                  })}
                </select>
              </Field>

            </div>
          </div>

          {/* Condition */}
          <div>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-4">
              <ShieldAlert size={10} /> Condition
              <span className="flex-1 h-px bg-stone-200" />
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.values(ItemStatus) as ItemStatus[]).map(s => {
                const meta = statusMeta[s];
                const isActive = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set({ status: s })}
                    className={`
                      py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all
                      ${isActive
                        ? meta.active
                        : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50 hover:border-stone-300'}
                    `}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cost fields */}
          <div>
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 mb-4">
              <Calculator size={10} /> Cost Components
              <span className="text-[8px] font-medium normal-case tracking-normal text-stone-300">(per unit)</span>
              <span className="flex-1 h-px bg-stone-200" />
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <CostField label="Base Cost" icon={Package}     accent="bg-violet-300" value={form.baseCost} onChange={v => set({ baseCost: v })} error={errors.baseCost} />
              <CostField label="Freight"   icon={Truck}       accent="bg-sky-300"    value={form.freight}  onChange={v => set({ freight: v })}  error={errors.freight}  />
              <CostField label="Duties"    icon={ShieldAlert} accent="bg-rose-300"   value={form.duties}   onChange={v => set({ duties: v })}   error={errors.duties}   />
              <CostField label="Taxes"     icon={ReceiptText} accent="bg-emerald-300"value={form.taxes}    onChange={v => set({ taxes: v })}    error={errors.taxes}    />
            </div>

            {/* Distribution bars */}
            {/* <div className="mt-4 bg-white border border-stone-200 rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-300 mb-3">Cost distribution</p>
              <div className="space-y-2">
                {bars.map(({ label, value, bar }) => {
                  const pct = trueUnitCost > 0 ? (value / trueUnitCost) * 100 : 0;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-stone-400 w-14 shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bar} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-stone-400 w-8 text-right shrink-0">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </div> */}
          </div>

          {/* ── Live result hero ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-7 shadow-lg">
            <span className="pointer-events-none select-none absolute -right-4 -top-4 text-[10rem] font-black text-white/10 leading-none">
              ₱
            </span>
            <div className="relative z-10 flex flex-col gap-4">

              {/* Validation summary banner */}
              {/* {hasErrors && (
                <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-300/40 rounded-xl px-4 py-2.5">
                  <AlertCircle size={13} className="text-rose-200 shrink-0" />
                  <p className="text-[11px] font-semibold text-rose-100">
                    Please fix the highlighted fields before saving.
                  </p>
                </div>
              )} */}

              {/* Per-unit cost */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/60 mb-1">
                  New True Unit Cost · Landed
                </p>
                <p className="text-5xl font-black text-white leading-none tracking-tighter">
                  ₱{trueUnitCost.toFixed(2)}
                </p>
                {/* Correct formula: plain sum, no division */}
                <p className="text-[10px] text-white/40 mt-1.5 font-mono">
                  ₱{form.baseCost.toFixed(2)} + ₱{form.freight.toFixed(2)} + ₱{form.duties.toFixed(2)} + ₱{form.taxes.toFixed(2)} per unit
                </p>
              </div>

              <div className="h-px bg-white/20" />

              {/* Total inventory value + CTA */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/60 mb-1">
                    Total Inventory Value
                  </p>
                  <p className="text-2xl font-black text-white/90 leading-none tracking-tight">
                    ₱{totalValue.toFixed(2)}
                  </p>
                  <p className="text-[9px] text-white/40 mt-1 font-mono">
                    ₱{trueUnitCost.toFixed(2)} × {safeQty} {safeQty === 1 ? 'unit' : 'units'}
                  </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl text-sm font-bold text-white/70 bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-blue-700 bg-white hover:bg-blue-50 shadow-lg transition-all active:scale-95"
                  >
                    <Save size={14} /> Commit Changes
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default EditItemModal;