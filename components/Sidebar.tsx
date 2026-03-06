import React from 'react';
import { LayoutDashboard, Package, Warehouse, ClipboardCheck, Calculator, BarChart3, ScanLine, Box, LogOut, Settings, ShieldAlert, Tags, FileUp } from 'lucide-react';
import { UserRole, Permission } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  onScan: () => void;
  onLogout: () => void;
  permissions: Permission[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, onScan, onLogout, permissions }) => {
  const menuItems = [
    { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
    { id: 'inventory',  label: 'Inventory',    icon: Package },
    { id: 'bulk-upload',label: 'Batch Intake', icon: FileUp },
    { id: 'warehouses', label: 'Warehouses',   icon: Warehouse },
    { id: 'approvals',  label: 'Gatekeeper',   icon: ClipboardCheck },
    { id: 'valuation',  label: 'Valuation',    icon: Calculator },
    { id: 'reports',    label: 'Analytics',    icon: BarChart3 },
  ];

  const adminItems = [
    { id: 'category-mgmt',  label: 'Categories',    icon: Tags },
    { id: 'access-control', label: 'Access Control', icon: ShieldAlert },
  ];

  const canView = (id: string) => permissions.some(p => p.moduleId === id && p.actions.includes('view'));

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/60 text-white flex-col hidden md:flex h-screen">

      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-slate-800/60">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40 shrink-0">
          <Box className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-base font-bold tracking-tight text-white">Nexus Inventory</h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-2">Main Menu</p>

        {menuItems.filter(item => canView(item.id)).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        {(role === UserRole.ADMIN || adminItems.some(i => canView(i.id))) && (
          <>
            <div className="h-px bg-slate-800 my-2 mx-1" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-2">Administration</p>
            {adminItems.filter(item => canView(item.id)).map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Footer actions */}
      <div className="p-3 space-y-2 border-t border-slate-800/60">
        <button
          onClick={onScan}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95 text-sm font-bold uppercase tracking-wider"
        >
          <ScanLine className="w-4 h-4" />
          Scan
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 py-2.5 rounded-xl transition-all border border-slate-800 hover:border-rose-500/20 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;