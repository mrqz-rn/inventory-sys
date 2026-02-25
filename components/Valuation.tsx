
import React, { useState } from 'react';
import { Item, Warehouse, Category, ItemStatus, UserRole } from '../types';
import { Calculator, Plus, Package, Truck, ShieldAlert, ReceiptText, Info } from 'lucide-react';

interface ValuationProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  warehouses: Warehouse[];
  categories: Category[];
  role: UserRole;
}

const Valuation: React.FC<ValuationProps> = ({ items, setItems, warehouses, categories, role }) => {
  const [formData, setFormData] = useState({
    name: '',
    warehouseId: warehouses[0]?.id || '',
    categoryId: categories[0]?.id || '',
    quantity: 1,
    baseCost: 0,
    freight: 0,
    duties: 0,
    taxes: 0,
    status: ItemStatus.RAW
  });

  const trueUnitCost = (formData.baseCost + formData.freight + formData.duties + formData.taxes) / (formData.quantity || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const wh = warehouses.find(w => w.id === formData.warehouseId);
    const cat = categories.find(c => c.id === formData.categoryId);
    const id = `it-${Date.now()}`;
    
    const newItem: Item = {
      id,
      name: formData.name,
      warehouseId: formData.warehouseId,
      categoryId: formData.categoryId,
      status: formData.status,
      barcode: `${wh?.prefix || 'WH'}-${cat?.code || 'GEN'}-${id}`,
      quantity: formData.quantity,
      baseCost: formData.baseCost,
      freight: formData.freight,
      duties: formData.duties,
      taxes: formData.taxes,
      trueUnitCost: trueUnitCost,
      lastUpdated: new Date().toISOString()
    };

    setItems(prev => [newItem, ...prev]);
    setFormData({ ...formData, name: '', quantity: 1, baseCost: 0, freight: 0, duties: 0, taxes: 0 });
    alert('Item added with true valuation!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Valuation Engine</h2>
          <p className="text-slate-500">Calculate True Unit Cost via Landed Cost model (PHP)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
              <Plus className="w-5 h-5 text-indigo-500" />
              New Stock In Record
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold"
                  value={formData.warehouseId}
                  onChange={e => setFormData({...formData, warehouseId: e.target.value})}
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold"
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
              <CostInput label="Base Cost" icon={<Package />} value={formData.baseCost} onChange={v => setFormData({...formData, baseCost: v})} />
              <CostInput label="Freight" icon={<Truck />} value={formData.freight} onChange={v => setFormData({...formData, freight: v})} />
              <CostInput label="Duties" icon={<ShieldAlert />} value={formData.duties} onChange={v => setFormData({...formData, duties: v})} />
              <CostInput label="Taxes" icon={<ReceiptText />} value={formData.taxes} onChange={v => setFormData({...formData, taxes: v})} />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              <Calculator className="w-5 h-5" /> Calculate & Register Stock
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between min-h-[200px] border border-slate-800">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">True Unit Cost Forecast (PHP)</p>
              <h4 className="text-4xl font-black">₱{trueUnitCost.toFixed(2)}</h4>
              <p className="text-slate-500 text-xs mt-2">Aggregated from all landed components divided by {formData.quantity} units.</p>
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              <div className="bg-slate-800 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap">
                <span className="text-slate-500">Base:</span> ₱{formData.baseCost}
              </div>
              <div className="bg-slate-800 px-3 py-2 rounded-lg text-[10px] whitespace-nowrap">
                <span className="text-slate-500">Logistics:</span> ₱{formData.freight + formData.duties + formData.taxes}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
            <h5 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <Info className="w-4 h-4" /> Valuation Note
            </h5>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Using Weighted Average valuation (PHP). Ensure all components like Freight and Taxes are accurately recorded for standard compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CostInput = ({ label, icon, value, onChange }: { label: string, icon: React.ReactNode, value: number, onChange: (v: number) => void }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-slate-400">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-3 h-3' })}
      <label className="text-[10px] font-bold uppercase tracking-wider">{label}</label>
    </div>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₱</span>
      <input 
        type="number" 
        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-900 font-bold"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  </div>
);

export default Valuation;
