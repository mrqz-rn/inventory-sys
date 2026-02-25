
import React from 'react';
import { Item } from '../types';
import { X, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Package, Box, ChevronRight } from 'lucide-react';

interface ScanActionMenuProps {
  item: Item;
  onClose: () => void;
  onSelectAction: (action: 'IN' | 'OUT' | 'TRANSFER') => void;
}

const ScanActionMenu: React.FC<ScanActionMenuProps> = ({ item, onClose, onSelectAction }) => {
  return (
    <div className="fixed inset-0 z-[120] flex flex-col md:items-center md:justify-center">
      <div className="hidden md:block absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="flex-1 md:flex-initial w-full md:max-w-md bg-white md:rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-full md:zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Item Found</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select subsequent operation</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-10 flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 border border-slate-100">
                <Package className="w-6 h-6" />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-indigo-600 font-black">{item.barcode}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">{item.quantity} Units in Stock</span>
                </div>
             </div>
          </div>

          <div className="space-y-3">
            <ActionButton 
              icon={<ArrowUpCircle className="w-5 h-5 text-emerald-500" />} 
              label="Stock In" 
              description="Add incoming units to current hub"
              onClick={() => onSelectAction('IN')}
              color="hover:border-emerald-500/30"
            />
            <ActionButton 
              icon={<ArrowDownCircle className="w-5 h-5 text-rose-500" />} 
              label="Stock Out" 
              description="Request release or disposal of assets"
              onClick={() => onSelectAction('OUT')}
              color="hover:border-rose-500/30"
            />
            <ActionButton 
              icon={<ArrowRightLeft className="w-5 h-5 text-indigo-500" />} 
              label="Inter-Hub Transfer" 
              description="Relocate inventory to another hub"
              onClick={() => onSelectAction('TRANSFER')}
              color="hover:border-indigo-500/30"
            />
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={onClose}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Dismiss Scan Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, description, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`w-full p-4 rounded-2xl border-2 border-slate-50 bg-white flex items-center gap-4 transition-all active:scale-[0.98] group ${color}`}
  >
    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className="text-sm font-black text-slate-900">{label}</p>
      <p className="text-[10px] font-medium text-slate-400">{description}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
  </button>
);

export default ScanActionMenu;
