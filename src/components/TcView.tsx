import React, { useState } from 'react';
import { PipelineTicket, TrainingModule, ZoneConfigs, JobPosition } from '../types/pipeline';
import { ZONE_LABEL } from '../data/pipelineSeed';
import { collectWeakModules, defaultModulesFor, positionLabel, sortModules } from '../lib/assessment';
import { ArrowLeft, CheckCircle2, UserCheck, BookOpen, RotateCcw, AlertTriangle, Play, ShieldAlert, GraduationCap } from 'lucide-react';
import { showToast } from './Toast';
import { formatDate, nowISO } from '../lib/date';

interface TcViewProps {
  canEdit?: boolean;
  tickets: PipelineTicket[];
  modules: TrainingModule[];
  zoneConfigs: ZoneConfigs;
  positions: JobPosition[];
  onUpdateTicket: (ticket: PipelineTicket) => void;
  onNavigateToEval: (stageViewId: string, candidateTicketId: string) => void;
  onNavigateToModuleDoc: (moduleId: string) => void;
}

export const TcView: React.FC<TcViewProps> = ({
  canEdit = true,
  tickets,
  modules,
  zoneConfigs,
  positions,
  onUpdateTicket,
  onNavigateToEval,
  onNavigateToModuleDoc
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'training' | 'eval'>('new');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Mentor Review state
  const [mentorName, setMentorName] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [classStartDate, setClassStartDate] = useState('');

  // Retrain picker modal
  const [retrainTicketId, setRetrainTicketId] = useState<string | null>(null);
  const [retrainModules, setRetrainModules] = useState<string[]>([]);

  // Evaluation detail popup
  const [evalPopupTicketId, setEvalPopupTicketId] = useState<string | null>(null);

  const newTickets = tickets.filter(t => t.status === 'referred_to_training');
  const trainingTickets = tickets.filter(t => t.status === 'training');
  const evalTickets = tickets.filter(t => t.status === 'evaluation');

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const evalPopupTicket = tickets.find(t => t.id === evalPopupTicketId);

  // Handlers for "ورودی‌های جدید"
  const handleToggleDocs = (t: PipelineTicket, checked: boolean) => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    const updated = {
      ...t,
      tc: {
        mentor: t.tc?.mentor || null,
        interviewDate: t.tc?.interviewDate || t.hr?.interviewDate || null,
        docsReceived: checked,
        initialReview: t.tc?.initialReview || null,
        initialReviewNote: t.tc?.initialReviewNote || '',
        assignedModules: t.tc?.assignedModules || [],
        evalAttempts: t.tc?.evalAttempts || 0,
        evalDecision: t.tc?.evalDecision || null,
        evalProgress: t.tc?.evalProgress || {},
        outcome: t.tc?.outcome || null
      }
    };
    onUpdateTicket(updated);
  };

  const handleApproveInitial = (t: PipelineTicket) => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    if (!mentorName.trim()) {
      showToast('لطفاً نام مربی همراه را مشخص فرمایید.', 'warning');
      return;
    }
    const updated = {
      ...t,
      tc: {
        mentor: mentorName.trim(),
        interviewDate: t.hr?.interviewDate || null,
        docsReceived: t.tc?.docsReceived || true,
        initialReview: 'approved' as const,
        initialReviewNote: reviewNote.trim(),
        assignedModules: t.tc?.assignedModules || [],
        evalAttempts: 0,
        evalDecision: null,
        evalProgress: {},
        outcome: null
      }
    };
    onUpdateTicket(updated);
    showToast('کاندیدا توسط مربی آموزش تأیید اولیه شد.', 'success');
  };

  const handleRejectInitial = (t: PipelineTicket) => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    const reason = reviewNote.trim() || 'عدم احراز شرایط در بررسی اولیه Training Center';
    const updated: PipelineTicket = {
      ...t,
      status: 'requested',
      hrSeen: false,
      returnHistory: [
        ...(t.returnHistory || []),
        {
          date: nowISO(),
          reason,
          by: 'Training Center',
          name: t.hr?.candidateName || '—'
        }
      ],
      hr: null,
      tc: null
    };
    onUpdateTicket(updated);
    showToast('پرونده به منابع انسانی عودت داده شد.', 'info');
    setSelectedTicketId(null);
  };

  const handleStartTraining = (t: PipelineTicket) => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    if (selectedModuleIds.length === 0) {
      showToast('حداقل یک ماژول برای آموزش انتخاب کنید.', 'warning');
      return;
    }
    const assigned = sortModules(selectedModuleIds).map(id => ({ id, done: false }));
    const updated: PipelineTicket = {
      ...t,
      status: 'training',
      tc: {
        mentor: t.tc?.mentor || mentorName || 'زهرا مرادی',
        interviewDate: t.tc?.interviewDate || t.hr?.interviewDate || null,
        docsReceived: t.tc?.docsReceived || true,
        initialReview: t.tc?.initialReview || 'approved',
        initialReviewNote: t.tc?.initialReviewNote || '',
        classStartDate: classStartDate || nowISO(),
        assignedModules: assigned,
        evalAttempts: 0,
        evalDecision: null,
        evalProgress: {},
        outcome: null
      }
    };
    onUpdateTicket(updated);
    showToast('دوره آموزش داوطلب آغاز گردید.', 'success');
    setSelectedTicketId(null);
    setActiveTab('training');
  };

  // Handlers for "در حال آموزش"
  const handleToggleModuleDone = (t: PipelineTicket, modId: string, done: boolean) => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    if (!t.tc) return;
    const updatedModules = t.tc.assignedModules.map(m => m.id === modId ? { ...m, done } : m);
    const updated: PipelineTicket = {
      ...t,
      tc: {
        ...t.tc,
        assignedModules: updatedModules
      }
    };
    onUpdateTicket(updated);
  };

  const handleEnterEvaluation = (t: PipelineTicket) => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    const updated: PipelineTicket = {
      ...t,
      status: 'evaluation'
    };
    onUpdateTicket(updated);
    showToast('داوطلب به مرحله ارزیابی منتقل شد.', 'success');
    setSelectedTicketId(null);
    setActiveTab('eval');
  };

  // Handlers for "در حال ارزیابی"
  const handleReferToOps = (ticket: PipelineTicket) => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    const updated: PipelineTicket = {
      ...ticket,
      status: 'handover',
      tc: {
        mentor: ticket.tc?.mentor || null,
        interviewDate: ticket.tc?.interviewDate || null,
        docsReceived: ticket.tc?.docsReceived || true,
        initialReview: ticket.tc?.initialReview || 'approved',
        initialReviewNote: ticket.tc?.initialReviewNote || '',
        assignedModules: ticket.tc?.assignedModules || [],
        classStartDate: ticket.tc?.classStartDate,
        evalAttempts: ticket.tc?.evalAttempts || 0,
        evalDecision: ticket.tc?.evalDecision || 'pass',
        evalProgress: ticket.tc?.evalProgress || {},
        outcome: {
          type: 'handover',
          date: nowISO(),
          buddy: 'سینا قاسمی (سوپروایزر)',
          opsConfirmed: false,
          opsConfirmedDate: null,
          report: { visits: 0, nonConformities: 0, durationDays: 0 }
        }
      }
    };
    onUpdateTicket(updated);
    showToast('داوطلب با موفقیت به عملیات ارجاع شد.', 'success');
    setEvalPopupTicketId(null);
  };

  const handleConfirmRetrain = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    if (!retrainTicketId) return;
    const t = tickets.find(x => x.id === retrainTicketId);
    if (!t || !t.tc) return;

    const updatedModules = t.tc.assignedModules.map(m => ({
      ...m,
      done: retrainModules.includes(m.id) ? false : m.done
    }));

    const updated: PipelineTicket = {
      ...t,
      status: 'training',
      tc: {
        ...t.tc,
        assignedModules: updatedModules,
        evalAttempts: (t.tc.evalAttempts || 0) + 1,
        evalProgress: {}
      }
    };
    onUpdateTicket(updated);
    showToast('بازآموزی ماژول‌های مشخص شده ثبت شد.', 'info');
    setRetrainTicketId(null);
    setEvalPopupTicketId(null);
    setActiveTab('training');
  };

  const handleNoCoop = (ticket: PipelineTicket) => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    const updated: PipelineTicket = {
      ...ticket,
      status: 'requested',
      hrSeen: false,
      returnHistory: [
        ...(ticket.returnHistory || []),
        {
          date: nowISO(),
          reason: 'مردودی در ارزیابی و عدم همکاری در بازآموزی',
          by: 'Training Center',
          name: ticket.hr?.candidateName || '—'
        }
      ],
      hr: null,
      tc: null
    };
    onUpdateTicket(updated);
    showToast('پرونده داوطلب به منابع انسانی عودت داده شد.', 'info');
    setEvalPopupTicketId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 text-[#835500] border border-[#F5A623]/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>مرکز آموزش (TC) — آموزش، منتورینگ و سنجش صلاحیت داوطلبان</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1B1F]">
            مرکز آموزش اسنپ‌کیچن (Training Center)
          </h1>
          <p className="text-xs text-[#524534] mt-1">
            بررسی اولیه مربی، تایید مدارک سلامت، تخصیص و تدریس ماژول‌های M1 تا M8، برگزاری ارزیابی‌های C1 تا C8 و هماهنگی بازآموزی
          </p>
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-[#835500] shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5">حالت فقط مشاهده (Read-Only) — فاقد دسترسی ویرایش آموزشی و ثبت نمرات</strong>
            <span>
              شما به مرکز آموزش دسترسی مشاهده دارید، اما تایید مدارک، شروع دوره، ثبت تیکت‌های بازآموزی یا تغییر وضعیت کارآموزان غیرفعال است.
            </span>
          </div>
        </div>
      )}

      {/* Subtabs */}
      <div className="flex items-center gap-2 border-b border-[#E3E2E7] pb-3">
        <button
          onClick={() => { setActiveTab('new'); setSelectedTicketId(null); }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'new'
              ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
              : 'text-[#524534] hover:bg-[#F4F3F8] hover:text-[#1A1B1F]'
          }`}
        >
          ورودی‌های جدید ({newTickets.length})
        </button>
        <button
          onClick={() => { setActiveTab('training'); setSelectedTicketId(null); }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'training'
              ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
              : 'text-[#524534] hover:bg-[#F4F3F8] hover:text-[#1A1B1F]'
          }`}
        >
          در حال آموزش ({trainingTickets.length})
        </button>
        <button
          onClick={() => { setActiveTab('eval'); setSelectedTicketId(null); }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'eval'
              ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
              : 'text-[#524534] hover:bg-[#F4F3F8] hover:text-[#1A1B1F]'
          }`}
        >
          در حال ارزیابی ({evalTickets.length})
        </button>
      </div>

      {/* TAB 1: New Entries */}
      {activeTab === 'new' && !selectedTicket && (
        <div className="space-y-3">
          {newTickets.length === 0 ? (
            <div className="bg-white border border-[#E3E2E7] rounded-3xl text-center py-12 text-[#524534] text-xs shadow-sm">
              ورودی جدیدی از سمت HR ارجاع داده نشده است.
            </div>
          ) : (
            newTickets.map(t => (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedTicketId(t.id);
                  setSelectedModuleIds(defaultModulesFor(t.zone, t.position, zoneConfigs, positions));
                  setMentorName(t.tc?.mentor || '');
                  setReviewNote(t.tc?.initialReviewNote || '');
                }}
                className="bg-white hover:bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer flex items-center justify-between gap-4 transition-all shadow-xs"
              >
                <div>
                  <span className="font-bold text-sm text-[#1A1B1F] block">
                    {t.hr?.candidateName}
                  </span>
                  <span className="text-xs text-[#524534] mt-1 block">
                    {ZONE_LABEL[t.zone]} · {positionLabel(positions, t.position)} · {t.location} · ورود به TC: {t.hr?.tcEntryDate || '—'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`pl-tag ${t.tc?.docsReceived ? 'good' : 'warn'}`}>
                    {t.tc?.docsReceived ? 'مدارک دریافت شد' : 'مدارک دریافت نشده'}
                  </span>
                  <span className="pl-tag">ارجاع‌شده به TC</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 1 DETAIL: Review & Module Allocation */}
      {activeTab === 'new' && selectedTicket && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="text-xs text-[#524534] hover:text-[#835500] font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>بازگشت به لیست ورودی‌های جدید</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Candidate Summary */}
            <div className="bg-[#FAF8FE] p-5 rounded-2xl border border-[#E3E2E7] space-y-3">
              <h4 className="font-bold text-[#835500] text-sm">اطلاعات پرونده داوطلب</h4>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">نام داوطلب:</span>
                <span className="font-bold text-[#1A1B1F]">{selectedTicket.hr?.candidateName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">Zone / شعبه:</span>
                <span className="text-[#1A1B1F]">{ZONE_LABEL[selectedTicket.zone]} — {selectedTicket.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">بخش استخدام:</span>
                <span className="font-bold text-[#1A1B1F]">{positionLabel(positions, selectedTicket.position)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">تاریخ مصاحبه HR:</span>
                <span className="text-[#1A1B1F]">{selectedTicket.hr?.interviewDate}</span>
              </div>
              <div className="py-1">
                <span className="text-[#524534] block mb-1">خوداظهاری فنی داوطلب:</span>
                <p className="text-[#1A1B1F] bg-white p-2.5 rounded-xl border border-[#E3E2E7]">
                  {selectedTicket.hr?.selfDeclaredTech || 'توضیحی ثبت نشده'}
                </p>
              </div>

              {/* Docs Received Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#1A1B1F] cursor-pointer select-none bg-white p-3 rounded-xl border border-[#E3E2E7]">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={Boolean(selectedTicket.tc?.docsReceived)}
                    onChange={e => handleToggleDocs(selectedTicket, e.target.checked)}
                    className="accent-[#F5A623] w-4 h-4"
                  />
                  <span>مدارک و گواهی سلامت داوطلب دریافت و تایید شد</span>
                </label>
              </div>
            </div>

            {/* Mentor Review / Allocation */}
            <div className="bg-[#FAF8FE] p-5 rounded-2xl border border-[#E3E2E7] space-y-4">
              <h4 className="font-bold text-[#835500] text-sm">
                بررسی اولیه و تخصیص ماژول‌های دوره
              </h4>

              {selectedTicket.tc?.initialReview !== 'approved' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[#1A1B1F] font-bold mb-1">مربی آموزش‌دهنده (Mentor)</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="مثلاً: زهرا مرادی (مربی TC)"
                      value={mentorName}
                      onChange={e => setMentorName(e.target.value)}
                      className="w-full md-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1A1B1F] font-bold mb-1">یادداشت ارزیابی اولیه</label>
                    <textarea
                      rows={2}
                      disabled={!canEdit}
                      placeholder="آمادگی رفتاری و فنی داوطلب جهت ورود به کلاس..."
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                      className="w-full md-input"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleApproveInitial(selectedTicket)}
                      className={`flex-1 text-xs py-2.5 px-4 font-bold rounded-xl transition-all ${
                        canEdit ? 'md-btn-primary shadow-xs' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {canEdit ? 'تأیید بررسی اولیه' : 'تأیید غیرفعال (فقط مشاهده)'}
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleRejectInitial(selectedTicket)}
                      className={`text-xs py-2.5 px-4 font-bold rounded-xl transition-all ${
                        canEdit ? 'md-btn-danger' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      رد — بازگشت به HR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
                    بررسی اولیه توسط <strong>{selectedTicket.tc.mentor}</strong> تأیید شد.
                  </div>

                  <div>
                    <label className="block text-[#1A1B1F] font-bold mb-1">ماژول‌های موردنیاز این نیرو</label>
                    <p className="text-[11px] text-[#524534] mb-2">
                      پیش‌فرض بر اساس بخش «{positionLabel(positions, selectedTicket.position)}» در {ZONE_LABEL[selectedTicket.zone]} انتخاب شده است.
                      آزمون‌ها و ارزیابی‌های این نیرو فقط از ماژول‌های تیک‌خورده ساخته می‌شوند.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {modules.map(m => (
                        <label
                          key={m.id}
                          className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            selectedModuleIds.includes(m.id)
                              ? 'bg-[#F5A623]/15 border-[#F5A623] text-[#835500] font-bold'
                              : 'bg-white border-[#E3E2E7] text-[#524534]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!canEdit}
                            checked={selectedModuleIds.includes(m.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedModuleIds([...selectedModuleIds, m.id]);
                              else setSelectedModuleIds(selectedModuleIds.filter(x => x !== m.id));
                            }}
                            className="accent-[#F5A623]"
                          />
                          <span>{m.id} ({m.name.split(' ')[0]})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#1A1B1F] font-bold mb-1">تاریخ شروع کلاس</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="۱۴۰۴/۰۶/۱۰"
                      value={classStartDate}
                      onChange={e => setClassStartDate(e.target.value)}
                      className="w-full md-input"
                    />
                  </div>

                  <button
                    onClick={() => handleStartTraining(selectedTicket)}
                    disabled={!canEdit}
                    className={`w-full text-xs font-bold py-3 flex items-center justify-center gap-2 rounded-2xl transition-all ${
                      canEdit ? 'md-btn-primary shadow-xs' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    <span>{canEdit ? 'تأیید و شروع رسمی آموزش' : 'شروع آموزش غیرفعال است (فقط مشاهده)'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: In Training */}
      {activeTab === 'training' && !selectedTicket && (
        <div className="space-y-3">
          {trainingTickets.length === 0 ? (
            <div className="bg-white border border-[#E3E2E7] rounded-3xl text-center py-12 text-[#524534] text-xs shadow-sm">
              هیچ نیرویی در حال حاضر در مرحله آموزش قرار ندارد.
            </div>
          ) : (
            trainingTickets.map(t => {
              const mods = t.tc?.assignedModules || [];
              const doneCount = mods.filter(m => m.done).length;
              const pct = mods.length ? Math.round((doneCount / mods.length) * 100) : 0;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className="bg-white hover:bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer flex items-center justify-between gap-4 transition-all shadow-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1A1B1F]">{t.hr?.candidateName}</span>
                      <span className="text-xs text-[#524534] font-mono">({ZONE_LABEL[t.zone]} · {positionLabel(positions, t.position)})</span>
                    </div>
                    <div className="text-xs text-[#524534] mt-1 flex items-center gap-4">
                      <span>مربی: {t.tc?.mentor}</span>
                      <span>شروع: {formatDate(t.tc?.classStartDate)}</span>
                    </div>
                  </div>

                  <div className="w-48 text-left">
                    <div className="flex justify-between text-xs text-[#524534] mb-1">
                      <span>پیشرفت ماژول‌ها:</span>
                      <span className="font-bold text-[#835500]">{doneCount} از {mods.length} ({pct}٪)</span>
                    </div>
                    <div className="w-full bg-[#F4F3F8] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#F5A623] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2 DETAIL: Module Checklist */}
      {activeTab === 'training' && selectedTicket && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="text-xs text-[#524534] hover:text-[#835500] font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>بازگشت به لیست در حال آموزش</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E3E2E7] pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#1A1B1F]">
                {selectedTicket.hr?.candidateName} — {ZONE_LABEL[selectedTicket.zone]}
              </h2>
              <div className="text-xs text-[#524534] mt-1 flex gap-4">
                <span>مربی: {selectedTicket.tc?.mentor}</span>
                <span>لوکیشن: {selectedTicket.location}</span>
                <span>تاریخ شروع: {formatDate(selectedTicket.tc?.classStartDate)}</span>
              </div>
            </div>

            <button
              onClick={() => handleEnterEvaluation(selectedTicket)}
              disabled={!canEdit}
              className={`text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all ${
                canEdit ? 'md-btn-primary shadow-xs' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              <span>{canEdit ? 'ورود به مرحله ارزیابی (C1–C8)' : 'ارزیابی غیرفعال (فقط مشاهده)'}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1A1B1F]">چک‌لیست ماژول‌های آموزشی اختصاص‌یافته</h4>
            {selectedTicket.tc?.assignedModules.map(m => {
              const modInfo = modules.find(x => x.id === m.id);
              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    m.done 
                      ? 'bg-emerald-50/50 border-emerald-300' 
                      : 'bg-white border-[#E3E2E7]'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-[#1A1B1F] flex-1 select-none">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={m.done}
                      onChange={e => handleToggleModuleDone(selectedTicket, m.id, e.target.checked)}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    <span>{m.id} — {modInfo?.name}</span>
                  </label>

                  <button
                    onClick={() => onNavigateToModuleDoc(m.id)}
                    className="text-[11px] text-[#835500] hover:underline flex items-center gap-1 font-bold"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>مطالعه داک آموزشی</span>
                  </button>

                  <span className={`pl-tag ${m.done ? 'good' : 'warn'}`}>
                    {m.done ? 'تکمیل شد ✓' : 'در حال تدریس'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: In Evaluation */}
      {activeTab === 'eval' && (
        <div className="space-y-3">
          {evalTickets.length === 0 ? (
            <div className="bg-white border border-[#E3E2E7] rounded-3xl text-center py-12 text-[#524534] text-xs shadow-sm">
              هیچ نیرویی در حال حاضر در مرحله ارزیابی قرار ندارد.
            </div>
          ) : (
            evalTickets.map(t => {
              const ep = t.tc?.evalProgress || {};
              const started = Object.keys(ep).length > 0;
              return (
                <div
                  key={t.id}
                  onClick={() => setEvalPopupTicketId(t.id)}
                  className="bg-white hover:bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer flex items-center justify-between gap-4 transition-all shadow-xs"
                >
                  <div>
                    <span className="font-bold text-sm text-[#1A1B1F] block">
                      {t.hr?.candidateName}
                    </span>
                    <span className="text-xs text-[#524534] mt-1 block">
                      {ZONE_LABEL[t.zone]} · تلاش شماره {(t.tc?.evalAttempts || 0) + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`pl-tag ${started ? 'warn' : ''}`}>
                      {started ? 'در حال انجام آزمون‌ها' : 'شروع‌نشده'}
                    </span>
                    <span className="pl-tag">ارزیابی C2–C8</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Evaluation Action Popup Modal */}
      {evalPopupTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl max-w-xl w-full p-6 text-right space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setEvalPopupTicketId(null); setRetrainTicketId(null); }}
              className="absolute left-6 top-6 text-[#524534] hover:text-[#1A1B1F] text-lg w-8 h-8 rounded-full bg-[#F4F3F8] flex items-center justify-center transition-all"
            >
              ✕
            </button>

            <div>
              <h2 className="text-xl font-bold text-[#1A1B1F]">
                {evalPopupTicket.hr?.candidateName}
              </h2>
              <p className="text-xs text-[#524534] mt-1">
                {ZONE_LABEL[evalPopupTicket.zone]} · {positionLabel(positions, evalPopupTicket.position)} · {evalPopupTicket.location} · ارزیابی نوبت {(evalPopupTicket.tc?.evalAttempts || 0) + 1}
              </p>
              <p className="text-xs text-[#835500] mt-1 font-bold">
                ماژول‌های ارزیابی: {evalPopupTicket.tc?.assignedModules.map(m => m.id).join('، ') || '—'}
                {collectWeakModules(evalPopupTicket.tc?.evalProgress).length > 0 &&
                  ` · ضعیف: ${collectWeakModules(evalPopupTicket.tc?.evalProgress).join('، ')}`}
              </p>
            </div>

            {/* Stages Status Checklist */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-[#835500] mb-2">
                وضعیت مراحل سنجش — روی هر مورد کلیک کنید تا وارد آزمون مربوطه شوید:
              </h4>

              {[
                { stage: 'c2', label: 'C2 — آزمون دانش ماژول‌ها', view: 'v-eval-c2' },
                { stage: 'c3', label: 'C3 — چک‌لیست عملی ایستگاهی', view: 'v-eval-c3' },
                { stage: 'c4', label: 'C4 — مصاحبه صلاحیت با سرپرست', view: 'v-eval-c4' },
                { stage: 'c5', label: 'C5 — سناریوی شبیه‌سازی پیک', view: 'v-eval-c5' },
                { stage: 'c6', label: 'C6 — فرم نهایی صلاحیت و جمع‌بندی', view: 'v-eval-c6' },
                { stage: 'c7', label: 'C7 — پروتکل تحویل به عملیات (Handover)', view: 'v-eval-c7' },
              ].map(st => {
                const res = evalPopupTicket.tc?.evalProgress?.[st.stage];
                return (
                  <div
                    key={st.stage}
                    onClick={() => {
                      setEvalPopupTicketId(null);
                      onNavigateToEval(st.view, evalPopupTicket.id);
                    }}
                    className="p-3 rounded-2xl bg-[#FAF8FE] hover:bg-[#F4F3F8] border border-[#E3E2E7] cursor-pointer flex items-center justify-between text-xs transition-all shadow-2xs"
                  >
                    <span className="font-bold text-[#1A1B1F]">{st.label} ◀</span>
                    <span className={res?.pass ? 'text-emerald-700 font-bold' : res ? 'text-rose-600 font-bold' : 'text-[#857462]'}>
                      {res ? (res.pass ? `✅ قبولی (${res.score ?? res.avg ?? ''})` : '❌ مردود') : '⏳ انجام‌نشده'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Retrain Selector */}
            {retrainTicketId === evalPopupTicket.id && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
                <span className="font-bold text-[#835500] block">
                  کدام ماژول‌ها نیاز به بازآموزی دارند؟
                </span>
                <span className="text-[11px] text-[#524534] block">
                  ماژول‌هایی که در ارزیابی‌ها ضعیف بوده‌اند از قبل انتخاب شده‌اند.
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {evalPopupTicket.tc?.assignedModules.map(m => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer text-[#1A1B1F]">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={retrainModules.includes(m.id)}
                        onChange={e => {
                          if (e.target.checked) setRetrainModules([...retrainModules, m.id]);
                          else setRetrainModules(retrainModules.filter(x => x !== m.id));
                        }}
                        className="accent-[#F5A623]"
                      />
                      <span>{m.id} — {modules.find(x => x.id === m.id)?.name}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleConfirmRetrain}
                  disabled={!canEdit}
                  className={`font-bold px-4 py-2 rounded-xl text-xs transition-all ${
                    canEdit ? 'md-btn-primary' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  تأیید و برگشت به مرحله آموزش
                </button>
              </div>
            )}

            {/* Final Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E3E2E7]">
              <button
                onClick={() => handleReferToOps(evalPopupTicket)}
                disabled={!canEdit}
                className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
                  canEdit 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                {canEdit ? 'ارجاع به عملیات (قبول نهایی)' : 'ارجاع غیرفعال (فقط مشاهده)'}
              </button>
              <button
                onClick={() => {
                  setRetrainTicketId(evalPopupTicket.id);
                  setRetrainModules(collectWeakModules(evalPopupTicket.tc?.evalProgress));
                }}
                disabled={!canEdit}
                className={`border px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-1 transition-all ${
                  canEdit 
                    ? 'bg-amber-50 hover:bg-amber-100 text-[#835500] border-amber-300' 
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>آموزش مجدد (Retrain)</span>
              </button>
              <button
                onClick={() => handleNoCoop(evalPopupTicket)}
                disabled={!canEdit}
                className={`text-xs py-2 px-4 rounded-2xl transition-all ${
                  canEdit ? 'md-btn-danger' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                عدم همکاری (برگشت به HR)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
