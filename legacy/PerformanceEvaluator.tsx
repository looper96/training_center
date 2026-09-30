import React, { useState, useEffect } from 'react';
import { TraineeProfile } from '../types';
import { 
  Gauge, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  User, 
  ShieldCheck, 
  FileCheck2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PerformanceEvaluatorProps {
  trainee: TraineeProfile;
  onUpdateEvaluations: (scores: Record<string, number>, assignedStation: 'بسته‌بندی (Packaging)' | 'تحویل و دیسپچ (Delivery)' | 'آماده‌سازی و پخت (Line)') => void;
}

export const PerformanceEvaluator: React.FC<PerformanceEvaluatorProps> = ({
  trainee,
  onUpdateEvaluations
}) => {
  // Stopwatch for Speed Test
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [recordedLaps, setRecordedLaps] = useState<number[]>([42, 38, 45]);

  // Scores
  const [scores, setScores] = useState({
    packagingSpeed: trainee.evaluations.packagingSpeed || 85,
    orderAccuracy: trainee.evaluations.orderReading || 92,
    hygienePPE: trainee.evaluations.hygienePPE || 96,
    courierEtiquette: trainee.evaluations.courierEtiquette || 90,
    kitchenCoordination: trainee.evaluations.kitchenWorkflow || 84
  });

  const [assignedStation, setAssignedStation] = useState<'بسته‌بندی (Packaging)' | 'تحویل و دیسپچ (Delivery)' | 'آماده‌سازی و پخت (Line)'>(
    trainee.assignedStation || 'بسته‌بندی (Packaging)'
  );

  const [showCertificate, setShowCertificate] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleStartPause = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleRecordLap = () => {
    if (timerSeconds > 0) {
      setRecordedLaps(prev => [timerSeconds, ...prev.slice(0, 4)]);
      // calculate speed score automatically based on seconds
      const avg = Math.round(([timerSeconds, ...recordedLaps].reduce((a, b) => a + b, 0)) / (recordedLaps.length + 1));
      let newSpeedScore = 80;
      if (avg <= 35) newSpeedScore = 98;
      else if (avg <= 45) newSpeedScore = 90;
      else if (avg <= 60) newSpeedScore = 82;
      else newSpeedScore = 70;
      setScores(prev => ({ ...prev, packagingSpeed: newSpeedScore }));
      setTimerSeconds(0);
      setIsTimerRunning(false);
    }
  };

  // Calculate Overall Weighted Score
  const overallScore = Math.round(
    scores.packagingSpeed * 0.25 +
    scores.orderAccuracy * 0.25 +
    scores.hygienePPE * 0.20 +
    scores.courierEtiquette * 0.15 +
    scores.kitchenCoordination * 0.15
  );

  // Determine Recommendation Engine
  useEffect(() => {
    if (scores.courierEtiquette >= 90 && scores.courierEtiquette > scores.packagingSpeed) {
      setAssignedStation('تحویل و دیسپچ (Delivery)');
    } else if (scores.packagingSpeed >= 88 && scores.orderAccuracy >= 90) {
      setAssignedStation('بسته‌بندی (Packaging)');
    } else {
      setAssignedStation('آماده‌سازی و پخت (Line)');
    }
  }, [scores]);

  const handleSaveEvaluation = () => {
    onUpdateEvaluations(scores, assignedStation);
    setShowCertificate(true);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900 border border-purple-800/40 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                ارزیابی فاز ۵ (روز ۲۲ تا ۳۰)
              </span>
              <span className="text-slate-400 text-xs">• سنجش کار مستقل، آزمون C2–C4 و تعیین بخش کاری</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              سامانه سنجش عملکرد، آزمون سرعت و استقرار نهایی پرسنل
            </h2>
            <p className="text-xs text-purple-200/80 max-w-3xl leading-relaxed">
              بر مبنای سند مرجع OE، در فاز ۵ توانایی نیرو برای کار کاملاً مستقل، سرعت آماده‌سازی، دقت در بسته‌بندی، شبیه‌سازی پیک (C2) و چک‌لیست منطقه‌ای (C4) ارزیابی شده و محل استقرار نهایی او در تیم تعیین می‌شود.
            </p>
          </div>

          <div className="bg-purple-900/40 border border-purple-700/60 rounded-2xl p-4 min-w-[200px] text-center">
            <span className="text-xs text-purple-300 font-semibold block mb-1">امتیاز کل ارزیابی فاز ۵:</span>
            <span className={`text-4xl font-black ${
              overallScore >= 85 ? 'text-emerald-400' : overallScore >= 70 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {overallScore} / ۱۰۰
            </span>
            <span className="text-[11px] text-purple-200 block mt-1">
              {overallScore >= 85 ? 'سطح: عالی و آماده کار مستقل' : overallScore >= 70 ? 'سطح: قبولی با نظارت دوره‌ای' : 'نیازمند بازآموزی'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Speed Stopwatch */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Timer className="w-5 h-5 text-rose-600" />
              تست زمان‌سنجی سرعت بسته‌بندی (Speed Test)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              استاندارد اسنپ‌کیچن: کمتر از ۴۵ ثانیه برای بسته‌بندی کامل هر سفارش
            </p>
          </div>

          {/* Stopwatch Display */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
            <div className="text-5xl font-mono font-black tracking-wider text-rose-400">
              {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              ثانیه‌شمار بسته‌بندی و پلمپ سفارش
            </div>

            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={handleStartPause}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'توقف تایمر' : 'شروع تست'}</span>
              </button>
              <button
                onClick={handleRecordLap}
                disabled={timerSeconds === 0}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-medium"
              >
                ثبت رکورد
              </button>
              <button
                onClick={handleResetTimer}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs"
                title="ریست"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recorded Laps */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              آخرین رکوردهای ثبت شده برای کارآموز:
            </span>
            <div className="space-y-1.5">
              {recordedLaps.map((lap, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 p-2 rounded-xl">
                  <span className="text-slate-600 font-medium">سفارش تستی شماره {idx + 1}:</span>
                  <span className={`font-mono font-bold ${
                    lap <= 45 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {lap} ثانیه {lap <= 45 ? '(استاندارد ✓)' : '(بیش از حد مجاز)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Scoring Dimensions & Station Assignment */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-600" />
              ارزیابی ۵ بعدی شایستگی‌های فاز ۵ (C2–C4 Rubric)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              امتیازها توسط سرپرست شیفت یا ممیز کیفیت بر مبنای عملکرد مستقل تنظیم می‌شوند:
            </p>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {/* Speed */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  ۱. سرعت آماده‌سازی و بسته‌بندی (وزن: ۲۵٪)
                </span>
                <span className="text-xs font-black text-rose-600">{scores.packagingSpeed} از ۱۰۰</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={scores.packagingSpeed}
                onChange={(e) => setScores({ ...scores, packagingSpeed: Number(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                سنجش سرعت پکینگ زیر فشار پیک بدون اتلاف وقت و سردرگمی.
              </span>
            </div>

            {/* Accuracy */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  ۲. دقت در خواندن فیش و تطبیق اقلام (وزن: ۲۵٪)
                </span>
                <span className="text-xs font-black text-rose-600">{scores.orderAccuracy} از ۱۰۰</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={scores.orderAccuracy}
                onChange={(e) => setScores({ ...scores, orderAccuracy: Number(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                صفر بودن کسری سس، نوشیدنی، دورچین و توجه دقیق به یادداشت‌های مشتری.
              </span>
            </div>

            {/* Hygiene */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  ۳. رعایت استانداردهای بهداشتی و ایمنی فردی (وزن: ۲۰٪)
                </span>
                <span className="text-xs font-black text-rose-600">{scores.hygienePPE} از ۱۰۰</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={scores.hygienePPE}
                onChange={(e) => setScores({ ...scores, hygienePPE: Number(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                استفاده مداوم از کلاه و دستکش، شست‌وشوی دست و تمیزکاری پایان شیفت.
              </span>
            </div>

            {/* Courier C2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  ۴. شبیه‌سازی تحویل به سفیر و تکریم پیک C2 (وزن: ۱۵٪)
                </span>
                <span className="text-xs font-black text-rose-600">{scores.courierEtiquette} از ۱۰۰</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={scores.courierEtiquette}
                onChange={(e) => setScores({ ...scores, courierEtiquette: Number(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                برخورد محترمانه، بررسی ۴ رقم کد سفارش و تحویل سریع بدون تاخیر.
              </span>
            </div>

            {/* Workflow */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  ۵. هماهنگی با ایستگاه‌ها و چک‌لیست منطقه‌ای C4 (وزن: ۱۵٪)
                </span>
                <span className="text-xs font-black text-rose-600">{scores.kitchenCoordination} از ۱۰۰</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={scores.kitchenCoordination}
                onChange={(e) => setScores({ ...scores, kitchenCoordination: Number(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                ارتباط موثر با گریل، فرایر، پیتزا و درک کامل گردش کار آشپزخانه.
              </span>
            </div>
          </div>

          {/* Station Assignment Decision Box */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  تعیین بخش کاری دائمی نیرو (بر اساس سند OE فاز ۵):
                </h4>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  توصیه سیستم بر مبنای بیشترین شایستگی فردی در تست‌های عملی:
                </p>
              </div>
              <span className="bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
                {assignedStation}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['بسته‌بندی (Packaging)', 'تحویل و دیسپچ (Delivery)', 'آماده‌سازی و پخت (Line)'] as const).map((station) => (
                <button
                  key={station}
                  onClick={() => setAssignedStation(station)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    assignedStation === station
                      ? 'bg-white text-indigo-950 border-indigo-500 shadow-sm ring-2 ring-indigo-400/30'
                      : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white'
                  }`}
                >
                  {station}
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              کارآموز: <strong>{trainee.fullName}</strong> | شعبه: <strong>{trainee.branch}</strong>
            </div>

            <button
              onClick={handleSaveEvaluation}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>ثبت ارزیابی و صدور گواهی پایان دوره فاز ۵</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 text-right shadow-2xl space-y-6 border-4 border-slate-100 relative">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center no-print"
            >
              ✕
            </button>

            {/* Certificate Header */}
            <div className="text-center border-b-2 border-rose-500 pb-5 space-y-2">
              <span className="text-rose-600 font-bold text-xs tracking-widest uppercase">
                SNAPPKITCHEN OPERATIONAL EXCELLENCE
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                گواهی احراز صلاحیت کار مستقل (فاز ۱ تا ۵)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                تاییدیه رسمی گذر از دوره ۳۰ روزه آموزش عملیات هاب و سوپرهاب
              </p>
            </div>

            {/* Trainee Body */}
            <div className="text-xs text-slate-700 leading-loose space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <p>
                بدین‌وسیله گواهی می‌شود که همکار گرامی، <strong className="text-slate-900 text-sm">{trainee.fullName}</strong>، پس از گذراندن موفقیت‌آمیز دوره‌های آشنایی، سایه‌زنی، بسته‌بندی مستقل و آموزش تحویل (فازهای ۱ تا ۴):
              </p>
              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">امتیاز ممیزی جامع (C2–C4):</span>
                  <span className="text-base font-bold text-rose-600">{overallScore} از ۱۰۰</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">محل استقرار رسمی تاییدشده:</span>
                  <span className="text-base font-bold text-indigo-700">{assignedStation}</span>
                </div>
              </div>
              <p>
                صلاحیت نامبرده برای انجام مستقل وظایف محوله در شعبه <strong className="text-slate-900">{trainee.branch}</strong> بدون نیاز به نظارت پیوسته مورد تایید قرار گرفته و مجوز ورود به دوره تخصصی ماه‌های ۲ و ۳ (فاز ۶) صادر می‌گردد.
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">مربی همراه (Mentor)</span>
                <span className="font-bold text-slate-800 block">{trainee.mentorName}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">✓ امضا شده</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">سرپرست شعبه (Supervisor)</span>
                <span className="font-bold text-slate-800 block">{trainee.supervisorName}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">✓ تایید نهایی</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">مدیر آموزش و عملیات اکسلنس</span>
                <span className="font-bold text-slate-800 block">مرکز آموزش OE اسنپ‌کیچن</span>
                <span className="text-[10px] text-emerald-600 font-semibold">✓ ثبت سامانه</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 no-print">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                چاپ گواهینامه
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                تایید و بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
