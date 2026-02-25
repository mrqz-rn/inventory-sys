
import React, { useState } from 'react';
import { UserRole, RolePermissionMap, ModuleAction } from '../types';
import { ShieldCheck, ShieldAlert, Check, X, Users, Lock, Save, Globe } from 'lucide-react';

interface AccessControlProps {
  permissions: RolePermissionMap;
  setPermissions: React.Dispatch<React.SetStateAction<RolePermissionMap>>;
  role: UserRole;
}

const AccessControl: React.FC<AccessControlProps> = ({ permissions, setPermissions, role }) => {
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.STAFF);

  const modules = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'warehouses', label: 'Warehouses' },
    { id: 'approvals', label: 'Gatekeeper' },
    { id: 'valuation', label: 'Valuation' },
    { id: 'reports', label: 'Analytics' },
    { id: 'category-mgmt', label: 'Taxonomy Settings' },
    { id: 'access-control', label: 'Access Control' },
  ];

  const actions: ModuleAction[] = ['view', 'update', 'delete', 'export'];

  const togglePermission = (moduleId: string, action: ModuleAction) => {
    setPermissions(prev => {
      const currentRolePerms = [...(prev[activeRole] || [])];
      const modulePermIndex = currentRolePerms.findIndex(p => p.moduleId === moduleId);
      
      if (modulePermIndex >= 0) {
        const modulePerm = { ...currentRolePerms[modulePermIndex] };
        if (modulePerm.actions.includes(action)) {
          modulePerm.actions = modulePerm.actions.filter(a => a !== action);
        } else {
          modulePerm.actions = [...modulePerm.actions, action];
        }
        
        if (modulePerm.actions.length === 0) {
          currentRolePerms.splice(modulePermIndex, 1);
        } else {
          currentRolePerms[modulePermIndex] = modulePerm;
        }
      } else {
        currentRolePerms.push({ moduleId, actions: [action] });
      }

      return { ...prev, [activeRole]: currentRolePerms };
    });
  };

  const hasPermission = (moduleId: string, action: ModuleAction) => {
    return permissions[activeRole]?.find(p => p.moduleId === moduleId)?.actions.includes(action) || false;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Sentinel Access</h2>
          <p className="text-slate-500">Configure role-based module capabilities and guardrails</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Global Policy Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Access Tier</p>
          {Object.values(UserRole).map(r => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                activeRole === r 
                ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100' 
                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activeRole === r ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-black ${activeRole === r ? 'text-slate-900' : 'text-slate-500'}`}>{r}</p>
                  <p className="text-[10px] font-bold opacity-60">System Role</p>
                </div>
              </div>
              {activeRole === r && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
          ))}
          
          <div className="bg-slate-900 text-white p-6 rounded-[2rem] mt-8">
            <Lock className="w-8 h-8 text-indigo-400 mb-4" />
            <h4 className="font-bold text-sm">Strict Security Mode</h4>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              Permissions are additive. An account must have explicitly granted "view" access to see a module in their menu.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">Capabilities Matrix: {activeRole}</h3>
              </div>
              <button className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Reset Defaults</button>
            </div>

            {/* Matrix View - Desktop */}
            <div className="hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module / Scope</th>
                    {actions.map(a => (
                      <th key={a} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {modules.map(mod => (
                    <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">{mod.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{mod.id}</p>
                      </td>
                      {actions.map(action => (
                        <td key={action} className="px-6 py-4 text-center">
                          <button
                            onClick={() => togglePermission(mod.id, action)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all ${
                              hasPermission(mod.id, action)
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-slate-50 text-slate-300 border border-slate-100'
                            }`}
                          >
                            {hasPermission(mod.id, action) ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card View - Mobile */}
            <div className="md:hidden p-4 space-y-4">
              {modules.map(mod => (
                <div key={mod.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="font-black text-slate-900 text-xs mb-3 uppercase tracking-widest">{mod.label}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {actions.map(action => (
                      <button
                        key={action}
                        onClick={() => togglePermission(mod.id, action)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          hasPermission(mod.id, action)
                          ? 'bg-white border-indigo-200 text-indigo-600'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{action}</span>
                        {hasPermission(mod.id, action) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-30" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 border-t border-slate-50 flex justify-end bg-slate-50/30">
              <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all flex items-center gap-3">
                <Save className="w-5 h-5 text-indigo-400" /> Commit Access Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;
