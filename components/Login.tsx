import React, { useEffect, useState } from 'react';
import { Box, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const roleConfig: Record<UserRole, { label: string; desc: string }> = {
  [UserRole.ADMIN]:    { label: 'Admin',    desc: 'Full system access' },
  [UserRole.STAFF]:  { label: 'Staff',  desc: 'Inventory & reports' },
  [UserRole.ACCOUNTANT]:   { label: 'Accountant',   desc: 'Read-only access' },
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mounted, setMounted]         = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [isLoading, setIsLoading]     = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLogin(selectedRole);
      setIsLoading(false);
    }, 800);
  };

  const inputCls =
    'w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-stone-900 ' +
    'placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Soft background blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-200/50 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-100/60 rounded-full blur-[80px]" />
      </div>

      {/* ── Card ── */}
      <div
        className={`
          relative z-10 w-full max-w-md
          transition-all duration-500 ease-out
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        `}
      >
        <div className="bg-white border border-stone-200 rounded-[2.5rem] shadow-2xl overflow-hidden">

          {/* ── Hero gradient strip ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-10 pt-10 pb-16">
            {/* Giant glyph */}
            <span className="pointer-events-none select-none absolute -right-4 -top-4 text-[10rem] font-black text-white/10 leading-none">
              ₱
            </span>

            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center">
                <Box size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">Nexus IMS</h1>
                <p className="text-white/60 text-sm font-medium mt-1">Inventory Management System</p>
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          <div className="px-8 pt-8 pb-10 -mt-6 relative">
            {/* Float card over gradient */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Credentials */}
              <div className="space-y-3 pt-4">
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Username"
                    required
                    autoFocus
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className={`${inputCls} pl-10`}
                  />
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              {/* Access tier */}
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-stone-400 flex items-center gap-2">
                  Access Tier
                  <span className="flex-1 h-px bg-stone-100" />
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.values(UserRole) as UserRole[]).map(role => {
                    const isActive = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`
                          flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl border text-center transition-all
                          ${isActive
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200 text-blue-700'
                            : 'bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300 hover:bg-white'}
                        `}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-blue-700' : 'text-stone-500'}`}>
                          {roleConfig[role].label}
                        </span>
                        <span className={`text-[8px] font-medium leading-tight ${isActive ? 'text-blue-500' : 'text-stone-300'}`}>
                          {roleConfig[role].desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full flex items-center justify-center gap-2
                  py-4 rounded-2xl
                  text-sm font-black text-white
                  bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
                  shadow-lg hover:shadow-xl active:scale-[0.98]
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                  transition-all
                "
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>Sign In to Dashboard <ArrowRight size={16} /></>
                }
              </button>

            </form>

            {/* Footer note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-stone-400 text-[11px] font-medium">
              <ShieldCheck size={13} />
              Secure Enterprise Environment
            </div>
          </div>
        </div>

        {/* Below-card link */}
        <p className="mt-5 text-center text-stone-400 text-xs">
          Need help?{' '}
          <span className="text-blue-600 font-bold hover:underline cursor-pointer">
            Contact System Admin
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;