import React, { useState, useEffect } from 'react';
import { Item, Category, Warehouse, ItemStatus, UserRole, Permission } from '../types';
import { Search, Filter, Plus, Minus, Info, Tag, Layers, ChevronRight, Box, Trash2, FileDown, Eye, Edit3, ArrowRightLeft, Check, ChevronLeft, ChevronRight as ChevronRightIcon, Printer, Scan, List } from 'lucide-react';
import AddItemModal from './AddItemModal';
import ItemDetailsModal from './ItemDetailsModal';
import EditItemModal from './EditItemModal';
import StockActionModal from './StockActionModal';
import TransferItemModal from './TransferItemModal';
import BulkTransferModal from './BulkTransferModal';
import BarcodeLabelModal from './BarcodeLabelModal';

interface InventoryProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  categories: Category[];
  warehouses: Warehouse[];
  onStockIn: (item: Item, qty: number) => void;
  onStockOut: (item: Item, qty: number) => void;
  onTransfer: (item: Item, targetWhId: string, qty: number) => void;
  role: UserRole;
  permissions: Permission[];
}

const Inventory: React.FC<InventoryProps> = ({ items, setItems, categories, warehouses, onStockIn, onStockOut, onTransfer, role, permissions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForView, setSelectedItemForView] = useState<Item | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [itemToTransfer, setItemToTransfer] = useState<Item | null>(null);
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  const [itemsToPrint, setItemsToPrint] = useState<Item[] | null>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isShowingAll, setIsShowingAll] = useState(false);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const canAction = (action: 'update' | 'delete' | 'export') => 
    permissions.some(p => p.moduleId === 'inventory' && p.actions.includes(action));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Pagination
  const effectiveItemsPerPage = isShowingAll ? filteredItems.length : itemsPerPage;
  const indexOfLastItem = currentPage * effectiveItemsPerPage;
  const indexOfFirstItem = indexOfLastItem - effectiveItemsPerPage;
  const currentItems = isShowingAll ? filteredItems : filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = isShowingAll ? 1 : Math.ceil(filteredItems.length / itemsPerPage);

  const [adjustmentState, setAdjustmentState] = useState<{
    item: Item | null,
    type: 'IN' | 'OUT' | null
  }>({ item: null, type: null });

  const getCategoryName = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return 'N/A';
    const parent = categories.find(p => p.id === cat.parentId);
    return parent ? `${parent.name} / ${cat.name}` : cat.name;
  };

  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || 'N/A';

  const statusColors = {
    [ItemStatus.RAW]: 'bg-slate-100 text-slate-700',
    [ItemStatus.FINISHED]: 'bg-indigo-100 text-indigo-700',
    [ItemStatus.GOOD_AS_NEW]: 'bg-emerald-100 text-emerald-700',
    [ItemStatus.OLD_USED]: 'bg-amber-100 text-amber-700 ring-1 ring-amber-500/20',
  };

  const deleteItem = (id: string) => {
    if (confirm('Permanently delete SKU?')) {
      setItems(prev => prev.filter(i => i.id !== id));
      const nextSelected = new Set(selectedIds);
      nextSelected.delete(id);
      setSelectedIds(nextSelected);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.size} selected items?`)) {
      setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentItems.length && currentItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map(i => i.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const nextSelected = new Set(selectedIds);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setSelectedIds(nextSelected);
  };

  const handleUpdateItem = (updatedItem: Item) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setItemToEdit(null);
  };

  const handleAdjustStock = (qty: number) => {
    if (!adjustmentState.item || !adjustmentState.type) return;
    if (adjustmentState.type === 'OUT') {
      onStockOut(adjustmentState.item, qty);
    } else {
      onStockIn(adjustmentState.item, qty);
    }
    setAdjustmentState({ item: null, type: null });
  };

  const handleConfirmTransfer = (targetWhId: string, qty: number) => {
    if (itemToTransfer) {
      onTransfer(itemToTransfer, targetWhId, qty);
      setItemToTransfer(null);
    }
  };

  const handleBulkRelocate = (targetWhId: string) => {
    const itemsToMove = items.filter(i => selectedIds.has(i.id));
    itemsToMove.forEach(item => {
      onTransfer(item, targetWhId, item.quantity);
    });
    setIsBulkTransferOpen(false);
    setSelectedIds(new Set());
  };

  const handleBulkPrint = () => {
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    setItemsToPrint(selectedItems);
  };

  const handleShowAll = () => {
    setIsShowingAll(!isShowingAll);
    setCurrentPage(1);
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Inventory</h2>
          <p className="text-xs md:text-sm text-slate-500">Live tracking and stock management</p>
        </div>
        <div className="flex gap-2">
          {canAction('export') && (
            <button className="hidden md:flex bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 items-center gap-2">
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          )}
          {canAction('update') && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 text-white p-2.5 md:px-5 md:py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5 md:w-4 md:h-4" /> 
              <span className="hidden md:inline">Add New SKU</span>
            </button>
          )}
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 my-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or barcode..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-900 font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}
          >
            All
          </button>
          {categories.filter(c => !c.parentId).map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 my-4 overflow-hidden">

        {/*
          SCROLLABLE TABLE BODY
          ─────────────────────────────────────────────────────────────────────
          Strategy: wrap the entire <table> in an overflow-x-auto + overflow-y-auto
          div with a fixed max-height. The <thead> uses `sticky top-0 z-10` so it
          stays visible as the tbody scrolls. The pagination bar lives OUTSIDE this
          scroll container so it always anchors to the bottom of the card.
        */}
        <div
          className="overflow-x-auto overflow-y-auto"
          style={{ maxHeight: '62vh' }}
        >
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 w-10">
                  <div 
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                      selectedIds.size > 0 && selectedIds.size === currentItems.length 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'border-slate-300 bg-white hover:border-indigo-400'
                    }`}
                  >
                    {selectedIds.size > 0 && selectedIds.size === currentItems.length && <Check className="w-3 h-3 text-white" />}
                    {selectedIds.size > 0 && selectedIds.size < currentItems.length && <div className="w-2.5 h-0.5 bg-indigo-600 rounded-full" />}
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Item</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentItems.map(item => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.has(item.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div 
                      onClick={() => toggleSelectRow(item.id)}
                      className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                        selectedIds.has(item.id) 
                          ? 'bg-indigo-600 border-indigo-600' 
                          : 'border-slate-300 bg-white hover:border-indigo-400'
                      }`}
                    >
                      {selectedIds.has(item.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{item.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{item.barcode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[item.status]}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{getCategoryName(item.categoryId)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{getWarehouseName(item.warehouseId)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{item.quantity} units</span>
                      <span className="text-[10px] text-slate-400 font-medium">₱{(item.quantity * item.trueUnitCost).toLocaleString()} total</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedItemForView(item)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canAction('update') && (
                        <>
                          <button 
                            onClick={() => setItemToEdit(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit SKU"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setItemsToPrint([item])}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Print Label"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setItemToTransfer(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Transfer Hub"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setAdjustmentState({ item, type: 'IN' })}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Stock In"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setAdjustmentState({ item, type: 'OUT' })}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Stock Out"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {/* {canAction('delete') && (
                        <button 
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete SKU"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )} */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI */}
        <div className="px-6 py-4 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-6">
            <p className="text-xs font-bold text-slate-500">
              Showing <span className="text-slate-900">{isShowingAll ? 1 : indexOfFirstItem + 1}</span> to <span className="text-slate-900">{isShowingAll ? filteredItems.length : Math.min(indexOfLastItem, filteredItems.length)}</span> of <span className="text-slate-900">{filteredItems.length}</span> SKUs
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
                <select 
                  disabled={isShowingAll}
                  className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer disabled:opacity-30"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <button 
                onClick={handleShowAll}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  isShowingAll 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                {isShowingAll ? 'Paginate' : 'Show All'}
              </button>
            </div>
          </div>
          
          {!isShowingAll && (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {(() => {
                const pages: (number | '...')[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  let start = Math.max(2, currentPage - 1);
                  let end = Math.min(totalPages - 1, currentPage + 1);
                  if (currentPage <= 3) { start = 2; end = 4; }
                  if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
                  pages.push(1);
                  if (start > 2) pages.push('...');
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (end < totalPages - 1) pages.push('...');
                  pages.push(totalPages);
                }
                return pages.map((page, i) =>
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 font-black">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                          : 'text-slate-500 hover:bg-white border border-transparent hover:border-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  )
                );
              })()}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {currentItems.map(item => (
          <div key={item.id} className={`bg-white p-4 rounded-2xl border transition-all ${selectedIds.has(item.id) ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-start">
                <div 
                  onClick={() => toggleSelectRow(item.id)}
                  className={`w-5 h-5 mt-1 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                    selectedIds.has(item.id) 
                      ? 'bg-indigo-600 border-indigo-600' 
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {selectedIds.has(item.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <div onClick={() => setSelectedItemForView(item)}>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">
                      {item.barcode}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${statusColors[item.status]}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900">{item.quantity}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Units</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter truncate">{getCategoryName(item.categoryId)}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedItemForView(item)}
                  className="bg-slate-50 text-slate-400 p-2 rounded-xl active:bg-slate-100"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canAction('update') && (
                  <>
                    <button 
                      onClick={() => setItemToEdit(item)}
                      className="bg-slate-50 text-slate-400 p-2 rounded-xl active:bg-slate-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setItemsToPrint([item])}
                      className="bg-slate-50 text-slate-400 p-2 rounded-xl active:bg-slate-100"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setItemToTransfer(item)}
                      className="bg-slate-50 text-slate-400 p-2 rounded-xl active:bg-slate-100"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setAdjustmentState({ item, type: 'IN' })}
                      className="bg-emerald-50 text-emerald-600 p-2 rounded-xl active:bg-emerald-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setAdjustmentState({ item, type: 'OUT' })}
                      className="bg-rose-50 text-rose-500 p-2 rounded-xl active:bg-rose-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </>
                )}
                {canAction('delete') && (
                   <button 
                    onClick={() => deleteItem(item.id)}
                    className="bg-rose-50 text-rose-500 p-2 rounded-xl active:bg-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredItems.length > 5 && (
           <button 
            onClick={handleShowAll}
            className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50"
           >
             {isShowingAll ? 'Show Less' : `Show All ${filteredItems.length} Items`}
           </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Assets</span>
              <span className="text-sm font-black">{selectedIds.size} SKUs</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex gap-2">
              <button 
                onClick={handleBulkPrint}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
              >
                <Printer className="w-4 h-4" /> Print Labels
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              <button 
                onClick={() => setIsBulkTransferOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all"
              >
                <ArrowRightLeft className="w-4 h-4" /> Relocate
              </button>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <AddItemModal 
          onClose={() => setIsAddModalOpen(false)}
          setItems={setItems}
          warehouses={warehouses}
          categories={categories}
        />
      )}

      {selectedItemForView && (
        <ItemDetailsModal
          item={selectedItemForView}
          onClose={() => setSelectedItemForView(null)}
          warehouse={warehouses.find(w => w.id === selectedItemForView.warehouseId)}
          category={categories.find(c => c.id === selectedItemForView.categoryId)}
          allCategories={categories}
        />
      )}

      {itemToEdit && (
        <EditItemModal
          item={itemToEdit}
          onClose={() => setItemToEdit(null)}
          onSave={handleUpdateItem}
          warehouses={warehouses}
          categories={categories}
        />
      )}

      {itemToTransfer && (
        <TransferItemModal
          item={itemToTransfer}
          warehouses={warehouses}
          onClose={() => setItemToTransfer(null)}
          onConfirm={handleConfirmTransfer}
        />
      )}

      {isBulkTransferOpen && (
        <BulkTransferModal
          selectedItems={items.filter(i => selectedIds.has(i.id))}
          warehouses={warehouses}
          onClose={() => setIsBulkTransferOpen(false)}
          onConfirm={handleBulkRelocate}
        />
      )}

      {itemsToPrint && (
        <BarcodeLabelModal 
          items={itemsToPrint}
          warehouses={warehouses}
          onClose={() => setItemsToPrint(null)}
        />
      )}

      {adjustmentState.item && (
        <StockActionModal
          item={adjustmentState.item}
          type={adjustmentState.type!}
          onClose={() => setAdjustmentState({ item: null, type: null })}
          onConfirm={handleAdjustStock}
        />
      )}
    </div>
  );
};

export default Inventory;