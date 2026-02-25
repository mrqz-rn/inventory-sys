
import React, { useState } from 'react';
import { Warehouse, Category, Item, ItemStatus, UserRole } from '../types';
import { FileUp, Plus, Trash2, Box, MapPin, Layers, Save, AlertCircle, CheckCircle2, Table, X } from 'lucide-react';

interface BulkUploadProps {
  warehouses: Warehouse[];
  categories: Category[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  addNotification: (title: string, message: string) => void;
  role: UserRole;
}

interface ManifestItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ warehouses, categories, setItems, addNotification, role }) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');
  const [manifest, setManifest] = useState<ManifestItem[]>([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addRow = () => {
    setManifest([...manifest, { id: Math.random().toString(), name: '', quantity: 1, price: 0 }]);
  };

  const removeRow = (id: string) => {
    if (manifest.length > 1) {
      setManifest(manifest.filter(item => item.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof ManifestItem, value: any) => {
    setManifest(manifest.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleBatchUpload = () => {
    const validItems = manifest.filter(item => item.name.trim() !== '' && item.quantity > 0);
    
    if (validItems.length === 0) {
      alert("Please enter at least one valid item name.");
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      const wh = warehouses.find(w => w.id === selectedWarehouseId);
      const cat = categories.find(c => c.id === selectedCategoryId);
      
      const newItems: Item[] = validItems.map(mItem => {
        const timestamp = Date.now() + Math.random();
        const id = `it-${Math.floor(timestamp)}`;
        return {
          id,
          name: mItem.name,
          warehouseId: selectedWarehouseId,
          categoryId: selectedCategoryId,
          status: ItemStatus.RAW,
          barcode: `${wh?.prefix || 'WH'}-${cat?.code || 'GEN'}-${id.replace('it-', '')}`,
          quantity: mItem.quantity,
          baseCost: mItem.price,
          freight: 0,
          duties: 0,
          taxes: 0,
          trueUnitCost: mItem.price, // Bulk defaults to base cost
          lastUpdated: new Date().toISOString()
        };
      });

      setItems(prev => [...newItems, ...prev]);
      addNotification('Batch Successful', `Provisioned ${newItems.length} new SKUs to ${wh?.name}`);
      
      // Reset
      setManifest([{ id: '1', name: '', quantity: 1, price: 0 }]);
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Batch Intake Terminal</h2>
          <p className="text-slate-500">Fast-track multi-SKU PHP provisioning with automatic barcode generation</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Manifest Session</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Destination Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Destination Context</p>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase ml-1">
                  <MapPin className="w-3 h-3" /> Target Warehouse
                </label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={selectedWarehouseId}
                  onChange={e => setSelectedWarehouseId(e.target.value)}
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.prefix})</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase ml-1">
                  <Layers className="w-3 h-3" /> Common Category
                </label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value)}
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

            <div className="pt-4 border-t border-slate-50">
              <div className="bg-indigo-50 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-indigo-600 mt-0.5" />
                <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                  Bulk items are registered with <b>Raw</b> status and 1:1 Base-to-Landed cost ratio (PHP) by default.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Pro Tip</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Use "Batch Intake" for new shipments. All prices are processed in <b>Philippine Peso (₱)</b>.
            </p>
          </div>
        </div>

        {/* Manifest Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
                  <Table className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Item Manifest (PHP)</h3>
              </div>
              <button 
                onClick={addRow}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-3 h-3" /> Add Row
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-3">
                {manifest.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-center group animate-in slide-in-from-right-4 duration-300">
                    <div className="col-span-1 text-[10px] font-black text-slate-300 text-center">
                      #{index + 1}
                    </div>
                    <div className="col-span-5 relative">
                      <input 
                        type="text" 
                        placeholder="Item Name (e.g. Copper Pipe 2m)" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 font-bold"
                        value={item.name}
                        onChange={e => updateRow(item.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 relative">
                       <input 
                        type="number" 
                        placeholder="Qty" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-center text-slate-900 font-bold"
                        value={item.quantity}
                        onChange={e => updateRow(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3 relative">
                       <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">₱</span>
                        <input 
                          type="number" 
                          placeholder="Price" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 font-bold"
                          value={item.price}
                          onChange={e => updateRow(item.id, 'price', parseFloat(e.target.value) || 0)}
                        />
                       </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button 
                        onClick={() => removeRow(item.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={addRow}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:border-indigo-200 hover:text-indigo-400 transition-all group"
              >
                <Plus className="w-4 h-4 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                Append New Row
              </button>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Manifest Value (PHP)</p>
                <p className="text-2xl font-black text-slate-900">
                  ₱{manifest.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={handleBatchUpload}
                disabled={isProcessing}
                className="w-full md:w-auto bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 text-indigo-400" /> Commit Manifest to Registry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
