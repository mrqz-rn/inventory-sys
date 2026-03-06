import React, { useEffect, useState, useRef } from 'react';
import { Box, Lock, User, ShieldCheck, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { UserRole } from '../types';
import { setAppState } from '../utils/db';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const roleConfig: Record<UserRole, { label: string; desc: string }> = {
  [UserRole.ADMIN]:      { label: 'Admin',      desc: 'Full system access' },
  [UserRole.STAFF]:      { label: 'Staff',      desc: 'Inventory & reports' },
  [UserRole.ACCOUNTANT]: { label: 'Accountant', desc: 'Read-only access' },
};

// Valid credentials per role
const CREDENTIALS: Record<UserRole, { username: string; password: string }> = {
  [UserRole.ADMIN]:      { username: 'admin',      password: 'admin' },
  [UserRole.STAFF]:      { username: 'staff',      password: 'staff' },
  [UserRole.ACCOUNTANT]: { username: 'accountant', password: 'accountant' },
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mounted, setMounted]           = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [isLoading, setIsLoading]       = useState(false);

  // Alert state
  const [showAlert, setShowAlert]   = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [shake, setShake]           = useState(false);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (showAlert) requestAnimationFrame(() => setAlertVisible(true));
    else setAlertVisible(false);
  }, [showAlert]);

  const triggerError = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);

    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setShowAlert(true);
    alertTimerRef.current = setTimeout(() => dismissAlert(), 4000);
  };

  const dismissAlert = () => {
    setAlertVisible(false);
    setTimeout(() => setShowAlert(false), 300);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const user = Object.entries(CREDENTIALS).find(([key, value]) => value.username === username.trim().toLowerCase());

    if(user?.[1].password !== password) {
      triggerError();
      return;
    }

    setIsLoading(true);

    // Persist session to IndexedDB (isVerified=false — 2FA not yet done)
    setAppState('session', { role: user?.[0], isLoggedIn: true, isVerified: false })
      .catch(console.error)
      .finally(() => {
        setTimeout(() => {
          onLogin(user?.[0] as UserRole);
          setIsLoading(false);
        }, 800);
      });
  };

  const inputCls =
    'w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-stone-900 ' +
    'placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes shake {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-7px); }
          30%  { transform: translateX(7px); }
          45%  { transform: translateX(-5px); }
          60%  { transform: translateX(5px); }
          75%  { transform: translateX(-3px); }
          90%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        .shake { animation: shake 0.55s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes slideDown {
          from { transform: translateY(-12px) scale(0.97); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        .alert-enter { animation: slideDown 0.28s cubic-bezier(0.34,1.3,0.64,1) forwards; }

        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* ── Error popup alert ── */}
      {showAlert && (
        <div
          className={`alert-enter fixed z-50 flex items-start gap-3 bg-white border border-red-200 shadow-2xl rounded-2xl px-4 py-3.5 transition-opacity duration-300 ${alertVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ top: '1rem', left: '1rem', right: '1rem', width: 'auto', maxWidth: '420px' }}
        >
          <div className="mt-0.5 w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-stone-800 leading-tight">Invalid Credentials</p>
            <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
              Username or password is incorrect for the selected role. Please try again.
            </p>
          </div>
          <button onClick={dismissAlert} className="mt-0.5 text-stone-300 hover:text-stone-500 transition-colors shrink-0">
            <X size={14} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
            <div className="h-full bg-red-400 rounded-b-2xl" style={{ animation: 'shrink 4s linear forwards' }} />
          </div>
        </div>
      )}

      {/* ── Soft background blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-200/50 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-100/60 rounded-full blur-[80px]" />
      </div>

      {/* ── Card ── */}
      <div
        className={`relative z-10 w-full max-w-md transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <div className="bg-white border border-stone-200 rounded-[2.5rem] shadow-2xl overflow-hidden">

          {/* ── Hero gradient strip ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-10 pt-10 pb-16">
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
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Credentials — shake on error */}
              <div className={`space-y-3 pt-4 ${shake ? 'shake' : ''}`}>
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
              {/* <div className="space-y-2">
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

                <p className="text-[10px] text-stone-300 text-center pt-1">
                  Use <span className="font-black text-stone-400">{CREDENTIALS[selectedRole].username} / {CREDENTIALS[selectedRole].password}</span> for this role
                </p>
              </div> */}

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

        {/* <p className="mt-5 text-center text-stone-400 text-xs">
          Need help?{' '}
          <span className="text-blue-600 font-bold hover:underline cursor-pointer">
            Contact System Admin
          </span>
        </p> */}
      </div>
    </div>
  );
};

export default Login;