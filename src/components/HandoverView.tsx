import React, { useState } from 'react';
import { PipelineTicket } from '../types/pipeline';
import { ZONE_LABEL } from '../data/pipelineSeed';
import { ArrowLeft, CheckCircle2, ShieldCheck, Clock, AlertTriangle, ShieldAlert, CheckSquare } from 'lucide-react';
import { showToast } from './Toast';
import { formatDate } from '../lib/date';

interface HandoverViewProps {
  canEdit?: boolean;
  tickets: PipelineTicket[];
  onConfirmReceipt: (ticketId: string) => void;
  onUpdateReport: (ticketId: string, report: { visits: number; nonConformities: number; durationDays?: string | number }) => void;
}

export const HandoverView: React.FC<HandoverViewProps> = ({
  canEdit = true,
  tickets,
  onConfirmReceipt,
  onUpdateReport
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [durationDays, setDurationDays] = useState('');
  const [visits, setVisits] = useState(0);
  const [nc, setNc] = useState(0);

  const handoverTickets = tickets.filter(t => t.status === 'handover');
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleOpenDetail = (t: PipelineTicket) => {
    setSelectedTicketId(t.id);
    const rep = t.tc?.outcome?.report;
    setDurationDays(String(rep?.durationDays ?? ''));
    setVisits(rep?.visits ?? 0);
    setNc(rep?.nonConformities ?? 0);
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showToast('حساب کاربری شما دارای دسترسی فقط مشاهده است و امکان ثبت گزارش پایش را ندارد.', 'warning');
      return;
    }
    if (!selectedTicketId) return;
    onUpdateReport(selectedTicketId, {
      durationDays: durationDays || undefined,
      visits: Number(visits) || 0,
      nonConformities: Number(nc) || 0
    });
    showToast('گزارش پایش استقرار نیرو در عملیات با موفقیت به‌روزرسانی شد.', 'success');
  };

  const handleConfirm = () => {
    if (!canEdit) {
      showToast('حساب کاربری شما فاقد دسترسی تأیید تحویل نیرو در عملیات است.', 'warning');
      return;
    }
    if (!selectedTicketId) return;
    onConfirmReceipt(selectedTicketId);
    showToast('تحویل نیرو با موفقیت تأیید شد.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 text-[#835500] border border-[#F5A623]/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>عملیات و شعب — پروتکل تحویل، همراه روز اول (Buddy) و پایش استقرار</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1B1F]">
            تحویل به عملیات (Handover)
          </h1>
          <p className="text-xs text-[#524534] mt-1">
            تأیید رسمی تحویل نیرو توسط سرپرست شعبه مقصد، تعیین Buddy روز اول و پایش شاخص‌های کیفی و ماندگاری ۳۰/۶۰/۹۰ روزه
          </p>
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-[#835500] shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5">حالت فقط مشاهده (Read-Only) — فاقد دسترسی تأیید تحویل و ثبت پایش</strong>
            <span>
              شما به این بخش دسترسی مشاهده دارید، اما تأیید دریافت فیزیکی نیرو یا ثبت گزارش‌های کیفی پایش غیرفعال است.
            </span>
          </div>
        </div>
      )}

      {!selectedTicket ? (
        <div className="space-y-3">
          {handoverTickets.length === 0 ? (
            <div className="bg-white border border-[#E3E2E7] rounded-3xl text-center py-12 text-[#524534] text-xs shadow-sm">
              هنوز نیرویی به مرحله تحویل نهایی به عملیات نرسیده است.
            </div>
          ) : (
            handoverTickets.map(t => {
              const confirmed = Boolean(t.tc?.outcome?.opsConfirmed);
              return (
                <div
                  key={t.id}
                  onClick={() => handleOpenDetail(t)}
                  className="bg-white hover:bg-[#FAF8FE] p-4 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623] cursor-pointer flex items-center justify-between gap-4 transition-all shadow-xs"
                >
                  <div>
                    <span className="font-bold text-sm text-[#1A1B1F] block">
                      {t.hr?.candidateName}
                    </span>
                    <span className="text-xs text-[#524534] mt-1 block">
                      {ZONE_LABEL[t.zone]} · {t.location} · تحویل TC: {formatDate(t.tc?.outcome?.date)}
                    </span>
                  </div>

                  <span className={`pl-tag ${confirmed ? 'good' : 'warn'}`}>
                    {confirmed ? 'تأییدشده توسط عملیات' : 'در انتظار تأیید عملیات'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="text-xs text-[#524534] hover:text-[#835500] font-bold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>بازگشت به لیست تحویل به عملیات</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Handover Details */}
            <div className="bg-[#FAF8FE] p-5 rounded-2xl border border-[#E3E2E7] space-y-3">
              <h4 className="font-bold text-[#835500] text-sm">
                مشخصات تحویل نیرو: {selectedTicket.hr?.candidateName}
              </h4>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">Zone و شعبه:</span>
                <span className="font-bold text-[#1A1B1F]">{ZONE_LABEL[selectedTicket.zone]} — {selectedTicket.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">مربی آموزش‌دهنده:</span>
                <span className="text-[#1A1B1F]">{selectedTicket.tc?.mentor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">تاریخ تحویل توسط TC:</span>
                <span className="text-[#1A1B1F]">{formatDate(selectedTicket.tc?.outcome?.date)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E3E2E7]">
                <span className="text-[#524534]">همراه روز اول (Buddy):</span>
                <span className="font-bold text-[#835500]">{selectedTicket.tc?.outcome?.buddy || 'سینا قاسمی'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#524534]">وضعیت دریافت عملیات:</span>
                <span className={selectedTicket.tc?.outcome?.opsConfirmed ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {selectedTicket.tc?.outcome?.opsConfirmed
                    ? `تأیید شده در ${formatDate(selectedTicket.tc.outcome.opsConfirmedDate)}`
                    : 'در انتظار تأیید سرپرست شعبه'}
                </span>
              </div>
            </div>

            {/* Confirmation or Monitoring Report */}
            <div className="bg-[#FAF8FE] p-5 rounded-2xl border border-[#E3E2E7] space-y-4">
              {!selectedTicket.tc?.outcome?.opsConfirmed ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-[#1A1B1F] text-sm">تأیید دریافت نیرو توسط عملیات</h4>
                  <p className="text-[#524534] leading-relaxed">
                    نیرو از سمت Training Center تحویل داده شده است؛ سرپرست شعبه باید حضور و تحویل فیزیکی نیرو را تایید نماید تا پایش ۳۰/۶۰/۹۰ روزه آغاز گردد.
                  </p>
                  <button
                    onClick={handleConfirm}
                    disabled={!canEdit}
                    className={`w-full text-xs font-bold py-3 flex items-center justify-center gap-2 rounded-2xl transition-all ${
                      canEdit 
                        ? 'md-btn-primary shadow-xs' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{canEdit ? 'تأیید رسمی دریافت نیرو در شعبه' : 'تأیید دریافت غیرفعال است (فقط مشاهده)'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-bold text-[#835500] text-sm">گزارش عملکرد و پایش پس از استقرار</h4>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-white p-3 rounded-2xl border border-[#E3E2E7] shadow-2xs">
                      <b className="text-xl font-bold text-[#835500] block">{visits}</b>
                      <span className="text-[11px] text-[#524534]">بازدیدهای QC</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[#E3E2E7] shadow-2xs">
                      <b className="text-xl font-bold text-rose-600 block">{nc}</b>
                      <span className="text-[11px] text-[#524534]">موارد عدم انطباق</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-[#E3E2E7] text-center shadow-2xs">
                    <b className="text-xl font-bold text-emerald-700 block">
                      {visits > 0 ? ((nc / visits) * 100).toFixed(1) : '۰'}٪
                    </b>
                    <span className="text-[11px] text-[#524534]">نرخ عدم انطباق کیفی (NC Rate)</span>
                  </div>

                  {/* Edit Form */}
                  <form onSubmit={handleSaveReport} className="space-y-3">
                    <div>
                      <label className="block text-[#1A1B1F] mb-1 font-bold">مدت حضور در تیم (روز)</label>
                      <input
                        type="number"
                        min="0"
                        disabled={!canEdit}
                        value={durationDays}
                        onChange={e => setDurationDays(e.target.value)}
                        className="w-full md-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[#1A1B1F] mb-1 font-bold">تعداد بازدید QC</label>
                        <input
                          type="number"
                          min="0"
                          disabled={!canEdit}
                          value={visits}
                          onChange={e => setVisits(Number(e.target.value))}
                          className="w-full md-input"
                        />
                      </div>
                      <div>
                        <label className="block text-[#1A1B1F] mb-1 font-bold">تعداد عدم انطباق</label>
                        <input
                          type="number"
                          min="0"
                          disabled={!canEdit}
                          value={nc}
                          onChange={e => setNc(Number(e.target.value))}
                          className="w-full md-input"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={!canEdit}
                      className={`w-full text-xs font-bold py-2.5 rounded-2xl transition-all ${
                        canEdit 
                          ? 'md-btn-primary shadow-xs' 
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {canEdit ? 'به‌روزرسانی آمار پایش' : 'به‌روزرسانی غیرفعال است (فقط مشاهده)'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
