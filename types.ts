
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  ACCOUNTANT = 'ACCOUNTANT'
}

export enum ItemStatus {
  RAW = 'RAW',
  FINISHED = 'FINISHED',
  GOOD_AS_NEW = 'GOOD_AS_NEW',
  OLD_USED = 'OLD_USED'
}

export type ModuleAction = 'view' | 'update' | 'delete' | 'export';

export interface Permission {
  moduleId: string;
  actions: ModuleAction[];
}

export interface RolePermissionMap {
  [role: string]: Permission[];
}

export interface Warehouse {
  id: string;
  name: string;
  prefix: string; // e.g., WHA
}

export interface Category {
  id: string;
  name: string;
  code: string; // e.g., CON
  parentId?: string;
}

export interface Item {
  id: string;
  name: string;
  warehouseId: string;
  categoryId: string;
  status: ItemStatus;
  barcode: string; // [WarehousePrefix]-[CategoryCode]-[ItemID]
  quantity: number;
  baseCost: number;
  freight: number;
  duties: number;
  taxes: number;
  trueUnitCost: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  type: 'STOCK_OUT' | 'TRANSFER' | 'STOCK_IN';
  itemId: string;
  warehouseId: string;
  targetWarehouseId?: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  staffName: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}
