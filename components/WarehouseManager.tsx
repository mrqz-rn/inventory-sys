
import React, { useState } from 'react';
import { Warehouse, UserRole } from '../types';
import { Warehouse as WarehouseIcon, Plus, Trash2, MapPin, Hash } from 'lucide-react';

interface Props {
  warehouses: Warehouse[];
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>;
  role: UserRole;
}

const WarehouseManager: React.FC<Props> = ({ warehouses, setWarehouses, role }) => {
  const [newWh, setNewWh] = useState({ name: '', prefix: '' });

  const addWarehouse = () => {
    if (!newWh.name || !newWh.prefix) return;
    const wh: Warehouse = {
      id: `wh-${Date.now()}`,
      name: newWh.name,
      prefix: newWh.prefix.toUpperCase()
    };
    setWarehouses(prev => [...prev, wh]);
    setNewWh({ name: '', prefix: '' });
  };

  const removeWarehouse = (id: string) => {
    setWarehouses(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Warehouse Scaling</h2>
        <p className="text-slate-500">Manage global locations and unique barcode prefixes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 sticky top-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New Hub
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Location Name</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. East Coast DC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold"
                    value={newWh.name}
                    onChange={e => setNewWh({...newWh, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Barcode Prefix ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    maxLength={3}
                    placeholder="WHE"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold"
                    value={newWh.prefix}
                    onChange={e => setNewWh({...newWh, prefix: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Unique 3-letter ID for stickers.</p>
              </div>

              <button 
                onClick={addWarehouse}
                disabled={!newWh.name || !newWh.prefix}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-100"
              >
                Provision Warehouse
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map(wh => (
            <div key={wh.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 border border-slate-100">
                  <WarehouseIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{wh.name}</h4>
                  <p className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest mt-0.5">Prefix: {wh.prefix}</p>
                </div>
              </div>
              <button 
                onClick={() => removeWarehouse(wh.id)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WarehouseManager;
