import React, { useState } from 'react';
import { PipelineTicket, ZoneType, SiteSettings, JobPosition } from '../types/pipeline';
import { positionLabel } from '../lib/assessment';
import { ZONE_LABEL, STATUS_LABEL, STATUS_COLOR } from '../data/pipelineSeed';
import { PlusCircle, ListFilter, ArrowLeft, CheckCircle2, ChevronRight, Sliders, ShieldAlert, FileText, Send } from 'lucide-react';
import { showToast } from './Toast';
import { formatDate } from '../lib/date';

interface RequestViewProps {
  canEdit?: boolean;
  tickets: PipelineTicket[];
  settings?: SiteSettings;
  positions: JobPosition[];
  onSubmitRequest: (ticket: Omit<PipelineTicket, 'id' | 'requestDate' | 'status' | 'hrSeen' | 'returnHistory' | 'hr' | 'tc'>) => void;
}

export const RequestView: React.FC<RequestViewProps> = ({ 
  canEdit = true, 
  tickets, 
  settings, 
  positions,
  onSubmitRequest 
}) => {
  const [activeSubtab, setActiveSubtab] = useState<'new' | 'status'>(canEdit ? 'new' : 'status');
  const [zone, setZone] = useState<ZoneType>('hub');
  const [location, setLocation] = useState('');
  const [position, setPosition] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('حساب کاربری شما فاقد دسترسی ثبت درخواست (فقط مشاهده) است.', 'warning');
      return;
    }
    if (!location.trim() || !position || !skillsText.trim() || !requestedBy.trim()) {
      showToast('لطفاً همه فیلدهای الزامی درخواست را تکمیل نمایید.', 'warning');
      return;
    }
    const requiredSkills = skillsText.split('\n').map(s => s.trim()).filter(Boolean);
    onSubmitRequest({
      zone,
      position,
      location: location.trim(),
      requiredSkills,
      requestedBy: requestedBy.trim(),
      customFields: customFieldValues
    });

    showToast(`درخواست نیرو برای ${location} با موفقیت ثبت شد.`, 'success');
    setSubmittedFeedback(`درخواست برای ${location} با موفقیت ثبت شد.`);
    setLocation('');
    setPosition('');
    setSkillsText('');
    setRequestedBy('');
    setCustomFieldValues({});
    setTimeout(() => {
      setSubmittedFeedback(null);
      setActiveSubtab('status');
    }, 1500);
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 text-[#835500] border border-[#F5A623]/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <FileText className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>عملیات اسنپ‌کیچن — ثبت و پیگیری نیاز نیروی انسانی</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1B1F]">
            ثبت درخواست نیروی کار جدید
          </h1>
          <p className="text-xs text-[#524534] mt-1">
            ثبت تیکت نیاز به نیروی کار جدید توسط سرپرستان و پیگیری فرآیند گزینش در HR و آموزش در Training Center
          </p>
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-[#835500] shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5">حالت فقط مشاهده (Read-Only) — فاقد دسترسی ثبت درخواست</strong>
            <span>
              شما به این بخش دسترسی مشاهده دارید و می‌توانید وضعیت درخواست‌های موجود را بررسی کنید، اما امکان ثبت تیکت جدید به شما اختصاص داده نشده است.
            </span>
          </div>
        </div>
      )}

      {/* Subtabs */}
      <div className="flex items-center gap-2 border-b border-[#E3E2E7] pb-3">
        {canEdit && (
          <button
            onClick={() => { setActiveSubtab('new'); setSelectedTicketId(null); }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeSubtab === 'new'
                ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
                : 'text-[#524534] hover:bg-[#F4F3F8] hover:text-[#1A1B1F]'
            }`}
          >
            درخواست جدید
          </button>
        )}
        <button
          onClick={() => setActiveSubtab('status')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeSubtab === 'status'
              ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
              : 'text-[#524534] hover:bg-[#F4F3F8] hover:text-[#1A1B1F]'
          }`}
        >
          وضعیت درخواست‌ها ({tickets.length})
        </button>
      </div>

      {/* Tab: New Request */}
      {activeSubtab === 'new' && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm max-w-2xl space-y-4">
          {submittedFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{submittedFeedback}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-[#1A1B1F] mb-1.5">Zone عملیاتی</label>
              <select
                value={zone}
                disabled={!canEdit}
                onChange={e => setZone(e.target.value as ZoneType)}
                className="w-full md-input font-bold"
              >
                <option value="hub">Zone Hub (~۲.۵ روز آموزش)</option>
                <option value="superhub">Zone SuperHub (۵ روز آموزش پخت و تاپینگ)</option>
                <option value="irancell">Zone irancell (~۲–۳ روز عملیات اختصاصی)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1B1F] mb-1.5">بخش / سمت استخدام</label>
              <select
                value={position}
                required
                disabled={!canEdit}
                onChange={e => setPosition(e.target.value)}
                className="w-full md-input font-bold"
              >
                <option value="">— انتخاب بخش —</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <p className="text-[11px] text-[#524534] mt-1">
                ماژول‌های آموزشی و آزمون‌های نیرو بر اساس همین بخش تعیین می‌شوند.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1B1F] mb-1.5">لوکیشن و آدرس شعبه</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                placeholder="مثلاً هاب ۳ — تهران، سعادت‌آباد"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full md-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1B1F] mb-1.5">
                قابلیت‌ها و مهارت‌های موردنیاز (هر مورد در یک خط)
              </label>
              <textarea
                rows={3}
                required
                disabled={!canEdit}
                placeholder="بسته‌بندی سریع و دقیق&#10;کار با پنل ثبت سفارش&#10;رعایت اصول FIFO"
                value={skillsText}
                onChange={e => setSkillsText(e.target.value)}
                className="w-full md-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1B1F] mb-1.5">
                درخواست‌دهنده
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                placeholder="مثلاً سرپرست عملیات هاب ۲"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                className="w-full md-input"
              />
            </div>

            {/* Dynamic Ticket Custom Fields */}
            {settings?.ticketCustomFields && settings.ticketCustomFields.length > 0 && (
              <div className="pt-3 border-t border-[#E3E2E7] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#835500]">
                  <Sliders className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>فیلدهای تکمیلی درخواست:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {settings.ticketCustomFields.filter(cf => cf.visible !== false).map(cf => (
                    <div key={cf.id} className={cf.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-[#1A1B1F] mb-1">
                        {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                      </label>
                      {cf.type === 'select' ? (
                        <select
                          value={customFieldValues[cf.key] || ''}
                          disabled={!canEdit}
                          onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                          className="w-full md-input"
                          required={cf.required}
                        >
                          <option value="">-- انتخاب کنید --</option>
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
                          className="w-full md-input"
                          required={cf.required}
                        />
                      ) : cf.type === 'number' ? (
                        <input
                          type="number"
                          disabled={!canEdit}
                          value={customFieldValues[cf.key] ?? ''}
                          onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                          className="w-full md-input"
                          required={cf.required}
                        />
                      ) : (
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={customFieldValues[cf.key] || ''}
                          onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                          className="w-full md-input"
                          required={cf.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={!canEdit}
                className={`w-full text-xs font-bold py-3 flex items-center justify-center gap-2 rounded-2xl transition-all ${
                  canEdit 
                    ? 'md-btn-primary shadow-md' 
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                {canEdit ? (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ثبت رسمی درخواست در سامانه</span>
                  </>
                ) : (
                  <span>ثبت درخواست غیرفعال است (حالت فقط مشاهده)</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Status of Requests */}
      {activeSubtab === 'status' && !selectedTicket && (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <div className="bg-white border border-[#E3E2E7] rounded-3xl p-10 text-center text-xs text-[#524534]">
              هنوز درخواستی در سامانه ثبت نشده است.
            </div>
          ) : (
            [...tickets].reverse().map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className="bg-white hover:bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer flex items-center justify-between gap-4 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#1A1B1F]">
                      {t.hr?.candidateName || `(نام کاندیدا هنوز ثبت نشده) — ${t.location}`}
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

                <div className="flex items-center gap-2">
                  <span className={`pl-tag ${STATUS_COLOR[t.status] || ''}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#857462]" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detailed Ticket Drawer */}
      {activeSubtab === 'status' && selectedTicket && (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="text-xs text-[#524534] hover:text-[#835500] font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>بازگشت به لیست درخواست‌ها</span>
          </button>

          <div className="border-b border-[#E3E2E7] pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1A1B1F]">
                جزئیات تیکت {selectedTicket.id} — {selectedTicket.location}
              </h2>
              <span className={`pl-tag ${STATUS_COLOR[selectedTicket.status] || ''}`}>
                {STATUS_LABEL[selectedTicket.status]}
              </span>
            </div>
          </div>

          {selectedTicket.returnHistory?.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-xs text-[#835500] space-y-1">
              <strong>تاریخچه برگشت به HR:</strong>
              {selectedTicket.returnHistory.map((h, i) => (
                <div key={i} className="text-[11px] text-[#835500]/90">
                  • {formatDate(h.date)} — {h.by}: {h.reason} (نیرو: {h.name})
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#FAF8FE] p-4 rounded-2xl space-y-2 border border-[#E3E2E7]">
              <h4 className="font-bold text-[#835500] mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#F5A623]" />
                <span>بسته‌ی درخواست (عملیات)</span>
              </h4>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">Zone:</span>
                <span className="font-bold text-[#1A1B1F]">{ZONE_LABEL[selectedTicket.zone]}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">بخش استخدام:</span>
                <span className="font-bold text-[#1A1B1F]">{positionLabel(positions, selectedTicket.position)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">شعبه:</span>
                <span className="font-bold text-[#1A1B1F]">{selectedTicket.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">درخواست‌دهنده:</span>
                <span className="font-bold text-[#1A1B1F]">{selectedTicket.requestedBy}</span>
              </div>
              <div className="py-1">
                <span className="text-[#524534] block mb-1">قابلیت‌های موردنیاز:</span>
                <ul className="list-disc pr-4 space-y-0.5 text-[#1A1B1F]">
                  {selectedTicket.requiredSkills.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {selectedTicket.customFields && Object.keys(selectedTicket.customFields).length > 0 && (
                <div className="pt-2 border-t border-[#E3E2E7] space-y-1">
                  <span className="text-[#835500] font-bold block text-[11px]">اطلاعات تکمیلی فیلدهای سفارشی:</span>
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

            <div className="bg-[#FAF8FE] p-4 rounded-2xl space-y-2 border border-[#E3E2E7]">
              <h4 className="font-bold text-[#835500] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#F5A623]" />
                <span>وضعیت جذب و آموزش (HR & TC)</span>
              </h4>
              {selectedTicket.hr ? (
                <>
                  <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                    <span className="text-[#524534]">نیروی جذب‌شده:</span>
                    <span className="font-bold text-[#1A1B1F]">{selectedTicket.hr.candidateName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                    <span className="text-[#524534]">تاریخ مصاحبه:</span>
                    <span className="text-[#1A1B1F]">{selectedTicket.hr.interviewDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                    <span className="text-[#524534]">ورود به سنجش:</span>
                    <span className="text-[#1A1B1F]">{selectedTicket.hr.tcEntryDate}</span>
                  </div>
                </>
              ) : (
                <p className="text-[#524534] py-2">هنوز نیرویی از سمت HR به این تیکت تخصیص داده نشده است.</p>
              )}

              {selectedTicket.tc?.mentor && (
                <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                  <span className="text-[#524534]">مربی Training Center:</span>
                  <span className="font-bold text-[#835500]">{selectedTicket.tc.mentor}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
