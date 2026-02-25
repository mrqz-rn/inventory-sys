
import React from 'react';
import { LayoutDashboard, Package, ClipboardCheck, ScanLine, User, FileUp } from 'lucide-react';
import { UserRole, Permission } from '../types';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onScan: () => void;
  role: UserRole;
  // Added permissions to fix type error in App.tsx
  permissions: Permission[];
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onScan, role, permissions }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stock', icon: Package },
    { id: 'bulk-upload', label: 'Batch', icon: FileUp },
    { id: 'scan', label: 'Scan', icon: ScanLine, special: true },
    { id: 'approvals', label: 'Gate', icon: ClipboardCheck },
    { id: 'profile', label: 'Me', icon: User },
  ];

  // Helper to check if a module can be viewed based on permissions
  const canView = (id: string) => permissions.some(p => p.moduleId === id && p.actions.includes('view'));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around z-40 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        // Filter tabs based on permissions for real modules
        if (!tab.special && tab.id !== 'profile') {
          if (!canView(tab.id)) return null;
        }

        if (tab.special) {
          return (
            <button
              key={tab.id}
              onClick={onScan}
              className="flex flex-col items-center justify-center -mt-8"
            >
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-300 active:scale-90 transition-transform text-white border-4 border-white">
                <tab.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold mt-1 text-indigo-600">{tab.label}</span>
            </button>
          );
        }

        const isActive = activeTab === tab.id || (tab.id === 'profile' && activeTab === 'settings');
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id === 'profile' ? 'dashboard' : tab.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              isActive ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${isActive ? 'fill-indigo-50' : ''}`} />
            <span className={`text-[10px] font-bold mt-1 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
