import React, { useState } from 'react';
import { TraineeProfile } from '../types';
import { 
  Compass, 
  Layers, 
  GitFork, 
  Gauge, 
  ReceiptText, 
  Clock, 
  Printer, 
  User, 
  Building2, 
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'roadmap' | 'matrix' | 'bpmn' | 'evaluator' | 'simulator' | 'shifts';
  setActiveTab: (tab: 'roadmap' | 'matrix' | 'bpmn' | 'evaluator' | 'simulator' | 'shifts') => void;
  trainee: TraineeProfile;
  totalChecklists: number;
  completedChecklists: number;
  onPrint: () => void;
  onUpdateTraineeName: (name: string, branch: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  trainee,
  totalChecklists,
  completedChecklists,
  onPrint,
  onUpdateTraineeName
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(trainee.fullName);
  const [editBranch, setEditBranch] = useState(trainee.branch);

  const progressPercent = Math.round((completedChecklists / Math.max(1, totalChecklists)) * 100);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTraineeName(editName, editBranch);
    setIsEditingProfile(false);
  };

  const navItems = [
    { id: 'roadmap', label: 'نقشه مسیر ۳۰ روزه و فازها', icon: Compass, count: '۶ فاز' },
    { id: 'matrix', label: 'تطبیق ماژول‌ها (M1–M8)', icon: Layers, count: '۸ ماژول' },
    { id: 'bpmn', label: 'کتابخانه فلوچارت‌های BPMN', icon: GitFork, count: '۴ سند SOP' },
    { id: 'evaluator', label: 'سنجش کار مستقل و تست C2–C4', icon: Gauge, count: 'ارزیابی فاز ۵' },
    { id: 'simulator', label: 'تمرین فیش‌خوانی و بسته‌بندی', icon: ReceiptText, count: 'کارگاهی' },
    { id: 'shifts', label: 'قوانین شیفت، ایمنی و بهداشت', icon: Clock, count: 'ضوابط OE' },
  ] as const;

  return (
    <header className="bg-slate-900 text-white shadow-xl border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 text-white text-xs py-1.5 px-4 font-medium flex justify-between items-center no-print">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[11px]">اسنپ‌کیچن OE</span>
          <span>سند مرجع عملیاتی: مسیر آموزش End-to-End نیروی تازه‌وارد (Hub & SuperHub)</span>
        </div>
        <div className="flex items-center gap-4 text-rose-100 hidden md:flex">
          <span>شیفت صبح: ۰۸:۳۰ تا ۱۶:۳۰</span>
          <span>•</span>
          <span>شیفت شب: ۱۷:۳۰ تا ۲۴:۰۰</span>
          <span>•</span>
          <span className="font-semibold text-white">تطبیق کامل با ماژول‌های M1 تا M8</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/40">
              <span className="text-2xl font-black tracking-tighter text-white">SK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  مسیر جامع آموزش نیروی تازه‌وارد
                </h1>
                <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-semibold">
                  Hub & SuperHub
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تطبیق سند مرجع OE با مرکز آموزش (M1–M8) و فرآیندهای BPMN اسنپ‌کیچن
              </p>
            </div>
          </div>

          {/* Trainee Quick Profile & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Trainee Card */}
            <div 
              onClick={() => setIsEditingProfile(true)}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2 flex items-center gap-3 cursor-pointer transition-all shadow-sm hover:border-slate-600 group"
              title="برای ویرایش اطلاعات کارآموز کلیک کنید"
            >
              <div className="w-9 h-9 rounded-full bg-slate-700 group-hover:bg-rose-600/30 border border-slate-600 group-hover:border-rose-500/50 flex items-center justify-center text-rose-400">
                <User className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-100">{trainee.fullName}</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded">
                    روز {trainee.currentDay}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span className="truncate max-w-[130px]">{trainee.branch}</span>
                </div>
              </div>
            </div>

            {/* Overall Progress Widget */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 min-w-[150px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">پیشرفت چک‌لیست:</span>
                <span className="font-bold text-rose-400">{progressPercent}٪</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-rose-500 to-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>{completedChecklists} از {totalChecklists} تیک</span>
                <span>فاز {trainee.currentDay <= 3 ? '۱' : trainee.currentDay <= 7 ? '۲' : trainee.currentDay <= 14 ? '۳' : trainee.currentDay <= 21 ? '۴' : trainee.currentDay <= 30 ? '۵' : '۶'}</span>
              </div>
            </div>

            {/* Print Button */}
            <button
              onClick={onPrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors no-print"
              title="چاپ کارنامه و چک‌لیست آموزشی"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>چاپ گزارش</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none no-print border-t border-slate-800 pt-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-500'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 bg-slate-800/40 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-700/60 text-slate-400'
                }`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Trainee Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-right shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-rose-500" />
              تنظیم مشخصات کارآموز تازه وارد
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              اطلاعات نیرو جهت درج در گزارش‌های ممیزی و گواهی پایان دوره
            </p>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  نام و نام خانوادگی کارآموز:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  شعبه هاب / سوپرهاب:
                </label>
                <input
                  type="text"
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium"
                >
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
