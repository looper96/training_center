import React, { useState } from 'react';
import { Lock, User, LogIn, Eye, EyeOff, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from '../lib/firebase';

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'ایمیل یا کلمه عبور نادرست است.',
  'auth/wrong-password': 'ایمیل یا کلمه عبور نادرست است.',
  'auth/user-not-found': 'ایمیل یا کلمه عبور نادرست است.',
  'auth/invalid-email': 'قالب ایمیل نامعتبر است.',
  'auth/user-disabled': 'این حساب کاربری غیرفعال شده است.',
  'auth/too-many-requests': 'تعداد تلاش‌ها زیاد بود. چند دقیقه بعد دوباره امتحان کنید.',
  'auth/network-request-failed': 'اتصال به سرور برقرار نشد. اینترنت را بررسی کنید.',
  'auth/popup-blocked': 'مرورگر پنجره ورود گوگل را مسدود کرد. اجازه Pop-up را فعال کنید.',
  'auth/unauthorized-domain': 'این دامنه در Firebase Authentication مجاز نشده است (Authorized domains).',
};

const errorMessage = (err: unknown) =>
  (err instanceof FirebaseError && AUTH_ERRORS[err.code]) || 'ورود ناموفق بود. دوباره تلاش کنید.';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
  </svg>
);

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await fn();
    } catch (err) {
      console.error('[login]', err);
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => signInWithEmailAndPassword(auth, email.trim(), password));
  };

  const handleReset = () => {
    if (!email.trim()) {
      setError('ابتدا ایمیل خود را وارد کنید.');
      return;
    }
    run(async () => {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('اگر این ایمیل در سامانه ثبت شده باشد، لینک تغییر رمز برای آن ارسال شد.');
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8FE] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#FE684F]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-[#F5A623] to-[#FE684F] text-[#1C1D21] font-black text-2xl shadow-xl shadow-amber-500/20 mb-1">
            SK
          </div>
          <h1 className="text-2xl font-black text-[#1A1B1F]">مرکز آموزش عملیات اسنپ‌کیچن</h1>
          <p className="text-xs text-[#524534]">
            سامانه مدیریت پایپ‌لاین استعداد، ارزیابی شایستگی و اسناد عملیاتی (TC Portal)
          </p>
        </div>

        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#1C1D21]/5 space-y-5">
          {error && (
            <div role="alert" className="bg-rose-50 border border-rose-200 text-[#BA1A1A] p-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{info}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => run(() => signInWithPopup(auth, googleProvider))}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#F4F3F8] text-[#1A1B1F] border border-[#E3E2E7] font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 disabled:opacity-60"
          >
            <GoogleIcon />
            <span>ورود با حساب گوگل</span>
          </button>

          <div className="flex items-center gap-3 text-[11px] text-[#857462]">
            <div className="h-px flex-1 bg-[#E3E2E7]" />
            <span>یا با ایمیل و کلمه عبور</span>
            <div className="h-px flex-1 bg-[#E3E2E7]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="login-email" className="block text-[#1A1B1F] font-bold mb-1.5">ایمیل سازمانی</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#857462] absolute right-3.5 top-3.5 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full md-input pr-10 font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-[#1A1B1F] font-bold">کلمه عبور</label>
                <button type="button" onClick={handleReset} className="text-[11px] text-[#835500] font-bold hover:underline">
                  فراموشی رمز
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#857462] absolute right-3.5 top-3.5 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full md-input pr-10 pl-10 font-mono text-left"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                  className="absolute left-3 top-3 text-[#857462] hover:text-[#1A1B1F]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full md-btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all text-sm disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? 'در حال بررسی...' : 'ورود به سامانه آموزش'}</span>
            </button>
          </form>

          <p className="text-[11px] text-[#524534] leading-relaxed flex gap-1.5">
            <KeyRound className="w-3.5 h-3.5 shrink-0 text-[#835500]" />
            <span>
              حساب‌ها توسط مدیر سامانه ساخته یا فعال می‌شوند. اگر اولین‌بار با گوگل وارد می‌شوید، حساب شما پس از تأیید مدیر فعال خواهد شد.
            </span>
          </p>
        </div>

        <div className="text-center text-[11px] text-[#524534]">
          <span>اسنپ‌کیچن · سیستم آموزش یکپارچه شعب (Hub · SuperHub · irancell)</span>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
