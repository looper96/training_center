# راهنمای جامع دیزاین سیستم (SnappKitchen Training Center Design System)

این سند تشریح‌کننده زبان بصری، توکن‌ها و الگوهای طراحی پیاده‌سازی شده در سامانه مرکز آموزش اسنپ‌کیچن است.

---

## ۱. اصول و فلسفه طراحی (Core Philosophy)
* **جهت‌گیری راست‌به‌چپ (RTL-First):** کلیه کامپوننت‌ها، ترازها، جریان‌های چیدمان و انیمیشن‌ها به‌صورت پیش‌فرض برای زبان فارسی و خط خوانای «وزیرمتن» بهینه‌سازی شده‌اند.
* **پالت رنگی گرم و مدرن (Warm Amber MD3):** استفاده از ترکیب رنگ زمینه ملایم و روشن (`#FAF8FE`) در کنار کارت‌های سفید با بردر خنثی (`#E3E2E7`) و لهجه‌های طلایی-عنبری سازمانی (`#F5A623` و `#835500`) حس صمیمیت، حرفه‌ای‌بودن و تمیزی محیط عملیاتی غذایی را القا می‌کند.
* **سلسله‌مراتب واضح بصری:** عناوین ضخیم (`font-black`), متن‌های ثانویه و توضیحات به رنگ برنز خنثی (`#524534`), و اعداد/کدهای فنی با فونت مونو اسپیس (`font-mono`).

---

## ۲. توکن‌های رنگی (Color Tokens)

| نام توکن | کد هگز | کاربرد |
| :--- | :--- | :--- |
| **Surface Canvas** | `#FAF8FE` | پس‌زمینه سراسری برنامه |
| **Surface Card** | `#FFFFFF` | پنل‌ها و کارت‌های اطلاعاتی |
| **Border Subtle** | `#E3E2E7` | حاشیه‌های تفکیک‌کننده ملایم |
| **Text Primary** | `#1A1B1F` | متون اصلی، تیترها و عناوین |
| **Text Secondary** | `#524534` | توضیحات تکمیلی و لیبل‌ها |
| **Brand Amber Primary** | `#F5A623` | دکمه‌های اصلی، هایلایت منوها و نشانگرها |
| **Brand Bronze** | `#835500` | آیکون‌های محوری و برچسب‌های شاخص |
| **Success (پذیرش/تأیید)** | `#15803D` / `#F0FDF4` | وضعیت‌های قبولی آزمون و تأیید تحویل |
| **Warning (فقط مشاهده/هشدار)** | `#B45309` / `#FEF3C7` | بنرهای عدم دسترسی ویرایش و حالت Read-Only |
| **Error / Urgent** | `#BA1A1A` / `#FEF2F2` | رد صلاحیت یا خطای اعتبارسنجی |

---

## ۳. الگوهای کامپوننت‌های UI (Component Patterns)

### الف) کارت‌ها و پنل‌های محتوایی
```tsx
<div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 sm:p-8 shadow-xs">
  {/* Content */}
</div>
```

### ب) نشانگر بصری حالت «فقط مشاهده» (Read-Only Badge)
```tsx
<span className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
  <Eye className="w-2.5 h-2.5" />
  <span>فقط مشاهده</span>
</span>
```

### ج) دکمه‌های تعاملی دوگانه (Primary & Secondary)
```tsx
{/* Primary Action Button */}
<button className="bg-[#F5A623] hover:bg-[#D99000] text-[#1A1B1F] font-bold px-6 py-2.5 rounded-full text-xs transition-all shadow-sm">
  ثبت اطلاعات
</button>

{/* Secondary / Action Button */}
<button className="bg-white border border-[#E3E2E7] hover:bg-[#FAF8FE] text-[#1A1B1F] font-bold px-5 py-2.5 rounded-full text-xs">
  انصراف
</button>
```

### د) سیستم نوتیفیکیشن سبک و غیرمسدودکننده (Toast System)
جایگزینی کامل برای `window.alert` با انیمیشن‌های روان و استیت مستقل در `src/components/Toast.tsx`.
