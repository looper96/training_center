import React, { useState } from 'react';
import { PHASES_DATA, DAYS_DATA } from '../data/trainingData';
import { TrainingPhase, DaySchedule, PhaseId, ModuleId } from '../types';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Award, 
  AlertCircle, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  BookOpen, 
  ShieldCheck, 
  ChevronDown, 
  Calendar,
  Layers,
  CheckCheck
} from 'lucide-react';

interface JourneyRoadmapProps {
  completedChecklistIds: string[];
  onToggleChecklist: (id: string) => void;
  onSelectModule: (moduleCode: ModuleId) => void;
  currentDay: number;
  onSetCurrentDay: (day: number) => void;
}

export const JourneyRoadmap: React.FC<JourneyRoadmapProps> = ({
  completedChecklistIds,
  onToggleChecklist,
  onSelectModule,
  currentDay,
  onSetCurrentDay
}) => {
  const [selectedPhaseId, setSelectedPhaseId] = useState<PhaseId>(1);
  const [selectedDayKey, setSelectedDayKey] = useState<number | string>(currentDay);
  const [signedDays, setSignedDays] = useState<Record<string, boolean>>({ '1': true, '2': true, '3': true });
  const [filterMode, setFilterMode] = useState<'all' | 'uncompleted'>('all');

  // Find active schedule
  const activeSchedule: DaySchedule = DAYS_DATA.find(d => String(d.dayNumber) === String(selectedDayKey)) || DAYS_DATA[0];
  const activePhase: TrainingPhase = PHASES_DATA.find(p => p.id === activeSchedule.phaseId) || PHASES_DATA[0];

  // Calculate stats for current phase
  const phaseDays = DAYS_DATA.filter(d => d.phaseId === selectedPhaseId);
  const phaseChecklists = phaseDays.flatMap(d => d.checklists);
  const completedInPhase = phaseChecklists.filter(c => completedChecklistIds.includes(c.id)).length;
  const phasePercent = Math.round((completedInPhase / Math.max(1, phaseChecklists.length)) * 100);

  // Day completion calculation
  const isDayFullyCompleted = (day: DaySchedule) => {
    return day.checklists.every(c => completedChecklistIds.includes(c.id));
  };

  const handleSignDay = (dayKey: string) => {
    setSignedDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey]
    }));
  };

  const getShiftBadge = (focus: DaySchedule['shiftFocus']) => {
    switch (focus) {
      case 'morning':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">شیفت صبح (۰۸:۳۰ تا ۱۶:۳۰)</span>;
      case 'night':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">شیفت شب (۱۷:۳۰ تا ۲۴:۰۰)</span>;
      case 'both':
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold px-2 py-0.5 rounded-full">قابل اجرا در هر دو شیفت</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Intro Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                ساختار ۶ فازی مرجع OE
              </span>
              <span className="text-slate-400 text-xs">• ۳۰ روزِ نخست + ماه‌های ۲ و ۳</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              برنامه زمان‌بندی و گام‌های عملیاتی نیروهای تازه‌وارد
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              این مسیر آموزشی بر اساس سند مرجع OE استخراج شده و شامل ۶ فاز اصلی (آشنایی، سایه‌زنی، بسته‌بندی مستقل، آموزش تحویل، کار مستقل و آموزش تخصصی فرایر/گریل/پیتزا) با تطبیق ماژول‌های M1 تا M8 مرکز آموزش است.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 min-w-[240px] text-right">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">پیشرفت فاز انتخابی ({activePhase.numberPersian}):</span>
              <span className="text-sm font-black text-rose-400">{phasePercent}٪</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-rose-500 to-red-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${phasePercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>{completedInPhase} از {phaseChecklists.length} مورد انجام شد</span>
              <span>{phaseDays.length} روز کاری</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Cards Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {PHASES_DATA.map((phase) => {
          const isSelected = selectedPhaseId === phase.id;
          const pDays = DAYS_DATA.filter(d => d.phaseId === phase.id);
          const pTasks = pDays.flatMap(d => d.checklists);
          const pDone = pTasks.filter(c => completedChecklistIds.includes(c.id)).length;
          const pPct = Math.round((pDone / Math.max(1, pTasks.length)) * 100);

          return (
            <button
              key={phase.id}
              onClick={() => {
                setSelectedPhaseId(phase.id);
                // switch to first day of phase
                const firstDay = phase.dayRange[0];
                setSelectedDayKey(firstDay);
              }}
              className={`text-right p-4 rounded-2xl transition-all border relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-rose-500 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${phase.badgeColor}`}>
                    {phase.numberPersian}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">{phase.timeframe}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 line-clamp-1 mt-1">
                  {phase.title}
                </h3>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>پیشرفت:</span>
                  <span className="font-bold text-slate-700">{pPct}٪</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-rose-500 h-1.5 rounded-full" 
                    style={{ width: `${pPct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Days Scroller / Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-700">انتخاب روز یا ماه آموزشی:</span>
            <span className="text-xs text-slate-500">
              (فاز انتخابی: {activePhase.title} - {activePhase.timeframe})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode(filterMode === 'all' ? 'uncompleted' : 'all')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                filterMode === 'uncompleted'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {filterMode === 'uncompleted' ? 'فقط روزهای ناقص' : 'نمایش همه روزها'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {DAYS_DATA.map((day) => {
            const isSelected = String(day.dayNumber) === String(selectedDayKey);
            const isCompleted = isDayFullyCompleted(day);
            const isCurrent = day.dayNumber === currentDay;

            if (filterMode === 'uncompleted' && isCompleted) {
              return null;
            }

            return (
              <button
                key={String(day.dayNumber)}
                onClick={() => {
                  setSelectedDayKey(day.dayNumber);
                  setSelectedPhaseId(day.phaseId);
                  if (typeof day.dayNumber === 'number') {
                    onSetCurrentDay(day.dayNumber);
                  }
                }}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 relative ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : isCurrent
                    ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isCompleted ? (
                  <CheckCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                ) : (
                  <Circle className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                )}
                <span>
                  {typeof day.dayNumber === 'number' ? `روز ${day.dayNumber}` : day.dayNumber}
                </span>
                {isCurrent && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                  }`}>
                    جاری
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Content Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Day Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-rose-100 text-rose-800 font-bold text-xs px-2.5 py-0.5 rounded-lg border border-rose-200">
                {typeof activeSchedule.dayNumber === 'number' ? `روز ${activeSchedule.dayNumber}` : activeSchedule.dayNumber}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${activePhase.badgeColor}`}>
                {activePhase.numberPersian}: {activePhase.title}
              </span>
              {getShiftBadge(activeSchedule.shiftFocus)}
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {activeSchedule.title}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {activeSchedule.summary}
            </p>
          </div>

          {/* Mapped Modules Badges */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 min-w-[220px]">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-600" />
              ماژول(های) متناظر مرکز آموزش:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeSchedule.mappedModules.map((mCode) => (
                <button
                  key={mCode}
                  onClick={() => onSelectModule(mCode)}
                  className="bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-700 border border-slate-300 hover:border-rose-400 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 group"
                  title="کلیک برای مشاهده سرفصل‌های ماژول"
                >
                  <span className="text-rose-600 font-black">{mCode}</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-rose-600 font-normal">
                    {mCode === 'M1' ? 'QC/بهداشت' : 
                     mCode === 'M2' ? 'انبارداری/FIFO' : 
                     mCode === 'M3' ? 'چیدمان/تاپینگ' : 
                     mCode === 'M4' ? 'بسته‌بندی' : 
                     mCode === 'M5' ? 'تحویل/پیک' : 
                     mCode === 'M6' ? 'تجهیزات' : 
                     mCode === 'M7' ? 'پخت' : 'ایرانسل'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OE Reference Direct Quotation */}
        {activeSchedule.oeReferenceNote && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-blue-900 block mb-0.5">
                مستند مرجع OE (Operational Excellence SnappKitchen):
              </span>
              <p className="text-blue-800 leading-relaxed">
                «{activeSchedule.oeReferenceNote}»
              </p>
            </div>
          </div>
        )}

        {/* Key Competencies Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            شایستگی‌های کلیدی و اهداف یادگیری این روز:
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {activeSchedule.keyCompetencies.map((comp, idx) => (
              <li key={idx} className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 flex items-start gap-2 shadow-xs">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{comp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Interactive Checklists Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              چک‌لیست عملیاتی و وظایف روزانه (قابل علامت‌گذاری):
            </h3>
            <span className="text-xs text-slate-500">
              {activeSchedule.checklists.filter(c => completedChecklistIds.includes(c.id)).length} از {activeSchedule.checklists.length} مورد انجام شد
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSchedule.checklists.map((item) => {
              const isDone = completedChecklistIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleChecklist(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-800'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {item.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        item.category === 'safety' ? 'bg-red-100 text-red-700' :
                        item.category === 'quality' ? 'bg-amber-100 text-amber-800' :
                        item.category === 'delivery' ? 'bg-cyan-100 text-cyan-800' :
                        item.category === 'evaluation' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.category === 'safety' ? 'ایمنی/بهداشت' :
                         item.category === 'quality' ? 'کنترل کیفی' :
                         item.category === 'delivery' ? 'تحویل/پیک' :
                         item.category === 'evaluation' ? 'ارزیابی' : 'عملیات'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supervisor Sign-Off & Verification Footer */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              signedDays[String(activeSchedule.dayNumber)]
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-slate-200 text-slate-500 border border-slate-300'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                تاییدیه و امضای دیجیتال مربی / سرپرست شیفت
              </h4>
              <p className="text-[11px] text-slate-500">
                {signedDays[String(activeSchedule.dayNumber)]
                  ? 'این روز توسط سرپرست شیفت ارزیابی و تایید صلاحیت شده است.'
                  : 'پس از تکمیل چک‌لیست‌ها، سرپرست شیفت باید این روز را مهر و تایید کند.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSignDay(String(activeSchedule.dayNumber))}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
              signedDays[String(activeSchedule.dayNumber)]
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {signedDays[String(activeSchedule.dayNumber)]
                ? 'تایید شده (لغو امضا)'
                : 'ثبت امضا و تایید صلاحیت این روز'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
