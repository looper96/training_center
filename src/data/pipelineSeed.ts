import { PipelineTicket, ZoneType, SiteSettings, TrainingModule } from '../types/pipeline';

export const ZONE_LABEL: Record<ZoneType, string> = {
  hub: 'Hub',
  superhub: 'SuperHub',
  irancell: 'irancell'
};

export const STATUS_LABEL: Record<string, string> = {
  requested: 'در انتظار بررسی HR',
  referred_to_training: 'ارجاع‌شده به Training Center',
  training: 'در حال آموزش',
  evaluation: 'در حال ارزیابی',
  handover: 'تحویل عملیات'
};

export const STATUS_COLOR: Record<string, string> = {
  requested: '',
  referred_to_training: '',
  training: '',
  evaluation: '',
  handover: 'good'
};

export const PIPE_ORDER = ['requested', 'referred_to_training', 'training', 'evaluation', 'handover'];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'مدیر کل سامانه (Admin)',
  trainer: 'مربی مرکز آموزش (Trainer)',
  hr: 'کارشناس منابع انسانی (HR)',
  ops: 'سرپرست عملیات (Ops Lead)',
  supervisor: 'سوپروایزر شعبه (Supervisor)'
};

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  id: 'global_settings',
  passingScorePct: 80,
  ticketCustomFields: [
    {
      id: 'cf_phone',
      label: 'شماره تماس داوطلب',
      key: 'phone',
      type: 'text',
      required: true,
      target: 'ticket'
    },
    {
      id: 'cf_shift',
      label: 'شیفت پیشنهادی',
      key: 'shiftPreference',
      type: 'select',
      options: ['شیفت صبح (۰۸:۳۰ الی ۱۶:۳۰)', 'شیفت شب (۱۷:۳۰ الی ۲۴:۰۰)', 'شناور / هر دو شیفت'],
      required: false,
      target: 'ticket'
    },
    {
      id: 'cf_exp',
      label: 'سابقه کار مرتبط (سال)',
      key: 'experienceYears',
      type: 'number',
      required: false,
      target: 'ticket'
    }
  ],
  componentCustomFields: [
    {
      id: 'cf_diff',
      label: 'سطح دشواری',
      key: 'difficulty',
      type: 'select',
      options: ['مقدماتی (پایه‌ای)', 'متوسط (عملیاتی)', 'پیشرفته (تخصصی)'],
      required: false,
      target: 'component'
    },
    {
      id: 'cf_retrain',
      label: 'دوره بازآموزی الزامی',
      key: 'retrainInterval',
      type: 'select',
      options: ['هر ۶ ماه', 'سالانه', 'بدون نیاز'],
      required: false,
      target: 'component'
    }
  ]
};

export const MODS: TrainingModule[] = [
  { id: 'M1', name: 'QC، ایمنی و بهداشت', count: 15, loc: 'Hub + SuperHub + irancell' },
  { id: 'M2', name: 'انبارداری', count: 13, loc: 'Hub + SuperHub' },
  { id: 'M3', name: 'چیدمان تا دسته‌بندی', count: 1, loc: 'Hub + SuperHub' },
  { id: 'M4', name: 'بسته‌بندی', count: 2, loc: 'Hub' },
  { id: 'M5', name: 'تحویل', count: 2, loc: 'Hub + SuperHub' },
  { id: 'M6', name: 'تجهیزات', count: 9, loc: 'Hub + SuperHub + irancell' },
  { id: 'M7', name: 'آماده‌سازی و پخت', count: 5, loc: 'SuperHub' },
  { id: 'M8', name: 'irancell — عملیات شعبه ایرانسل', count: 14, loc: 'irancell' }
];

export const ZONES_INIT: Record<ZoneType, { mods: string[]; dur: string }> = {
  hub: { mods: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'], dur: '~۲.۵ روز' },
  superhub: { mods: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'], dur: '۵ روز' },
  irancell: { mods: ['M1', 'M6', 'M8'], dur: '~۲–۳ روز' }
};

export const INTERVIEW_Q = [
  'چه میزان سابقه کار در رستوران یا فست‌فود دارید؟',
  'نحوه‌ی واکنش شما به خرابی ناگهانی تجهیزات (مثل فرایر یا یخچال) چیست؟',
  'اگر همکارتان اشتباهی مرتکب شود، چگونه با او برخورد می‌کنید؟',
  'در شرایط شلوغی و فشار زمانی پیک، چطور اولویت‌بندی می‌کنید؟',
  'تا چه اندازه توانایی آموزش و انتقال تجربه به نیروی جدید بعدی را دارید؟',
  'اگر متوجه تغییر غیرعادی در دمای یک دستگاه شوید، چه اقدامی انجام می‌دهید؟'
];

export const HANDOVER_ITEMS = [
  'جلسه‌ی حضوری/تماس مستقیم بین مسئول مرکز آموزش و سرپرست عملیات پذیرنده برگزار شد',
  'فرم نهایی تأیید صلاحیت (C6) به سرپرست پذیرنده منتقل شد',
  'نکات ایمنی خاص فردی (در صورت وجود) صریح به سرپرست پذیرنده منتقل شد',
  'نیرو به تیم عملیات معرفی شد',
  'همراه روز اول (Buddy) در عملیات واقعی مشخص شد'
];

export const CHECKIN_LABELS = [
  'وضعیت اشتغال (همچنان فعال؟)',
  'نرخ عدم انطباق QC ثبت‌شده برای این فرد (تعداد)',
  'یادداشت سرپرست',
  'وضعیت کلی'
];

export const TICKETS_SEED: PipelineTicket[] = [
  {
    id: 't1',
    zone: 'hub',
    location: 'هاب ۳ — تهران، سعادت‌آباد',
    requiredSkills: ['بسته‌بندی سریع و دقیق', 'کار با پنل ثبت سفارش', 'آشنایی با اصول FIFO'],
    requestedBy: 'سرپرست عملیات هاب ۳',
    requestDate: '1404/06/01',
    status: 'requested',
    hrSeen: false,
    returnHistory: [],
    hr: null,
    tc: null,
    customFields: { phone: '09121112233', shiftPreference: 'شیفت صبح (۰۸:۳۰ الی ۱۶:۳۰)' }
  },
  {
    id: 't2',
    zone: 'hub',
    location: 'هاب ۱ — تهران، ونک',
    requiredSkills: ['بسته‌بندی سریع و دقیق', 'تحویل به بایکر'],
    requestedBy: 'سرپرست عملیات هاب ۱',
    requestDate: '1404/05/20',
    status: 'referred_to_training',
    hrSeen: true,
    returnHistory: [],
    hr: {
      candidateName: 'مریم احمدی',
      interviewDate: '1404/05/25',
      tcEntryDate: '1404/06/02',
      selfDeclaredTech: 'بسته‌بندی: بله / کار با پنل: بله',
      phone: '09123456789',
      shiftPreference: 'شیفت شب (۱۷:۳۰ الی ۲۴:۰۰)'
    },
    tc: null
  },
  {
    id: 't3',
    zone: 'superhub',
    location: 'سوپرهاب ۲ — کرج',
    requiredSkills: ['پخت گریل', 'کار با فرایر', 'QC ظاهری محصول'],
    requestedBy: 'سرپرست عملیات سوپرهاب ۲',
    requestDate: '1404/05/10',
    status: 'training',
    hrSeen: true,
    returnHistory: [],
    hr: {
      candidateName: 'حسین کریمی',
      interviewDate: '1404/05/14',
      tcEntryDate: '1404/05/18',
      selfDeclaredTech: 'پخت گریل: بله / فرایر: بله',
      phone: '09351234567'
    },
    tc: {
      mentor: 'زهرا مرادی (مربی TC)',
      interviewDate: '1404/05/14',
      docsReceived: true,
      initialReview: 'approved',
      initialReviewNote: 'آمادگی بالا و تسلط بر ایستگاه پخت',
      assignedModules: [
        { id: 'M1', done: true },
        { id: 'M3', done: true },
        { id: 'M6', done: false },
        { id: 'M7', done: false }
      ],
      classStartDate: '1404/05/18',
      evalAttempts: 0,
      evalDecision: null,
      evalProgress: {},
      outcome: null
    }
  },
  {
    id: 't4',
    zone: 'superhub',
    location: 'سوپرهاب ۱ — تهران، پونک',
    requiredSkills: ['پخت گریل', 'تاپینگ برگر', 'بسته‌بندی نهایی'],
    requestedBy: 'سرپرست عملیات سوپرهاب ۱',
    requestDate: '1404/04/28',
    status: 'evaluation',
    hrSeen: true,
    returnHistory: [],
    hr: {
      candidateName: 'سارا نوری',
      interviewDate: '1404/05/02',
      tcEntryDate: '1404/05/06',
      selfDeclaredTech: 'پخت گریل: بله / پیتزا: خیر',
      phone: '09199887766'
    },
    tc: {
      mentor: 'زهرا مرادی (مربی TC)',
      interviewDate: '1404/05/02',
      docsReceived: true,
      initialReview: 'approved',
      initialReviewNote: '',
      assignedModules: [
        { id: 'M1', done: true },
        { id: 'M3', done: true },
        { id: 'M6', done: true },
        { id: 'M7', done: true }
      ],
      classStartDate: '1404/05/06',
      evalAttempts: 1,
      evalDecision: null,
      evalProgress: {
        c2: { score: 87, pass: true },
        c3: { score: 92, pass: true }
      },
      outcome: null
    }
  },
  {
    id: 't5',
    zone: 'irancell',
    location: 'شعبه ایرانسل — ولیعصر',
    requiredSkills: ['عملیات کامل شعبه', 'رعایت ساعت‌های مقرر'],
    requestedBy: 'سرپرست شعبه ایرانسل',
    requestDate: '1404/02/25',
    status: 'handover',
    hrSeen: true,
    returnHistory: [],
    hr: {
      candidateName: 'رضا مرادی',
      interviewDate: '1404/03/01',
      tcEntryDate: '1404/03/03',
      selfDeclaredTech: 'بله'
    },
    tc: {
      mentor: 'زهرا مرادی (مربی TC)',
      interviewDate: '1404/03/01',
      docsReceived: true,
      initialReview: 'approved',
      initialReviewNote: '',
      assignedModules: [
        { id: 'M1', done: true },
        { id: 'M6', done: true },
        { id: 'M8', done: true }
      ],
      classStartDate: '1404/03/03',
      evalAttempts: 1,
      evalDecision: 'pass',
      evalProgress: {
        c2: { score: 90, pass: true },
        c3: { score: 95, pass: true },
        c4: { pass: true, summary: 'تأیید شد' },
        c5: { avg: 4.8, pass: true },
        c6: { decision: 'pass', pass: true }
      },
      outcome: {
        type: 'handover',
        date: '1404/03/05',
        buddy: 'سینا قاسمی',
        opsConfirmed: true,
        opsConfirmedDate: '1404/03/06',
        report: { visits: 6, nonConformities: 2 }
      }
    }
  },
  {
    id: 't6',
    zone: 'hub',
    location: 'هاب ۲ — اصفهان',
    requiredSkills: ['بسته‌بندی', 'کنترل دما هنگام ارسال'],
    requestedBy: 'سرپرست عملیات هاب ۲',
    requestDate: '1404/03/20',
    status: 'requested',
    hrSeen: false,
    returnHistory: [
      {
        date: '1404/03/24',
        reason: 'در بررسی اولیه، آمادگی رفتاری لازم برای ورود به دوره تشخیص داده نشد.',
        by: 'Training Center',
        name: 'زهرا حسینی'
      }
    ],
    hr: null,
    tc: null
  },
  {
    id: 't7',
    zone: 'superhub',
    location: 'سوپرهاب ۳ — تهران، تجریش',
    requiredSkills: ['پخت فرایر', 'تاپینگ', 'QC'],
    requestedBy: 'سرپرست عملیات سوپرهاب ۳',
    requestDate: '1404/05/28',
    status: 'referred_to_training',
    hrSeen: true,
    returnHistory: [],
    hr: {
      candidateName: 'امیر صادقی',
      interviewDate: '1404/06/01',
      tcEntryDate: '1404/06/05',
      selfDeclaredTech: 'بله به همه موارد'
    },
    tc: null
  },
  {
    id: 't8',
    zone: 'hub',
    location: 'هاب ۴ — تهران، نارمک',
    requiredSkills: ['بسته‌بندی سریع', 'تحویل به بایکر'],
    requestedBy: 'سرپرست عملیات هاب ۴',
    requestDate: '1404/04/10',
    status: 'handover',
    hrSeen: true,
    returnHistory: [],
    hr: {
      candidateName: 'نگار رضایی',
      interviewDate: '1404/04/14',
      tcEntryDate: '1404/04/18',
      selfDeclaredTech: 'بله'
    },
    tc: {
      mentor: 'کیوان رستمی (مربی TC)',
      interviewDate: '1404/04/14',
      docsReceived: true,
      initialReview: 'approved',
      initialReviewNote: '',
      assignedModules: [
        { id: 'M1', done: true },
        { id: 'M4', done: true },
        { id: 'M5', done: true }
      ],
      classStartDate: '1404/04/18',
      evalAttempts: 1,
      evalDecision: 'pass',
      evalProgress: {
        c2: { score: 92, pass: true },
        c3: { score: 88, pass: true }
      },
      outcome: {
        type: 'handover',
        date: '1404/04/25',
        buddy: 'امید کاظمی',
        opsConfirmed: false,
        opsConfirmedDate: null,
        report: { visits: 0, nonConformities: 0 }
      }
    }
  }
];
