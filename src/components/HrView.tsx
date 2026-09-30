import React, { useState } from 'react';
import { PipelineTicket, SiteSettings } from '../types/pipeline';
import { ZONE_LABEL, STATUS_LABEL } from '../data/pipelineSeed';
import { Calendar, List, ArrowLeft, CheckCircle2, UserPlus, Clock, Sliders, ShieldAlert, UserCheck } from 'lucide-react';
import { showToast } from './Toast';
import { formatDate } from '../lib/date';

interface HrViewProps {
  canEdit?: boolean;
  tickets: PipelineTicket[];
  settings?: SiteSettings;
  onSaveHrInfo: (
    ticketId: string, 
    hrData: { candidateName: string; interviewDate: string; tcEntryDate: string; selfDeclaredTech: string },
    customFields?: Record<string, any>
  ) => void;
  onReferToTC: (ticketId: string) => void;
  onMarkSeen: (ticketId: string) => void;
}

export const HrView: React.FC<HrViewProps> = ({ 
  canEdit = true, 
  tickets, 
  settings, 
  onSaveHrInfo, 
  onReferToTC, 
  onMarkSeen 
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'cal'>('list');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Candidate form inputs
  const [name, setName] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [tcEntryDate, setTcEntryDate] = useState('');
  const [tech, setTech] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Calendar month state (Jalali 1404 default)
  const [calYear, setCalYear] = useState(1404);
  const [calMonth, setCalMonth] = useState(5); // Mordad / Shahrivar
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);

  const pendingTickets = tickets.filter(t => t.status === 'requested');
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleOpenDetail = (t: PipelineTicket) => {
    setSelectedTicketId(t.id);
    setName(t.hr?.candidateName || '');
    setInterviewDate(t.hr?.interviewDate || '');
    setTcEntryDate(t.hr?.tcEntryDate || '');
    setTech(t.hr?.selfDeclaredTech || '');
    setCustomFieldValues(t.customFields || {});
    if (!t.hrSeen && canEdit) {
      onMarkSeen(t.id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است و امکان ویرایش پرونده را ندارد.', 'warning');
      return;
    }
    if (!selectedTicketId || !name.trim() || !interviewDate.trim()) {
      showToast('لطفاً نام و تاریخ مصاحبه را وارد کنید.', 'warning');
      return;
    }
    onSaveHrInfo(
      selectedTicketId, 
      {
        candidateName: name.trim(),
        interviewDate: interviewDate.trim(),
        tcEntryDate: tcEntryDate.trim(),
        selfDeclaredTech: tech.trim()
      },
      customFieldValues
    );
    showToast('اطلاعات داوطلب و فیلدهای سفارشی با موفقیت ثبت شد.', 'success');
  };

  const handleRefer = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما فاقد دسترسی ارجاع کاندیدا به مرکز آموزش است.', 'warning');
      return;
    }
    if (!selectedTicketId) return;
    onReferToTC(selectedTicketId);
    showToast('کاندیدا با موفقیت به مرکز آموزش ارجاع داده شد.', 'success');
    setSelectedTicketId(null);
  };

  // Calendar helpers
  const JMONTHS = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const JDOW = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // Days in Iranian calendar month: months 1..6 have 31 days, 7..11 have 30 days, 12 has 29 (30 leap)
  const daysInMonth = calMonth <= 6 ? 31 : calMonth <= 11 ? 30 : 29;

  // Find all events for calendar
  const eventsByDay: Record<number, { ticket: PipelineTicket; kind: string }[]> = {};
  tickets.forEach(t => {
    if (t.hr?.interviewDate) {
      const parts = t.hr.interviewDate.split('/').map(Number);
      if (parts[0] === calYear && parts[1] === calMonth && parts[2]) {
        eventsByDay[parts[2]] = eventsByDay[parts[2]] || [];
        eventsByDay[parts[2]].push({ ticket: t, kind: 'مصاحبه استخدامی' });
      }
    }
    if (t.hr?.tcEntryDate) {
      const parts = t.hr.tcEntryDate.split('/').map(Number);
      if (parts[0] === calYear && parts[1] === calMonth && parts[2]) {
        eventsByDay[parts[2]] = eventsByDay[parts[2]] || [];
        eventsByDay[parts[2]].push({ ticket: t, kind: 'ورود به Training Center' });
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 text-[#835500] border border-[#F5A623]/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <UserCheck className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>منابع انسانی (HR) — ارزیابی، مصاحبه و ارجاع کارآموزان</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1B1F]">
            مدیریت متقاضیان و تقویم مصاحبه‌ها (HR)
          </h1>
          <p className="text-xs text-[#524534] mt-1">
            بررسی درخواست‌های جدید شعب، ثبت پرونده متقاضی جذب‌شده، هماهنگی تقویم مصاحبه و ارجاع به مرکز آموزش
          </p>
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-[#835500] shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5">حالت فقط مشاهده (Read-Only) — فاقد دسترسی ویرایش پرونده و ارجاع</strong>
            <span>
              شما به بخش منابع انسانی دسترسی مشاهده دارید، اما ثبت پرونده، تغییر مشخصات داوطلبان یا ارجاع به مرکز آموزش غیرفعال است.
            </span>
          </div>
        </div>
      )}

      {/* Subtabs */}
      <div className="flex items-center gap-2 border-b border-[#E3E2E7] pb-3">
        <button
          onClick={() => { setActiveTab('list'); setSelectedTicketId(null); }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'list'
              ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
              : 'text-[#524534] hover:bg-[#F4F3F8] hover:text-[#1A1B1F]'
          }`}
        >
          لیست تیکت‌ها ({pendingTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('cal')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'cal'
              ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
              : 'text-[#524534] hover:bg-[#F4F3F8] hover:text-[#1A1B1F]'
          }`}
        >
          تقویم مصاحبه‌ها
        </button>
      </div>

      {/* List Subtab */}
      {activeTab === 'list' && !selectedTicket && (
        <div className="space-y-3">
          {pendingTickets.length === 0 ? (
            <div className="bg-white border border-[#E3E2E7] rounded-3xl text-center py-12 text-[#524534] text-xs shadow-sm">
              تیکتی در انتظار بررسی HR وجود ندارد.
            </div>
          ) : (
            pendingTickets.map(t => (
              <div
                key={t.id}
                onClick={() => handleOpenDetail(t)}
                className="bg-white hover:bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer flex items-center justify-between gap-4 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {!t.hrSeen && (
                      <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                        NEW
                      </span>
                    )}
                    <span className="font-bold text-sm text-[#1A1B1F]">
                      {t.hr?.candidateName || `نیاز به نیرو: ${t.location}`}
                    </span>
                    {t.returnHistory?.length > 0 && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                        ↩ برگشتی ({t.returnHistory.length})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#524534] mt-1">
                    {ZONE_LABEL[t.zone]} · تاریخ درخواست: {formatDate(t.requestDate)} · درخواست‌دهنده: {t.requestedBy}
                  </div>
                </div>

                <span className="pl-tag">در انتظار بررسی HR</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ticket Detail & Registration Form */}
      {activeTab === 'list' && selectedTicket && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="text-xs text-[#524534] hover:text-[#835500] font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>بازگشت به لیست تیکت‌های HR</span>
          </button>

          {selectedTicket.returnHistory?.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-xs text-[#835500] space-y-1">
              <strong>علت برگشت از سوی Training Center:</strong>
              {selectedTicket.returnHistory.map((h, i) => (
                <div key={i} className="text-[11px] text-[#835500]/90">
                  • {formatDate(h.date)} — {h.reason} (توسط {h.by})
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Summary */}
            <div className="bg-[#FAF8FE] p-5 rounded-2xl border border-[#E3E2E7] space-y-3 text-xs">
              <h4 className="font-bold text-[#835500] text-sm">بسته‌ی درخواست عملیات</h4>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">Zone:</span>
                <span className="font-bold text-[#1A1B1F]">{ZONE_LABEL[selectedTicket.zone]}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">لوکیشن:</span>
                <span className="font-bold text-[#1A1B1F]">{selectedTicket.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">درخواست‌دهنده:</span>
                <span className="text-[#1A1B1F] font-bold">{selectedTicket.requestedBy}</span>
              </div>
              <div>
                <span className="text-[#524534] block mb-1">مهارت‌های الزامی:</span>
                <ul className="list-disc pr-4 space-y-0.5 text-[#1A1B1F]">
                  {selectedTicket.requiredSkills.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {selectedTicket.customFields && Object.keys(selectedTicket.customFields).length > 0 && (
                <div className="pt-2 border-t border-[#E3E2E7] space-y-1">
                  <span className="text-[#835500] font-bold block text-[11px]">فیلدهای سفارشی ثبت‌شده:</span>
                  {Object.entries(selectedTicket.customFields).map(([k, v]) => {
                    const fieldDef = settings?.ticketCustomFields?.find(f => f.key === k);
                    const label = fieldDef?.label || k;
                    return (
                      <div key={k} className="flex justify-between py-0.5 text-[11px]">
                        <span className="text-[#524534]">{label}:</span>
                        <span className="text-[#1A1B1F] font-bold">{String(v)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Candidate Registration Form */}
            <div className="bg-[#FAF8FE] p-5 rounded-2xl border border-[#E3E2E7] space-y-4">
              <h4 className="font-bold text-[#835500] text-sm flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#F5A623]" />
                ثبت اطلاعات نیروی جذب‌شده
              </h4>

              <form onSubmit={handleSave} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">نام و نام خانوادگی داوطلب</label>
                  <input
                    type="text"
                    required
                    disabled={!canEdit}
                    placeholder="مثلاً: سارا نوری"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full md-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#1A1B1F] font-bold mb-1">تاریخ مصاحبه</label>
                    <input
                      type="text"
                      required
                      disabled={!canEdit}
                      placeholder="۱۴۰۴/۰۶/۰۵"
                      value={interviewDate}
                      onChange={e => setInterviewDate(e.target.value)}
                      className="w-full md-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1A1B1F] font-bold mb-1">تاریخ ورود به سنجش</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="۱۴۰۴/۰۶/۱۰"
                      value={tcEntryDate}
                      onChange={e => setTcEntryDate(e.target.value)}
                      className="w-full md-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">خوداظهاری فنی و سوابق</label>
                  <textarea
                    rows={2}
                    disabled={!canEdit}
                    placeholder="تجربه کار با فرایر: بله / پیتزا: خیر"
                    value={tech}
                    onChange={e => setTech(e.target.value)}
                    className="w-full md-input"
                  />
                </div>

                {/* Dynamic Custom Fields in Candidate Profile */}
                {settings?.ticketCustomFields && settings.ticketCustomFields.length > 0 && (
                  <div className="pt-2 border-t border-[#E3E2E7] space-y-2">
                    <span className="text-[11px] font-bold text-[#835500] block flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-[#F5A623]" />
                      فیلدهای سفارشی پرونده داوطلب:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {settings.ticketCustomFields.filter(cf => cf.visible !== false).map(cf => (
                        <div key={cf.id} className={cf.type === 'textarea' ? 'sm:col-span-2' : ''}>
                          <label className="block text-[#1A1B1F] mb-1 font-medium text-[11px]">
                            {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                          </label>
                          {cf.type === 'select' ? (
                            <select
                              value={customFieldValues[cf.key] || ''}
                              disabled={!canEdit}
                              onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                              className="w-full md-input text-xs"
                              required={cf.required}
                            >
                              <option value="">-- انتخاب --</option>
                              {cf.options?.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : cf.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              disabled={!canEdit}
                              value={customFieldValues[cf.key] || ''}
                              onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                              className="w-full md-input text-xs"
                              required={cf.required}
                            />
                          ) : cf.type === 'number' ? (
                            <input
                              type="number"
                              disabled={!canEdit}
                              value={customFieldValues[cf.key] ?? ''}
                              onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                              className="w-full md-input text-xs"
                              required={cf.required}
                            />
                          ) : (
                            <input
                              type="text"
                              disabled={!canEdit}
                              value={customFieldValues[cf.key] || ''}
                              onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                              className="w-full md-input text-xs"
                              required={cf.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                  <button 
                    type="submit" 
                    disabled={!canEdit}
                    className={`w-full sm:flex-1 text-xs py-2.5 px-4 font-bold rounded-xl transition-all ${
                      canEdit 
                        ? 'md-btn-primary shadow-xs' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {canEdit ? 'ذخیره اطلاعات نیرو' : 'ذخیره غیرفعال (دسترسی فقط مشاهده)'}
                  </button>
                  {selectedTicket.hr && (
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={handleRefer}
                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        canEdit 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {canEdit ? 'ارجاع به Training Center' : 'ارجاع غیرفعال (فقط مشاهده)'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Subtab */}
      {activeTab === 'cal' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E2E7]">
            <button
              onClick={() => {
                if (calMonth === 1) { setCalMonth(12); setCalYear(y => y - 1); }
                else setCalMonth(m => m - 1);
              }}
              className="w-8 h-8 rounded-full bg-[#F4F3F8] hover:bg-[#E3E2E7] text-[#1A1B1F] flex items-center justify-center font-bold text-sm transition-all"
            >
              ‹
            </button>
            <h3 className="text-sm font-bold text-[#1A1B1F]">
              {JMONTHS[calMonth]} {calYear}
            </h3>
            <button
              onClick={() => {
                if (calMonth === 12) { setCalMonth(1); setCalYear(y => y + 1); }
                else setCalMonth(m => m + 1);
              }}
              className="w-8 h-8 rounded-full bg-[#F4F3F8] hover:bg-[#E3E2E7] text-[#1A1B1F] flex items-center justify-center font-bold text-sm transition-all"
            >
              ›
            </button>
          </div>

          {/* DOW headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs text-[#524534] font-bold">
            {JDOW.map((d, i) => (
              <div key={i} className="py-1">{d}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const hasEvents = Boolean(eventsByDay[dayNum]?.length);
              const isSelected = selectedCalDay === dayNum;

              return (
                <div
                  key={dayNum}
                  onClick={() => hasEvents && setSelectedCalDay(dayNum)}
                  className={`aspect-square rounded-2xl p-1.5 flex flex-col items-center justify-start text-xs transition-all relative border ${
                    hasEvents
                      ? 'bg-[#F5A623]/15 border-[#F5A623]/40 text-[#835500] font-bold cursor-pointer hover:bg-[#F5A623]/25 shadow-2xs'
                      : 'bg-[#FAF8FE] border-[#E3E2E7] text-[#524534]'
                  } ${isSelected ? 'ring-2 ring-[#F5A623] border-[#F5A623]' : ''}`}
                >
                  <span>{dayNum}</span>
                  {hasEvents && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] mt-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Day Events Info */}
          <div className="mt-4 p-4 rounded-2xl bg-[#FAF8FE] border border-[#E3E2E7] text-xs">
            {selectedCalDay && eventsByDay[selectedCalDay] ? (
              <div className="space-y-2">
                <span className="font-bold text-[#835500] block">
                  رویدادهای {selectedCalDay} {JMONTHS[calMonth]}:
                </span>
                {eventsByDay[selectedCalDay].map((ev, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#E3E2E7] last:border-0">
                    <span className="text-[#1A1B1F] font-bold">{ev.ticket.hr?.candidateName}</span>
                    <span className="text-[#524534] font-medium">{ev.kind} ({ZONE_LABEL[ev.ticket.zone]})</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[#524534]">
                روی روزهای دارای نشانگر کلیک کنید تا داوطلبان آن روز را مشاهده نمایید.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
