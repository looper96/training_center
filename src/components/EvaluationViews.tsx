import React, { useState, useEffect, useMemo } from 'react';
import { ZoneType, PipelineTicket, QuizBank, TrainingModule, ZoneConfigs, JobPosition } from '../types/pipeline';
import { ZONE_LABEL, HANDOVER_ITEMS, CHECKIN_LABELS } from '../data/pipelineSeed';
import { SIM_SCENARIO } from '../data/pipelineEval';
import {
  MODULE_MIN_PCT,
  ModuleScore,
  buildChecklist,
  buildExam,
  buildInterview,
  buildSimCriteria,
  collectWeakModules,
  defaultModulesFor,
  evaluationModules,
  gradeChecklist,
  gradeExam,
  gradeSim,
  interviewWeakModules,
  positionLabel,
  sortModules,
  type ChecklistResult,
  type ExamResult,
  type SimResult,
} from '../lib/assessment';
import { Award, ShieldAlert, ArrowLeft, User, ShieldCheck, Layers, RefreshCw } from 'lucide-react';
import { showToast } from './Toast';
import { formatDate, nowISO } from '../lib/date';

interface EvaluationViewsProps {
  canEdit?: boolean;
  viewId: string;
  activeTicket: PipelineTicket | null;
  onSaveResult: (stageKey: string, resultData: any) => void;
  onGraduateToHandover?: (ticketId: string) => void;
  onNavigate: (viewId: string) => void;
  passingScorePct?: number;
  /** Questions drawn per module for C2 (0 = all). */
  questionsPerModule?: number;
  quizBank: QuizBank;
  modules: TrainingModule[];
  zoneConfigs: ZoneConfigs;
  positions: JobPosition[];
}

const resultTone = (pass: boolean) =>
  pass ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950';

export const EvaluationViews: React.FC<EvaluationViewsProps> = ({
  canEdit = true,
  viewId,
  activeTicket,
  onSaveResult,
  onGraduateToHandover,
  onNavigate,
  passingScorePct = 80,
  questionsPerModule = 0,
  quizBank,
  modules,
  zoneConfigs,
  positions,
}) => {
  // Candidate header state
  const [candidateName, setCandidateName] = useState(activeTicket?.hr?.candidateName || '');
  const [reviewerName, setReviewerName] = useState(activeTicket?.tc?.mentor || '');
  const [period, setPeriod] = useState('');

  // Without a linked candidate (practice / cohort run) the evaluator picks zone + modules.
  const [zone, setZone] = useState<ZoneType>(activeTicket?.zone || 'hub');
  const [manualModules, setManualModules] = useState<string[]>(() => sortModules(zoneConfigs[activeTicket?.zone || 'hub']?.mods ?? []));

  useEffect(() => {
    if (activeTicket) {
      setCandidateName(activeTicket.hr?.candidateName || '');
      if (activeTicket.tc?.mentor) setReviewerName(activeTicket.tc.mentor);
      setZone(activeTicket.zone);
    }
  }, [activeTicket]);

  const evalModules = useMemo(
    () => (activeTicket ? evaluationModules(activeTicket, zoneConfigs, positions) : manualModules),
    [activeTicket, zoneConfigs, positions, manualModules]
  );
  const modulesKey = evalModules.join(',');
  const moduleName = (id: string) => modules.find(m => m.id === id)?.name ?? id;

  // C2 — exam is drawn once per module set; "new draw" re-samples it.
  const [examDraw, setExamDraw] = useState(0);
  const exam = useMemo(
    () => buildExam(evalModules, quizBank, questionsPerModule),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modulesKey, quizBank, questionsPerModule, examDraw]
  );
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<ExamResult | null>(null);

  // C3
  const checklist = useMemo(() => buildChecklist(evalModules), [modulesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [checklistScores, setChecklistScores] = useState<Record<string, number>>({});
  const [checklistResult, setChecklistResult] = useState<ChecklistResult | null>(null);

  // C4
  const interviewQs = useMemo(() => buildInterview(evalModules), [modulesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [interviewRatings, setInterviewRatings] = useState<Record<string, 'ok' | 'bad'>>({});
  const [interviewNotes, setInterviewNotes] = useState<Record<string, string>>({});
  const [interviewFinal, setInterviewFinal] = useState<'yes' | 'no' | ''>('');
  const [interviewResult, setInterviewResult] = useState<{ pass: boolean; summary: string; weakModules: string[] } | null>(null);

  // C5
  const simCriteria = useMemo(() => buildSimCriteria(evalModules), [modulesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [simScores, setSimScores] = useState<Record<string, number>>({});
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  // A different module set means a different test: clear answers and shown results.
  useEffect(() => {
    setQuizAnswers({});
    setQuizResult(null);
  }, [exam]);
  useEffect(() => {
    setChecklistScores({});
    setChecklistResult(null);
    setInterviewRatings({});
    setInterviewNotes({});
    setInterviewResult(null);
    setSimScores({});
    setSimResult(null);
  }, [modulesKey]);

  // C6 state
  const [finalDecision, setFinalDecision] = useState<'pass' | 'conditional' | 'repeat' | ''>(
    (activeTicket?.tc?.evalDecision as any) || ''
  );
  const [finalResult, setFinalResult] = useState<{ decision: string; date: string } | null>(null);

  // C7 state
  const [handoverChecks, setHandoverChecks] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true, 4: true });
  const [buddyName, setBuddyName] = useState(activeTicket?.tc?.outcome?.buddy || '');
  const [handoverResult, setHandoverResult] = useState<boolean | null>(null);

  // C8 state
  const [c8Day, setC8Day] = useState<number>(30);
  const [c8Employed, setC8Employed] = useState<'yes' | 'no'>('yes');
  const [c8Qc, setC8Qc] = useState<number>(0);
  const [c8Note, setC8Note] = useState('');
  const [c8Status, setC8Status] = useState<'normal' | 'retrain' | 'corrective'>('normal');
  const [c8Saved, setC8Saved] = useState(false);

  const readOnlyToast = () => showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
  const common = () => ({ zone, modules: evalModules, candidateName, reviewerName, period });

  // Header helper
  const renderHeaderFields = () => (
    <div className="space-y-3 mb-5">
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-[#835500] shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5">حالت فقط مشاهده ارزیابی‌ها (Read-Only)</strong>
            <span>
              حساب کاربری شما دارای دسترسی مشاهده آزمون‌ها و چک‌لیست‌های ارزیابی است. امکان ثبت یا تغییر نمره، تایید آزمون و انتقال داوطلب در این حالت غیرفعال می‌باشد.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#524534] mb-1">نام نیرو / کاندیدا:</label>
          <input
            type="text"
            disabled={!canEdit}
            value={candidateName}
            onChange={e => setCandidateName(e.target.value)}
            className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F5A623] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#524534] mb-1">ارزیاب / سرپرست:</label>
          <input
            type="text"
            disabled={!canEdit}
            value={reviewerName}
            onChange={e => setReviewerName(e.target.value)}
            className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F5A623] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#524534] mb-1">دوره / تاریخ ارزیابی:</label>
          <input
            type="text"
            disabled={!canEdit}
            placeholder="مثلاً هفته ۳۴ - ۱۴۰۴"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F5A623] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );

  /** Shows which modules this evaluation covers; without a candidate, lets the evaluator choose them. */
  const renderModuleScope = () => (
    <div className="bg-[#FAF8FE] border border-[#E3E2E7] rounded-2xl p-4 mb-4 space-y-3 text-xs">
      <div className="flex items-center gap-2 font-bold text-[#835500]">
        <Layers className="w-4 h-4" />
        <span>ماژول‌های مورد ارزیابی</span>
        {activeTicket && (
          <span className="font-normal text-[#524534]">
            — بخش: {positionLabel(positions, activeTicket.position)} · {ZONE_LABEL[activeTicket.zone]}
          </span>
        )}
      </div>

      {activeTicket ? (
        <div className="flex flex-wrap gap-1.5">
          {evalModules.map(id => (
            <span key={id} className="bg-white border border-[#F5A623]/50 text-[#835500] font-bold px-2.5 py-1 rounded-full">
              {id} — {moduleName(id)}
            </span>
          ))}
        </div>
      ) : (
        <>
          <p className="text-[11px] text-[#524534]">
            داوطلبی انتخاب نشده است. برای ارزیابی یک نیرو از صفحه Training Center وارد شوید؛ یا زون و ماژول‌ها را دستی انتخاب کنید.
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['hub', 'superhub', 'irancell'] as ZoneType[]).map(z => (
              <button
                key={z}
                onClick={() => {
                  setZone(z);
                  setManualModules(defaultModulesFor(z, undefined, zoneConfigs, positions));
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  zone === z ? 'bg-[#F5A623] text-[#1A1B1F] shadow-xs' : 'bg-white text-[#524534] hover:bg-[#FAF8FE] border border-[#E3E2E7]'
                }`}
              >
                {ZONE_LABEL[z]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {modules.map(m => {
              const on = manualModules.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() =>
                    setManualModules(prev => (on ? prev.filter(x => x !== m.id) : sortModules([...prev, m.id])))
                  }
                  className={`px-2.5 py-1 rounded-full border transition-all ${
                    on ? 'bg-[#F5A623]/15 border-[#F5A623] text-[#835500] font-bold' : 'bg-white border-[#E3E2E7] text-[#524534]'
                  }`}
                >
                  {m.id} — {m.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {evalModules.length === 0 && (
        <div className="text-rose-700 font-bold">هیچ ماژولی انتخاب نشده است.</div>
      )}
    </div>
  );

  /** Per-module scores; a module is shown in red only when the stage flagged it as weak. */
  const renderModuleBreakdown = (byModule: Record<string, ModuleScore>, unit: 'answer' | 'point', weak: string[] = []) => (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {Object.entries(byModule)
        .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
        .map(([id, s]) => {
          const ok = !weak.includes(id);
          return (
            <div key={id} className="bg-white/70 border border-current/10 rounded-xl px-3 py-1.5 flex justify-between gap-2">
              <span>{id} — {moduleName(id)}</span>
              <span className={`font-bold ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                {s.pct}٪ ({s.correct} از {s.total}{unit === 'point' ? ' امتیاز' : ''})
              </span>
            </div>
          );
        })}
    </div>
  );

  const renderWeak = (weak: string[]) =>
    weak.length > 0 && (
      <div className="mt-2 text-[11px]">
        ماژول‌های نیازمند بازآموزی: <b>{weak.map(id => `${id} (${moduleName(id)})`).join('، ')}</b>
      </div>
    );

  const moduleTag = (id?: string) =>
    id ? (
      <span className="bg-white border border-[#E3E2E7] px-2 py-0.5 rounded text-[10px] text-[#835500] font-bold shrink-0">{id}</span>
    ) : (
      <span className="bg-white border border-[#E3E2E7] px-2 py-0.5 rounded text-[10px] text-[#524534] shrink-0">عمومی</span>
    );

  // C2 Submit
  const handleQuizSubmit = () => {
    if (!canEdit) return readOnlyToast();
    if (exam.length === 0) {
      showToast('برای ماژول‌های انتخاب‌شده سوالی در بانک آزمون وجود ندارد.', 'warning');
      return;
    }
    const unanswered = exam.filter(q => quizAnswers[q.key] === undefined).length;
    if (unanswered > 0 && !confirm(`${unanswered} سوال بی‌پاسخ است و غلط حساب می‌شود. ثبت شود؟`)) return;
    const res = gradeExam(exam, quizAnswers, passingScorePct);
    setQuizResult(res);
    onSaveResult('c2', { ...res, ...common(), questionKeys: exam.map(q => q.key) });
    showToast(res.pass ? 'نتیجه آزمون ثبت شد: قبولی داوطلب ✅' : 'نتیجه آزمون ثبت شد: عدم احراز حد نصاب ❌', res.pass ? 'success' : 'info');
  };

  // C3 Submit
  const handleChecklistSubmit = () => {
    if (!canEdit) return readOnlyToast();
    const res = gradeChecklist(checklist, checklistScores);
    setChecklistResult(res);
    onSaveResult('c3', { ...res, ...common() });
    showToast('چک‌لیست ارزیابی عملی ایستگاهی با موفقیت ثبت شد.', 'success');
  };

  // C4 Submit
  const handleInterviewSubmit = () => {
    if (!canEdit) return readOnlyToast();
    if (!interviewFinal) {
      showToast('لطفاً نظر نهایی مصاحبه‌کننده را انتخاب کنید.', 'warning');
      return;
    }
    const pass = interviewFinal === 'yes';
    const bad = interviewQs.filter(q => interviewRatings[q.key] === 'bad').length;
    const summary = `${interviewQs.length - bad} پاسخ مناسب از ${interviewQs.length} سوال`;
    const weakModules = interviewWeakModules(interviewQs, interviewRatings);
    setInterviewResult({ pass, summary, weakModules });
    onSaveResult('c4', { pass, summary, weakModules, notes: interviewNotes, ...common() });
    showToast('نتیجه مصاحبه صلاحیت با موفقیت ثبت شد.', 'success');
  };

  // C5 Submit
  const handleSimSubmit = () => {
    if (!canEdit) return readOnlyToast();
    const res = gradeSim(simCriteria, simScores);
    setSimResult(res);
    onSaveResult('c5', { ...res, ...common() });
    showToast('نتیجه شبیه‌سازی پیک عملیاتی ثبت شد.', 'success');
  };

  // C6 Submit
  const handleFinalSubmit = () => {
    if (!canEdit) return readOnlyToast();
    if (!finalDecision) {
      showToast('لطفاً تصمیم نهایی را انتخاب فرمایید.', 'warning');
      return;
    }
    const res = { decision: finalDecision, date: nowISO() };
    setFinalResult(res);
    onSaveResult('c6', { ...res, ...common(), weakModules, pass: finalDecision === 'pass' });
    showToast('تصمیم نهایی فرم تأیید صلاحیت ثبت گردید.', 'success');
  };

  // C7 Submit
  const handleHandoverSubmit = () => {
    if (!canEdit) return readOnlyToast();
    const allDone = Object.values(handoverChecks).every(Boolean) && buddyName.trim().length > 0;
    setHandoverResult(allDone);
    onSaveResult('c7', { pass: allDone, buddy: buddyName, candidateName });
    showToast('پروتکل تحویل نیرو به سرپرست شعبه ثبت شد.', 'success');
  };

  // C8 Submit
  const handleC8Submit = () => {
    if (!canEdit) return readOnlyToast();
    setC8Saved(true);
    onSaveResult('c8', { day: c8Day, employed: c8Employed, qc: c8Qc, note: c8Note, status: c8Status, pass: c8Status === 'normal' });
    showToast(`چک‌این روز ${c8Day} با موفقیت ثبت شد.`, 'success');
  };

  // Dynamic Pulls for C6
  const evalProg = activeTicket?.tc?.evalProgress || {};
  const weakModules = collectWeakModules(evalProg);
  const submitButton = (onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      disabled={!canEdit}
      className={`px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm ${
        canEdit ? 'bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F]' : 'bg-stone-200 text-stone-500 cursor-not-allowed'
      }`}
    >
      {canEdit ? label : `${label} (فقط مشاهده)`}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Linked Candidate Banner if active */}
      {activeTicket && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              در حال ثبت ارزیابی برای: <strong className="font-bold">{activeTicket.hr?.candidateName || activeTicket.location}</strong> ({ZONE_LABEL[activeTicket.zone]} · {activeTicket.location} · بخش {positionLabel(positions, activeTicket.position)})
            </span>
          </div>
          <button
            onClick={() => onNavigate('v-pl-tc')}
            className="text-[#835500] hover:underline font-bold self-start sm:self-auto flex items-center gap-1"
          >
            <span>بازگشت به Training Center</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VIEW: C1 Overview */}
      {viewId === 'v-eval' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs">
            <span className="inline-flex items-center gap-1.5 bg-[#F5A623]/15 text-[#835500] text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>قدم نهایی سفر نیوجوینر — چارچوب ارزیابی Kirkpatrick</span>
            </span>
            <h1 className="text-2xl font-black text-[#1A1B1F] mb-2">
              ارزیابی نهایی و تحویل به عملیات (مدل ۴ سطحی)
            </h1>
            <p className="text-xs text-[#524534] max-w-3xl leading-relaxed">
              ارزیابی هر نیرو بر اساس بخشی که برای آن استخدام شده و ماژول‌هایی که در Training Center آموزش دیده انجام می‌شود:
              سوالات آزمون، موارد چک‌لیست عملی، سوالات سناریویی مصاحبه و معیارهای شبیه‌سازی فقط از همان ماژول‌ها انتخاب می‌شوند
              و نتیجه به تفکیک ماژول ثبت می‌شود تا ماژول‌های ضعیف برای بازآموزی مشخص شوند.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-center">
                <b className="text-sm text-[#835500] block mb-1">۱. واکنش</b>
                <span className="text-[11px] text-[#524534]">نظرسنجی پایان دوره</span>
              </div>
              <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-center">
                <b className="text-sm text-[#835500] block mb-1">۲. یادگیری</b>
                <span className="text-[11px] text-[#524534]">آزمون دانش ماژول‌ها (C2)</span>
              </div>
              <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-center">
                <b className="text-sm text-[#835500] block mb-1">۳. رفتار</b>
                <span className="text-[11px] text-[#524534]">ارزیابی عملی + شبیه‌سازی (C3-C5)</span>
              </div>
              <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-center">
                <b className="text-sm text-[#835500] block mb-1">۴. نتیجه</b>
                <span className="text-[11px] text-[#524534]">پایش KPI در ۳۰/۶۰/۹۰ روز (C8)</span>
              </div>
            </div>
          </div>

          {/* Roadmap Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border-t-4 border-t-[#F5A623] p-5 rounded-3xl border border-[#E3E2E7] shadow-xs">
              <h4 className="text-xs font-bold text-[#835500] mb-2">🌅 صبح روز پایانی</h4>
              <ul className="text-xs text-[#524534] space-y-1.5 list-disc pr-4">
                <li>آزمون دانش/تئوری (C2)</li>
                <li>چک‌لیست ارزیابی عملی ایستگاهی (C3)</li>
              </ul>
            </div>
            <div className="bg-white border-t-4 border-t-[#F5A623] p-5 rounded-3xl border border-[#E3E2E7] shadow-xs">
              <h4 className="text-xs font-bold text-[#835500] mb-2">☀️ ظهر روز پایانی</h4>
              <ul className="text-xs text-[#524534] space-y-1.5 list-disc pr-4">
                <li>مصاحبه صلاحیت با سرپرست (C4)</li>
                <li>شبیه‌سازی پیک B2B + B2C (C5)</li>
              </ul>
            </div>
            <div className="bg-white border-t-4 border-t-[#F5A623] p-5 rounded-3xl border border-[#E3E2E7] shadow-xs">
              <h4 className="text-xs font-bold text-[#835500] mb-2">🌆 عصر روز پایانی</h4>
              <ul className="text-xs text-[#524534] space-y-1.5 list-disc pr-4">
                <li>فرم نهایی تأیید صلاحیت (C6)</li>
                <li>جلسه تحویل ساختاریافته به عملیات (C7)</li>
              </ul>
            </div>
            <div className="bg-white border-t-4 border-t-[#F5A623] p-5 rounded-3xl border border-[#E3E2E7] shadow-xs">
              <h4 className="text-xs font-bold text-[#835500] mb-2">📅 روزهای ۳۰ / ۶۰ / ۹۰</h4>
              <ul className="text-xs text-[#524534] space-y-1.5 list-disc pr-4">
                <li>پایش ساختاریافته ماندگاری (C8)</li>
                <li>نرخ عدم انطباق کیفی QC و مسیر تشدید</li>
              </ul>
            </div>
          </div>

          {/* Quick Links to C2-C8 */}
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1A1B1F]">ورود به فرم‌ها و آزمون‌های سنجش صلاحیت:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'v-eval-c2', title: 'C2 — آزمون دانش و تئوری', desc: `سوالات چهارگزینه‌ای از ماژول‌های نیرو (حداقل قبولی ${passingScorePct}٪)` },
                { id: 'v-eval-c3', title: 'C3 — چک‌لیست عملی ایستگاهی', desc: 'مشاهده سر ایستگاه‌های ماژول‌های نیرو' },
                { id: 'v-eval-c4', title: 'C4 — مصاحبه صلاحیت رفتاری', desc: 'سوالات عمومی + سناریوی هر ماژول' },
                { id: 'v-eval-c5', title: 'C5 — شبیه‌سازی پیک عملیاتی', desc: 'معیارهای عمومی + معیار هر ماژول' },
                { id: 'v-eval-c6', title: 'C6 — فرم نهایی تأیید صلاحیت', desc: 'جمع‌بندی C2 تا C5 و ماژول‌های ضعیف' },
                { id: 'v-eval-c7', title: 'C7 — پروتکل تحویل به عملیات', desc: 'جلسه تحویل + تعیین Buddy روز اول' },
                { id: 'v-eval-c8', title: 'C8 — پایش ۳۰/۶۰/۹۰ روزه', desc: 'چک‌این‌های دوره‌ای و رصد نرخ خطا' },
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="bg-[#FAF8FE] hover:bg-[#F3EEFA] p-4 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div>
                    <b className="text-xs font-bold text-[#1A1B1F] group-hover:text-[#835500] block mb-1">{item.title}</b>
                    <span className="text-[11px] text-[#524534]">{item.desc}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-end text-[11px] text-[#835500] font-bold">
                    <span>ورود به آزمون ◀</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: C2 Quiz */}
      {viewId === 'v-eval-c2' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E3E2E7] pb-4">
            <div>
              <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-bold font-mono">C2</span>
              <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">آزمون دانش/تئوری پایان دوره</h2>
              <p className="text-xs text-[#524534]">
                {exam.length} سوال از محتوای ماژول‌های آموزش‌دیده
                {questionsPerModule > 0 && ` (حداکثر ${questionsPerModule} سوال از هر ماژول)`}
                {' '}— حداقل نمره قبولی {passingScorePct}٪ و هیچ ماژولی زیر {MODULE_MIN_PCT}٪
              </p>
            </div>
            <button onClick={() => onNavigate('v-eval')} className="text-xs text-[#524534] hover:text-[#1A1B1F] flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>بازگشت به ارزیابی</span>
            </button>
          </div>

          {renderHeaderFields()}
          {renderModuleScope()}

          {questionsPerModule > 0 && canEdit && (
            <button
              onClick={() => setExamDraw(d => d + 1)}
              className="text-xs text-[#835500] font-bold flex items-center gap-1.5 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>قرعه‌کشی مجدد سوالات (آزمون جدید)</span>
            </button>
          )}

          <div className="space-y-4">
            {exam.map((q, qIdx) => {
              const firstOfModule = qIdx === 0 || exam[qIdx - 1].moduleId !== q.moduleId;
              return (
                <React.Fragment key={q.key}>
                  {firstOfModule && (
                    <h3 className="text-xs font-black text-[#835500] pt-2">
                      {q.moduleId} — {moduleName(q.moduleId)}
                    </h3>
                  )}
                  <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] space-y-3 text-xs">
                    <span className="font-bold text-[#1A1B1F] block">{qIdx + 1}. {q.q}</span>
                    <div className="space-y-1.5 pr-2">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                            quizAnswers[q.key] === optIdx
                              ? 'bg-amber-100/70 text-[#835500] font-bold border border-amber-300'
                              : 'hover:bg-white text-[#524534]'
                          } ${!canEdit ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          <input
                            type="radio"
                            disabled={!canEdit}
                            name={`q_${q.key}`}
                            checked={quizAnswers[q.key] === optIdx}
                            onChange={() => setQuizAnswers(prev => ({ ...prev, [q.key]: optIdx }))}
                            className="accent-[#F5A623]"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            {exam.length === 0 && (
              <div className="text-xs text-[#524534] bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7]">
                برای ماژول‌های انتخاب‌شده سوالی در بانک آزمون ثبت نشده است. از پنل مدیریت ← «بانک آزمون تئوری» سوال اضافه کنید.
              </div>
            )}
          </div>

          <div className="pt-2">{submitButton(handleQuizSubmit, 'ثبت و محاسبه نمره آزمون C2')}</div>

          {quizResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${resultTone(quizResult.pass)}`}>
              <b>
                نتیجه آزمون: {quizResult.score}٪ ({quizResult.correct} از {quizResult.total} صحیح) —{' '}
                {quizResult.pass ? 'قبول ✅' : `مردود ❌ (حداقل ${passingScorePct}٪ کل و ${MODULE_MIN_PCT}٪ در هر ماژول)`}
              </b>
              {renderModuleBreakdown(quizResult.byModule, 'answer', quizResult.weakModules)}
              {renderWeak(quizResult.weakModules)}
            </div>
          )}
        </div>
      )}

      {/* VIEW: C3 Checklist */}
      {viewId === 'v-eval-c3' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E3E2E7] pb-4">
            <div>
              <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-bold font-mono">C3</span>
              <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">چک‌لیست ارزیابی عملی ایستگاهی</h2>
              <p className="text-xs text-[#524534]">مشاهده در طول شیفت کامل — فقط ایستگاه‌ها و تسک‌های ماژول‌های این نیرو</p>
            </div>
            <button onClick={() => onNavigate('v-eval')} className="text-xs text-[#524534] hover:text-[#1A1B1F] flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>بازگشت</span>
            </button>
          </div>

          {renderHeaderFields()}
          {renderModuleScope()}

          <div className="space-y-2 text-xs">
            {checklist.map((it, idx) => (
              <div
                key={it.key}
                className={`p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E3E2E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  it.safety ? 'border-r-4 border-r-amber-500' : ''
                }`}
              >
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {moduleTag(it.moduleId)}
                  <span>{idx + 1}. {it.step}</span>
                  {it.ref && <span className="bg-white border border-[#E3E2E7] px-2 py-0.5 rounded text-[10px] text-[#524534]">{it.ref}</span>}
                  {it.safety && <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">⚠ ایمنی</span>}
                </div>

                <select
                  disabled={!canEdit}
                  value={checklistScores[it.key] ?? 1}
                  onChange={e => setChecklistScores(prev => ({ ...prev, [it.key]: Number(e.target.value) }))}
                  className="bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="0">نیاز به تمرین (۰)</option>
                  <option value="1">در مسیر درست (۱)</option>
                  <option value="2">قوی (۲)</option>
                </select>
              </div>
            ))}
          </div>

          <div className="pt-2">{submitButton(handleChecklistSubmit, 'ثبت و محاسبه ارزیابی C3')}</div>

          {checklistResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${resultTone(checklistResult.pass)}`}>
              <b>نتیجه ارزیابی عملی: {checklistResult.score}٪ — {checklistResult.pass ? 'قبول ✅' : 'مردود ❌'}</b>
              {checklistResult.reason && <div className="mt-1">{checklistResult.reason}</div>}
              {renderModuleBreakdown(checklistResult.byModule, 'point', checklistResult.weakModules)}
              {renderWeak(checklistResult.weakModules)}
            </div>
          )}
        </div>
      )}

      {/* VIEW: C4 Interview */}
      {viewId === 'v-eval-c4' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E3E2E7] pb-4">
            <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-mono font-bold">C4</span>
            <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">مصاحبه صلاحیت با سرآشپز/سرپرست</h2>
            <p className="text-xs text-[#524534]">۱۵ تا ۲۰ دقیقه — سوالات رفتاری عمومی + یک سناریوی عملیاتی از هر ماژول این نیرو</p>
          </div>

          {renderHeaderFields()}
          {renderModuleScope()}

          <div className="space-y-4 text-xs">
            {interviewQs.map((q, idx) => (
              <div key={q.key} className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] space-y-2">
                <div className="flex items-center gap-2">
                  {moduleTag(q.moduleId)}
                  <span className="font-bold text-[#1A1B1F]">{idx + 1}. {q.text}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    disabled={!canEdit}
                    value={interviewRatings[q.key] || 'ok'}
                    onChange={e => setInterviewRatings(prev => ({ ...prev, [q.key]: e.target.value as 'ok' | 'bad' }))}
                    className="bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 sm:w-44 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="ok">مناسب و قابل قبول</option>
                    <option value="bad">نیاز به بهبود</option>
                  </select>
                  <input
                    type="text"
                    disabled={!canEdit}
                    placeholder="یادداشت و مشاهدات پاسخ داوطلب..."
                    value={interviewNotes[q.key] || ''}
                    onChange={e => setInterviewNotes(prev => ({ ...prev, [q.key]: e.target.value }))}
                    className="flex-1 bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F5A623] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ))}

            <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7]">
              <label className="block text-[#524534] font-bold mb-1.5">تأیید نهایی صلاحیت رفتاری توسط مصاحبه‌کننده:</label>
              <select
                disabled={!canEdit}
                value={interviewFinal}
                onChange={e => setInterviewFinal(e.target.value as 'yes' | 'no')}
                className="bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs max-w-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">— انتخاب نظر نهایی —</option>
                <option value="yes">بله — تأیید صلاحیت رفتاری</option>
                <option value="no">خیر — عدم تأیید</option>
              </select>
            </div>
          </div>

          <div className="pt-2">{submitButton(handleInterviewSubmit, 'ثبت نتیجه مصاحبه C4')}</div>

          {interviewResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${resultTone(interviewResult.pass)}`}>
              <b>وضعیت مصاحبه: {interviewResult.pass ? 'تأیید صلاحیت ✅' : 'عدم تأیید ❌'} ({interviewResult.summary})</b>
              {renderWeak(interviewResult.weakModules)}
            </div>
          )}
        </div>
      )}

      {/* VIEW: C5 Simulation */}
      {viewId === 'v-eval-c5' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E3E2E7] pb-4">
            <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-bold font-mono">C5</span>
            <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">سناریوی شبیه‌سازی پیک عملیاتی</h2>
            <p className="text-xs text-[#524534]">تست استرس زیر فشار حجم واقعی سفارشات — معیارها بر اساس ماژول‌های این نیرو</p>
          </div>

          {renderHeaderFields()}
          {renderModuleScope()}

          <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-xs leading-relaxed text-[#524534] mb-4">
            <strong className="text-[#835500] block mb-1">سناریوی آزمون ({ZONE_LABEL[zone]}):</strong>
            {SIM_SCENARIO[zone]}
          </div>

          <div className="space-y-3 text-xs">
            {simCriteria.map(c => (
              <div key={c.key} className="p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E3E2E7] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {moduleTag(c.moduleId)}
                  <span className="font-bold text-[#1A1B1F]">{c.text}</span>
                  {c.safety && <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">(الزامی: ۵ از ۵)</span>}
                </div>
                <select
                  disabled={!canEdit}
                  value={simScores[c.key] ?? 4}
                  onChange={e => setSimScores(prev => ({ ...prev, [c.key]: Number(e.target.value) }))}
                  className="bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="1">۱ — ضعیف</option>
                  <option value="2">۲ — کمتر از انتظار</option>
                  <option value="3">۳ — متوسط</option>
                  <option value="4">۴ — خوب</option>
                  <option value="5">۵ — عالی</option>
                </select>
              </div>
            ))}
          </div>

          <div className="pt-2">{submitButton(handleSimSubmit, 'ثبت نتیجه شبیه‌سازی پیک C5')}</div>

          {simResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${resultTone(simResult.pass)}`}>
              <b>نتیجه شبیه‌سازی: میانگین {simResult.avg} از ۵ — {simResult.pass ? 'قبول ✅' : 'مردود ❌'}</b>
              {simResult.reason && <div className="mt-1">{simResult.reason}</div>}
              {renderWeak(simResult.weakModules)}
            </div>
          )}
        </div>
      )}

      {/* VIEW: C6 Final Certification Form */}
      {viewId === 'v-eval-c6' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E3E2E7] pb-4">
            <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-mono font-bold">C6</span>
            <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">فرم نهایی تأیید صلاحیت</h2>
            <p className="text-xs text-[#524534]">جمع‌بندی نتایج C2 تا C5 به تفکیک ماژول و تصمیم‌گیری نهایی مربی</p>
          </div>

          {renderHeaderFields()}
          {renderModuleScope()}

          {/* Dynamic Pulls from Active Ticket */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-[#835500] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#835500]" />
              <span>نتایج ثبت‌شده برای داوطلب ({candidateName || '—'}):</span>
            </h4>

            {[
              { key: 'c2', label: 'C2 — آزمون دانش و تئوری', value: (r: any) => `${r.score}٪` },
              { key: 'c3', label: 'C3 — چک‌لیست عملی ایستگاهی', value: (r: any) => `${r.score}٪` },
              { key: 'c4', label: 'C4 — مصاحبه صلاحیت رفتاری', value: (r: any) => (r.pass ? 'تأیید شد' : 'تأیید نشد') },
              { key: 'c5', label: 'C5 — شبیه‌سازی پیک عملیاتی', value: (r: any) => `میانگین ${r.avg} از ۵` },
            ].map(st => {
              const r = evalProg[st.key];
              return (
                <div key={st.key} className="p-3.5 bg-[#FAF8FE] rounded-2xl border border-[#E3E2E7] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#1A1B1F]">{st.label}:</span>
                    {r ? (
                      <span className={r.pass ? 'text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full' : 'text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full'}>
                        {st.value(r)} ({r.pass ? 'قبول' : 'مردود'})
                      </span>
                    ) : (
                      <span className="text-[#524534] bg-stone-100 px-2 py-0.5 rounded">ثبت نشده</span>
                    )}
                  </div>
                  {r?.byModule && renderModuleBreakdown(r.byModule, st.key === 'c3' ? 'point' : 'answer', r.weakModules ?? [])}
                </div>
              );
            })}

            <div className={`p-3.5 rounded-2xl border ${weakModules.length ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'}`}>
              {weakModules.length ? (
                <>
                  <b>ماژول‌های ضعیف در ارزیابی‌ها:</b> {weakModules.map(id => `${id} (${moduleName(id)})`).join('، ')}
                  <div className="text-[11px] mt-1">در صورت «عبور مشروط» یا «تکرار دوره»، همین ماژول‌ها برای بازآموزی پیشنهاد می‌شوند.</div>
                </>
              ) : (
                <b>هیچ ماژول ضعیفی در نتایج ثبت‌شده دیده نشد.</b>
              )}
            </div>
          </div>

          <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] space-y-2 text-xs">
            <label className="block text-[#524534] font-bold">تصمیم نهایی مربی و سرپرست آموزش:</label>
            <select
              disabled={!canEdit}
              value={finalDecision}
              onChange={e => setFinalDecision(e.target.value as any)}
              className="bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs max-w-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">— انتخاب تصمیم —</option>
              <option value="pass">قبول — ورود به عملیات و معرفی به شعبه</option>
              <option value="conditional">عبور مشروط — بازآموزی نقطه‌ای ماژول‌های ضعیف</option>
              <option value="repeat">تکرار ماژول‌های ضعیف دوره آموزشی</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {submitButton(handleFinalSubmit, 'ثبت تصمیم نهایی C6')}

            {/* Flow to Handover */}
            {finalDecision === 'pass' && activeTicket && onGraduateToHandover && canEdit && (
              <button
                onClick={() => {
                  onGraduateToHandover(activeTicket.id);
                  onNavigate('v-pl-handover');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-full text-xs shadow-sm flex items-center gap-2"
              >
                <span>انتقال مستقیم به مرحله تحویل به عملیات (Handover)</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {finalResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs leading-relaxed">
              فرم نهایی صلاحیت در تاریخ {formatDate(finalResult.date)} با تصمیم «
              {finalResult.decision === 'pass' ? 'قبول و معرفی به عملیات' : finalResult.decision === 'conditional' ? 'عبور مشروط' : 'تکرار ماژول‌های ضعیف'}
              » ثبت شد.
            </div>
          )}
        </div>
      )}

      {/* VIEW: C7 Handover Protocol */}
      {viewId === 'v-eval-c7' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E3E2E7] pb-4">
            <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-mono font-bold">C7</span>
            <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">پروتکل تحویل ساختاریافته به عملیات (Handover)</h2>
            <p className="text-xs text-[#524534]">جلسه با سرپرست پذیرنده و تعیین همراه روز اول (Buddy)</p>
          </div>

          {renderHeaderFields()}

          <div className="space-y-2 text-xs">
            {HANDOVER_ITEMS.map((item, idx) => (
              <label
                key={idx}
                className={`p-3.5 bg-[#FAF8FE] rounded-2xl border border-[#E3E2E7] flex items-center justify-between gap-3 ${
                  canEdit ? 'cursor-pointer hover:bg-[#F3EEFA]' : 'cursor-not-allowed opacity-80'
                }`}
              >
                <span>{idx + 1}. {item}</span>
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={Boolean(handoverChecks[idx])}
                  onChange={e => setHandoverChecks(prev => ({ ...prev, [idx]: e.target.checked }))}
                  className="accent-[#F5A623] w-4 h-4"
                />
              </label>
            ))}
          </div>

          <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-xs">
            <label className="block text-[#524534] font-bold mb-1">همراه روز اول در شعبه (Buddy):</label>
            <input
              type="text"
              disabled={!canEdit}
              value={buddyName}
              onChange={e => setBuddyName(e.target.value)}
              className="bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 max-w-sm w-full focus:outline-none focus:border-[#F5A623] disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleHandoverSubmit}
              disabled={!canEdit}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm ${
                canEdit 
                  ? 'bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F]' 
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              {canEdit ? 'ثبت تحویل رسمی به عملیات' : 'ثبت تحویل رسمی به عملیات (فقط مشاهده)'}
            </button>
          </div>

          {handoverResult !== null && (
            <div className={`p-4 rounded-2xl border text-xs ${
              handoverResult ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              {handoverResult ? 'جلسه تحویل با موفقیت ثبت شد و Buddy تخصیص یافت ✅' : 'برخی از موارد چک‌لیست تحویل هنوز تکمیل نشده است.'}
            </div>
          )}
        </div>
      )}

      {/* VIEW: C8 Monitoring */}
      {viewId === 'v-eval-c8' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E3E2E7] pb-4">
            <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-mono font-bold">C8</span>
            <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">پایش ساختاریافته ۳۰ / ۶۰ / ۹۰ روزه</h2>
            <p className="text-xs text-[#524534]">سطح ۴ Kirkpatrick — اطمینان از اثربخشی پایدار در عملیات واقعی و مسیر تشدید</p>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2">
            {[30, 60, 90].map(d => (
              <button
                key={d}
                onClick={() => setC8Day(d)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  c8Day === d
                    ? 'bg-[#F5A623] text-[#1A1B1F] shadow-xs'
                    : 'bg-white text-[#524534] border border-[#E3E2E7] hover:bg-[#FAF8FE]'
                }`}
              >
                روز {d}
              </button>
            ))}
          </div>

          {renderHeaderFields()}

          <div className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block text-[#524534] font-bold mb-1">{CHECKIN_LABELS[0]}</label>
              <select
                disabled={!canEdit}
                value={c8Employed}
                onChange={e => setC8Employed(e.target.value as any)}
                className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="yes">بله — همچنان در شعبه فعال است</option>
                <option value="no">خیر — قطع همکاری یا جابجایی</option>
              </select>
            </div>

            <div>
              <label className="block text-[#524534] font-bold mb-1">{CHECKIN_LABELS[1]}</label>
              <input
                type="number"
                disabled={!canEdit}
                min="0"
                value={c8Qc}
                onChange={e => setC8Qc(Number(e.target.value))}
                className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[#524534] font-bold mb-1">{CHECKIN_LABELS[2]}</label>
              <textarea
                disabled={!canEdit}
                rows={2}
                value={c8Note}
                onChange={e => setC8Note(e.target.value)}
                className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[#524534] font-bold mb-1">{CHECKIN_LABELS[3]}</label>
              <select
                disabled={!canEdit}
                value={c8Status}
                onChange={e => setC8Status(e.target.value as any)}
                className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="normal">عادی و رضایت‌بخش ✅</option>
                <option value="retrain">نیاز به بازآموزی نقطه‌ای ⚠️</option>
                <option value="corrective">نیاز به جلسه اصلاحی با سرپرست ❌</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={handleC8Submit}
                disabled={!canEdit}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                  canEdit 
                    ? 'bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F]' 
                    : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                }`}
              >
                {canEdit ? `ثبت چک‌این روز ${c8Day}` : `ثبت چک‌این روز ${c8Day} (فقط مشاهده)`}
              </button>
            </div>

            {c8Saved && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs">
                گزارش پایش روز {c8Day} با موفقیت ثبت شد.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
