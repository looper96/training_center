# مرکز آموزش عملیات اسنپ‌کیچن (Training Center)

سامانه مدیریت پایپ‌لاین استعداد (درخواست نیرو → HR → آموزش → ارزیابی C1–C8 → تحویل به عملیات)،
داک آموزشی ماژول‌های M1–M8 و بانک آزمون.

**پشته فنی:** React 19 · Vite 8 · Tailwind 4 · Firebase (Auth + Firestore) · میزبانی روی Netlify

---

## ساختار پروژه

```
src/
  App.tsx                 گیت احراز هویت + مسیریابی بین نماها
  lib/firebase.ts         پیکربندی Firebase از متغیرهای محیطی (VITE_FIREBASE_*)
  lib/useAuth.ts          ورود، ساخت پروفایل، اولین ادمین (bootstrap)
  lib/useAppData.ts       همگام‌سازی زنده با Firestore + توابع نوشتن
  lib/date.ts             ذخیره تاریخ به ISO و نمایش شمسی
  types/pipeline.ts       مدل داده و منطق دسترسی (هم‌راستا با firestore.rules)
  components/             نماها (داشبورد، HR، TC، ارزیابی، ادمین، …)
  data/                   محتوای پیش‌فرض (ماژول‌ها، SOPها، بانک سؤال، داده نمونه)
firestore.rules           قوانین امنیتی سمت سرور  ← مرجع اصلی دسترسی‌ها
tests/unit                تست منطق دسترسی
tests/rules               تست قوانین Firestore روی Emulator
docs/                     معماری محصول و دیزاین سیستم
legacy/                   کامپوننت‌های استفاده‌نشده خروجی اولیه (در بیلد نیستند)
```

## مدل امنیتی

- **ورود فقط از طریق Firebase Authentication** (گوگل یا ایمیل/رمز). هیچ رمزی در کد یا دیتابیس نیست.
- نقش، وضعیت و دسترسی هر کاربر در `users/{uid}` است و **فقط ادمین** می‌تواند آن‌ها را تغییر دهد (در `firestore.rules` اعمال می‌شود، نه فقط در UI).
- هر بخش سایت سه سطح دارد: `none` / `view` / `edit`. کاربران غیرادمین به‌صورت پیش‌فرض فقط مشاهده دارند.
- **اولین کاربری که وارد می‌شود ادمین می‌شود** (سند `config/bootstrap` ساخته می‌شود و دیگر قابل تغییر نیست). کاربران بعدی در وضعیت «در انتظار تأیید» هستند تا ادمین فعالشان کند.
- ادمین می‌تواند از پنل مدیریت برای افراد حساب ایمیل/رمز بسازد یا لینک تغییر رمز بفرستد.

> ⚠️ بلافاصله بعد از اولین دیپلوی، خودتان وارد شوید تا ادمین شوید.

---

## راه‌اندازی (یک‌بار)

### ۱) پروژه Firebase
1. در [Firebase Console](https://console.firebase.google.com) یک پروژه بسازید (یا پروژه قبلی را استفاده کنید — بخش «مهاجرت» را ببینید).
2. **Authentication → Sign-in method:** گزینه‌های **Google** و **Email/Password** را فعال کنید.
3. **Authentication → Settings → Authorized domains:** دامنه Netlify (مثلاً `kitchentc.netlify.app`) و دامنه اختصاصی خود را اضافه کنید.
4. **Firestore Database:** یک دیتابیس بسازید (Production mode).
5. **Project settings → General → Your apps → Web app:** مقادیر `firebaseConfig` را بردارید.

### ۲) دیپلوی قوانین امنیتی
```bash
npm install
npx firebase login
npx firebase use --add          # انتخاب پروژه
npm run deploy:rules
```
یا خودکار از GitHub Actions: در تنظیمات مخزن، Secret با نام `FIREBASE_SERVICE_ACCOUNT` (کلید JSON یک Service Account با نقش‌های *Firebase Rules Admin* و *Cloud Datastore Index Admin*) و Variable با نام `FIREBASE_PROJECT_ID` بسازید؛ از آن به بعد هر تغییر `firestore.rules` روی `main` خودکار دیپلوی می‌شود.

### ۳) Netlify
1. پروژه Netlify را به همین مخزن GitHub وصل کنید (Build command و publish در `netlify.toml` تعریف شده‌اند).
2. در **Site configuration → Environment variables** این متغیرها را از `firebaseConfig` وارد کنید:

| متغیر | مقدار |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_DATABASE_ID` | فقط اگر دیتابیس نام‌دار (غیر `(default)`) دارید |

3. دیپلوی کنید و **اول خودتان وارد شوید**.

> این مقادیر شناسه عمومی‌اند و در مرورگر دیده می‌شوند؛ امنیت را `firestore.rules` تأمین می‌کند.

### ۴) بعد از اولین ورود
- پنل مدیریت → «تنظیمات و پشتیبان‌گیری»: در صورت نیاز «افزودن داده‌های نمونه (Demo)» برای محیط تست.
- محتوای آموزشی تا وقتی ویرایش نشود از نسخه پیش‌فرض داخل کد خوانده می‌شود.

---

## ارزیابی بر اساس بخش و ماژول‌ها

- در **ثبت درخواست**، «بخش استخدام» انتخاب می‌شود (انبار، گرمخانه، بسته‌بندی، تحویل، آشپزخانه، شعبه ایرانسل یا چندمهارته).
- در **Training Center** ماژول‌های پیش‌فرض همان بخش (فقط ماژول‌های زون نیرو) تیک می‌خورند و مربی می‌تواند تغییرشان دهد.
- همه ارزیابی‌ها فقط از ماژول‌های تخصیص‌یافته ساخته می‌شوند:
  C2 سوالات بانک همان ماژول‌ها (پیش‌فرض ۵ سوال تصادفی از هر ماژول)، C3 تسک‌های عملی همان ماژول‌ها،
  C4 سوالات عمومی + یک سناریو از هر ماژول، C5 معیارهای عمومی + معیار هر ماژول.
- نتیجه‌ها به تفکیک ماژول ذخیره می‌شوند؛ C6 ماژول‌های ضعیف را جمع‌بندی می‌کند و در «آموزش مجدد» همان‌ها از پیش انتخاب می‌شوند.
- پنل مدیریت: «ساختار ماژول‌ها» ← بخش‌ها و ماژول‌های هر بخش؛ «بانک آزمون تئوری» ← سوالات هر ماژول؛
  «تنظیمات و پشتیبان‌گیری» ← تعداد سوال از هر ماژول و حد نصاب قبولی.

> بانک سوالات حالا به ازای ماژول (`content/quizzes.byModule`) ذخیره می‌شود؛ سوالاتی که قبلاً به ازای زون ذخیره شده بودند (`byZone`) خوانده نمی‌شوند.

---

## مهاجرت از نسخه قبلی (AI Studio)

اگر از همان پروژه Firebase قبلی استفاده می‌کنید:
1. `firestoreDatabaseId` فایل `firebase-applet-config.json` قبلی را در `VITE_FIREBASE_DATABASE_ID` بگذارید (اگر `(default)` نبود).
2. **قبل از دیپلوی**، در Firestore Console:
   - سند `users/{UID خودتان}` را ویرایش کنید: `role = "admin"` و `status = "active"`.
   - سند `config/bootstrap` را با فیلد `adminUid = "{UID خودتان}"` بسازید (تا کس دیگری نتواند اولین ادمین شود).
   - فیلدهای `password` و `username` را از اسناد `users` حذف کنید (نسخه قبلی رمزها را متن ساده ذخیره می‌کرد).
3. کاربران قبلی `sectionPermissions` ندارند و بدون دسترسی دیده می‌شوند؛ از پنل مدیریت برایشان دسترسی تعیین کنید.
4. تاریخ‌های قدیمی (رشته شمسی) همان‌طور نمایش داده می‌شوند؛ داده‌های جدید ISO ذخیره می‌شوند.

---

## توسعه محلی

```bash
cp .env.example .env.local        # مقادیر Firebase را وارد کنید
npm install
npm run dev                       # http://localhost:3000
```

بدون پروژه واقعی، با Emulator (نیاز به Java):
```bash
npm run emulators                 # ترمینال ۱
# در .env.local:  VITE_USE_EMULATORS=true  و مقادیر ساختگی مثل VITE_FIREBASE_PROJECT_ID=demo-tc
npm run dev                       # ترمینال ۲
```

### دستورات

| دستور | کار |
|---|---|
| `npm run dev` | سرور توسعه |
| `npm run build` | تایپ‌چک + بیلد تولید در `dist/` |
| `npm test` | تست‌های واحد |
| `npm run test:rules` | تست قوانین امنیتی روی Emulator |
| `npm run deploy:rules` | دیپلوی `firestore.rules` |

CI (`.github/workflows/ci.yml`) روی هر Push/PR تایپ‌چک، تست‌ها، تست قوانین و بیلد را اجرا می‌کند.
