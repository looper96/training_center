import React, { useState, useEffect } from 'react';
import { ZoneType, PipelineTicket } from '../types/pipeline';
import { ZONE_LABEL, HANDOVER_ITEMS, CHECKIN_LABELS, INTERVIEW_Q } from '../data/pipelineSeed';
import { QUIZ, CHECKLIST, SIM } from '../data/pipelineEval';
import { Award, CheckCircle2, AlertTriangle, ShieldAlert, ArrowLeft, RotateCcw, HelpCircle, Check, X, User, ExternalLink, ShieldCheck } from 'lucide-react';
import { showToast } from './Toast';
import { formatDate, nowISO } from '../lib/date';

interface EvaluationViewsProps {
  canEdit?: boolean;
  viewId: string;
  activeTicket: PipelineTicket | null;
  tickets?: PipelineTicket[];
  onSelectCandidateTicket?: (ticketId: string) => void;
  onSaveResult: (stageKey: string, resultData: any) => void;
  onGraduateToHandover?: (ticketId: string) => void;
  onNavigate: (viewId: string) => void;
  passingScorePct?: number;
}

export const EvaluationViews: React.FC<EvaluationViewsProps> = ({
  canEdit = true,
  viewId,
  activeTicket,
  tickets = [],
  onSelectCandidateTicket,
  onSaveResult,
  onGraduateToHandover,
  onNavigate,
  passingScorePct = 80
}) => {
  // Candidate header state
  const [candidateName, setCandidateName] = useState(activeTicket?.hr?.candidateName || 'علی رضایی');
  const [reviewerName, setReviewerName] = useState(activeTicket?.tc?.mentor || 'زهرا مرادی (مربی TC)');
  const [period, setPeriod] = useState('هفته ۳۴ - ۱۴۰۴');

  // Zone selector for C2, C3, C5, C6
  const [zone, setZone] = useState<ZoneType>(activeTicket?.zone || 'hub');

  // Update when activeTicket changes
  useEffect(() => {
    if (activeTicket) {
      setCandidateName(activeTicket.hr?.candidateName || '');
      if (activeTicket.tc?.mentor) setReviewerName(activeTicket.tc.mentor);
      setZone(activeTicket.zone);
    }
  }, [activeTicket]);

  // C2 state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; correct: number; total: number; pass: boolean } | null>(null);

  // C3 state
  const [checklistScores, setChecklistScores] = useState<Record<number, number>>({});
  const [checklistResult, setChecklistResult] = useState<{ score: number; pass: boolean; reason: string } | null>(null);

  // C4 state
  const [interviewRatings, setInterviewRatings] = useState<Record<number, 'ok' | 'bad'>>({});
  const [interviewNotes, setInterviewNotes] = useState<Record<number, string>>({});
  const [interviewFinal, setInterviewFinal] = useState<'yes' | 'no' | ''>('');
  const [interviewResult, setInterviewResult] = useState<{ pass: boolean; summary: string } | null>(null);

  // C5 state
  const [simScores, setSimScores] = useState<Record<number, number>>({});
  const [simResult, setSimResult] = useState<{ avg: number; pass: boolean; reason: string } | null>(null);

  // C6 state
  const [finalDecision, setFinalDecision] = useState<'pass' | 'conditional' | 'repeat' | ''>(
    (activeTicket?.tc?.evalDecision as any) || ''
  );
  const [finalResult, setFinalResult] = useState<{ decision: string; date: string } | null>(null);

  // C7 state
  const [handoverChecks, setHandoverChecks] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true, 3: true, 4: true });
  const [buddyName, setBuddyName] = useState(activeTicket?.tc?.outcome?.buddy || 'سینا قاسمی (Buddy روز اول)');
  const [handoverResult, setHandoverResult] = useState<boolean | null>(null);

  // C8 state
  const [c8Day, setC8Day] = useState<number>(30);
  const [c8Employed, setC8Employed] = useState<'yes' | 'no'>('yes');
  const [c8Qc, setC8Qc] = useState<number>(1);
  const [c8Note, setC8Note] = useState('عملکرد مطلوب و هماهنگ با خط');
  const [c8Status, setC8Status] = useState<'normal' | 'retrain' | 'corrective'>('normal');
  const [c8Saved, setC8Saved] = useState(false);

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
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full bg-[#FAF8FE] border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F5A623] disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );

  // Zone Tabs helper
  const renderZoneTabs = (currentZ: ZoneType, onSelect: (z: ZoneType) => void) => (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
      {(['hub', 'superhub', 'irancell'] as ZoneType[]).map(z => (
        <button
          key={z}
          onClick={() => onSelect(z)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            currentZ === z
              ? 'bg-[#F5A623] text-[#1A1B1F] shadow-xs'
              : 'bg-white text-[#524534] hover:bg-[#FAF8FE] border border-[#E3E2E7]'
          }`}
        >
          {ZONE_LABEL[z]}
        </button>
      ))}
    </div>
  );

  // C2 Submit
  const handleQuizSubmit = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است و امکان ثبت نتیجه آزمون را ندارد.', 'warning');
      return;
    }
    const questions = QUIZ[zone] || [];
    let correct = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) correct++;
    });
    const pct = Math.round((correct / questions.length) * 100);
    const pass = pct >= passingScorePct;
    const res = { score: pct, correct, total: questions.length, pass };
    setQuizResult(res);
    onSaveResult('c2', { ...res, zone, candidateName, reviewerName, period });
    showToast(pass ? 'نتیجه آزمون ثبت شد: قبولی داوطلب ✅' : 'نتیجه آزمون ثبت شد: عدم احراز حد نصاب ❌', pass ? 'success' : 'info');
  };

  // C3 Submit
  const handleChecklistSubmit = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است و امکان ثبت چک‌لیست را ندارد.', 'warning');
      return;
    }
    const items = CHECKLIST[zone] || [];
    let sum = 0;
    let safetyFail = false;
    let nonSafetyWeak = 0;

    items.forEach((it, idx) => {
      const score = checklistScores[idx] ?? 1;
      sum += score;
      if (score === 0) {
        if (it.safety) safetyFail = true;
        else nonSafetyWeak++;
      }
    });

    const max = items.length * 2;
    const pct = Math.round((sum / max) * 100);
    const pass = !safetyFail && nonSafetyWeak <= 1;
    let reason = '';
    if (safetyFail) reason = 'حداقل یک مورد ایمنی‌محور «نیاز به تمرین» دارد — مردودی مستقل از میانگین نمره.';
    else if (nonSafetyWeak > 1) reason = `${nonSafetyWeak} مورد غیرایمنی «نیاز به تمرین» وجود دارد (حداکثر ۱ مورد مجاز است).`;

    const res = { score: pct, pass, reason };
    setChecklistResult(res);
    onSaveResult('c3', { ...res, zone, candidateName, reviewerName });
    showToast('چک‌لیست ارزیابی عملی ایستگاهی با موفقیت ثبت شد.', 'success');
  };

  // C4 Submit
  const handleInterviewSubmit = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است و امکان ثبت مصاحبه را ندارد.', 'warning');
      return;
    }
    const pass = interviewFinal === 'yes';
    const total = INTERVIEW_Q.length;
    let bad = 0;
    INTERVIEW_Q.forEach((_, idx) => {
      if (interviewRatings[idx] === 'bad') bad++;
    });
    const summary = `${total - bad} پاسخ مناسب از ${total} سوال`;
    setInterviewResult({ pass, summary });
    onSaveResult('c4', { pass, summary, candidateName, reviewerName });
    showToast('نتیجه مصاحبه صلاحیت با موفقیت ثبت شد.', 'success');
  };

  // C5 Submit
  const handleSimSubmit = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    const sc = SIM[zone];
    let sum = 0;
    let safetyLow = false;
    sc.criteria.forEach((crit, idx) => {
      const val = simScores[idx] ?? 4;
      sum += val;
      if (crit.includes('ایمنی') && val < 5) safetyLow = true;
    });
    const avg = Number((sum / sc.criteria.length).toFixed(1));
    const pass = !safetyLow && avg >= 4.0;
    let reason = '';
    if (safetyLow) reason = 'معیار رعایت ایمنی باید امتیاز کامل (۵ از ۵) بگیرد.';
    else if (avg < 4.0) reason = 'میانگین کل زیر حد نصاب قبولی (۴.۰) است.';

    const res = { avg, pass, reason };
    setSimResult(res);
    onSaveResult('c5', { ...res, zone, candidateName });
    showToast('نتیجه شبیه‌سازی پیک عملیاتی ثبت شد.', 'success');
  };

  // C6 Submit
  const handleFinalSubmit = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    if (!finalDecision) {
      showToast('لطفاً تصمیم نهایی را انتخاب فرمایید.', 'warning');
      return;
    }
    const res = { decision: finalDecision, date: nowISO() };
    setFinalResult(res);
    onSaveResult('c6', { ...res, zone, candidateName, reviewerName, pass: finalDecision === 'pass' });
    showToast('تصمیم نهایی فرم تأیید صلاحیت ثبت گردید.', 'success');
  };

  // C7 Submit
  const handleHandoverSubmit = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    const allDone = Object.values(handoverChecks).every(Boolean) && buddyName.trim().length > 0;
    setHandoverResult(allDone);
    onSaveResult('c7', { pass: allDone, buddy: buddyName, candidateName });
    showToast('پروتکل تحویل نیرو به سرپرست شعبه ثبت شد.', 'success');
  };

  // C8 Submit
  const handleC8Submit = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است.', 'warning');
      return;
    }
    setC8Saved(true);
    onSaveResult('c8', { day: c8Day, employed: c8Employed, qc: c8Qc, note: c8Note, status: c8Status });
    showToast(`چک‌این روز ${c8Day} با موفقیت ثبت شد.`, 'success');
  };

  // Dynamic Pulls for C6
  const evalProg = activeTicket?.tc?.evalProgress || {};

  return (
    <div className="space-y-6">
      {/* Linked Candidate Banner if active */}
      {activeTicket && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600 shrink-0" />
            <span>در حال ثبت ارزیابی برای: <strong className="font-bold">{activeTicket.hr?.candidateName || activeTicket.location}</strong> ({ZONE_LABEL[activeTicket.zone]} · {activeTicket.location})</span>
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
              پس از طی ماژول‌های آموزشی Zone خودش (M1 تا M8 بسته به Hub/SuperHub/irancell)، نیروی تازه‌وارد وارد این مرحله می‌شود: سنجش واقعی صلاحیت پیش از ورود مستقل به خط عملیاتی.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-center">
                <b className="text-sm text-[#835500] block mb-1">۱. واکنش</b>
                <span className="text-[11px] text-[#524534]">نظرسنجی پایان دوره</span>
              </div>
              <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-center">
                <b className="text-sm text-[#835500] block mb-1">۲. یادگیری</b>
                <span className="text-[11px] text-[#524534]">آزمون دانش کتبی (C2)</span>
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
                { id: 'v-eval-c2', title: 'C2 — آزمون دانش و تئوری', desc: `۳۰ سوال چهارگزینه‌ای (حداقل قبولی ${passingScorePct}٪)` },
                { id: 'v-eval-c3', title: 'C3 — چک‌لیست عملی ایستگاهی', desc: 'مشاهده سر ایستگاه در طول شیفت کامل' },
                { id: 'v-eval-c4', title: 'C4 — مصاحبه صلاحیت رفتاری', desc: '۶ سوال ساختاریافته سرآشپز/سرپرست' },
                { id: 'v-eval-c5', title: 'C5 — شبیه‌سازی پیک عملیاتی', desc: 'تست استرس ۴۵ تا ۶۰ دقیقه B2B/B2C' },
                { id: 'v-eval-c6', title: 'C6 — فرم نهایی تأیید صلاحیت', desc: 'جمع‌بندی خودکار C2 تا C5 و امضا' },
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
              <p className="text-xs text-[#524534]">۳۰ سوال تستی، تفکیک‌شده بر اساس Zone — حداقل نمره قبولی {passingScorePct}٪</p>
            </div>
            <button onClick={() => onNavigate('v-eval')} className="text-xs text-[#524534] hover:text-[#1A1B1F] flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>بازگشت به ارزیابی</span>
            </button>
          </div>

          {renderHeaderFields()}
          {renderZoneTabs(zone, setZone)}

          <div className="space-y-4">
            {(QUIZ[zone] || []).map((q, qIdx) => (
              <div key={qIdx} className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] space-y-3 text-xs">
                <span className="font-bold text-[#1A1B1F] block">{qIdx + 1}. {q.q}</span>
                <div className="space-y-1.5 pr-2">
                  {q.options.map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                        quizAnswers[qIdx] === optIdx
                          ? 'bg-amber-100/70 text-[#835500] font-bold border border-amber-300'
                          : 'hover:bg-white text-[#524534]'
                      } ${!canEdit ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      <input
                        type="radio"
                        disabled={!canEdit}
                        name={`q_${qIdx}`}
                        checked={quizAnswers[qIdx] === optIdx}
                        onChange={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                        className="accent-[#F5A623]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleQuizSubmit}
              disabled={!canEdit}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm ${
                canEdit 
                  ? 'bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F]' 
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              {canEdit ? 'ثبت و محاسبه نمره آزمون C2' : 'ثبت نمره آزمون C2 (فقط مشاهده)'}
            </button>
          </div>

          {quizResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              quizResult.pass ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <b>نتیجه آزمون ({ZONE_LABEL[zone]}): {quizResult.score}٪ ({quizResult.correct} از {quizResult.total} صحیح) — {quizResult.pass ? 'قبول ✅' : `مردود ❌ (حداقل ${passingScorePct}٪ الزامی است)`}</b>
              <div className="text-[11px] text-[#524534] mt-1">نیرو: {candidateName} | ارزیاب: {reviewerName} | دوره: {period}</div>
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
              <p className="text-xs text-[#524534]">مشاهده‌ای طول شیفت کامل — تفکیک‌شده برای هر Zone</p>
            </div>
            <button onClick={() => onNavigate('v-eval')} className="text-xs text-[#524534] hover:text-[#1A1B1F] flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>بازگشت</span>
            </button>
          </div>

          {renderHeaderFields()}
          {renderZoneTabs(zone, setZone)}

          <div className="space-y-2 text-xs">
            {(CHECKLIST[zone] || []).map((it, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E3E2E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  it.safety ? 'border-r-4 border-r-amber-500' : ''
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span>{idx + 1}. {it.step}</span>
                  {it.ref && <span className="bg-white border border-[#E3E2E7] px-2 py-0.5 rounded text-[10px] text-[#524534]">{it.ref}</span>}
                  {it.safety && <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">⚠ ایمنی</span>}
                </div>

                <select
                  disabled={!canEdit}
                  value={checklistScores[idx] ?? 1}
                  onChange={e => setChecklistScores(prev => ({ ...prev, [idx]: Number(e.target.value) }))}
                  className="bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="0">نیاز به تمرین (۰)</option>
                  <option value="1">در مسیر درست (۱)</option>
                  <option value="2">قوی (۲)</option>
                </select>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={handleChecklistSubmit}
              disabled={!canEdit}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm ${
                canEdit 
                  ? 'bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F]' 
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              {canEdit ? 'ثبت و محاسبه ارزیابی C3' : 'ثبت ارزیابی C3 (فقط مشاهده)'}
            </button>
          </div>

          {checklistResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              checklistResult.pass ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <b>نتیجه ارزیابی عملی ({ZONE_LABEL[zone]}): {checklistResult.score}٪ — {checklistResult.pass ? 'قبول ✅' : 'مردود ❌'}</b>
              {checklistResult.reason && <div className="mt-1">{checklistResult.reason}</div>}
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
            <p className="text-xs text-[#524534]">۱۵ تا ۲۰ دقیقه مصاحبه ساختاریافته پیرامون رفتار، آرامش زیر فشار و فرهنگ کاری</p>
          </div>

          {renderHeaderFields()}

          <div className="space-y-4 text-xs">
            {INTERVIEW_Q.map((q, idx) => (
              <div key={idx} className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] space-y-2">
                <span className="font-bold text-[#1A1B1F] block">{idx + 1}. {q}</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    disabled={!canEdit}
                    value={interviewRatings[idx] || 'ok'}
                    onChange={e => setInterviewRatings(prev => ({ ...prev, [idx]: e.target.value as 'ok' | 'bad' }))}
                    className="bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-3 py-2 sm:w-44 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="ok">مناسب و قابل قبول</option>
                    <option value="bad">نیاز به بهبود</option>
                  </select>
                  <input
                    type="text"
                    disabled={!canEdit}
                    placeholder="یادداشت و مشاهدات پاسخ داوطلب..."
                    value={interviewNotes[idx] || ''}
                    onChange={e => setInterviewNotes(prev => ({ ...prev, [idx]: e.target.value }))}
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

          <div className="pt-2">
            <button
              onClick={handleInterviewSubmit}
              disabled={!canEdit}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm ${
                canEdit 
                  ? 'bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F]' 
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              {canEdit ? 'ثبت نتیجه مصاحبه C4' : 'ثبت نتیجه مصاحبه C4 (فقط مشاهده)'}
            </button>
          </div>

          {interviewResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              interviewResult.pass ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <b>وضعیت مصاحبه: {interviewResult.pass ? 'تأیید صلاحیت ✅' : 'عدم تأیید ❌'} ({interviewResult.summary})</b>
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
            <p className="text-xs text-[#524534]">تست استرس ۴۵ تا ۶۰ دقیقه B2B + B2C زیر فشار حجم واقعی سفارشات</p>
          </div>

          {renderHeaderFields()}
          {renderZoneTabs(zone, setZone)}

          <div className="bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] text-xs leading-relaxed text-[#524534] mb-4">
            <strong className="text-[#835500] block mb-1">سناریوی آزمون:</strong>
            {SIM[zone]?.desc}
          </div>

          <div className="space-y-3 text-xs">
            {SIM[zone]?.criteria.map((c, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF8FE] border border-[#E3E2E7] flex items-center justify-between gap-4">
                <span className="font-bold text-[#1A1B1F]">{c} {c.includes('ایمنی') && <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">(الزامی: ۵ از ۵)</span>}</span>
                <select
                  disabled={!canEdit}
                  value={simScores[idx] ?? 4}
                  onChange={e => setSimScores(prev => ({ ...prev, [idx]: Number(e.target.value) }))}
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

          <div className="pt-2">
            <button
              onClick={handleSimSubmit}
              disabled={!canEdit}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm ${
                canEdit 
                  ? 'bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F]' 
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              {canEdit ? 'ثبت نتیجه شبیه‌سازی پیک C5' : 'ثبت نتیجه شبیه‌سازی C5 (فقط مشاهده)'}
            </button>
          </div>

          {simResult && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              simResult.pass ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <b>نتیجه شبیه‌سازی: میانگین {simResult.avg} از ۵ — {simResult.pass ? 'قبول ✅' : 'مردود ❌'}</b>
              {simResult.reason && <div className="mt-1">{simResult.reason}</div>}
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
            <p className="text-xs text-[#524534]">جمع‌بندی هوشمند نتایج آزمون‌های C2 تا C5 و تصمیم‌گیری نهایی مربی</p>
          </div>

          {renderHeaderFields()}

          {/* Dynamic Pulls from Active Ticket */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-bold text-[#835500] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#835500]" />
              <span>نتایج واقعی استخراج‌شده برای داوطلب ({candidateName}):</span>
            </h4>

            <div className="p-3.5 bg-[#FAF8FE] rounded-2xl border border-[#E3E2E7] flex justify-between items-center">
              <span className="font-medium text-[#1A1B1F]">C2 — آزمون دانش و تئوری:</span>
              {evalProg.c2 ? (
                <span className={evalProg.c2.pass ? 'text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full' : 'text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full'}>
                  {evalProg.c2.score}٪ ({evalProg.c2.pass ? 'قبول' : 'مردود'})
                </span>
              ) : (
                <span className="text-[#524534] bg-stone-100 px-2 py-0.5 rounded">ثبت نشده</span>
              )}
            </div>

            <div className="p-3.5 bg-[#FAF8FE] rounded-2xl border border-[#E3E2E7] flex justify-between items-center">
              <span className="font-medium text-[#1A1B1F]">C3 — چک‌لیست عملی ایستگاهی:</span>
              {evalProg.c3 ? (
                <span className={evalProg.c3.pass ? 'text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full' : 'text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full'}>
                  {evalProg.c3.score}٪ ({evalProg.c3.pass ? 'قبول' : 'مردود'})
                </span>
              ) : (
                <span className="text-[#524534] bg-stone-100 px-2 py-0.5 rounded">ثبت نشده</span>
              )}
            </div>

            <div className="p-3.5 bg-[#FAF8FE] rounded-2xl border border-[#E3E2E7] flex justify-between items-center">
              <span className="font-medium text-[#1A1B1F]">C4 — مصاحبه صلاحیت رفتاری:</span>
              {evalProg.c4 ? (
                <span className={evalProg.c4.pass ? 'text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full' : 'text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full'}>
                  {evalProg.c4.pass ? 'تأیید شد' : 'تأیید نشد'}
                </span>
              ) : (
                <span className="text-[#524534] bg-stone-100 px-2 py-0.5 rounded">ثبت نشده</span>
              )}
            </div>

            <div className="p-3.5 bg-[#FAF8FE] rounded-2xl border border-[#E3E2E7] flex justify-between items-center">
              <span className="font-medium text-[#1A1B1F]">C5 — شبیه‌سازی پیک عملیاتی:</span>
              {evalProg.c5 ? (
                <span className={evalProg.c5.pass ? 'text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full' : 'text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full'}>
                  میانگین {evalProg.c5.avg} از ۵ ({evalProg.c5.pass ? 'قبول' : 'مردود'})
                </span>
              ) : (
                <span className="text-[#524534] bg-stone-100 px-2 py-0.5 rounded">ثبت نشده</span>
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
              <option value="conditional">عبور مشروط — بازآموزی نقطه‌ای</option>
              <option value="repeat">تکرار بخشی از دوره آموزشی</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleFinalSubmit}
              disabled={!canEdit}
              className={`px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm ${
                canEdit 
                  ? 'bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F]' 
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              }`}
            >
              {canEdit ? 'ثبت تصمیم نهایی C6' : 'ثبت تصمیم نهایی C6 (فقط مشاهده)'}
            </button>

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
              فرم نهایی صلاحیت در تاریخ {formatDate(finalResult.date)} ثبت گردید. داوطلب با تصمیم «{finalResult.decision === 'pass' ? 'قبول و معرفی به عملیات' : finalResult.decision}» تایید شد.
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
