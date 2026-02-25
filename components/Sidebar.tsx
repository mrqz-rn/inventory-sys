
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'bulk-upload', label: 'Batch Intake', icon: FileUp },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'approvals', label: 'Gatekeeper', icon: ClipboardCheck },
    { id: 'valuation', label: 'Valuation', icon: Calculator },
    { id: 'reports', label: 'Analytics', icon: BarChart3 },
  ];

  const adminItems = [
    { id: 'category-mgmt', label: 'Categories', icon: Tags },
    { id: 'access-control', label: 'Access Control', icon: ShieldAlert },
  ];

  const canView = (id: string) => permissions.some(p => p.moduleId === id && p.actions.includes('view'));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex h-screen shadow-2xl">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Box className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Nexus Inventory</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">Main Menu</p>
        {menuItems.filter(item => canView(item.id)).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}

        {(role === UserRole.ADMIN || adminItems.some(i => canView(i.id))) && (
          <>
            <div className="h-px bg-slate-800 my-4 mx-4" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-2">Administration</p>
            {adminItems.filter(item => canView(item.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 space-y-3 border-t border-slate-800">
        <button 
          onClick={onScan}
          className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl transition-all shadow-lg active:scale-95"
        >
          <ScanLine className="w-5 h-5" />
          <span className="font-bold uppercase tracking-wider text-sm">Scan</span>
        </button>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 py-3 rounded-xl transition-all border border-slate-800 hover:border-rose-500/30 text-sm font-bold"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
