import React, { useState } from 'react';
import { 
  ReceiptText, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Flame,
  Snowflake,
  PackageCheck
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  category: 'hot' | 'cold' | 'sauce' | 'cutlery';
  qty: number;
  notes?: string;
  packed?: boolean;
}

interface SimulatedOrder {
  orderNumber: string;
  courierCode: string;
  customerName: string;
  timeOrdered: string;
  specialInstruction: string;
  items: OrderItem[];
  requiresSeparateDrinkBag: boolean;
  requiresDoubleSeal: boolean;
}

const SAMPLE_ORDERS: SimulatedOrder[] = [
  {
    orderNumber: 'SK-84920',
    courierCode: '۹۴۲۰',
    customerName: 'سارا کاظمی',
    timeOrdered: '۱۲:۴۵:۱۰',
    specialInstruction: 'لطفاً بدون پیاز باشد؛ سس دست‌ساز اضافه فراموش نشود. قاشق و دستمال گذاشته شود.',
    requiresSeparateDrinkBag: true,
    requiresDoubleSeal: true,
    items: [
      { id: '1', name: 'دبل چیزبرگر مخصوص زغالی (بدون پیاز)', category: 'hot', qty: 1, notes: 'سفارشی: بدون پیاز' },
      { id: '2', name: 'سیب‌زمینی کریسپی ویژه با پودر پاپریکا', category: 'hot', qty: 1 },
      { id: '3', name: 'نوشابه کوکاکولا قوطی خنک', category: 'cold', qty: 2 },
      { id: '4', name: 'سس تارتار دست‌ساز اضافه', category: 'sauce', qty: 2 },
      { id: '5', name: 'پک قاشق، چنگال و دستمال مرطوب اسنپ‌کیچن', category: 'cutlery', qty: 1 }
    ]
  },
  {
    orderNumber: 'SK-73104',
    courierCode: '۳۱۰۴',
    customerName: 'محمدرضا کریمی',
    timeOrdered: '۲۰:۱۵:۳۳',
    specialInstruction: 'غذا خیلی داغ بماند؛ پیتزا برش نخورده باشد؛ سس سیر اضافه.',
    requiresSeparateDrinkBag: true,
    requiresDoubleSeal: false,
    items: [
      { id: '1', name: 'پیتزا سیر و استیک آمریکایی (برش نخورده)', category: 'hot', qty: 1, notes: 'کاستوم: برش نخورده' },
      { id: '2', name: 'بال سوخاری ۶ تکه با دیپ هالاپینو', category: 'hot', qty: 1 },
      { id: '3', name: 'دوغ نعنایی بطری سرد', category: 'cold', qty: 1 },
      { id: '4', name: 'دیپ پنیر گودا گرم', category: 'sauce', qty: 1 },
      { id: '5', name: 'پک بهداشتی و دستمال سفره', category: 'cutlery', qty: 1 }
    ]
  },
  {
    orderNumber: 'SK-99412',
    courierCode: '۹۴۱۲',
    customerName: 'فاطمه ابراهیمی',
    timeOrdered: '۲۱:۰۵:۱۸',
    specialInstruction: 'رژیمی؛ سالاد سزار بدون سس روی کاهو (سس جدا در کاسه)؛ آب معدنی خنک.',
    requiresSeparateDrinkBag: true,
    requiresDoubleSeal: true,
    items: [
      { id: '1', name: 'فیله مرغ گریل رژیمی با سبزیجات بخارپز', category: 'hot', qty: 1 },
      { id: '2', name: 'سالاد سزار ویژه (سس سزار در ظرف جدا)', category: 'cold', qty: 1, notes: 'سس مجزا' },
      { id: '3', name: 'آب معدنی دماوند خنک', category: 'cold', qty: 2 },
      { id: '4', name: 'سس باربیکیو تند', category: 'sauce', qty: 1 },
      { id: '5', name: 'پک قاشق و چنگال زیست‌تخریب‌پذیر', category: 'cutlery', qty: 1 }
    ]
  }
];

export const OrderSimulator: React.FC = () => {
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [packedItems, setPackedItems] = useState<string[]>([]);
  const [hasSeparateDrinkBag, setHasSeparateDrinkBag] = useState(false);
  const [hasDoubleSealed, setHasDoubleSealed] = useState(false);
  const [courierInputCode, setCourierInputCode] = useState('');
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error' | null; message: string }>({
    status: null,
    message: ''
  });

  const order = SAMPLE_ORDERS[currentOrderIndex];

  const toggleItemPack = (id: string) => {
    setPackedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNextOrder = () => {
    setCurrentOrderIndex((currentOrderIndex + 1) % SAMPLE_ORDERS.length);
    setPackedItems([]);
    setHasSeparateDrinkBag(false);
    setHasDoubleSealed(false);
    setCourierInputCode('');
    setFeedback({ status: null, message: '' });
  };

  const handleValidatePackaging = () => {
    // Check all items packed
    if (packedItems.length < order.items.length) {
      setFeedback({
        status: 'error',
        message: 'خطای پکینگ: هنوز همه اقلام فیش در بسته قرار نگرفته‌اند! اقلام جامانده را بررسی کنید.'
      });
      return;
    }

    // Check cold separation
    if (order.requiresSeparateDrinkBag && !hasSeparateDrinkBag) {
      setFeedback({
        status: 'error',
        message: 'خطای کنترل کیفی (M4): نوشیدنی سرد نباید در کنار ظرف داغ قرار گیرد؛ گزینه «تفکیک نوشیدنی در کیسه مجزا» الزامی است.'
      });
      return;
    }

    // Check seal
    if (!hasDoubleSealed) {
      setFeedback({
        status: 'error',
        message: 'خطای ایمنی تحویل: پلمپ امنیتی کیسه با منگنه یا چسب پلمپ اسنپ‌کیچن انجام نشده است.'
      });
      return;
    }

    // Check courier code
    if (courierInputCode.trim() !== order.courierCode) {
      setFeedback({
        status: 'error',
        message: `خطای تطبیق پیک (M5): کد ۴ رقمی تحویل به پیک مطابقت ندارد! (کد صحیح: ${order.courierCode})`
      });
      return;
    }

    setFeedback({
      status: 'success',
      message: 'آفرین! سفارش ۱۰۰٪ بر اساس استانداردهای M4 (بسته‌بندی) و M5 (تحویل به پیک) تکمیل و دیسپچ شد.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 border border-amber-800/40 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                کارگاه عملی فاز ۲ و ۴
              </span>
              <span className="text-slate-400 text-xs">• تفسیر فیش حرارتی، پکینگ و تحویل پیک</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              شبیه‌ساز تعاملی فیش‌خوانی و بسته‌بندی سفارشات (M4 & M5)
            </h2>
            <p className="text-xs text-amber-200/80 max-w-3xl leading-relaxed">
              پرسنل در این شبیه‌ساز واقعی، فیش سفارش مشتری را بررسی کرده، اقلام غذایی و سس‌ها را انتخاب می‌کند، تداخل دمایی غذا و نوشیدنی را مدیریت کرده و با تطبیق کد ۴ رقمی تحویل پیک را نهایی می‌سازد.
            </p>
          </div>

          <button
            onClick={handleNextOrder}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>بارگذاری فیش سفارش بعدی</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Thermal Receipt Simulation (Left 5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-300 rounded-3xl p-6 shadow-md relative overflow-hidden font-mono text-slate-800">
          {/* Top Sawtooth Graphic */}
          <div className="border-b-2 border-dashed border-slate-300 pb-4 mb-4 text-center space-y-1">
            <span className="text-sm font-black tracking-widest text-slate-900 uppercase block font-sans">
              ★ SNAPPKITCHEN EXPRESS ★
            </span>
            <span className="text-xs text-slate-500 block font-sans">
              شعبه سوپرهاب سعادت‌آباد - میز پکینگ ۳
            </span>
            <div className="flex justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200 font-sans">
              <span>شماره فیش: <strong className="text-slate-900">{order.orderNumber}</strong></span>
              <span>ساعت: <strong>{order.timeOrdered}</strong></span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 font-sans">
              <span>مشتری: <strong>{order.customerName}</strong></span>
              <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                کد پیک: {order.courierCode}
              </span>
            </div>
          </div>

          {/* Customer Instruction Alert */}
          {order.specialInstruction && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4 text-xs font-sans">
              <span className="text-amber-900 font-bold block mb-0.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                یادداشت حیاتی مشتری:
              </span>
              <p className="text-amber-800 leading-relaxed font-semibold">
                «{order.specialInstruction}»
              </p>
            </div>
          )}

          {/* Items List in Receipt */}
          <div className="space-y-2 mb-6">
            <span className="text-[11px] font-bold text-slate-500 block uppercase font-sans border-b border-slate-200 pb-1">
              اقلام سفارش (برای افزودن به پاکت کلیک کنید):
            </span>
            {order.items.map((item) => {
              const isPacked = packedItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItemPack(item.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer font-sans flex items-center justify-between text-xs select-none ${
                    isPacked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${
                      isPacked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.qty}×
                    </span>
                    <div>
                      <span>{item.name}</span>
                      {item.notes && (
                        <span className="block text-[10px] text-amber-700 font-semibold">
                          ({item.notes})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.category === 'hot' && (
                      <span title="غذای گرم">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                      </span>
                    )}
                    {item.category === 'cold' && (
                      <span title="نوشیدنی خنک">
                        <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isPacked ? 'bg-emerald-200 text-emerald-800 font-bold' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPacked ? 'در پاکت قرار گرفت ✓' : 'هنوز برداشته نشده'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-center text-slate-400 border-t-2 border-dashed border-slate-300 pt-3 font-sans">
            اسنپ‌کیچن | لذت یک غذای سالم و داغ | بازرسی کیفیت پیش از تحویل
          </div>
        </div>

        {/* Packing & Courier Verification Workbench (Right 7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              میز کار بسته‌بندی و کنترل کیفیت نهایی (Packaging Station)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              دستورالعمل ماژول M4: تفکیک دمایی، بسته‌بندی امن و تطبیق ۴ رقم کد پیک پیش از خروج
            </p>
          </div>

          {/* Items Packed Counter */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">اقلام قرار گرفته در پاکت:</span>
                <span className="text-[11px] text-slate-500">
                  {packedItems.length} از {order.items.length} آیتم جمع‌آوری شد
                </span>
              </div>
            </div>

            <span className="text-lg font-black text-emerald-600">
              {Math.round((packedItems.length / order.items.length) * 100)}٪
            </span>
          </div>

          {/* Quality Rules Checkboxes */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              اقدامات کنترلی و استانداردهای فیزیکی:
            </span>

            {/* Drink Bag Option */}
            <div
              onClick={() => setHasSeparateDrinkBag(!hasSeparateDrinkBag)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                hasSeparateDrinkBag
                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Snowflake className="w-4 h-4 text-blue-500" />
                <div>
                  <span>تفکیک نوشیدنی‌های خنک در کیسه مجزا (حفظ دمای غذای گرم)</span>
                  <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                    طبق استاندارد OE، قوطی سرد نباید جعبه برگر یا پیتزا را خنک کند.
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                hasSeparateDrinkBag ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {hasSeparateDrinkBag && '✓'}
              </div>
            </div>

            {/* Seal Bag Option */}
            <div
              onClick={() => setHasDoubleSealed(!hasDoubleSealed)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                hasDoubleSealed
                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <div>
                  <span>پلمپ امنیتی کیسه با برچسب یا منگنه اسنپ‌کیچن</span>
                  <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                    اطمینان از دست‌نخورده رسیدن سفارش به مشتری و عدم باز شدن در موتور.
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                hasDoubleSealed ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {hasDoubleSealed && '✓'}
              </div>
            </div>
          </div>

          {/* Courier Handover Code Verification */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              تطبیق ۴ رقم پایانی کد سفیر پیک (تحویل به پیک - ماژول M5):
            </label>
            <p className="text-[11px] text-slate-500">
              از روی فیش سفارش، کد ۴ رقمی راننده را خوانده و جهت تایید وارد نمایید:
            </p>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                maxLength={4}
                value={courierInputCode}
                onChange={(e) => setCourierInputCode(e.target.value)}
                placeholder="مثلاً ۹۴۲۰"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-center tracking-widest focus:outline-none focus:border-rose-500"
              />
              <span className="text-xs text-slate-400 font-medium">کد تحویل</span>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback.message && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              feedback.status === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                : 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
            }`}>
              {feedback.status === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleNextOrder}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              رد کردن این سفارش
            </button>

            <button
              onClick={handleValidatePackaging}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <PackageCheck className="w-4 h-4" />
              <span>تایید بسته‌بندی و تحویل سفارش به پیک</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
