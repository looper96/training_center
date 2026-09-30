import React, { useState } from 'react';
import { MODULES_DATA, PHASES_DATA } from '../data/trainingData';
import { TrainingModule, ModuleId } from '../types';
import { 
  Layers, 
  Search, 
  CheckCircle2, 
  BookOpen, 
  GitFork, 
  FileText, 
  ArrowLeft,
  GraduationCap,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ModulesMatrixProps {
  onSelectModuleDetails?: (moduleId: ModuleId) => void;
  onNavigateToBpmn?: (bpmnId: string) => void;
}

export const ModulesMatrix: React.FC<ModulesMatrixProps> = ({
  onNavigateToBpmn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState<ModuleId | null>(null);

  const filteredModules = MODULES_DATA.filter(m => 
    m.title.includes(searchTerm) || 
    m.code.includes(searchTerm) || 
    m.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.includes(searchTerm)
  );

  const activeModule = MODULES_DATA.find(m => m.id === selectedModuleId) || MODULES_DATA[0];

  const mappingRows = [
    {
      phase: 'فاز ۱ – آشنایی',
      days: 'روز ۱–۳',
      modules: 'M1 (QC / ایمنی و بهداشت) + استقرار اولیه',
      focus: 'معرفی رستوران، قوانین شیفت‌ها، اصول بهداشت، لباس فرم و ایمنی',
      sop: 'چک‌لیست بهداشت فردی و ایمنی',
      sopId: null
    },
    {
      phase: 'فاز ۲ – سایه‌زنی و بسته‌بندی',
      days: 'روز ۴–۷',
      modules: 'M3 (چیدمان تا دسته‌بندی) + M4 (بسته‌بندی)',
      focus: 'همراهی با پرسنل ارشد، آماده‌سازی تاپینگ‌ها، تمرین بسته‌بندی مستقل، خواندن فیش',
      sop: 'Stow SOP (چیدمان تاپینگ)',
      sopId: 'stow'
    },
    {
      phase: 'فاز ۳ – بسته‌بندی مستقل و مقدمات',
      days: 'روز ۸–۱۴',
      modules: 'M2 (انبارداری) + M4 (بسته‌بندی)',
      focus: 'چرخش موجودی FIFO، نظافت پایان شیفت، سازماندهی انبار، تمرین اولیه تحویل به پیک',
      sop: 'SOP of Receiving & Waste & Stow',
      sopId: 'receiving'
    },
    {
      phase: 'فاز ۴ – آموزش تحویل',
      days: 'روز ۱۵–۲۱',
      modules: 'M5 (تحویل)',
      focus: 'تحویل مستقل به پیک، برخورد محترمانه، گردش کار آشپزخانه (گریل/فرایر/پیتزا/بسته‌بندی)',
      sop: 'چک‌لیست تحویل سفیر و دیسپچ',
      sopId: null
    },
    {
      phase: 'فاز ۵ – کار مستقل',
      days: 'روز ۲۲–۳۰',
      modules: 'ارزیابی C2–C4 (شبیه‌سازی پیک / چک‌لیست منطقه‌ای)',
      focus: 'انجام همه وظایف بدون کمک، تست سرعت و عملکرد، تعیین بخش کاری دائمی',
      sop: 'ممیزی عملیاتی منطقه‌ای C4',
      sopId: null
    },
    {
      phase: 'فاز ۶ – آموزش تخصصی',
      days: 'ماه ۲–۳',
      modules: 'M6 (تجهیزات) + M7 (آماده‌سازی و پخت)',
      focus: 'آموزش تخصصی فرایر (ماه ۲)؛ گریل یا پیتزا (ماه ۳)؛ تست سلامت و جلسه قرارداد',
      sop: 'چک‌لیست ایمنی روغن داغ و فر پیتزا',
      sopId: null
    },
    {
      phase: 'سند اختصاصی شعب همکار',
      days: 'آموزش تکمیلی',
      modules: 'M8 (فرآیندهای اختصاصی ایرانسل)',
      focus: 'چک صندوق و تنخواه، انبارگردانی دوره‌ای اقلام، ثبت ساعت ورود و خروج',
      sop: 'Irancell Dedicated Hub Flowchart',
      sopId: 'irancell'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                تطبیق ساختاریافته مرکز آموزش
              </span>
              <span className="text-slate-400 text-xs">• ماژول‌های M1 تا M8</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              ماتریس تطبیق سند مرجع OE با ماژول‌های آموزشی اسنپ‌کیچن
            </h2>
            <p className="text-xs text-indigo-200/80 max-w-3xl leading-relaxed">
              جدول تطبیقی زیر بر اساس توافق عملیاتی و استخراج مستقیم از سند «End-to-End New Joiner Training Journey» طراحی شده و مشخص می‌کند هر فاز مرجع OE با کدام ماژول آموزشی و اسناد استاندارد عملیاتی (SOP) منطبق است.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در ماژول‌ها یا مهارت‌ها..."
                className="bg-slate-800/90 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Reference Alignment Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              جدول رسمی انطباق فازهای OE با ماژول‌های مرکز آموزش (M1–M8)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              استخراج ساختاریافته از سند مرجع OE «End-to-End New Joiner Training Journey»
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4 rounded-r-xl">فاز سند مرجع OE</th>
                <th className="py-3 px-3">بازه زمانی</th>
                <th className="py-3 px-4">ماژول(های) متناظر در مرکز آموزش</th>
                <th className="py-3 px-4">تمرکز عملیاتی و شایستگی‌ها</th>
                <th className="py-3 px-4 rounded-l-xl">سند و فلوچارت مرتبط (SOP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappingRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                      {row.phase}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-rose-600 whitespace-nowrap">
                    {row.days}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                      {row.modules}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs leading-relaxed">
                    {row.focus}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {row.sopId && onNavigateToBpmn ? (
                      <button
                        onClick={() => onNavigateToBpmn(row.sopId!)}
                        className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 hover:border-rose-400 px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                      >
                        <GitFork className="w-3 h-3 text-rose-600" />
                        <span>{row.sop}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">{row.sop}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Detailed Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-rose-600" />
            شناسنامه تفصیلی ماژول‌های آموزشی (M1 تا M8)
          </h3>
          <span className="text-xs text-slate-500">
            نمایش {filteredModules.length} از {MODULES_DATA.length} ماژول
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredModules.map((module) => {
            const isSelected = selectedModuleId === module.id;
            return (
              <div
                key={module.id}
                onClick={() => setSelectedModuleId(module.id)}
                className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-lg">
                      {module.code}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                      {module.phaseRange}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {module.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 dir-ltr text-right">
                    {module.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">نحوه ارزیابی:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                      {module.assessmentType.split(' ')[0]}...
                    </span>
                  </div>

                  {module.linkedBpmnSop && (
                    <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1 font-semibold">
                      <GitFork className="w-3 h-3 text-amber-600" />
                      <span className="truncate">{module.linkedBpmnSop}</span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-xs text-indigo-600 font-bold group">
                    <span>مشاهده سرفصل‌ها و جزئیات</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Module Detail Modal / Drawer */}
      {selectedModuleId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 text-right shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-indigo-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
                    {activeModule.code}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {activeModule.phaseRange}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {activeModule.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {activeModule.subtitle}
                </p>
              </div>

              <button
                onClick={() => setSelectedModuleId(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  شرح و دامنه کاربرد در اسنپ‌کیچن:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {activeModule.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  اهداف آموزشی و شایستگی‌های نهایی:
                </h4>
                <ul className="space-y-1.5">
                  {activeModule.keyObjectives.map((obj, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  سرفصل‌ها و محتوای آموزشی:
                </h4>
                <div className="space-y-2">
                  {activeModule.syllabus.map((syl, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <span className="text-xs font-bold text-slate-900 block mb-1">
                        {syl.title}
                      </span>
                      <ul className="space-y-1">
                        {syl.items.map((it, j) => (
                          <li key={j} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <span className="text-indigo-500">•</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-indigo-900 block">شیوه سنجش و قبولی:</span>
                  <span className="text-indigo-700">{activeModule.assessmentType}</span>
                </div>
                {activeModule.linkedBpmnSop && (
                  <span className="bg-white border border-indigo-300 text-indigo-900 px-2 py-1 rounded-lg font-bold text-[11px]">
                    {activeModule.linkedBpmnSop}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedModuleId(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
