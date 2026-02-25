import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, ChevronLeft, Lock } from 'lucide-react';

interface TwoFactorAuthProps {
  onVerify: () => void;
  onCancel: () => void;
  userRole: string;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onVerify, onCancel, userRole }) => {
  const [mounted, setMounted]   = useState(false);
  const [code, setCode]         = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer]       = useState(59);
  const [resendKey, setResendKey] = useState(0); // bump to restart timer
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mount animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Countdown — restarts when resendKey changes
  useEffect(() => {
    setTimer(59);
    const interval = setInterval(() =>
      setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [resendKey]);

  const handleChange = (index: number, value: string) => {
    // Allow only single digit
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Auto-submit once all 6 digits are filled
  useEffect(() => {
    if (code.every(d => d !== '')) {
      setIsLoading(true);
      setTimeout(() => { onVerify(); setIsLoading(false); }, 900);
    }
  }, [code]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.every(d => d !== '') || isLoading) return;
    setIsLoading(true);
    setTimeout(() => { onVerify(); setIsLoading(false); }, 900);
  };

  const handleResend = () => {
    if (timer > 0) return;
    setCode(['', '', '', '', '', '']);
    setResendKey(k => k + 1);
    inputRefs.current[0]?.focus();
  };

  const isFull = code.every(d => d !== '');

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Background blobs — matches Login ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-200/50 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-amber-200/50 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-100/60 rounded-full blur-[80px]" />
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

          {/* ── Hero strip — blue for 2FA context ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-10 pt-10 pb-16">
            <span className="pointer-events-none select-none absolute -right-4 -top-4 text-[10rem] font-black text-white/10 leading-none">
              2FA
            </span>
            <div className="relative z-10 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">Verification</h1>
                <p className="text-white/60 text-sm font-medium mt-1">Two-factor authentication</p>
              </div>
            </div>
          </div>

          {/* ── Form body ── */}
          <div className="px-8 pt-8 pb-10">

            {/* Back link */}
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 transition-colors mb-6 group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to Login</span>
            </button>

            {/* Subtitle */}
            <p className="text-sm text-stone-500 leading-relaxed mb-7">
              A 6-digit code was sent to your registered device for the{' '}
              <span className="font-black text-blue-600">{userRole}</span> account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── OTP inputs ── */}
              <div className="flex justify-between gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={index === 0}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className={`
                      w-11 h-14 md:w-12 md:h-16 text-center text-2xl font-black rounded-2xl border-2
                      bg-white text-stone-900 transition-all focus:outline-none
                      ${digit
                        ? 'border-blue-400 ring-2 ring-blue-200/60 bg-blue-50'
                        : 'border-stone-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60'}
                    `}
                  />
                ))}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5">
                {code.map((d, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      d ? 'w-5 bg-blue-400' : 'w-2 bg-stone-200'
                    }`}
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0}
                  className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    timer > 0
                      ? 'text-stone-300 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <RefreshCw size={11} className={timer === 0 ? '' : 'opacity-40'} />
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !isFull}
                className="
                  w-full flex items-center justify-center gap-2
                  py-4 rounded-2xl
                  text-sm font-black text-white
                  bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
                  shadow-lg hover:shadow-xl active:scale-[0.98]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                  transition-all
                "
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>Confirm Identity <ArrowRight size={16} /></>
                }
              </button>

            </form>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-center gap-2 text-stone-300 text-[10px] font-black uppercase tracking-[0.18em]">
              <Lock size={11} />
              End-to-End Encrypted
            </div>

          </div>
        </div>

        <p className="mt-5 text-center text-stone-400 text-xs">
          Having trouble?{' '}
          <span className="text-blue-600 font-bold hover:underline cursor-pointer">
            Contact System Admin
          </span>
        </p>
      </div>
    </div>
  );
};

export default TwoFactorAuth;