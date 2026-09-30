import React, { useState } from 'react';
import { 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  ArrowLeftRight, 
  CheckCircle2, 
  Sparkles,
  Shirt,
  HeartPulse,
  Send
} from 'lucide-react';

export const ShiftRulesHub: React.FC = () => {
  // Shift Swap State
  const [swapData, setSwapData] = useState({
    colleagueName: '',
    targetDate: '',
    shiftType: 'صبح به شب',
    reason: ''
  });
  const [swapSubmitted, setSwapSubmitted] = useState(false);

  // PPE Checklist State
  const [ppeState, setPpeState] = useState({
    hairnet: true,
    gloves: true,
    cleanUniform: true,
    shoes: true,
    noJewelry: true,
    handwashing: true
  });

  // Incident State
  const [incidentData, setIncidentData] = useState({
    type: 'لغزندگی یا ریزش مایعات',
    location: 'ایستگاه پکینگ',
    description: ''
  });
  const [incidentSubmitted, setIncidentSubmitted] = useState(false);

  const togglePpe = (key: keyof typeof ppeState) => {
    setPpeState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSwapSubmitted(true);
  };

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIncidentSubmitted(true);
  };

  const allPpeCompliant = Object.values(ppeState).every(Boolean);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 border border-blue-800/40 rounded-3xl p-6 text-white shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
              ضوابط عملیاتی فاز ۱ و استقرار
            </span>
            <span className="text-slate-400 text-xs">• استخراج شده از سند مرجع OE اسنپ‌کیچن</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            مرکز قوانین شیفت‌ها، انضباط سازمانی و استانداردهای بهداشت و ایمنی
          </h2>
          <p className="text-xs text-blue-200/80 max-w-3xl leading-relaxed">
            رعایت دقیق ساعت شروع و پایان شیفت، الزام به دریافت تاییدیه دوگانه برای هرگونه تعویض شیفت، استفاده بی‌قیدوشرط از فرم و تجهیزات بهداشتی، و گزارش‌دهی فوری خطرات ایمنی طبق دستورالعمل‌های عملیاتی اکسلنس.
          </p>
        </div>
      </div>

      {/* Shifts Card Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Morning Shift */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                صبح
              </span>
              <h3 className="text-base font-bold text-amber-950">
                شیفت صبح اسنپ‌کیچن
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-200/60 text-amber-900 px-3 py-1 rounded-xl">
              ۰۸:۳۰ الی ۱۶:۳۰
            </span>
          </div>

          <p className="text-xs text-amber-900/80 leading-relaxed mb-4">
            آماده‌سازی خطوط، دریافت بارهای روزانه از راننده، شارژ بن‌ماری‌های تاپینگ و پوشش کامل پیک ناهار مشتریان.
          </p>

          <div className="space-y-2 text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>حضور الزامی با لباس فرم کامل حداکثر در ساعت <strong>۰۸:۲۵</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-amber-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>پروتکل تحویل ایستگاه کاری به شیفت بعد در ساعت <strong>۱۶:۱۵ تا ۱۶:۳۰</strong></span>
            </div>
          </div>
        </div>

        {/* Night Shift */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                شب
              </span>
              <h3 className="text-base font-bold text-indigo-950">
                شیفت شب اسنپ‌کیچن
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-indigo-200/60 text-indigo-900 px-3 py-1 rounded-xl">
              ۱۷:۳۰ الی ۲۴:۰۰
            </span>
          </div>

          <p className="text-xs text-indigo-900/80 leading-relaxed mb-4">
            پوشش ساعات اوج شام، سرعت‌عمل بالا در پکینگ و دیسپچ، و اجرای پروتکل نظافت عمیق و خاموش‌سازی تجهیزات در پایان شب.
          </p>

          <div className="space-y-2 text-xs text-indigo-900 font-medium">
            <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-indigo-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              <span>حضور الزامی با لباس فرم کامل حداکثر در ساعت <strong>۱۷:۲۵</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-xl border border-indigo-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              <span>اجرای کامل نظافت پایان شیفت، تخلیه زباله‌ها و ضدعفونی سطوح کار</span>
            </div>
          </div>
        </div>
      </div>

      {/* PPE Compliance & Shift Swap Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PPE Checklist (Left) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shirt className="w-5 h-5 text-rose-600" />
                چک‌لیست تطبیق لباس فرم و بهداشت فردی
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                سند OE: استفاده از فرم کامل و تمیز (کلاه و دستکش) برای همه کارکنان الزامی است.
              </p>
            </div>

            <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
              allPpeCompliant ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
            }`}>
              {allPpeCompliant ? '۱۰۰٪ منطبق ✓' : 'نقص در پوشش'}
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { key: 'hairnet', title: 'کلاه مو (پوشش کامل موها برای برادران و خواهران)', sub: 'جلوگیری از ریزش حتی یک تار مو در محیط پخت و بسته‌بندی' },
              { key: 'gloves', title: 'دستکش یک‌بارمصرف بهداشتی', sub: 'تعویض فوری پس از دست زدن به سطوح نامتعارف یا زباله' },
              { key: 'cleanUniform', title: 'لباس فرم تمیز و شسته‌شده اسنپ‌کیچن', sub: 'روپوش و پیش‌بند عاری از لکه چربی و آلودگی' },
              { key: 'shoes', title: 'کفش ایمنی مقاوم و ضدلغزش', sub: 'کاهش ریسک سر خوردن روی سطوح چرب و سرامیک خیس' },
              { key: 'noJewelry', title: 'ممنوعیت زیورآلات، ساعت مچی و لاک ناخن', sub: 'بر اساس استانداردهای سختگیرانه سازمان غذا و دارو و OE' },
              { key: 'handwashing', title: 'شست‌وشوی ۲۰ ثانیه‌ای دست‌ها با مایع ضدعفونی', sub: 'قبل از ورود به خط، بعد از استراحت و حین کار' }
            ].map((item) => {
              const checked = ppeState[item.key as keyof typeof ppeState];
              return (
                <div
                  key={item.key}
                  onClick={() => togglePpe(item.key as keyof typeof ppeState)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs select-none ${
                    checked
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-800'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-slate-900">{item.title}</span>
                    <span className="text-[11px] text-slate-500">{item.sub}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center font-bold text-xs ${
                    checked ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 bg-white'
                  }`}>
                    {checked && '✓'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shift Swap Request & Approval Workflow (Right) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              فرآیند رسمی تعویض و جابجایی شیفت
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متن سند OE: «جابجایی و تعویض شیفت فقط با هماهنگی سرپرست و تایید سوپروایزر مجاز است.»
            </p>
          </div>

          {swapSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-950">
                درخواست جابجایی شیفت با موفقیت ثبت شد
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                درخواست شما جهت هماهنگی برای <strong>سرپرست شیفت</strong> و تاییدیه نهایی برای <strong>سوپروایزر شعبه</strong> ارسال گردید. تا قبل از تایید نهایی در کارتابل، شیفت قبلی به قوت خود باقی است.
              </p>
              <button
                onClick={() => setSwapSubmitted(false)}
                className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl"
              >
                ثبت درخواست جدید
              </button>
            </div>
          ) : (
            <form onSubmit={handleSwapSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  نام همکار جانشین برای جابجایی:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: محمد صادقی"
                  value={swapData.colleagueName}
                  onChange={(e) => setSwapData({ ...swapData, colleagueName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    تاریخ مورد نظر:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="۱۴۰۳/۰۷/۱۰"
                    value={swapData.targetDate}
                    onChange={(e) => setSwapData({ ...swapData, targetDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    نوع جابجایی:
                  </label>
                  <select
                    value={swapData.shiftType}
                    onChange={(e) => setSwapData({ ...swapData, shiftType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="صبح به شب">صبح به شب</option>
                    <option value="شب به صبح">شب به صبح</option>
                    <option value="تعویض روز آف">تعویض روز استراحت</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  علت درخواست جابجایی:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="علت موجه جابجایی شیفت را بنویسید..."
                  value={swapData.reason}
                  onChange={(e) => setSwapData({ ...swapData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800">
                <strong>قانون OE:</strong> هرگونه ترک خودسرانه یا جابجایی بدون تایید کتبی سوپروایزر به منزله غیبت غیرموجه ثبت می‌شود.
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>ارسال درخواست جابجایی به سرپرست و سوپروایزر</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Emergency Incident & Safety Hazard Report Form */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-600" />
              سامانه گزارش فوری حوادث و نواقص ایمنی محیط کار
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              متن سند OE: «گزارش فوری هرگونه حادثه یا مشکل ایمنی به سرپرست الزامی است.»
            </p>
          </div>
        </div>

        {incidentSubmitted ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center text-xs text-emerald-900 font-medium">
            گزارش نقص ایمنی به سرپرست شیفت مخابره گردید. اقدامات پیشگیرانه ثبت شد.
          </div>
        ) : (
          <form onSubmit={handleIncidentSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع رخداد یا خطر:</label>
              <select
                value={incidentData.type}
                onChange={(e) => setIncidentData({ ...incidentData, type: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              >
                <option value="لغزندگی یا ریزش مایعات">لغزندگی کف یا ریزش روغن/آب</option>
                <option value="نقص هود یا اگزاست">نقص تهویه و تجمع دود</option>
                <option value="بریدگی یا جراحت جزئی">بریدگی دست یا سوختگی</option>
                <option value="نقص کابل یا اتصالی برق">اتصالی یا جرقه برقی تجهیزات</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">محل دقیق در شعبه:</label>
              <input
                type="text"
                required
                value={incidentData.location}
                onChange={(e) => setIncidentData({ ...incidentData, location: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">توضیح کوتاه:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="شرح مختصر خطر..."
                  value={incidentData.description}
                  onChange={(e) => setIncidentData({ ...incidentData, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl flex-shrink-0"
                >
                  ثبت فوری
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
