
import React from 'react';
import { Item, Transaction, Warehouse } from '../types';
import { X, AlertTriangle, ArrowRight, Package, TrendingDown, ChevronLeft, Zap, ShoppingCart, FileDown } from 'lucide-react';

interface RiskManifestModalProps {
  items: Item[];
  transactions: Transaction[];
  warehouses: Warehouse[];
  onClose: () => void;
}

const RiskManifestModal: React.FC<RiskManifestModalProps> = ({ items, transactions, warehouses, onClose }) => {
  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || 'N/A';

  const riskData = items.map(item => {
    // Calculate this specific item's outbound volume in the last 30 days
    const itemOutbound = transactions
      .filter(t => t.itemId === item.id && t.type === 'STOCK_OUT' && t.status === 'APPROVED')
      .reduce((sum, t) => sum + t.quantity, 0);

    // Heuristic: If we sell X per month, and have < X/2, we are at risk (less than 15 days supply)
    // Or if stock is just objectively low (e.g., < 10 units)
    const demandPerDay = itemOutbound / 30;
    const daysRemaining = demandPerDay > 0 ? Math.floor(item.quantity / demandPerDay) : 999;
    
    let riskLevel: 'CRITICAL' | 'WARNING' | 'STABLE' = 'STABLE';
    if (daysRemaining <= 7 || item.quantity < 5) riskLevel = 'CRITICAL';
    else if (daysRemaining <= 14 || item.quantity < 20) riskLevel = 'WARNING';

    return {
      ...item,
      monthlyDemand: itemOutbound,
      daysRemaining,
      riskLevel
    };
  }).filter(i => i.riskLevel !== 'STABLE').sort((a, b) => a.daysRemaining - b.daysRemaining);

  const handleExportCSV = () => {
    if (riskData.length === 0) return;

    const headers = ['Name', 'Barcode', 'Warehouse', 'Risk Level', 'Quantity', 'Monthly Demand', 'Days Remaining'];
    const rows = riskData.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.barcode,
      `"${getWarehouseName(item.warehouseId).replace(/"/g, '""')}"`,
      item.riskLevel,
      item.quantity,
      item.monthlyDemand,
      item.daysRemaining === 999 ? '30+' : item.daysRemaining
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nexus_Risk_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col md:items-center md:justify-center">
      <div className="hidden md:block absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex-1 md:flex-initial w-full md:max-w-4xl bg-white md:rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full duration-300">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="md:hidden p-2 -ml-2 text-slate-400">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="p-2.5 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Risk Manifest</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Depletion Forecast Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {riskData.length > 0 && (
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95"
              >
                <FileDown className="w-4 h-4" /> <span className="hidden sm:inline">Export List</span>
              </button>
            )}
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 gap-4">
            {riskData.length === 0 ? (
              <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Inventory Levels Stable</h3>
                <p className="text-sm text-slate-500 mt-2">No SKUs currently meet the critical depletion threshold.</p>
              </div>
            ) : (
              riskData.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white p-5 rounded-[2rem] border transition-all flex flex-col md:flex-row items-center gap-6 ${
                    item.riskLevel === 'CRITICAL' ? 'border-rose-200 shadow-lg shadow-rose-50' : 'border-amber-100'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    item.riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                  }`}>
                    <TrendingDown className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                      <h4 className="text-base font-black text-slate-900 truncate">{item.name}</h4>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                        item.riskLevel === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      {item.barcode} • {getWarehouseName(item.warehouseId)}
                    </p>
                  </div>

                  <div className="flex items-center gap-8 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Stock</p>
                      <p className="text-sm font-black text-slate-900">{item.quantity}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Velocity/Mo</p>
                      <p className="text-sm font-black text-slate-900">{item.monthlyDemand}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Est. Survival</p>
                      <p className={`text-sm font-black ${item.riskLevel === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {item.daysRemaining > 30 ? '30+ Days' : `${item.daysRemaining} Days`}
                      </p>
                    </div>
                  </div>

                  <button className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl">
                    <ShoppingCart className="w-4 h-4" /> Re-order
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Zap className="w-4 h-4" />
             </div>
             <p className="text-xs text-slate-500 font-medium">
                Predictions are based on <span className="font-black text-slate-900">{transactions.length} historical records</span>.
             </p>
          </div>
          <button onClick={onClose} className="w-full md:w-auto text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">
            Close Manifest Terminal
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskManifestModal;
