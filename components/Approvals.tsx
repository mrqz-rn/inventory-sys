
import React, { useState } from 'react';
import { Transaction, Item, UserRole, Warehouse } from '../types';
import { CheckCircle2, XCircle, Clock, ArrowRightLeft, User, Calendar, MapPin, ArrowRight, AlertTriangle, MessageSquare, Info } from 'lucide-react';

interface ApprovalsProps {
  transactions: Transaction[];
  items: Item[];
  warehouses: Warehouse[];
  onApprove: (txId: string) => void;
  onReject: (txId: string, reason: string) => void;
  role: UserRole;
}

const Approvals: React.FC<ApprovalsProps> = ({ transactions, items, warehouses, onApprove, onReject, role }) => {
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const pendingTxs = transactions.filter(t => t.status === 'PENDING');
  const pastTxs = transactions.filter(t => t.status !== 'PENDING');

  const getItemName = (id: string) => items.find(i => i.id === id)?.name || 'Unknown Item';
  const getWarehouseName = (id?: string) => warehouses.find(w => w.id === id)?.name || 'Unknown Hub';

  const commonReasons = [
    "Insufficient Documentation",
    "Hub Capacity Reached",
    "Inventory Discrepancy",
    "Staff Authorization Expired",
    "Category Conflict"
  ];

  const handleFinalReject = () => {
    if (!rejectingTx) return;
    const finalReason = rejectionReason === 'Other' ? customReason : rejectionReason;
    if (!finalReason) return;
    onReject(rejectingTx.id, finalReason);
    setRejectingTx(null);
    setRejectionReason('');
    setCustomReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Gatekeeper Workflow</h2>
        <p className="text-slate-500">Stock updates require administrative approval</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Requests ({pendingTxs.length})
          </h3>
          {pendingTxs.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-slate-400">All requests have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTxs.map(tx => {
                const isTransfer = tx.type === 'TRANSFER';
                const isStockOut = tx.type === 'STOCK_OUT';
                return (
                  <div key={tx.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter mb-2 inline-block ${isTransfer ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{getItemName(tx.itemId)}</h4>
                        
                        {isTransfer ? (
                          <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-400 uppercase">From Hub</span>
                               <span className="text-[10px] font-bold text-slate-700 truncate">{getWarehouseName(tx.warehouseId)}</span>
                             </div>
                             <ArrowRight className="w-3 h-3 text-slate-300 mx-1" />
                             <div className="flex flex-col">
                               <span className="text-[8px] font-black text-slate-400 uppercase">Target Hub</span>
                               <span className="text-[10px] font-bold text-indigo-600 truncate">{getWarehouseName(tx.targetWarehouseId)}</span>
                             </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mt-1 uppercase">
                            <MapPin className="w-3 h-3" /> Location: {getWarehouseName(tx.warehouseId)}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] mt-3">
                          <User className="w-3 h-3" /> {tx.staffName}
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <Calendar className="w-3 h-3" /> {new Date(tx.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl border font-black text-xl ml-4 
                        ${isTransfer ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : isStockOut ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {tx.quantity}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => onApprove(tx.id)}
                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {isTransfer ? 'Confirm Relocation' : ( isStockOut ? 'Approve & Deduct' : 'Add to Inventory' )}
                      </button>
                      <button 
                        onClick={() => setRejectingTx(tx)}
                        className="px-4 py-3 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all group active:scale-95"
                        title="Reject Request"
                      >
                        <XCircle className="w-5 h-5 text-slate-300 group-hover:text-rose-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">History Log</h3>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Process</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Qty</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pastTxs.sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map(tx => (
                    <tr key={tx.id} className="text-sm group">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 uppercase">{tx.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{getItemName(tx.itemId)}</p>
                        <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                           <User className="w-2.5 h-2.5" /> {tx.staffName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          {tx.type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900">{tx.quantity}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${tx.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {tx.status}
                          </span>
                          {tx.rejectionReason && (
                            <div className="flex items-center gap-1 mt-1 text-rose-600/60 font-medium text-[9px]">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{tx.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Rejection Reason Modal */}
      {rejectingTx && (
        <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setRejectingTx(null)} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-xl shadow-rose-200">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Decline Request</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Audit trail justification required</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                 <div className="flex items-center gap-2 mb-2">
                    <Info className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Details</span>
                 </div>
                 <p className="text-xs font-bold text-slate-700">{getItemName(rejectingTx.itemId)}</p>
                 <p className="text-[10px] text-slate-500 mt-1">
                   {rejectingTx.type.replace('_', ' ')} • {rejectingTx.quantity} Units • From {getWarehouseName(rejectingTx.warehouseId)}
                 </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Reason</label>
                  <div className="grid grid-cols-1 gap-2">
                    {commonReasons.map(reason => (
                      <button 
                        key={reason}
                        onClick={() => { setRejectionReason(reason); setCustomReason(''); }}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                          rejectionReason === reason 
                            ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/10' 
                            : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                    <button 
                      onClick={() => setRejectionReason('Other')}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                        rejectionReason === 'Other' 
                          ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/10' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Other / Custom Reason
                    </button>
                  </div>
                </div>

                {rejectionReason === 'Other' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <textarea 
                        autoFocus
                        placeholder="Type detailed reason here..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all min-h-[100px]"
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setRejectingTx(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  disabled={!rejectionReason || (rejectionReason === 'Other' && !customReason)}
                  onClick={handleFinalReject}
                  className="flex-[2] bg-rose-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  Commit Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
