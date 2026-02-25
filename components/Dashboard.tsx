import React, { useMemo, useState } from 'react';
import { Item, Warehouse, Transaction, ItemStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Package, AlertTriangle, DollarSign, Warehouse as WarehouseIcon, X, Eye, CheckCircle2, XCircle, ArrowRight, Clock, User, MapPin, MessageSquare, Info } from 'lucide-react';

interface DashboardProps {
  items: Item[];
  warehouses: Warehouse[];
  transactions: Transaction[];
  onApprove?: (txId: string) => void;
  onReject?: (txId: string, reason: string) => void;
  onViewAll?: () => void;

}

const REJECTION_REASONS = [
  'Insufficient Documentation',
  'Hub Capacity Reached',
  'Inventory Discrepancy',
  'Staff Authorization Expired',
  'Category Conflict',
  'Other / Custom Reason',
];

const Dashboard: React.FC<DashboardProps> = ({ items, warehouses, transactions, onApprove, onReject, onViewAll }) => {
  console.log("items", items.filter(i => i.status === ItemStatus.OLD_USED));  
  const [selectedWarehouse, setSelectedWarehouse] = useState<{ id: string; name: string; color: string } | null>(null);
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const getItemName = (id: string) => items.find(i => i.id === id)?.name ?? 'Unknown Item';
  const getWarehouseName = (id?: string) => warehouses.find(w => w.id === id)?.name ?? 'Unknown Hub';

  const handleFinalReject = () => {
    if (!rejectingTx || !onReject) return;
    const finalReason = rejectionReason === 'Other / Custom Reason' ? customReason : rejectionReason;
    if (!finalReason) return;
    onReject(rejectingTx.id, finalReason);
    setRejectingTx(null);
    setRejectionReason('');
    setCustomReason('');
  };
  const totalValue = useMemo(() => items.reduce((sum, item) => sum + (item.trueUnitCost * item.quantity), 0), [items]);
  const oldStockValue = useMemo(() => items.filter(i => i.status === ItemStatus.OLD_USED).reduce((sum, item) => sum + (item.trueUnitCost * item.quantity), 0), [items]);

  const LOW_STOCK_THRESHOLD = 20;
  const lowStockItems = useMemo(() => items.filter(i => i.quantity < LOW_STOCK_THRESHOLD), [items]);
  const pendingTxs = useMemo(() => transactions.filter(t => t.status === 'PENDING'), [transactions]);

  const warehouseStats = useMemo(() => warehouses.map(wh => {
    const whItems = items.filter(i => i.warehouseId === wh.id);
    const value = whItems.reduce((sum, i) => sum + (i.trueUnitCost * i.quantity), 0);
    const lowStock = whItems.filter(i => i.quantity < LOW_STOCK_THRESHOLD).length;
    return {
      id: wh.id,
      name: wh.name,
      shortName: wh.name.split(' ')[0],
      value,
      itemCount: whItems.length,
      lowStock,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
    };
  }), [warehouses, items, totalValue]);

  const statusStats = useMemo(() => [
    { name: 'Raw', value: items.filter(i => i.status === ItemStatus.RAW).length },
    { name: 'Finished', value: items.filter(i => i.status === ItemStatus.FINISHED).length },
    { name: 'Good', value: items.filter(i => i.status === ItemStatus.GOOD_AS_NEW).length },
    { name: 'Old', value: items.filter(i => i.status === ItemStatus.OLD_USED).length },
  ], [items]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
  const WH_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Dashboard Analytics</h2>
          <p className="text-xs md:text-sm text-slate-500">Live operational metrics</p>
        </div>
        {/* <button className="bg-white p-2 md:px-4 md:py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm">
          <TrendingUp className="w-4 h-4 inline md:mr-2" /> <span className="hidden md:inline">Growth</span>
        </button> */}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 my-4">
        <StatCard title="Total Value" 
          value={`₱ ${ totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="" icon={<DollarSign />} color="indigo" />
        <StatCard title="Aging" value={`₱${(oldStockValue/1000).toFixed(1)}k`} trend="" icon={<AlertTriangle />} color="rose" />
        <StatCard title="Low Stock" value={lowStockItems.length.toString()} trend="Reorder" icon={<AlertTriangle />} color="amber" />
        <StatCard title="For Approval" value={pendingTxs.length.toString()} trend={pendingTxs.length > 0 ? 'Action needed' : 'All clear'} icon={<Clock />} color={pendingTxs.length > 0 ? 'rose' : 'emerald'} />
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden my-4">
        <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pending Approvals</h3>
              <p className="text-[12px] text-slate-400 f">Requests awaiting your action</p>
            </div>
          </div>
          {pendingTxs.length > 5 && (
            <div className="px-5 md:px-6 py-1 border-t border-slate-100 bg-slate-50">
              <button
                onClick={onViewAll}
                className="w-full text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest transition-colors"
              >
                View all {pendingTxs.length} pending requests →
              </button>
            </div>
          )}
        </div>

        {pendingTxs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-300" />
            <p className="text-sm font-bold">All caught up — no pending requests</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {pendingTxs.slice(0, 5).map(tx => {
              const isTransfer = tx.type === 'TRANSFER';
              const isStockOut = tx.type === 'STOCK_OUT';
              const typeColors: Record<string, string> = {
                TRANSFER: 'bg-indigo-100 text-indigo-700',
                STOCK_OUT: 'bg-rose-100 text-rose-700',
                STOCK_IN: 'bg-emerald-100 text-emerald-700',
              };
              const qtyColors: Record<string, string> = {
                TRANSFER: 'bg-indigo-50 border-indigo-100 text-indigo-600',
                STOCK_OUT: 'bg-rose-50 border-rose-100 text-rose-600',
                STOCK_IN: 'bg-emerald-50 border-emerald-100 text-emerald-600',
              };
              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 md:px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  {/* Type badge */}
                  <div className='w-[80px]'>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider  ${typeColors[tx.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </div>
                 

                  {/* Item + location */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{getItemName(tx.itemId)}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isTransfer ? (
                        <>
                          <MapPin className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                          <span className="text-[12px] text-slate-500 truncate">{getWarehouseName(tx.warehouseId)}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                          <span className="text-[12px] text-indigo-500 font-bold truncate">{getWarehouseName(tx.targetWarehouseId)}</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                          <span className="text-[12px] text-slate-500 truncate">{getWarehouseName(tx.warehouseId)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Staff + date */}
                  <div className="hidden md:flex flex-col items-end shrink-0">
                    <span className="text-[14px] font-bold text-slate-500 flex items-center gap-1"><User className="w-3.5 h-3.5" />{tx.staffName}</span>
                    <span className="text-[13px] text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</span>
                  </div>

                  {/* Quantity pill */}
                  <div className={`px-3 py-1.5 rounded-xl border font-black text-sm shrink-0 ${qtyColors[tx.type] ?? 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    {tx.quantity}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onApprove?.(tx.id)}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                      title="Approve"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="hidden sm:inline">Approve</span>
                    </button>
                    <button
                      onClick={() => setRejectingTx(tx)}
                      className="flex items-center gap-1 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-500 text-[10px] font-black px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                      title="Reject"
                    >
                      <XCircle className="w-3 h-3" />
                      <span className="hidden sm:inline">Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Warehouse Inventory Value Breakdown */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 my-4">
        <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2 uppercase tracking-widest mb-4">
          <WarehouseIcon className="w-4 h-4 text-indigo-500" /> Inventory Value by Warehouse
        </h3>
        {/* <p className="text-[10px] text-slate-400 font-semibold mb-5 uppercase tracking-wider">
          Total: ₱{totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {warehouseStats.map((wh, i) => (
            <div key={wh.id} className="relative bg-slate-50 rounded-xl p-4 overflow-hidden border border-slate-100">
              {/* Background fill bar showing % share */}
              <div
                className="absolute inset-0 opacity-[0.07] rounded-xl"
                style={{ backgroundColor: WH_COLORS[i % WH_COLORS.length] }}
              />
              <div
                className="absolute left-0 top-0 bottom-0 rounded-l-xl opacity-10"
                style={{
                  width: `${wh.percentage}%`,
                  backgroundColor: WH_COLORS[i % WH_COLORS.length],
                  transition: 'width 0.6s ease',
                }}
              />

              <div className="relative z-10 flex items-start justify-between mb-3">
                {/* <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: WH_COLORS[i % WH_COLORS.length] }}
                >
                  <WarehouseIcon className="w-3.5 h-3.5" />
                </div> */}
                <p className="text-[12px] font-black text-slate-700 uppercase tracking-widest mb-0.5 truncate">{wh.name}</p>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${WH_COLORS[i % WH_COLORS.length]}18`,
                      color: WH_COLORS[i % WH_COLORS.length],
                    }}
                  >
                    {wh.percentage.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => setSelectedWarehouse({ id: wh.id, name: wh.name, color: WH_COLORS[i % WH_COLORS.length] })}
                    className="flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-colors shadow-sm"
                  >
                    <Eye className="w-2.5 h-2.5" /> View
                  </button>
                </div>
              </div>

              <div className="relative z-10">
                {/* <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{wh.name}</p> */}
                <p className="text-lg font-black text-slate-900">
                  ₱{wh.value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[12px] text-slate-400 font-bold">{wh.itemCount} SKU{wh.itemCount !== 1 ? 's' : ''}</p>
                  {wh.lowStock > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {wh.lowStock} low
                    </span>
                  )}
                  {wh.lowStock === 0 && (
                    <span className="text-[10px] font-black text-emerald-500">Stocked</span>
                  )}
                </div>
              </div>

              {/* Thin colored bottom border accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl"
                style={{ backgroundColor: WH_COLORS[i % WH_COLORS.length] }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <WarehouseIcon className="w-4 h-4 text-indigo-500" /> Hub Distribution
          </h3>
          <div className="h-[250px] md:h-[300px]" style={{ minHeight: 0 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={warehouseStats.map(w => ({ name: w.shortName, value: w.value }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24}>
                  {warehouseStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={WH_COLORS[index % WH_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Item Type Distribution Bar Chart */}
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <Package className="w-4 h-4 text-indigo-500" /> Item Types
          </h3>
          <div className="h-[250px] md:h-[300px]" style={{ minHeight: 0 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusStats} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} allowDecimals={false} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} width={52} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22} label={{ position: 'right', fontSize: 10, fontWeight: 900, fill: '#64748b' }}>
                  {statusStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {statusStats.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: COLORS[i]}} />
                <span className="text-[10px] font-bold text-slate-600">{s.name}</span>
                <span className="text-[10px] font-black text-slate-900 ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <Package className="w-4 h-4 text-indigo-500" /> Health
          </h3>
          <div className="h-[200px] relative" style={{ minHeight: 0 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusStats} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {statusStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-xl font-black text-slate-800">{items.length}</span>
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">SKUs</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {statusStats.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                <span className="text-[10px] font-bold text-slate-600">{s.name}</span>
                <span className="text-[10px] font-black text-slate-900 ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectingTx && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={() => { setRejectingTx(null); setRejectionReason(''); setCustomReason(''); }}>
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-7">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-xl shadow-rose-200">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Decline Request</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Audit trail justification required</p>
                </div>
              </div>

              {/* Request detail */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Request Details</span>
                </div>
                <p className="text-xs font-black text-slate-800">{getItemName(rejectingTx.itemId)}</p>
                <p className="text-[9px] text-slate-500 mt-0.5 font-semibold">
                  {rejectingTx.type.replace('_', ' ')} • {rejectingTx.quantity} units • {getWarehouseName(rejectingTx.warehouseId)}
                </p>
              </div>

              {/* Reason selection */}
              <div className="space-y-2 mb-5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Reason</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {REJECTION_REASONS.map(reason => (
                    <button
                      key={reason}
                      onClick={() => { setRejectionReason(reason); setCustomReason(''); }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        rejectionReason === reason
                          ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/10'
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {rejectionReason === 'Other / Custom Reason' && (
                <div className="mb-5 relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    autoFocus
                    placeholder="Type detailed reason here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all min-h-[80px]"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectingTx(null); setRejectionReason(''); setCustomReason(''); }}
                  className="flex-1 py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  disabled={!rejectionReason || (rejectionReason === 'Other / Custom Reason' && !customReason)}
                  onClick={handleFinalReject}
                  className="flex-[2] bg-rose-600 text-white py-3.5 rounded-2xl font-black text-sm shadow-xl hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-40"
                >
                  Commit Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Items Dialog */}
      {selectedWarehouse && (() => {
        const whItems = items.filter(i => i.warehouseId === selectedWarehouse.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedWarehouse(null)}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: selectedWarehouse.color }}>
                    <WarehouseIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{selectedWarehouse.name}</h3>
                    <p className="text-[12px] text-slate-400 font-semibold uppercase tracking-widest">{whItems.length} item{whItems.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWarehouse(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-y-auto flex-1">
                {whItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Package className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-bold">No items in this warehouse</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3">Item</th>
                        <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-3">Status</th>
                        <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-3 text-right">Qty</th>
                        <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {whItems.map(item => {
                        const isLow = item.quantity < LOW_STOCK_THRESHOLD;
                        const statusColors: Record<string, string> = {
                          [ItemStatus.RAW]: 'bg-indigo-50 text-indigo-600',
                          [ItemStatus.FINISHED]: 'bg-emerald-50 text-emerald-600',
                          [ItemStatus.GOOD_AS_NEW]: 'bg-amber-50 text-amber-600',
                          [ItemStatus.OLD_USED]: 'bg-rose-50 text-rose-600',
                        };
                        const statusLabels: Record<string, string> = {
                          [ItemStatus.RAW]: 'Raw',
                          [ItemStatus.FINISHED]: 'Finished',
                          [ItemStatus.GOOD_AS_NEW]: 'Good',
                          [ItemStatus.OLD_USED]: 'Old',
                        };
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-sm font-black text-slate-800">{item.name}</p>
                              <p className="text-[11px] text-slate-400 font-semibold">₱{item.trueUnitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / unit</p>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${statusColors[item.status] ?? 'bg-slate-100 text-slate-500'}`}>
                                {statusLabels[item.status] ?? item.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className={`text-sm font-black ${isLow ? 'text-amber-500' : 'text-slate-800'}`}>
                                {item.quantity}
                              </span>
                              {isLow && <AlertTriangle className="w-3 h-3 text-amber-400 inline ml-1" />}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className="text-sm font-black text-slate-800">
                                ₱{(item.trueUnitCost * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer total */}
              <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50">
                <span className="text-[12px] text-slate-400 font-bold uppercase tracking-widest">Total Value</span>
                <span className="text-sm font-black text-slate-900">
                  ₱{whItems.reduce((s, i) => s + i.trueUnitCost * i.quantity, 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const StatCard = ({ title, value, trend, icon, color }: any) => {
  const colors: any = { indigo: 'bg-indigo-50 text-indigo-600', rose: 'bg-rose-50 text-rose-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center mb-2">
        <div className={`w-8 h-8 rounded-xl ${colors[color]} flex items-center justify-center transition-colors duration-300`}>
          {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </div>
        <p className="px-2 text-[12px] font-black text-slate-500 uppercase tracking-widest mb-0.5 transition-colors duration-300">{title}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg md:text-xl font-black text-slate-900 transition-colors duration-300">{value}</span>
        <span className="text-[11px] font-black text-emerald-500 transition-colors duration-300">{trend}</span>
      </div>
    </div>
  );
};

export default Dashboard;