import React from 'react';
import { Compass, BookOpen, Award, Layers, ArrowLeft, ShieldCheck, Sparkles, Building2, Flame } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (viewId: string, param?: string) => void;
  totalTickets: number;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, totalTickets }) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden min-h-[420px] flex flex-col justify-center items-center text-center p-8 sm:p-12 bg-white border border-[#E3E2E7] shadow-sm">
        <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#835500] text-xs font-bold px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
          <span>Snapp Kitchen Operations · سامانه جامع منابع و آموزش</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-[#1A1B1F] mb-3 tracking-tight">
          Training Center
        </h1>

        <div className="text-[#524534] text-base md:text-lg max-w-2xl mb-2 font-medium">
          سامانه آموزش، ارزیابی صلاحیت و پایپ‌لاین استقرار نیروهای <span className="text-[#835500] font-bold">اسنپ‌کیچن</span>
        </div>

        <div className="text-xs text-[#524534] font-mono tracking-wider mb-8 dir-ltr">
          Hub · SuperHub · irancell
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('v-pl-dashboard')}
            className="bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F] font-bold px-5 py-3 rounded-full text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>ورود به Talent Pipeline ({totalTickets} پرونده)</span>
          </button>
          <button
            onClick={() => onNavigate('v-doc')}
            className="bg-white hover:bg-[#FAF8FE] text-[#1A1B1F] border border-[#E3E2E7] font-bold px-5 py-3 rounded-full text-xs flex items-center gap-2 transition-all shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-[#835500]" />
            <span>مشاهده ۶۱ جزء داک آموزشی</span>
          </button>
          <button
            onClick={() => onNavigate('v-eval')}
            className="bg-amber-50 hover:bg-amber-100 text-[#835500] border border-amber-200 px-5 py-3 rounded-full text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Award className="w-4 h-4 text-[#835500]" />
            <span>ارزیابی و تحویل به عملیات (C1–C8)</span>
          </button>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('v-pl-dashboard')}
          className="bg-white p-6 rounded-3xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer group flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#835500] border border-amber-200 flex items-center justify-center mb-4 text-xl">
              🧭
            </div>
            <h3 className="text-base font-bold text-[#1A1B1F] mb-2">Talent Pipeline</h3>
            <p className="text-xs text-[#524534] leading-relaxed">
              مدیریت زنجیره کامل از ثبت تیکت عملیات، بررسی HR و مصاحبه‌ها تا آموزش TC، ارزیابی صلاحیت و تحویل رسمی به شعبه.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E3E2E7] flex items-center justify-between text-xs text-[#835500] font-bold">
            <span>مشاهده داشبورد</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('v-doc')}
          className="bg-white p-6 rounded-3xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer group flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#835500] border border-amber-200 flex items-center justify-center mb-4 text-xl">
              📚
            </div>
            <h3 className="text-base font-bold text-[#1A1B1F] mb-2">داک آموزشی ماژول‌ها</h3>
            <p className="text-xs text-[#524534] leading-relaxed">
              ۶۱ جزء استاندارد عملیاتی استخراج‌شده از اسناد رسمی شامل SOPها، تسک‌های روزانه، جداول Red Line و منوی رسپی‌ها.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E3E2E7] flex items-center justify-between text-xs text-[#835500] font-bold">
            <span>جستجو در داک</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('v-eval')}
          className="bg-white p-6 rounded-3xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer group flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#835500] border border-amber-200 flex items-center justify-center mb-4 text-xl">
              🏁
            </div>
            <h3 className="text-base font-bold text-[#1A1B1F] mb-2">ارزیابی نهایی (Kirkpatrick)</h3>
            <p className="text-xs text-[#524534] leading-relaxed">
              چارچوب ۴ سطحی: آزمون دانش C2 (۳۰ سوال)، چک‌لیست عملی C3، مصاحبه C4، شبیه‌سازی پیک C5، فرم C6 و پایش ۳۰/۶۰/۹۰ روزه C8.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E3E2E7] flex items-center justify-between text-xs text-[#835500] font-bold">
            <span>شروع ارزیابی</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('v-flow')}
          className="bg-white p-6 rounded-3xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer group flex flex-col justify-between shadow-xs transition-all hover:shadow-md"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#835500] border border-amber-200 flex items-center justify-center mb-4 text-xl">
              ⚙️
            </div>
            <h3 className="text-base font-bold text-[#1A1B1F] mb-2">Zone-Builder تعاملی</h3>
            <p className="text-xs text-[#524534] leading-relaxed">
              تخصیص ماژول‌ها و زمان دوره متناسب با ماهیت شعب Hub (~۲.۵ روز)، SuperHub (۵ روز)، و شعبه اختصاصی irancell (~۲–۳ روز).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E3E2E7] flex items-center justify-between text-xs text-[#835500] font-bold">
            <span>تنظیمات Zoneها</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
