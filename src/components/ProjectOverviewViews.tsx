import React from 'react';
import { MODS, ZONES_INIT } from '../data/pipelineSeed';
import { ZoneType } from '../types/pipeline';
import { Layers, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';

interface ProjectOverviewViewsProps {
  viewId: string;
  onNavigate: (viewId: string, param?: string) => void;
  zoneConfigs: Record<ZoneType, { mods: string[]; dur: string }>;
  onUpdateZoneConfig: (zone: ZoneType, mods: string[], dur: string) => void;
  canEdit: boolean;
}

export const ProjectOverviewViews: React.FC<ProjectOverviewViewsProps> = ({
  viewId,
  onNavigate,
  zoneConfigs,
  onUpdateZoneConfig,
  canEdit
}) => {
  const toggleMod = (zone: ZoneType, modId: string, checked: boolean) => {
    if (!canEdit) return;
    const current = zoneConfigs[zone] || ZONES_INIT[zone];
    const newMods = checked
      ? [...current.mods, modId]
      : current.mods.filter((m: string) => m !== modId);

    onUpdateZoneConfig(zone, newMods, current.dur);
  };

  const handleDurChange = (zone: ZoneType, dur: string) => {
    const current = zoneConfigs[zone] || ZONES_INIT[zone];
    if (!canEdit || dur === current.dur) return;
    onUpdateZoneConfig(zone, current.mods, dur);
  };

  return (
    <div className="space-y-6">
      {/* VIEW: v-flow */}
      {viewId === 'v-flow' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E3E2E7] pb-4">
            <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-bold font-mono">۱</span>
            <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">فلوی کلی: جذب ← آموزش ← ورود به عملیات</h2>
            <p className="text-xs text-[#524534]">سه فاز اصلی به‌همراه Zone-Builder تعاملی</p>
          </div>

          {/* Phase 1 */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-[#835500] block uppercase tracking-wider">
              فاز ۱ — جذب و فیلتر اولیه
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-4 rounded-2xl text-center">
                <b className="text-[#1A1B1F] block mb-1">انتخاب فیلترهای جذب</b>
                <span className="text-[#524534]">تعیین نیازمندی‌های مهارتی</span>
              </div>
              <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-4 rounded-2xl text-center">
                <b className="text-[#1A1B1F] block mb-1">مصاحبه ورودی</b>
                <span className="text-[#524534]">سنجش نگرش و رفتار تیمی</span>
              </div>
              <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-4 rounded-2xl text-center">
                <b className="text-[#1A1B1F] block mb-1">تست سلامت و مدارک</b>
                <span className="text-[#524534]">فیلتر نهایی جذب و قرارداد اولیه</span>
              </div>
            </div>
          </div>

          {/* Phase 2: Interactive Zone-Builder */}
          <div className="space-y-4 pt-2">
            <div>
              <span className="text-xs font-bold text-[#835500] block uppercase tracking-wider">
                فاز ۲ — آموزش (بر اساس Zone-Builder تعاملی)
              </span>
              <p className="text-xs text-[#524534] mt-0.5">
                برای هر Zone می‌توانید ماژول‌های آموزشی را انتخاب کنید (مولتی‌سلکت) و زمان تقریبی را ویرایش کنید — تنظیمات ذخیره می‌مانند:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['hub', 'superhub', 'irancell'] as const).map(z => {
                const conf = zoneConfigs[z] || ZONES_INIT[z];
                const topBorder = z === 'superhub' ? 'border-t-4 border-t-amber-500' : z === 'irancell' ? 'border-t-4 border-t-emerald-500' : 'border-t-4 border-t-amber-600';

                return (
                  <div key={z} className={`bg-[#FAF8FE] border border-[#E3E2E7] ${topBorder} rounded-3xl p-5 space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#1A1B1F]">Zone {z === 'hub' ? 'Hub' : z === 'superhub' ? 'SuperHub' : 'irancell'}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#524534] whitespace-nowrap font-medium">زمان تقریبی:</span>
                      <input
                        type="text"
                        key={conf.dur}
                        defaultValue={conf.dur}
                        disabled={!canEdit}
                        onBlur={e => handleDurChange(z, e.target.value.trim())}
                        className="disabled:opacity-60 bg-white border border-[#D7C3AE] text-[#1A1B1F] rounded-xl px-2 py-1 text-xs w-28 text-center focus:outline-none focus:border-[#F5A623]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] text-[#524534] font-medium block">ماژول‌های فعال این Zone:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {MODS.map(m => {
                          const isChecked = conf.mods.includes(m.id);
                          return (
                            <label
                              key={m.id}
                              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${
                                isChecked
                                  ? 'bg-[#F5A623] text-[#1A1B1F] shadow-2xs'
                                  : 'bg-white border border-[#E3E2E7] text-[#524534] hover:bg-stone-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => toggleMod(z, m.id, e.target.checked)}
                                className="hidden"
                              />
                              <span>{m.id}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E3E2E7] text-[11px] text-[#524534] leading-relaxed">
                      <b className="text-[#1A1B1F]">{conf.mods.length} ماژول انتخاب شده:</b> {conf.mods.join('، ') || '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Gate banner */}
            <div
              onClick={() => onNavigate('v-eval')}
              className="bg-amber-50 hover:bg-amber-100/70 border border-amber-300 p-4 rounded-2xl text-center cursor-pointer transition-all text-xs space-y-1"
            >
              <b className="text-[#835500] block text-sm">
                🏁 قدم نهایی — ارزیابی و تحویل به عملیات:
              </b>
              <p className="text-[#524534]">
                سناریوی پیک + ثبت Pass/Fail در داشبورد ← Pass: Handover به شعبه | Fail: بازآموزی ماژول ضعیف (کلیک برای جزئیات)
              </p>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-rose-700 block uppercase tracking-wider">
              فاز ۳ — ورود به عملیات و پایش
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-4 rounded-2xl text-center">
                <b className="text-[#1A1B1F] block mb-1">ورود به شعبه مقصد</b>
                <span className="text-[#524534]">هفته اول در کنار Buddy همراه</span>
              </div>
              <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-4 rounded-2xl text-center">
                <b className="text-[#1A1B1F] block mb-1">پایش ۳۰ / ۶۰ / ۹۰ روزه</b>
                <span className="text-[#524534]">Retention، انحراف QC و رصد کیفیت</span>
              </div>
              <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-4 rounded-2xl text-center">
                <b className="text-[#1A1B1F] block mb-1">بازخورد به Training Center</b>
                <span className="text-[#524534]">اصلاح ماژول‌ها بر پایه داده‌های واقعی (حلقه بسته)</span>
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <div className="pt-4 border-t border-[#E3E2E7]">
            <h3 className="text-sm font-bold text-[#1A1B1F] mb-3">مسیر پیش‌رو (Roadmap اجرایی)</h3>
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#FAF8FE] text-[#524534] border-b border-[#E3E2E7]">
                  <th className="p-3">هفته</th>
                  <th className="p-3">اقدام کلیدی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E2E7]">
                <tr><td className="p-3 font-bold text-[#1A1B1F]">هفته ۱</td><td className="p-3 text-[#524534]">پایلوت Zone Hub با ماژول‌های آماده (M1/M2/M6/M8) — تخصیص Zone دستی</td></tr>
                <tr><td className="p-3 font-bold text-[#1A1B1F]">هفته ۲</td><td className="p-3 text-[#524534]">بستن ۳ گپ SOP + پایلوت کامل SuperHub</td></tr>
                <tr><td className="p-3 font-bold text-[#1A1B1F]">هفته ۳</td><td className="p-3 text-[#524534]">فعال‌سازی کامل قدم نهایی + پایش ۳۰/۶۰/۹۰ روزه اولین کوهورت</td></tr>
                <tr><td className="p-3 font-bold text-[#1A1B1F]">هفته ۴+</td><td className="p-3 text-[#524534]">چرخه پایدار کوهورت‌ها + اصلاح مستمر از روی KPI</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: v-e2e */}
      {viewId === 'v-e2e' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E3E2E7] pb-4">
            <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-bold font-mono">۲</span>
            <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">فلوچارت سطح بالای End-to-End عملیات</h2>
            <p className="text-xs text-[#524534]">جریان کلی کار از دریافت کالا تا تحویل به مشتری — بدون جزئیات پیچیده تسک‌ها</p>
          </div>

          <div className="space-y-6 text-xs">
            {/* Step 0 */}
            <div>
              <span className="text-emerald-700 font-bold block mb-2 text-center uppercase">مرحله صفر — شروع روز</span>
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-center max-w-sm mx-auto">
                <b className="text-emerald-950 block mb-1">M6 — راه‌اندازی تجهیزات</b>
                <span className="text-emerald-800 text-[11px]">روشن‌کردن دستگاه‌ها، چک سلامت و پایداری دما</span>
              </div>
            </div>

            <div className="text-center text-lg text-[#F5A623]">⬇</div>

            {/* Core Chain */}
            <div>
              <span className="text-[#835500] font-bold block mb-2 text-center uppercase">زنجیره اصلی Hub / SuperHub</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-3.5 rounded-2xl text-center">
                  <b className="text-[#1A1B1F] block mb-1">دریافت از وندور</b>
                  <span className="text-[#524534] text-[11px]">SOP Receiving، کنترل خودرو، دما و لیبل</span>
                </div>
                <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-3.5 rounded-2xl text-center">
                  <b className="text-[#1A1B1F] block mb-1">M1 — QC و نگهداری</b>
                  <span className="text-[#524534] text-[11px]">قبول/رد، دمای ۰-۴، انقضا و FEFO</span>
                </div>
                <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-3.5 rounded-2xl text-center">
                  <b className="text-[#1A1B1F] block mb-1">M2 — انبار و Stow</b>
                  <span className="text-[#524534] text-[11px]">چیدمان، لیبل، چرخش و سفارش‌گذاری</span>
                </div>
                <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-3.5 rounded-2xl text-center">
                  <b className="text-[#1A1B1F] block mb-1">M3 — گرمخانه</b>
                  <span className="text-[#524534] text-[11px]">هات‌هولدینگ بالای ۶۰°C و جداسازی B2B</span>
                </div>
              </div>
            </div>

            <div className="text-center text-lg text-[#F5A623]">⬇</div>

            {/* Branching */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-4 rounded-2xl text-center">
                <b className="text-[#1A1B1F] block mb-1">M4 — بسته‌بندی</b>
                <span className="text-[#524534] text-[11px]">سفارش‌های B2B و B2C، تفکیک سرد و گرم</span>
              </div>
              <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-center">
                <b className="text-amber-950 block mb-1">مسیر SuperHub</b>
                <span className="text-amber-800 text-[11px]">M7 پخت گریل/فرایر ← M8 تاپینگ رسپی</span>
              </div>
              <div className="bg-[#FAF8FE] border border-[#E3E2E7] p-4 rounded-2xl text-center">
                <b className="text-[#1A1B1F] block mb-1">M5 — تحویل</b>
                <span className="text-[#524534] text-[11px]">فاکتور، تطبیق ۴ رقم کد و تحویل به بایکر</span>
              </div>
            </div>

            <div className="text-center text-lg text-[#F5A623]">⬇</div>

            {/* Parallel irancell */}
            <div>
              <span className="text-emerald-700 font-bold block mb-2 text-center uppercase">شاخه موازی — شعبه ایرانسل</span>
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-center max-w-md mx-auto">
                <b className="text-emerald-950 block mb-1">M8 — irancell</b>
                <span className="text-emerald-800 text-[11px]">ورود پرسنل/بار ← استاک روز ← شام سازمانی ← تحویل داخلی</span>
              </div>
            </div>

            <div className="text-center text-lg text-[#F5A623]">⬇</div>

            {/* End of day */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-center">
                <b className="text-emerald-950 block mb-1">M6 — خاموش‌کردن و نظافت</b>
                <span className="text-emerald-800 text-[11px]">تحویل شیفت و ایمنی پایان روز</span>
              </div>
              <div
                onClick={() => onNavigate('v-eval')}
                className="bg-amber-50 border border-amber-300 p-4 rounded-2xl text-center cursor-pointer hover:bg-amber-100 transition-all"
              >
                <b className="text-amber-950 block mb-1">🏁 ارزیابی و تحویل</b>
                <span className="text-amber-800 text-[11px]">شبیه‌سازی پیک و آزمون صلاحیت C1–C8</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: v-mods */}
      {viewId === 'v-mods' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E3E2E7] pb-4">
            <span className="bg-[#835500] text-white px-2 py-0.5 rounded text-xs font-bold font-mono">۳</span>
            <h2 className="text-xl font-bold text-[#1A1B1F] mt-1">نمای کلی ۸ ماژول آموزشی</h2>
            <p className="text-xs text-[#524534]">پوشش، مخاطبان و تعداد اجزای هر ماژول در مرکز آموزش اسنپ‌کیچن</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#FAF8FE] text-[#524534] border-b border-[#E3E2E7]">
                  <th className="p-3.5">ماژول</th>
                  <th className="p-3.5">نام ماژول</th>
                  <th className="p-3.5">محدوده پوشش</th>
                  <th className="p-3.5">مخاطب</th>
                  <th className="p-3.5">تعداد اجزا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E2E7]">
                {MODS.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => onNavigate('v-module', m.id)}
                    className="hover:bg-[#FAF8FE] cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-bold font-mono text-[#835500]">{m.id}</td>
                    <td className="p-3.5 font-bold text-[#1A1B1F]">{m.name}</td>
                    <td className="p-3.5 text-[#524534]">
                      {m.id === 'M1' ? 'قبل از دست‌زدن به غذا: قبول/رد، دما، انقضا، ثبت و ارجاع' :
                       m.id === 'M2' ? 'از ورود بار تا چیدمان، شمارش، ثبت پنل و سفارش' :
                       m.id === 'M3' ? 'سفر غذاها از دریافت تا تحویل به راننده' :
                       m.id === 'M4' ? 'بسته‌بندی سفارش‌های B2B و B2C' :
                       m.id === 'M5' ? 'آخرین نقطه تماس قبل از مشتری' :
                       m.id === 'M6' ? 'شروع امن، دمای پایدار و نظافت پایان روز' :
                       m.id === 'M7' ? 'رسپی، دما، زمان، ظرف و نشانه پخت' :
                       'ورود پرسنل/بار، استاک روز، کانترها و شام سازمانی'}
                    </td>
                    <td className="p-3.5 text-teal-800 font-semibold">{m.loc}</td>
                    <td className="p-3.5 font-bold text-[#1A1B1F]">{m.count} جزء</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
            {MODS.map(m => (
              <div
                key={m.id}
                onClick={() => onNavigate('v-module', m.id)}
                className="bg-[#FAF8FE] hover:bg-[#F3EEFA] p-4 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer transition-all"
              >
                <div className="flex justify-between items-center mb-1">
                  <b className="text-[#1A1B1F] text-xs">{m.id} — {m.name}</b>
                </div>
                <div className="text-[11px] text-[#524534]">{m.count} جزء | {m.loc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
