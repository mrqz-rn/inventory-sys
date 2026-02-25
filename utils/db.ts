// src/utils/db.ts
// IndexedDB wrapper for offline-first data persistence

const DB_NAME = 'WarehouseAppDB';
const DB_VERSION = 1;

const STORES = {
  items: 'items',
  warehouses: 'warehouses',
  categories: 'categories',
  transactions: 'transactions',
  notifications: 'notifications',
  syncQueue: 'syncQueue',        // Queued actions to replay when back online
  appState: 'appState',          // Miscellaneous key-value state
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains(STORES.items)) {
        db.createObjectStore(STORES.items, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.warehouses)) {
        db.createObjectStore(STORES.warehouses, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.categories)) {
        db.createObjectStore(STORES.categories, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.transactions)) {
        db.createObjectStore(STORES.transactions, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.notifications)) {
        db.createObjectStore(STORES.notifications, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        const syncStore = db.createObjectStore(STORES.syncQueue, {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.appState)) {
        db.createObjectStore(STORES.appState, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// ─── Generic CRUD helpers ─────────────────────────────────────────────────────

export async function dbGetAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGet<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbPutMany<T>(storeName: StoreName, values: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    values.forEach((v) => store.put(v));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbDelete(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbClear(storeName: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── App State (key-value) ────────────────────────────────────────────────────

export async function getAppState<T>(key: string): Promise<T | undefined> {
  const record = await dbGet<{ key: string; value: T }>(STORES.appState, key);
  return record?.value;
}

export async function setAppState<T>(key: string, value: T): Promise<void> {
  await dbPut(STORES.appState, { key, value });
}

// ─── Sync Queue ───────────────────────────────────────────────────────────────

export interface SyncAction {
  id?: number;
  type: string;          // e.g. 'STOCK_IN', 'STOCK_OUT', 'TRANSFER', 'APPROVE', 'REJECT'
  payload: unknown;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  timestamp: string;
  retries: number;
}

export async function enqueueSyncAction(action: Omit<SyncAction, 'id' | 'status' | 'retries'>): Promise<void> {
  await dbPut(STORES.syncQueue, {
    ...action,
    status: 'PENDING',
    retries: 0,
  });
}

export async function getPendingSyncActions(): Promise<SyncAction[]> {
  const all = await dbGetAll<SyncAction>(STORES.syncQueue);
  return all.filter((a) => a.status === 'PENDING');
}

export async function markSyncActionSynced(id: number): Promise<void> {
  const action = await dbGet<SyncAction>(STORES.syncQueue, id);
  if (action) {
    await dbPut(STORES.syncQueue, { ...action, status: 'SYNCED' });
  }
}

export async function markSyncActionFailed(id: number): Promise<void> {
  const action = await dbGet<SyncAction>(STORES.syncQueue, id);
  if (action) {
    await dbPut(STORES.syncQueue, {
      ...action,
      status: 'FAILED',
      retries: action.retries + 1,
    });
  }
}

// ─── Convenience: persist full state slices ───────────────────────────────────

export async function persistItems(items: unknown[]): Promise<void> {
  await dbClear(STORES.items);
  await dbPutMany(STORES.items, items);
}

export async function persistWarehouses(warehouses: unknown[]): Promise<void> {
  await dbClear(STORES.warehouses);
  await dbPutMany(STORES.warehouses, warehouses);
}

export async function persistCategories(categories: unknown[]): Promise<void> {
  await dbClear(STORES.categories);
  await dbPutMany(STORES.categories, categories);
}

export async function persistTransactions(transactions: unknown[]): Promise<void> {
  await dbClear(STORES.transactions);
  await dbPutMany(STORES.transactions, transactions);
}

export async function persistNotifications(notifications: unknown[]): Promise<void> {
  await dbClear(STORES.notifications);
  await dbPutMany(STORES.notifications, notifications);
}

// ─── Load everything at startup ───────────────────────────────────────────────

export async function loadPersistedState() {
  const [items, warehouses, categories, transactions, notifications] = await Promise.all([
    dbGetAll(STORES.items),
    dbGetAll(STORES.warehouses),
    dbGetAll(STORES.categories),
    dbGetAll(STORES.transactions),
    dbGetAll(STORES.notifications),
  ]);
  return { items, warehouses, categories, transactions, notifications };
}