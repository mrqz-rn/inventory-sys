
import React, { useState } from 'react';
import { Bell, LogOut, ChevronDown, CheckCheck, Settings, Search, Menu } from 'lucide-react';
import { UserRole, Notification } from '../types';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ role, setRole, notifications, setNotifications, onLogout, activeTab, setActiveTab }) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-20 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white md:hidden">
           <Menu className="w-5 h-5" onClick={() => setActiveTab('dashboard')} />
        </div>
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Global search..." className="w-40 md:w-64 pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none" />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Alerts */}
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-slate-500 active:scale-95 transition-all">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full ring-2 ring-white">{unreadCount}</span>}
          </button>
          
          {showNotifs && (
            <div className="absolute right-0 mt-3 w-72 md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="p-4 border-b flex justify-between items-center"><h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">Notifications</h3></div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? <p className="p-8 text-center text-slate-400 text-xs font-bold">Inbox empty</p> : 
                  notifications.map(n => (
                    <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <p className="text-[10px] font-black text-indigo-600 mb-1">{n.title}</p>
                      <p className="text-xs text-slate-600 font-medium leading-tight">{n.message}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />
        
        {/* Profile */}
        <div className="relative">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1 rounded-xl active:bg-slate-50 transition-all">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px]">
              {role[0]}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-50 bg-slate-50/50 text-center">
                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Access Level</p>
                <p className="text-[10px] font-black text-indigo-600">{role}</p>
              </div>
              <div className="p-2 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"><Settings className="w-3.5 h-3.5" /> Settings</button>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-black text-rose-600 hover:bg-rose-50"><LogOut className="w-3.5 h-3.5" /> Log Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
