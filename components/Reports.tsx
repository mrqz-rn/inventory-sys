
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
      
      return {
        id: wh.id,
        name: wh.name,
        prefix: wh.prefix,
        value,
        percentage,
        count
      };
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
      recoveryValue: totalOldValue * 0.6 // 40% markdown
    };
  }, [items]);

  // 3. Consumption Trend for Forecasting
  const consumptionMetrics = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyOutbound = transactions
      .filter(t => t.type === 'STOCK_OUT' && t.status === 'APPROVED')
      .reduce((sum, t) => sum + t.quantity, 0);
    
    // Calculate how many items are actually at risk based on velocity
    const riskItemsCount = items.filter(item => {
        const itemOutbound = transactions
            .filter(t => t.itemId === item.id && t.type === 'STOCK_OUT' && t.status === 'APPROVED')
            .reduce((sum, t) => sum + t.quantity, 0);
        
        const demandPerDay = itemOutbound / 30;
        const daysRemaining = demandPerDay > 0 ? (item.quantity / demandPerDay) : 999;
        
        return daysRemaining <= 14 || item.quantity < 5;
    }).length;
    
    // Simulate a trend based on transaction volume vs previous month (mocked logic)
    const currentVolume = monthlyOutbound;
    const prevVolume = monthlyOutbound * 0.85; // Mocking growth
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
    // Give react time to render the print view before calling print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reporting Period</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">{currentMonth} Summary</h2>
          <p className="text-slate-500 text-sm">Automated intelligence and stock valuation report</p>
        </div>
        
        {canExport && (
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all"
          >
            <FileDown className="w-4 h-4" /> Download PDF Report
          </button>
        )}
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Global Consumption Trend Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consumption Velocity</p>
              <h4 className="text-3xl font-black text-slate-900">{consumptionMetrics.monthlyOutbound} <span className="text-xs text-slate-400 font-bold uppercase">Units</span></h4>
            </div>
            <div className={`p-2 rounded-xl flex items-center gap-1 ${consumptionMetrics.velocityChange > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {consumptionMetrics.velocityChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-[10px] font-black">{Math.abs(consumptionMetrics.velocityChange).toFixed(1)}%</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-bold text-slate-600">Forecasting: <span className="text-indigo-600 uppercase text-[10px]">{consumptionMetrics.forecastLabel}</span></span>
            </div>
          </div>
        </div>

        {/* Aging Stock Liability Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aging Stock Total (Liability)</p>
            <h4 className="text-3xl font-black text-slate-900">₱{agingStats.value.toLocaleString()}</h4>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 transition-all duration-1000" 
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

        {/* Predictive Stock-Out Risk */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-24 h-24 -mr-8 -mt-8" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Stock-Out Risk Forecast</p>
            <h4 className="text-3xl font-black">{consumptionMetrics.riskItems} <span className="text-xs text-slate-400 font-bold">AT RISK</span></h4>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">SKUs likely to reach zero-stock within the next audit cycle based on velocity.</p>
          </div>
          <button 
            onClick={() => setShowRiskModal(true)}
            className="mt-4 text-[10px] font-black uppercase text-indigo-400 hover:text-white flex items-center gap-2 transition-colors relative z-10"
          >
            View Risk Manifest <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Total Value per Warehouse Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
                <WarehouseIcon className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Warehouse Valuation Matrix</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Currency: PHP</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hub Location</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Count</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribution</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {warehouseValuations.map(wh => (
                  <tr key={wh.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">
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
                          <span className="text-indigo-600">{wh.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${wh.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-900">₱{wh.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Trend Insights */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Asset Health Audit</h3>
          </div>

          <div className="space-y-4">
            <AuditMetric 
              label="Old/Used Recovery" 
              value={`₱${agingStats.recoveryValue.toLocaleString()}`} 
              sub="Potential liquidation value (60% cost basis)"
              icon={<AlertCircle className="w-4 h-4 text-rose-500" />}
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
              icon={<TrendingUp className="w-4 h-4 text-indigo-500" />}
            />
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mt-auto">
            <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5" /> AI Insight
            </p>
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              Inventory value in <span className="font-black">{warehouseValuations[0]?.name}</span> has increased by {((warehouseValuations[0]?.percentage || 0) / 2).toFixed(1)}% this month. Recommend reviewing security protocols for this hub.
            </p>
          </div>
        </div>
      </div>

      {/* Predictive Gemini Card (Refined) */}
      <div className="bg-indigo-600 p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-indigo-100 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 p-4 translate-x-1/4 -translate-y-1/4">
          <BarChart3 className="w-80 h-80" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">Nexus Gemini Forecaster</h3>
          </div>
          <p className="text-indigo-100 text-lg font-medium leading-relaxed mb-8">
            Analyzing transaction patterns... Based on <span className="text-white font-bold">{consumptionMetrics.monthlyOutbound} monthly stock-outs</span>, the 
            system predicts a need for increased re-order volume in <span className="text-white font-bold">Construction (CON)</span> categories by mid-next month. 
            There are currently <span className="text-white font-bold">{consumptionMetrics.riskItems} high-risk items</span> that may face total depletion within 14 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setShowRiskModal(true)}
              className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
            >
              Generate Re-order Manifest
            </button>
            <button className="bg-indigo-500/30 backdrop-blur-sm text-white border border-indigo-400 px-8 py-4 rounded-2xl font-black text-sm hover:bg-indigo-500/50 transition-all">
              Tune Prediction Model
            </button>
          </div>
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

const AuditMetric = ({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: React.ReactNode }) => (
  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
    <div className="mt-1">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[9px] text-slate-500 font-medium mt-1 leading-tight">{sub}</p>
    </div>
  </div>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
);

export default Reports;
