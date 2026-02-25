// App.tsx — Offline-first version
// Changes from original:
//  1. Loads initial state from IndexedDB on mount (falls back to constants if empty)
//  2. Persists every state mutation to IndexedDB
//  3. Queues mutating actions to a sync queue while offline
//  4. Replays the sync queue automatically when connectivity returns
//  5. Shows OfflineBanner at the top of the UI

import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Warehouse, Item, Category, Transaction, Notification, RolePermissionMap } from './types';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import WarehouseManager from './components/WarehouseManager';
import Approvals from './components/Approvals';
import Scanner from './components/Scanner';
import Valuation from './components/Valuation';
import Reports from './components/Reports';
import Login from './components/Login';
import TwoFactorAuth from './components/TwoFactorAuth';
import CategoryManagement from './components/CategoryManagement';
import AccessControl from './components/AccessControl';
import BulkUpload from './components/BulkUpload';
import ScanActionMenu from './components/ScanActionMenu';
import StockActionModal from './components/StockActionModal';
import TransferItemModal from './components/TransferItemModal';
import OfflineBanner from './components/OfflineBanner';
import { initialItems, initialWarehouses, initialCategories } from './constants';
import {
  loadPersistedState,
  persistItems,
  persistWarehouses,
  persistCategories,
  persistTransactions,
  persistNotifications,
  enqueueSyncAction,
  SyncAction,
} from './utils/db';
import { useOfflineSync } from './hooks/useOfflineSync';

// ─── Default permissions (unchanged) ─────────────────────────────────────────

const defaultPermissions: RolePermissionMap = {
  [UserRole.ADMIN]: [
    { moduleId: 'dashboard', actions: ['view', 'update', 'delete', 'export'] },
    { moduleId: 'inventory', actions: ['view', 'update', 'delete', 'export'] },
    { moduleId: 'warehouses', actions: ['view', 'update', 'delete', 'export'] },
    { moduleId: 'approvals', actions: ['view', 'update', 'delete', 'export'] },
    { moduleId: 'valuation', actions: ['view', 'update', 'delete', 'export'] },
    { moduleId: 'reports', actions: ['view', 'update', 'delete', 'export'] },
    { moduleId: 'category-mgmt', actions: ['view', 'update', 'delete', 'export'] },
    { moduleId: 'access-control', actions: ['view', 'update', 'delete', 'export'] },
    { moduleId: 'bulk-upload', actions: ['view', 'update', 'delete', 'export'] },
  ],
  [UserRole.STAFF]: [
    { moduleId: 'dashboard', actions: ['view'] },
    { moduleId: 'inventory', actions: ['view', 'update'] },
    { moduleId: 'valuation', actions: ['view', 'update'] },
    { moduleId: 'bulk-upload', actions: ['view', 'update'] },
  ],
  [UserRole.ACCOUNTANT]: [
    { moduleId: 'dashboard', actions: ['view'] },
    { moduleId: 'inventory', actions: ['view'] },
    { moduleId: 'reports', actions: ['view', 'export'] },
  ],
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDbReady, setIsDbReady] = useState<boolean>(false);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permissions, setPermissions] = useState<RolePermissionMap>(defaultPermissions);

  // Scanning state
  const [showScanner, setShowScanner] = useState(false);
  const [scannedItem, setScannedItem] = useState<Item | null>(null);
  const [activeScanFlow, setActiveScanFlow] = useState<'IN' | 'OUT' | 'TRANSFER' | null>(null);

  // ─── 1. Load persisted state on mount ──────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const persisted = await loadPersistedState();

        // Use persisted data if it exists, otherwise seed with constants
        setItems(persisted.items.length > 0 ? (persisted.items as Item[]) : initialItems);
        setWarehouses(persisted.warehouses.length > 0 ? (persisted.warehouses as Warehouse[]) : initialWarehouses);
        setCategories(persisted.categories.length > 0 ? (persisted.categories as Category[]) : initialCategories);
        setTransactions(persisted.transactions as Transaction[]);
        setNotifications(persisted.notifications as Notification[]);

        // Seed IndexedDB if first run
        if (persisted.items.length === 0) {
          await persistItems(initialItems);
          await persistWarehouses(initialWarehouses);
          await persistCategories(initialCategories);
        }
      } catch (err) {
        console.error('Failed to load from IndexedDB, using defaults:', err);
        setItems(initialItems);
        setWarehouses(initialWarehouses);
        setCategories(initialCategories);
      } finally {
        setIsDbReady(true);
      }
    })();
  }, []);

  // ─── 2. Persist state whenever it changes ──────────────────────────────────

  useEffect(() => {
    if (!isDbReady) return;
    persistItems(items).catch(console.error);
  }, [items, isDbReady]);

  useEffect(() => {
    if (!isDbReady) return;
    persistWarehouses(warehouses).catch(console.error);
  }, [warehouses, isDbReady]);

  useEffect(() => {
    if (!isDbReady) return;
    persistCategories(categories).catch(console.error);
  }, [categories, isDbReady]);

  useEffect(() => {
    if (!isDbReady) return;
    persistTransactions(transactions).catch(console.error);
  }, [transactions, isDbReady]);

  useEffect(() => {
    if (!isDbReady) return;
    persistNotifications(notifications).catch(console.error);
  }, [notifications, isDbReady]);

  // ─── 3. Offline sync hook ───────────────────────────────────────────────────

  /**
   * When connectivity returns, replay any queued actions.
   * In a real app with a backend, you'd POST each action to your API here.
   * For this local-only app, the data is already applied optimistically,
   * so we just log/mark them done.
   */
  const handleSync = useCallback(async (actions: SyncAction[]) => {
    console.log(`[Sync] Replaying ${actions.length} offline action(s)…`);
    for (const action of actions) {
      // TODO: await apiClient.post('/sync', action)
      console.log('[Sync]', action.type, action.payload);
    }
  }, []);

  const { isOnline, isSyncing, pendingCount } = useOfflineSync({
    onSync: handleSync,
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const checkAccess = (moduleId: string, action: 'view' | 'update' | 'delete' | 'export' = 'view') => {
    const rolePerms = permissions[role] || [];
    const modulePerm = rolePerms.find((p) => p.moduleId === moduleId);
    return modulePerm ? modulePerm.actions.includes(action) : false;
  };

  const addNotification = useCallback((title: string, message: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // ─── Stock / Transfer actions ────────────────────────────────────────────────
  // Each action is applied optimistically to local state AND enqueued for server sync.

  const handleStockInRequest = useCallback((item: Item, qty: number) => {
    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      type: 'STOCK_IN',
      itemId: item.id,
      warehouseId: item.warehouseId,
      quantity: qty,
      status: 'PENDING',
      staffName: 'John Staff',
      timestamp: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, newTx]);
    addNotification('Approval Required', `Stock In of ${qty} units of ${item.name}`);

    // Queue for server sync
    enqueueSyncAction({ type: 'STOCK_IN', payload: newTx, timestamp: newTx.timestamp });

    setScannedItem(null);
    setActiveScanFlow(null);
  }, [addNotification]);

  const handleStockOutRequest = useCallback((item: Item, qty: number) => {
    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      type: 'STOCK_OUT',
      itemId: item.id,
      warehouseId: item.warehouseId,
      quantity: qty,
      status: 'PENDING',
      staffName: 'John Staff',
      timestamp: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, newTx]);
    addNotification('Approval Required', `Stock Out of ${qty} units of ${item.name}`);
    enqueueSyncAction({ type: 'STOCK_OUT', payload: newTx, timestamp: newTx.timestamp });

    setScannedItem(null);
    setActiveScanFlow(null);
  }, [addNotification]);

  const handleTransferRequest = useCallback((item: Item, targetWhId: string, qty: number) => {
    const targetWh = warehouses.find((w) => w.id === targetWhId);
    const newTx: Transaction = {
      id: `TR-${Date.now()}`,
      type: 'TRANSFER',
      itemId: item.id,
      warehouseId: item.warehouseId,
      targetWarehouseId: targetWhId,
      quantity: qty,
      status: 'PENDING',
      staffName: 'John Staff',
      timestamp: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, newTx]);
    addNotification('Transfer Pending', `Relocating ${qty} units of ${item.name} to ${targetWh?.name}`);
    enqueueSyncAction({ type: 'TRANSFER', payload: newTx, timestamp: newTx.timestamp });

    setScannedItem(null);
    setActiveScanFlow(null);
  }, [warehouses, addNotification]);

  const handleApproveTransaction = useCallback((txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== txId) return tx;

        const sourceItem = items.find((i) => i.id === tx.itemId);
        if (!sourceItem) return tx;

        setItems((currItems) => {
          let updated = currItems.map((i) =>
            i.id === tx.itemId
              ? { ...i, quantity: i.quantity - tx.quantity, lastUpdated: new Date().toISOString() }
              : i
          );

          if (tx.type === 'TRANSFER' && tx.targetWarehouseId) {
            const targetWarehouse = warehouses.find((w) => w.id === tx.targetWarehouseId);
            const targetCategory = categories.find((c) => c.id === sourceItem.categoryId);
            const existingInTarget = updated.find(
              (i) =>
                i.warehouseId === tx.targetWarehouseId &&
                i.categoryId === sourceItem.categoryId &&
                i.name === sourceItem.name
            );

            if (existingInTarget) {
              updated = updated.map((i) =>
                i.id === existingInTarget.id
                  ? { ...i, quantity: i.quantity + tx.quantity, lastUpdated: new Date().toISOString() }
                  : i
              );
            } else {
              const newId = `it-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const newItem: Item = {
                ...sourceItem,
                id: newId,
                warehouseId: tx.targetWarehouseId,
                quantity: tx.quantity,
                barcode: `${targetWarehouse?.prefix || 'WH'}-${targetCategory?.code || 'GEN'}-${newId.split('-')[1]}`,
                lastUpdated: new Date().toISOString(),
              };
              updated.push(newItem);
            }
          }

          return updated;
        });

        addNotification('Transaction Approved', `${tx.type} request for ${sourceItem.name} completed.`);
        enqueueSyncAction({ type: 'APPROVE', payload: { txId }, timestamp: new Date().toISOString() });
        return { ...tx, status: 'APPROVED' as const };
      })
    );
  }, [items, warehouses, categories, addNotification]);

  const handleRejectTransaction = useCallback((txId: string, reason: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== txId) return tx;
        const sourceItem = items.find((i) => i.id === tx.itemId);
        addNotification('Transaction Rejected', `${tx.type} request for ${sourceItem?.name || 'Item'} was declined.`);
        enqueueSyncAction({ type: 'REJECT', payload: { txId, reason }, timestamp: new Date().toISOString() });
        return { ...tx, status: 'REJECTED' as const, rejectionReason: reason };
      })
    );
  }, [items, addNotification]);

  const handleScanSuccess = useCallback((barcode: string) => {
    const found = items.find((i) => i.barcode === barcode);
    if (found) {
      setScannedItem(found);
      setShowScanner(false);
    } else {
      addNotification('Scan Error', `Barcode ${barcode} not found in registry.`);
      setShowScanner(false);
    }
  }, [items, addNotification]);

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsLoggedIn(true);
    setIsVerified(false);
  };

  const handleVerify = () => {
    setIsVerified(true);
    addNotification('Security Verified', 'Identity confirmed via 2FA');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsVerified(false);
    setActiveTab('dashboard');
  };

  const handleCancel2FA = () => {
    setIsLoggedIn(false);
    setIsVerified(false);
  };

  // ─── Auth screens ───────────────────────────────────────────────────────────

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;
  if (isLoggedIn && !isVerified) {
    return (
      <TwoFactorAuth
        onVerify={handleVerify}
        onCancel={handleCancel2FA}
        userRole={role}
      />
    );
  }

  // ─── Main content router ────────────────────────────────────────────────────

  const renderContent = () => {
    if (!checkAccess(activeTab)) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-rose-50 p-6 rounded-full mb-4">
            <span className="text-4xl">🚫</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
          <p className="text-slate-500 mt-2 max-w-sm">
            Your role "{role}" does not have permission to view the {activeTab} module.
          </p>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mt-6 text-indigo-600 font-bold hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      // case 'dashboard':    return <Dashboard items={items} warehouses={warehouses} transactions={transactions} />;
      case 'dashboard': return (
        <Dashboard
          items={items}
          warehouses={warehouses}
          transactions={transactions}
          onApprove={handleApproveTransaction}
          onReject={handleRejectTransaction}
          onViewAll={() => setActiveTab('approvals')}
        />
      );
      case 'inventory':    return <Inventory items={items} setItems={setItems} categories={categories} warehouses={warehouses} onStockIn={handleStockInRequest} onStockOut={handleStockOutRequest} onTransfer={handleTransferRequest} role={role} permissions={permissions[role]} />;
      case 'warehouses':   return <WarehouseManager warehouses={warehouses} setWarehouses={setWarehouses} role={role} />;
      case 'approvals':    return <Approvals transactions={transactions} items={items} warehouses={warehouses} onApprove={handleApproveTransaction} onReject={handleRejectTransaction} role={role} />;
      case 'valuation':    return <Valuation items={items} setItems={setItems} warehouses={warehouses} categories={categories} role={role} />;
      case 'reports':      return <Reports items={items} warehouses={warehouses} transactions={transactions} role={role} canExport={checkAccess('reports', 'export')} />;
      case 'category-mgmt': return <CategoryManagement categories={categories} setCategories={setCategories} role={role} />;
      case 'access-control': return <AccessControl permissions={permissions} setPermissions={setPermissions} role={role} />;
      case 'bulk-upload':  return <BulkUpload warehouses={warehouses} categories={categories} setItems={setItems} addNotification={addNotification} role={role} />;
      default:             return <Dashboard items={items} warehouses={warehouses} transactions={transactions} />;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Offline / syncing banner — shows when offline OR when syncing after reconnection */}
      <OfflineBanner isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingCount} />

      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={role}
          onScan={() => setShowScanner(true)}
          onLogout={handleLogout}
          permissions={permissions[role]}
        />

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header
            role={role}
            setRole={setRole}
            notifications={notifications}
            setNotifications={setNotifications}
            onLogout={handleLogout}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {isDbReady ? renderContent() : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-400 text-sm animate-pulse">Loading local data…</p>
                </div>
              )}
            </div>
          </main>
        </div>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onScan={() => setShowScanner(true)}
          role={role}
          permissions={permissions[role]}
        />

        {showScanner && (
          <Scanner onClose={() => setShowScanner(false)} onScan={handleScanSuccess} />
        )}

        {scannedItem && !activeScanFlow && (
          <ScanActionMenu
            item={scannedItem}
            onClose={() => setScannedItem(null)}
            onSelectAction={setActiveScanFlow}
          />
        )}

        {scannedItem && activeScanFlow === 'IN' && (
          <StockActionModal
            item={scannedItem}
            type="IN"
            onClose={() => setActiveScanFlow(null)}
            onConfirm={(qty) => handleStockInRequest(scannedItem, qty)}
          />
        )}

        {scannedItem && activeScanFlow === 'OUT' && (
          <StockActionModal
            item={scannedItem}
            type="OUT"
            onClose={() => setActiveScanFlow(null)}
            onConfirm={(qty) => handleStockOutRequest(scannedItem, qty)}
          />
        )}

        {scannedItem && activeScanFlow === 'TRANSFER' && (
          <TransferItemModal
            item={scannedItem}
            warehouses={warehouses}
            onClose={() => setActiveScanFlow(null)}
            onConfirm={(targetWhId, qty) => handleTransferRequest(scannedItem, targetWhId, qty)}
          />
        )}
      </div>
    </>
  );
};

export default App;