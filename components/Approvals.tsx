import React, { useState } from 'react';
import { Transaction, Item, UserRole, Warehouse } from '../types';
import { CheckCircle2, XCircle, Clock, ArrowRightLeft, User, Calendar, MapPin, ArrowRight, AlertTriangle, MessageSquare, Info, ShieldCheck } from 'lucide-react';

interface ApprovalsProps {
  transactions: Transaction[];
  items: Item[];
  warehouses: Warehouse[];
  onApprove: (txId: string) => void;
  onReject: (txId: string, reason: string) => void;
  role: UserRole;
}

type SuccessAlert = { message: string; sub: string } | null;

const Approvals: React.FC<ApprovalsProps> = ({ transactions, items, warehouses, onApprove, onReject, role }) => {
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [confirmRejectTx, setConfirmRejectTx] = useState<{ tx: Transaction; reason: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [successAlert, setSuccessAlert] = useState<SuccessAlert>(null);

  const pendingTxs = transactions.filter(t => t.status === 'PENDING');
  const pastTxs = transactions.filter(t => t.status !== 'PENDING');

  const getItemName = (id: string) => items.find(i => i.id === id)?.name || 'Unknown Item';
  const getWarehouseName = (id?: string) => warehouses.find(w => w.id === id)?.name || 'Unknown Hub';

  const showSuccess = (message: string, sub: string) => {
    setSuccessAlert({ message, sub });
    setTimeout(() => setSuccessAlert(null), 3500);
  };

  const handleApprove = (tx: Transaction) => {
    onApprove(tx.id);
    showSuccess(
      'Request Approved',
      `${getItemName(tx.itemId)} — ${tx.quantity} unit${tx.quantity !== 1 ? 's' : ''} processed successfully`
    );
  };

  const commonReasons = [
    "Insufficient Documentation",
    "Hub Capacity Reached",
    "Inventory Discrepancy",
    "Staff Authorization Expired",
    "Category Conflict"
  ];

  const handleReasonSubmit = () => {
    if (!rejectingTx) return;
    const finalReason = rejectionReason === 'Other' ? customReason : rejectionReason;
    if (!finalReason) return;
    setConfirmRejectTx({ tx: rejectingTx, reason: finalReason });
    setRejectingTx(null);
  };

  const handleFinalReject = () => {
    if (!confirmRejectTx) return;
    onReject(confirmRejectTx.tx.id, confirmRejectTx.reason);
    showSuccess(
      'Request Declined',
      `${getItemName(confirmRejectTx.tx.itemId)} — rejection recorded with audit trail`
    );
    setConfirmRejectTx(null);
    setRejectionReason('');
    setCustomReason('');
  };

  const handleCancelReject = () => {
    setRejectingTx(null);
    setRejectionReason('');
    setCustomReason('');
  };

  return (
    <div className="space-y-">

      {/* ── Success Toast ── */}
      <div
        className={`fixed top-5 right-5 z-[200] transition-all duration-500 ${
          successAlert ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white border border-blue-100 shadow-xl shadow-blue-100/60 rounded-2xl px-5 py-4 flex items-center gap-4 min-w-[320px]">
          <div className="p-2 bg-blue-500 rounded-xl shadow-md shadow-blue-200">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800">{successAlert?.message}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{successAlert?.sub}</p>
          </div>
          <div className="ml-auto w-1 h-10 rounded-full bg-blue-100 overflow-hidden">
            <div
              className="w-full bg-blue-500 rounded-full"
              style={{
                height: successAlert ? '0%' : '100%',
                transition: successAlert ? 'height 3.5s linear' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Gatekeeper Workflow</h2>
        <p className="text-slate-400">Stock updates require administrative approval</p>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-4">
        {/* ── Pending Requests ── */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Requests ({pendingTxs.length})
          </h3>
          {pendingTxs.length === 0 ? (
            <div className="bg-blue-50/40 border-2 border-dashed border-blue-100 rounded-2xl p-8 text-center">
              <p className="text-slate-400">All requests have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTxs.map(tx => {
                const isTransfer = tx.type === 'TRANSFER';
                const isStockOut = tx.type === 'STOCK_OUT';
                return (
                  <div key={tx.id} className="bg-white p-5 rounded-2xl shadow-sm shadow-blue-50 border border-blue-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter mb-2 inline-block ${
                          isTransfer ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-base font-bold text-slate-800">{getItemName(tx.itemId)}</h4>

                        {isTransfer ? (
                          <div className="flex items-center gap-2 mt-2 bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-blue-700 uppercase">From Hub</span>
                              <span className="text-[10px] font-bold text-slate-600 truncate">{getWarehouseName(tx.warehouseId)}</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-blue-500 mx-1" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black text-blue-700 uppercase">Target Hub</span>
                              <span className="text-[10px] font-bold text-blue-600 truncate">{getWarehouseName(tx.targetWarehouseId)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold mt-1 uppercase">
                            <MapPin className="w-3 h-3" /> Location: {getWarehouseName(tx.warehouseId)}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-slate-300 text-[10px] mt-3">
                          <User className="w-3 h-3" /> {tx.staffName}
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <Calendar className="w-3 h-3" /> {new Date(tx.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl border font-black text-xl ml-4
                        ${isTransfer
                          ? 'bg-blue-50 border-blue-100 text-blue-500'
                          : isStockOut
                          ? 'bg-rose-50 border-rose-100 text-rose-500'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-500'
                        }`}>
                        {tx.quantity}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(tx)}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-200" />
                        {isTransfer ? 'Confirm Relocation' : isStockOut ? 'Approve & Deduct' : 'Add to Inventory'}
                      </button>
                      <button
                        onClick={() => setRejectingTx(tx)}
                        className="px-4 py-3 border border-slate-100 bg-white rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all group active:scale-95"
                        title="Reject Request"
                      >
                        <XCircle className="w-5 h-5 text-slate-300 group-hover:text-rose-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── History Log ── */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest">History Log</h3>
          <div className="max-h-[60vh] overflow-y-auto bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm shadow-blue-50">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-blue-50/50 border-b border-blue-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Reference ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Item</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Process</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center">Qty</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/80">
                  {pastTxs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(tx => (
                    <tr key={tx.id} className="text-sm group hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 uppercase">{tx.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{getItemName(tx.itemId)}</p>
                        <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-2.5 h-2.5" /> {tx.staffName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-300" />
                          {tx.type.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-700">{tx.quantity}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            tx.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-rose-100 text-rose-600'
                          }`}>
                            {tx.status}
                          </span>
                          {tx.rejectionReason && (
                            <div className="flex items-center gap-1 mt-1 text-rose-400 font-medium text-[9px]">
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

      {/* ── Rejection Reason Modal ── */}
      {rejectingTx && (
        <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-800/60 backdrop-blur-sm" onClick={handleCancelReject} />
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-blue-100 relative overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-200">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Decline Request</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Audit trail justification required</p>
                </div>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Request Details</span>
                </div>
                <p className="text-xs font-bold text-slate-700">{getItemName(rejectingTx.itemId)}</p>
                <p className="text-[10px] text-slate-400 mt-1">
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
                            ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-400/10'
                            : 'bg-white border-slate-100 text-slate-500 hover:bg-blue-50 hover:border-blue-100'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                    <button
                      onClick={() => setRejectionReason('Other')}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                        rejectionReason === 'Other'
                          ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-400/10'
                          : 'bg-white border-slate-100 text-slate-500 hover:bg-blue-50 hover:border-blue-100'
                      }`}
                    >
                      Other / Custom Reason
                    </button>
                  </div>
                </div>

                {rejectionReason === 'Other' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-blue-300" />
                      <textarea
                        autoFocus
                        placeholder="Type detailed reason here..."
                        className="w-full bg-blue-50/40 border border-blue-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 focus:ring-4 focus:ring-blue-400/10 focus:border-blue-300 outline-none transition-all min-h-[100px]"
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCancelReject}
                  className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  disabled={!rejectionReason || (rejectionReason === 'Other' && !customReason)}
                  onClick={handleReasonSubmit}
                  className="flex-[2] bg-rose-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-rose-100 hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Final Confirmation Modal ── */}
      {confirmRejectTx && (
        <div className="fixed inset-0 z-[160] flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-800/70 backdrop-blur-sm" />
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl shadow-rose-100 relative overflow-hidden">
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="p-4 bg-rose-100 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Confirm Rejection</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">This action will be permanently recorded in the audit trail.</p>

              {/* Summary card */}
              <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</span>
                  <span className="text-[10px] font-bold text-slate-600">{getItemName(confirmRejectTx.tx.itemId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                  <span className="text-[10px] font-bold text-slate-600">{confirmRejectTx.tx.quantity} units</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Reason</span>
                  <span className="text-[10px] font-bold text-rose-600 text-right">{confirmRejectTx.reason}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmRejectTx(null);
                    setRejectionReason('');
                    setCustomReason('');
                  }}
                  className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-95"
                >
                  Go Back
                </button>
                <button
                  onClick={handleFinalReject}
                  className="flex-[2] bg-rose-600 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all"
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