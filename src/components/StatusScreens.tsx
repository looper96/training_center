import React from 'react';
import { Clock, Loader2, LogOut, ShieldAlert, Wrench } from 'lucide-react';

const Shell: React.FC<{ icon: React.ReactNode; title: string; children?: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="min-h-screen bg-[#FAF8FE] flex items-center justify-center p-4">
    <div className="bg-white border border-[#E3E2E7] rounded-3xl p-8 text-center max-w-lg w-full space-y-4 shadow-lg shadow-[#1C1D21]/5">
      <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#835500] mx-auto flex items-center justify-center">
        {icon}
      </div>
      <h1 className="text-lg font-bold text-[#1A1B1F]">{title}</h1>
      {children}
    </div>
  </div>
);

const SignOutButton: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => (
  <button onClick={onSignOut} className="md-btn-secondary text-xs py-2 px-4 font-bold inline-flex items-center gap-1.5">
    <LogOut className="w-4 h-4" />
    <span>خروج از حساب</span>
  </button>
);

export const LoadingScreen = () => (
  <div className="min-h-screen bg-[#FAF8FE] flex items-center justify-center" role="status" aria-live="polite">
    <Loader2 className="w-8 h-8 text-[#F5A623] animate-spin" />
    <span className="sr-only">در حال بارگذاری…</span>
  </div>
);

export const SetupRequiredScreen = () => (
  <Shell icon={<Wrench className="w-7 h-7" />} title="پیکربندی Firebase انجام نشده است">
    <p className="text-xs text-[#524534] leading-relaxed">
      متغیرهای محیطی <code className="font-mono">VITE_FIREBASE_*</code> هنگام بیلد تنظیم نشده‌اند. آن‌ها را در Netlify
      (Site configuration → Environment variables) یا فایل <code className="font-mono">.env.local</code> وارد کرده و دوباره بیلد کنید.
      راهنمای کامل در README مخزن آمده است.
    </p>
  </Shell>
);

export const PendingScreen: React.FC<{ email: string; onSignOut: () => void }> = ({ email, onSignOut }) => (
  <Shell icon={<Clock className="w-7 h-7" />} title="حساب شما در انتظار تأیید مدیر است">
    <p className="text-xs text-[#524534] leading-relaxed">
      حساب <span className="font-mono">{email}</span> ثبت شد. پس از اینکه مدیر سامانه نقش و سطح دسترسی شما را تعیین کند،
      این صفحه به‌صورت خودکار باز می‌شود.
    </p>
    <SignOutButton onSignOut={onSignOut} />
  </Shell>
);

export const BlockedScreen: React.FC<{ message: string; onSignOut: () => void }> = ({ message, onSignOut }) => (
  <Shell icon={<ShieldAlert className="w-7 h-7" />} title="دسترسی امکان‌پذیر نیست">
    <p className="text-xs text-[#524534] leading-relaxed">{message}</p>
    <SignOutButton onSignOut={onSignOut} />
  </Shell>
);
