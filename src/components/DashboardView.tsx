import React, { useState } from 'react';
import { PipelineTicket } from '../types/pipeline';
import { ZONE_LABEL } from '../data/pipelineSeed';
import { ArrowLeft, Compass, Users } from 'lucide-react';

interface DashboardViewProps {
  tickets: PipelineTicket[];
  onNavigate: (viewId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ tickets, onNavigate }) => {
  const [expandedStageKey, setExpandedStageKey] = useState<string | null>(null);

  const stages = [
    { key: 'requested', label: 'درخواست نیرو (عملیات)', icon: '📋', target: 'v-pl-request', match: (t: PipelineTicket) => t.status === 'requested' },
    { key: 'hr', label: 'بررسی HR و مصاحبه', icon: '👤', target: 'v-pl-hr', match: (t: PipelineTicket) => t.status === 'referred_to_training' },
    { key: 'training', label: 'آموزش TC (کلاس و مربی)', icon: '🎓', target: 'v-pl-tc', match: (t: PipelineTicket) => t.status === 'training' },
    { key: 'evaluation', label: 'سنجش صلاحیت و آزمون', icon: '🏁', target: 'v-pl-tc', match: (t: PipelineTicket) => t.status === 'evaluation' },
    { key: 'handover', label: 'تحویل و استقرار در شعبه', icon: '🤝', target: 'v-pl-handover', match: (t: PipelineTicket) => t.status === 'handover' }
  ];

  const pastCountFor = (key: string): number => {
    switch (key) {
      case 'requested':
        return tickets.length;
      case 'hr':
        return tickets.filter(t => ['referred_to_training', 'training', 'evaluation', 'handover'].includes(t.status) || (t.returnHistory && t.returnHistory.length > 0)).length;
      case 'training':
        return tickets.filter(t => ['training', 'evaluation', 'handover'].includes(t.status)).length;
      case 'evaluation':
        return tickets.filter(t => ['evaluation', 'handover'].includes(t.status)).length;
      case 'handover':
        return tickets.filter(t => t.status === 'handover' && t.tc?.outcome?.opsConfirmed).length;
      default:
        return 0;
    }
  };

  const getCandLabel = (t: PipelineTicket) => {
    return t.hr?.candidateName || `(نام هنوز ثبت نشده) — ${t.location}`;
  };

  const getZoneBorderClass = (zone: string) => {
    if (zone === 'superhub') return 'border-r-4 border-r-teal-500';
    if (zone === 'irancell') return 'border-r-4 border-r-emerald-500';
    return 'border-r-4 border-r-[#F5A623]';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-[#835500]" />
          <span className="text-xs font-bold text-[#835500]">مرکز پایش کلان خط استقرار نیرو</span>
        </div>
        <h1 className="text-2xl font-black text-[#1A1B1F] mb-1">
          داشبورد Talent Pipeline
        </h1>
        <p className="text-xs text-[#524534]">
          وضعیت لحظه‌ای و تاریخچه‌ی هر بخش از فرآیند جذب، آموزش و تحویل به عملیات
        </p>
      </div>

      {/* Funnel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stages.map(s => {
          const nowCount = tickets.filter(s.match).length;
          const pastCount = pastCountFor(s.key);
          const pastLabel = s.key === 'requested'
            ? `${pastCount} درخواست از ابتدا`
            : s.key === 'handover'
            ? `${pastCount} نفر تحویل و تأییدشده`
            : `${pastCount} نفر تا کنون از این مرحله عبور کرده‌اند`;

          const isExpanded = expandedStageKey === s.key;

          return (
            <div
              key={s.key}
              onClick={() => setExpandedStageKey(isExpanded ? null : s.key)}
              className={`bg-white rounded-3xl p-5 cursor-pointer relative overflow-hidden transition-all border shadow-xs hover:shadow-md ${
                isExpanded ? 'border-[#F5A623] ring-2 ring-[#F5A623]/30 bg-amber-50/20' : 'border-[#E3E2E7]'
              }`}
            >
              <div className="absolute left-4 top-4 text-2xl opacity-40">
                {s.icon}
              </div>
              <div className="text-xs text-[#524534] mb-2 font-bold">
                {s.label}
              </div>
              <div className="text-3xl font-black text-[#1A1B1F] leading-none">
                {nowCount} <span className="text-xs font-normal text-[#524534]">نفر الان</span>
              </div>
              <div className="text-[11px] text-[#524534] mt-3 pt-3 border-t border-[#E3E2E7] leading-tight">
                {pastLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Stage List Drawer */}
      {expandedStageKey && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E2E7]">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {stages.find(s => s.key === expandedStageKey)?.icon}
              </span>
              <h3 className="text-base font-bold text-[#1A1B1F]">
                افراد حاضر در مرحله «{stages.find(s => s.key === expandedStageKey)?.label}»
              </h3>
            </div>
            <button
              onClick={() => onNavigate(stages.find(s => s.key === expandedStageKey)?.target || 'v-pl-dashboard')}
              className="bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F] font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>ورود به محیط کاری این بخش</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {tickets.filter(stages.find(s => s.key === expandedStageKey)!.match).length === 0 ? (
              <div className="text-center py-10 text-xs text-[#524534]">
                هیچ فردی در این مرحله قرار ندارد.
              </div>
            ) : (
              tickets.filter(stages.find(s => s.key === expandedStageKey)!.match).map(t => (
                <div
                  key={t.id}
                  onClick={() => onNavigate(stages.find(s => s.key === expandedStageKey)?.target || 'v-pl-dashboard')}
                  className={`bg-[#FAF8FE] hover:bg-[#F3EEFA] p-4 rounded-2xl border border-[#E3E2E7] flex items-center justify-between gap-3 cursor-pointer transition-all ${getZoneBorderClass(t.zone)}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1A1B1F]">{getCandLabel(t)}</span>
                      {t.returnHistory && t.returnHistory.length > 0 && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                          ↩ برگشتی ({t.returnHistory.length})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#524534] mt-1 flex items-center gap-3">
                      <span>موقعیت: {t.location}</span>
                      <span>زون: {ZONE_LABEL[t.zone]}</span>
                      {t.tc?.mentor && <span>مربی: {t.tc.mentor}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-[#835500]">
                    <span>مشاهده پرونده</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
