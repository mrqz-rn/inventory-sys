import React, { useEffect, useState } from 'react';
import { Category, UserRole } from '../types';
import { Plus, Trash2, Edit3, ChevronRight, Tags, Info, Save, X, AlertTriangle } from 'lucide-react';

interface CategoryManagementProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  role: UserRole;
}

// ── Reusable modal shell ──────────────────────────────────────────────────────
const Modal = ({
  open, onClose, children
}: {
  open: boolean; onClose: () => void; children: React.ReactNode;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [open]);

  if (!open && !visible) return null;

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-[200] flex items-end md:items-center md:justify-center transition-all duration-300 ${
        visible ? 'bg-stone-900/40 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none pointer-events-none'
      }`}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`relative w-full md:max-w-lg bg-stone-50 border border-stone-200 shadow-2xl rounded-t-[2rem] md:rounded-[2rem] transition-all duration-300 ease-out ${
          visible
            ? 'translate-y-0 opacity-100 md:scale-100'
            : 'translate-y-full opacity-0 md:translate-y-4 md:scale-[0.97]'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

// ── Confirm dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({
  open, message, onConfirm, onCancel
}: {
  open: boolean; message: string; onConfirm: () => void; onCancel: () => void;
}) => (
  <Modal open={open} onClose={onCancel}>
    <div className="p-8 flex flex-col items-center text-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
        <AlertTriangle size={22} className="text-rose-500" />
      </div>
      <div>
        <h3 className="text-base font-black text-stone-900 mb-1">Confirm Deletion</h3>
        <p className="text-sm text-stone-500 leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-rose-500 hover:bg-rose-600 shadow-md transition-all active:scale-95"
        >
          Delete
        </button>
      </div>
    </div>
  </Modal>
);

// ── Form dialog (add / edit) ──────────────────────────────────────────────────
interface FormState {
  name: string;
  code: string;
  parentId: string;
}

const CategoryFormDialog = ({
  open,
  onClose,
  onSave,
  initial,
  mainCategories,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormState) => void;
  initial: FormState;
  mainCategories: Category[];
  title: string;
}) => {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  // Reset form when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, JSON.stringify(initial)]);

  const set = (patch: Partial<FormState>) => {
    setForm(f => ({ ...f, ...patch }));
    const key = Object.keys(patch)[0] as keyof FormState;
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSave = () => {
    const errs: Partial<FormState> = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.code.trim()) errs.code = 'Code is required.';
    if (form.code.trim().length !== 3) errs.code = 'Code must be exactly 3 characters.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ ...form, code: form.code.toUpperCase().trim(), name: form.name.trim() });
  };

  const inputCls = (err?: string) =>
    'w-full bg-white border rounded-xl px-3.5 py-3 text-sm font-semibold text-stone-800 ' +
    'placeholder:text-stone-300 focus:outline-none focus:ring-2 transition-all ' +
    (err
      ? 'border-rose-300 focus:ring-rose-200/50 focus:border-rose-400'
      : 'border-stone-200 focus:ring-blue-400/40 focus:border-blue-400');

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="sticky top-0 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-[2rem]">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400">Taxonomy</p>
          <h2 className="text-lg font-black text-stone-900 leading-tight">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">Category Name</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Mechanical"
            value={form.name}
            onChange={e => set({ name: e.target.value })}
            className={inputCls(errors.name)}
          />
          {errors.name && (
            <p className="text-[10px] text-rose-500 font-semibold px-0.5">{errors.name}</p>
          )}
        </div>

        {/* Code */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
            Barcode Code <span className="normal-case tracking-normal text-stone-300 font-medium">(3 chars)</span>
          </label>
          <input
            type="text"
            maxLength={3}
            placeholder="MEC"
            value={form.code}
            onChange={e => set({ code: e.target.value.toUpperCase() })}
            className={`${inputCls(errors.code)} font-mono uppercase`}
          />
          {errors.code && (
            <p className="text-[10px] text-rose-500 font-semibold px-0.5">{errors.code}</p>
          )}
        </div>

        {/* Parent */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">Parent Category</label>
          <select
            value={form.parentId}
            onChange={e => set({ parentId: e.target.value })}
            className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all appearance-none cursor-pointer"
          >
            <option value="">(None — set as main)</option>
            {mainCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-stone-50/90 backdrop-blur-md border-t border-stone-200 px-6 py-4 flex gap-3 rounded-b-[2rem]">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 transition-all"
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black text-white bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Save size={14} /> Save Node
        </button>
      </div>
    </Modal>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const CategoryManagement: React.FC<CategoryManagementProps> = ({ categories, setCategories, role }) => {
  const mainCategories = categories.filter(c => !c.parentId);

  // Add dialog
  const [addOpen, setAddOpen]     = useState(false);
  const [addInitial, setAddInitial] = useState<FormState>({ name: '', code: '', parentId: '' });

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hasSubs: boolean } | null>(null);

  const handleAdd = (data: FormState) => {
    const cat: Category = {
      id: `cat-${Date.now()}`,
      name: data.name,
      code: data.code,
      parentId: data.parentId || undefined,
    };
    setCategories(prev => [...prev, cat]);
    setAddOpen(false);
  };

  const handleEdit = (data: FormState) => {
    if (!editTarget) return;
    setCategories(prev =>
      prev.map(c =>
        c.id === editTarget.id
          ? { ...c, name: data.name, code: data.code, parentId: data.parentId || undefined }
          : c
      )
    );
    setEditTarget(null);
  };

  const confirmDelete = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    const hasSubs = categories.some(c => c.parentId === id);
    setDeleteTarget({ id, name: cat.name, hasSubs });
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    setCategories(prev =>
      prev.filter(c => c.id !== deleteTarget.id && c.parentId !== deleteTarget.id)
    );
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900">Taxonomy Architect</h2>
          <p className="text-stone-500 text-sm">Manage nested categorization and barcode mapping</p>
        </div>
        <button
          onClick={() => { setAddInitial({ name: '', code: '', parentId: '' }); setAddOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          <Plus size={15} /> New Category
        </button>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 gap-4">
        {mainCategories.map(main => {
          const subs = categories.filter(c => c.parentId === main.id);
          return (
            <div key={main.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden group">

              {/* Main category row */}
              <div className="p-5 flex items-center justify-between bg-stone-50/60 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Tags size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900">{main.name}</h3>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                      {main.code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditTarget(main)}
                    className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit category"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => confirmDelete(main.id)}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Sub-categories */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400">
                    Sub-categories {subs.length > 0 && <span className="text-stone-300">· {subs.length}</span>}
                  </p>
                  <button
                    onClick={() => { setAddInitial({ name: '', code: '', parentId: main.id }); setAddOpen(true); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <Plus size={10} /> Add Sub
                  </button>
                </div>

                {subs.length === 0 ? (
                  <p className="text-[11px] text-stone-300 font-medium py-2 px-1">No sub-categories yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {subs.map(sub => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group/sub"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ChevronRight size={11} className="text-stone-300 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-700 truncate">{sub.name}</p>
                            <p className="text-[9px] font-mono text-stone-400 uppercase">{sub.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0 ml-2">
                          <button
                            onClick={() => setEditTarget(sub)}
                            className="p-1 text-stone-300 hover:text-blue-500 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => confirmDelete(sub.id)}
                            className="p-1 text-stone-300 hover:text-rose-500 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guidance note */}
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <Info size={14} className="text-blue-500" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm mb-1">System Guidance</h4>
          <p className="text-xs text-blue-700/70 leading-relaxed">
            Category codes are used to generate unique SKUs. A sub-category with code{' '}
            <span className="font-mono font-bold text-blue-800">COM</span> under a warehouse prefixed{' '}
            <span className="font-mono font-bold text-blue-800">WHA</span> produces barcodes like{' '}
            <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">WHA-COM-XXXX</span>.
            Ensure codes are distinct within their tier.
          </p>
        </div>
      </div>

      {/* ── Dialogs ── */}

      {/* Add form */}
      <CategoryFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
        initial={addInitial}
        mainCategories={mainCategories}
        title="New Category"
      />

      {/* Edit form */}
      <CategoryFormDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
        initial={editTarget
          ? { name: editTarget.name, code: editTarget.code, parentId: editTarget.parentId ?? '' }
          : { name: '', code: '', parentId: '' }
        }
        mainCategories={mainCategories.filter(c => c.id !== editTarget?.id)}
        title={`Edit — ${editTarget?.name ?? ''}`}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        message={
          deleteTarget?.hasSubs
            ? `Deleting "${deleteTarget.name}" will also remove all its sub-categories and may affect existing items. This cannot be undone.`
            : `"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`
        }
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};

export default CategoryManagement;