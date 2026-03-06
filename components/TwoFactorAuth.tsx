import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, ChevronLeft, AlertTriangle, X } from 'lucide-react';

interface TwoFactorAuthProps {
  onVerify: () => void;
  onCancel: () => void;
  userRole: string;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onVerify, onCancel, userRole }) => {
  const [mounted, setMounted]     = useState(false);
  const [code, setCode]           = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer]         = useState(59);
  const [resendKey, setResendKey] = useState(0);
  const [shake, setShake]         = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false); // controls CSS transition
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Animate alert in after mount
  useEffect(() => {
    if (showAlert) {
      requestAnimationFrame(() => setAlertVisible(true));
    } else {
      setAlertVisible(false);
    }
  }, [showAlert]);

  const triggerInvalid = () => {
    // Shake the inputs
    setShake(true);
    setTimeout(() => setShake(false), 600);

    // Show popup
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setShowAlert(true);
    alertTimerRef.current = setTimeout(() => dismissAlert(), 4000);

    // Clear inputs
    setTimeout(() => {
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }, 250);
  };

  const dismissAlert = () => {
    setAlertVisible(false);
    setTimeout(() => setShowAlert(false), 300); // wait for fade-out
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
  };

  const handleChange = (index: number, value: string) => {
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
      if (code.join('') === '123123') {
        setIsLoading(true);
        setTimeout(() => { onVerify(); setIsLoading(false); }, 900);
      } else {
        triggerInvalid();
      }
    }
  }, [code]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.every(d => d !== '') || isLoading) return;
    if (code.join('') !== '123123') {
      triggerInvalid();
      return;
    }
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

      {/* ── Keyframe styles injected ── */}
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
          to   { transform: translateY(0)     scale(1);    opacity: 1; }
        }
        .alert-enter { animation: slideDown 0.28s cubic-bezier(0.34,1.3,0.64,1) forwards; }
      `}</style>

      {/* ── Background blobs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-200/50 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-amber-200/50 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-orange-100/60 rounded-full blur-[80px]" />
      </div>

      {/* ── Invalid code popup alert ── */}
      {showAlert && (
        <div
          className={`
            alert-enter
            fixed z-50
            flex items-start gap-3
            bg-white border border-red-200 shadow-2xl
            rounded-2xl px-4 py-3.5
            transition-opacity duration-300
            ${alertVisible ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ top: '1rem', left: '1rem', right: '1rem', transform: 'none', width: 'auto', maxWidth: '420px' }}
        >
          {/* Icon */}
          <div className="mt-0.5 w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-500" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-stone-800 leading-tight">Invalid Code</p>
            <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
              The code you entered is incorrect. Please try again or request a new one.
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismissAlert}
            className="mt-0.5 text-stone-300 hover:text-stone-500 transition-colors shrink-0"
          >
            <X size={14} />
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-b-2xl"
              style={{
                animation: 'shrink 4s linear forwards',
              }}
            />
          </div>
          <style>{`
            @keyframes shrink {
              from { width: 100%; }
              to   { width: 0%; }
            }
          `}</style>
        </div>
      )}

      {/* ── Card ── */}
      <div
        className={`
          relative z-10 w-full max-w-md
          transition-all duration-500 ease-out
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        `}
      >
        <div className="bg-white border border-stone-200 rounded-[2.5rem] shadow-2xl overflow-hidden">

          {/* ── Hero strip ── */}
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

              {/* ── OTP inputs with shake ── */}
              <div className={`flex justify-between gap-2 ${shake ? 'shake' : ''}`}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;