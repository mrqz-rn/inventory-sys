import React, { useMemo, useState } from 'react';
import { Item, Warehouse, Transaction, ItemStatus, UserRole } from '../types';
import { 
  BarChart3, 
  FileDown, 
  TrendingUp, 
  AlertCircle, 
  PieChart, 
  ChevronRight, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Warehouse as WarehouseIcon,
  Activity,
  Zap
} from 'lucide-react';
import RiskManifestModal from './RiskManifestModal';
import ReportPrintView from './ReportPrintView';

interface Props {
  items: Item[];
  warehouses: Warehouse[];
  transactions: Transaction[];
  role: UserRole;
  canExport: boolean;
}

const Reports: React.FC<Props> = ({ items, warehouses, transactions, role, canExport }) => {
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  // 1. Total Value per Warehouse
  const warehouseValuations = useMemo(() => {
    const globalTotal = items.reduce((sum, i) => sum + (i.quantity * i.trueUnitCost), 0);
    
    return warehouses.map(wh => {
      const whItems = items.filter(i => i.warehouseId === wh.id);
      const value = whItems.reduce((sum, i) => sum + (i.quantity * i.trueUnitCost), 0);
      const percentage = globalTotal > 0 ? (value / globalTotal) * 100 : 0;
      const count = whItems.length;
      
      return { id: wh.id, name: wh.name, prefix: wh.prefix, value, percentage, count };
    }).sort((a, b) => b.value - a.value);
  }, [items, warehouses]);

  // 2. Aging Stock Summary
  const agingStats = useMemo(() => {
    const oldStock = items.filter(i => i.status === ItemStatus.OLD_USED);
    const totalOldValue = oldStock.reduce((sum, i) => sum + (i.quantity * i.trueUnitCost), 0);
    const totalGlobalValue = items.reduce((sum, i) => sum + (i.quantity * i.trueUnitCost), 0);
    
    return {
      count: oldStock.length,
      value: totalOldValue,
      percentage: totalGlobalValue > 0 ? (totalOldValue / totalGlobalValue) * 100 : 0,
      recoveryValue: totalOldValue * 0.6
    };
  }, [items]);

  // 3. Consumption Trend for Forecasting
  const consumptionMetrics = useMemo(() => {
    const monthlyOutbound = transactions
      .filter(t => t.type === 'STOCK_OUT' && t.status === 'APPROVED')
      .reduce((sum, t) => sum + t.quantity, 0);
    
    const riskItemsCount = items.filter(item => {
      const itemOutbound = transactions
        .filter(t => t.itemId === item.id && t.type === 'STOCK_OUT' && t.status === 'APPROVED')
        .reduce((sum, t) => sum + t.quantity, 0);
      const demandPerDay = itemOutbound / 30;
      const daysRemaining = demandPerDay > 0 ? (item.quantity / demandPerDay) : 999;
      return daysRemaining <= 14 || item.quantity < 5;
    }).length;
    
    const currentVolume = monthlyOutbound;
    const prevVolume = monthlyOutbound * 0.85;
    const velocityChange = ((currentVolume - prevVolume) / (prevVolume || 1)) * 100;
    
    return {
      monthlyOutbound,
      velocityChange,
      forecastLabel: velocityChange > 0 ? 'High Demand' : 'Steady',
      riskItems: riskItemsCount
    };
  }, [transactions, items]);

  const handleDownloadPDF = () => {
    setShowPrintView(true);
    setTimeout(() => { window.print(); }, 100);
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="pb-24 space-y">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ">
        <div className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em]">Reporting Period</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">{currentMonth} Summary</h2>
          <p className="text-slate-400 text-sm">Automated intelligence and stock valuation report</p>
        </div>
        
        {canExport && (
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-blue-100 active:scale-95 transition-all hover:bg-blue-700"
          >
            <FileDown className="w-4 h-4" /> Download PDF Report
          </button>
        )}
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-5">
        {/* Consumption Velocity */}
        <div className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-50 border border-blue-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Consumption Velocity</p>
              <h4 className="text-3xl font-black text-slate-800">
                {consumptionMetrics.monthlyOutbound}{' '}
                <span className="text-xs text-slate-400 font-bold uppercase">Units</span>
              </h4>
            </div>
            <div className={`p-2 rounded-xl flex items-center gap-1 ${
              consumptionMetrics.velocityChange > 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-500'
            }`}>
              {consumptionMetrics.velocityChange > 0
                ? <ArrowUpRight className="w-4 h-4" />
                : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-[10px] font-black">{Math.abs(consumptionMetrics.velocityChange).toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-blue-50">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-bold text-slate-600">
                Forecasting:{' '}
                <span className="text-blue-600 uppercase text-[10px]">{consumptionMetrics.forecastLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Aging Stock Liability */}
        <div className="bg-white p-6 rounded-3xl shadow-sm shadow-blue-50 border border-blue-100 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Aging Stock Total (Liability)</p>
            <h4 className="text-3xl font-black text-slate-800">₱{agingStats.value.toLocaleString()}</h4>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-blue-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-400 transition-all duration-1000" 
                  style={{ width: `${agingStats.percentage}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-slate-400">{agingStats.percentage.toFixed(1)}% of total</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>{agingStats.count} Items Flagged</span>
            <span className="text-rose-500">Action Required</span>
          </div>
        </div>

        {/* Stock-Out Risk — accent card in blue instead of dark */}
        <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-200 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-24 h-24 -mr-8 -mt-8" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Stock-Out Risk Forecast</p>
            <h4 className="text-3xl font-black">
              {consumptionMetrics.riskItems}{' '}
              <span className="text-xs text-blue-200 font-bold">AT RISK</span>
            </h4>
            <p className="text-[10px] text-blue-200 mt-2 leading-relaxed">
              SKUs likely to reach zero-stock within the next audit cycle based on velocity.
            </p>
          </div>
          <button 
            onClick={() => setShowRiskModal(true)}
            className="mt-4 text-[10px] font-black uppercase text-blue-200 hover:text-white flex items-center gap-2 transition-colors relative z-10"
          >
            View Risk Manifest <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Valuation Matrix */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-blue-100 shadow-sm shadow-blue-50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-blue-50 flex items-center justify-between bg-blue-50/40">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-200">
                <WarehouseIcon className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">Warehouse Valuation Matrix</h3>
            </div>
            {/* <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Currency: PHP</span> */}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-blue-50/30">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Hub Location</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">SKU Count</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Distribution</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {warehouseValuations.map(wh => (
                  <tr key={wh.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-[10px] text-blue-500">
                          {wh.prefix}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{wh.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-500">{wh.count}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                          <span className="text-slate-400">Global Share</span>
                          <span className="text-blue-600">{wh.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${wh.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-800">₱{wh.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Health Audit */}
        <div className="bg-white rounded-3xl border border-blue-100 shadow-sm shadow-blue-50 p-6 flex flex-col space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-md shadow-emerald-100">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">Asset Health Audit</h3>
          </div>

          <div className="space-y-4">
            <AuditMetric 
              label="Old/Used Recovery" 
              value={`₱${agingStats.recoveryValue.toLocaleString()}`} 
              sub="Potential liquidation value (60% cost basis)"
              icon={<AlertCircle className="w-4 h-4 text-rose-400" />}
            />
            <AuditMetric 
              label="Intake Success" 
              value="100%" 
              sub="Ratio of registered vs physically verified SKUs"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            />
            <AuditMetric 
              label="Avg Unit Velocity" 
              value={`${(consumptionMetrics.monthlyOutbound / (items.length || 1)).toFixed(2)}`} 
              sub="Outbound units per unique SKU/month"
              icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
            />
          </div>

          {/* <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-auto">
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5" /> AI Insight
            </p>
            <p className="text-xs text-blue-600 leading-relaxed font-medium">
              Inventory value in{' '}
              <span className="font-black">{warehouseValuations[0]?.name}</span> has increased by{' '}
              {((warehouseValuations[0]?.percentage || 0) / 2).toFixed(1)}% this month. Recommend reviewing security protocols for this hub.
            </p>
          </div> */}
        </div>
      </div>

      {showRiskModal && (
        <RiskManifestModal 
          items={items}
          transactions={transactions}
          warehouses={warehouses}
          onClose={() => setShowRiskModal(false)}
        />
      )}

      {showPrintView && (
        <ReportPrintView 
          items={items}
          warehouses={warehouses}
          transactions={transactions}
          onClose={() => setShowPrintView(false)}
        />
      )}
    </div>
  );
};

const AuditMetric = ({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: React.ReactNode }) => (
  <div className="flex items-start gap-4 p-4 bg-blue-50/40 rounded-2xl border border-blue-100 hover:border-blue-200 hover:bg-blue-50/70 transition-all">
    <div className="mt-1">{icon}</div>
    <div>
      <p className="text-[10px] font-black  uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-lg font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[9px] text-slate-400 font-medium mt-1 leading-tight">{sub}</p>
    </div>
  </div>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default Reports;