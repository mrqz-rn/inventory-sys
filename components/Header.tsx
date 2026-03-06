// Header.tsx
import React, { useState } from 'react';
import { Bell, LogOut, ChevronDown, Settings, Search, Menu, X, LayoutDashboard, Package, Warehouse, ClipboardCheck, Calculator, BarChart3, ScanLine, Box, ShieldAlert, Tags, FileUp } from 'lucide-react';
import { UserRole, Notification, Permission } from '../types';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onScan: () => void;
  permissions: Permission[];
}

const menuItems = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'inventory',   label: 'Inventory',     icon: Package },
  { id: 'bulk-upload', label: 'Batch Intake',  icon: FileUp },
  { id: 'warehouses',  label: 'Warehouses',    icon: Warehouse },
  { id: 'approvals',   label: 'Gatekeeper',    icon: ClipboardCheck },
  { id: 'valuation',   label: 'Valuation',     icon: Calculator },
  { id: 'reports',     label: 'Analytics',     icon: BarChart3 },
];

const adminItems = [
  { id: 'category-mgmt',  label: 'Categories',    icon: Tags },
  { id: 'access-control', label: 'Access Control', icon: ShieldAlert },
];

const Header: React.FC<HeaderProps> = ({
  role, notifications, setNotifications, onLogout,
  activeTab, setActiveTab, onScan, permissions,
}) => {
  const [showNotifs, setShowNotifs]           = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [drawerOpen, setDrawerOpen]           = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const canView = (id: string) => permissions.some(p => p.moduleId === id && p.actions.includes('view'));

  const navigate = (tab: string) => {
    setActiveTab(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* ── Top bar ── */}
      <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-20 sticky top-0 shadow-sm">
        
        {/* Left: hamburger + search */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo mark — visible on desktop too for branding */}
          <div className="hidden md:flex items-center gap-2.5 mr-4">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight">Nexus</span>
          </div>

          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything…"
              className="w-44 md:w-60 pl-8.5 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Right: scan + notifs + profile */}
        <div className="flex items-center gap-1 md:gap-2">

          {/* Scan button — desktop */}
          <button
            onClick={onScan}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm active:scale-95"
          >
            <ScanLine className="w-3.5 h-3.5" />
            Scan
          </button>

          {/* Divider */}
          <div className="hidden md:block h-5 w-px bg-stone-200 mx-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifs(!showNotifs); setShowProfileMenu(false); }}
              className="relative w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 tracking-wide">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-stone-50">
                  {notifications.length === 0
                    ? <p className="p-8 text-center text-slate-400 text-xs">No notifications</p>
                    : notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
                          <p className="text-[10px] font-bold text-blue-600 mb-0.5 uppercase tracking-wider">{n.title}</p>
                          <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                        </div>
                      ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-stone-200 mx-0.5" />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifs(false); }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all active:scale-95"
            >
              <div className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                {role[0]}
              </div>
              <span className="hidden md:block text-xs font-semibold text-slate-700 max-w-20 truncate">{role}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">Role</p>
                  <p className="text-xs font-bold text-blue-600 mt-0.5 truncate">{role}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {/* Backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-white text-slate-800 flex flex-col shadow-2xl border-r border-slate-200 transition-transform duration-300 ease-in-out md:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
              <Box className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight">Nexus Inventory</h1>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100">
          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">Signed in as</p>
          <p className="text-xs font-bold text-blue-600 mt-0.5">{role}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Main Menu</p>
          {menuItems.filter(item => canView(item.id)).map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          {adminItems.some(i => canView(i.id)) && (
            <>
              <div className="h-px bg-slate-100 my-2 mx-1" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Administration</p>
              {adminItems.filter(item => canView(item.id)).map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
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
        <div className="p-3 space-y-2 border-t border-slate-100">
          <button
            onClick={() => { onScan(); setDrawerOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition-all shadow-sm active:scale-95 text-sm font-semibold"
          >
            <ScanLine className="w-4 h-4" />
            Scan Item
          </button>
          <button
            onClick={() => { onLogout(); setDrawerOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 py-2.5 rounded-lg transition-all border border-slate-200 hover:border-rose-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Header;