
import React from 'react';
import { Item, Warehouse, Transaction, ItemStatus } from '../types';
import { Box, MapPin, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

interface ReportPrintViewProps {
  items: Item[];
  warehouses: Warehouse[];
  transactions: Transaction[];
  onClose: () => void;
}

const ReportPrintView: React.FC<ReportPrintViewProps> = ({ items, warehouses, transactions, onClose }) => {
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.trueUnitCost), 0);
  const oldStock = items.filter(i => i.status === ItemStatus.OLD_USED);
  const oldStockValue = oldStock.reduce((sum, i) => sum + (i.quantity * i.trueUnitCost), 0);
  
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Risk items logic (same as RiskManifest)
  const riskItems = items.map(item => {
    const itemOutbound = transactions
      .filter(t => t.itemId === item.id && t.type === 'STOCK_OUT' && t.status === 'APPROVED')
      .reduce((sum, t) => sum + t.quantity, 0);
    const demandPerDay = itemOutbound / 30;
    const daysRemaining = demandPerDay > 0 ? Math.floor(item.quantity / demandPerDay) : 999;
    return { ...item, daysRemaining };
  }).filter(i => i.daysRemaining <= 14 || i.quantity < 5);

  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto print-section text-black">
      <div className="max-w-[800px] mx-auto p-12 bg-white">
        {/* Report Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-black p-2 rounded-lg text-white">
                <Box className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-black uppercase">Nexus Warehouse Pro</h1>
            </div>
            <h2 className="text-xl font-bold text-black uppercase tracking-widest">Inventory Performance Report</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-black">{currentMonth}</p>
            <p className="text-xs font-bold text-black mt-1 uppercase">Generated: {new Date().toLocaleDateString()}</p>
            <p className="text-xs font-mono text-black mt-1 uppercase">REF: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="border-2 border-black p-6 rounded-xl">
            <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Total Net Assets</p>
            <p className="text-2xl font-black text-black">₱{totalValue.toLocaleString()}</p>
          </div>
          <div className="border-2 border-black p-6 rounded-xl">
            <p className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Aging Stock Value</p>
            <p className="text-2xl font-black text-black">₱{oldStockValue.toLocaleString()}</p>
          </div>
          <div className="border-2 border-black p-6 rounded-xl bg-black text-white">
            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Risk Count</p>
            <p className="text-2xl font-black">{riskItems.length} SKUs</p>
          </div>
        </div>

        {/* Warehouse Valuation Table */}
        <div className="mb-12">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b-2 border-black pb-2 flex items-center gap-2 text-black">
            <MapPin className="w-4 h-4" /> Hub Valuation Matrix
          </h3>
          <table className="w-full text-left border-collapse border border-black text-black">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-[10px] font-black uppercase border border-black text-black">Warehouse</th>
                <th className="p-4 text-[10px] font-black uppercase border border-black text-black">SKUs</th>
                <th className="p-4 text-[10px] font-black uppercase border border-black text-black">Quantity</th>
                <th className="p-4 text-[10px] font-black uppercase border border-black text-black text-right">Value (PHP)</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map(wh => {
                const whItems = items.filter(i => i.warehouseId === wh.id);
                const val = whItems.reduce((sum, i) => sum + (i.quantity * i.trueUnitCost), 0);
                const qty = whItems.reduce((sum, i) => sum + i.quantity, 0);
                return (
                  <tr key={wh.id}>
                    <td className="p-4 text-sm font-bold border border-black text-black">{wh.name}</td>
                    <td className="p-4 text-sm border border-black text-black">{whItems.length}</td>
                    <td className="p-4 text-sm border border-black text-black">{qty}</td>
                    <td className="p-4 text-sm font-black border border-black text-black text-right">₱{val.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Critical Depletion Risk Manifest */}
        <div className="mb-12">
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b-2 border-black pb-2 flex items-center gap-2 text-black">
            <AlertTriangle className="w-4 h-4" /> Critical Depletion Manifest
          </h3>
          <div className="space-y-3">
            {riskItems.slice(0, 10).map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 border border-black rounded-lg">
                <div>
                  <p className="text-sm font-black text-black">{item.name}</p>
                  <p className="text-[10px] font-mono text-black">{item.barcode}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-black uppercase tracking-tight">Est. {item.daysRemaining} Days Left</p>
                  <p className="text-[10px] font-bold text-black uppercase">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
            {riskItems.length > 10 && (
              <p className="text-center text-[10px] font-bold text-black mt-4 uppercase">
                ... and {riskItems.length - 10} more items. See digital manifest for full details.
              </p>
            )}
          </div>
        </div>

        {/* Audit Certification */}
        <div className="mt-20 pt-8 border-t border-black grid grid-cols-2 gap-20">
          <div className="space-y-4">
            <div className="h-px bg-black w-full mb-8"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black">Warehouse Manager Signature</p>
          </div>
          <div className="space-y-4">
             <div className="h-px bg-black w-full mb-8"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black">Chief Accountant Audit</p>
          </div>
        </div>

        {/* Page Footer */}
        <div className="mt-20 text-center no-print">
          <button 
            onClick={onClose}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPrintView;
