import React, { useState } from 'react';
import { 
  Home, 
  Compass, 
  BookOpen, 
  Award, 
  Layers, 
  ChevronLeft, 
  LogOut, 
  Menu,
  X,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { MODS, ROLE_LABELS } from '../data/pipelineSeed';
import { 
  PipelineTicket, 
  TrainingModule, 
  SystemUser, 
  DEFAULT_ROLE_PERMISSIONS, 
  SiteSectionId,
  canUserViewSection,
  canUserEditSection
} from '../types/pipeline';

interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string, param?: string) => void;
  tickets: PipelineTicket[];
  currentUserProfile: SystemUser;
  onSignOut: () => void;
  activeCandidateName?: string | null;
  modules?: TrainingModule[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate: navigate,
  tickets,
  currentUserProfile,
  onSignOut,
  activeCandidateName,
  modules
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    tp: true,
    docs: false,
    eval: false,
    pres: false
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the off-canvas drawer after navigating on small screens.
  const onNavigate = (viewId: string, param?: string) => {
    setMobileOpen(false);
    navigate(viewId, param);
  };

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Determine allowed sections for current user
  const canAccess = (sectionId: SiteSectionId) => canUserViewSection(currentUserProfile, sectionId);
  const isReadOnly = (sectionId: SiteSectionId) => canUserViewSection(currentUserProfile, sectionId) && !canUserEditSection(currentUserProfile, sectionId);

  const renderAccessBadge = (sectionId: SiteSectionId) => {
    if (isReadOnly(sectionId)) {
      return (
        <span 
          className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0" 
          title="دسترسی فقط مشاهده (بدون امکان ویرایش)"
        >
          <Eye className="w-2.5 h-2.5" />
          <span>فقط مشاهده</span>
        </span>
      );
    }
    return null;
  };

  // Badge calculations
  const requestedCount = tickets.filter(t => t.status === 'requested' && !t.hrSeen).length;
  const trainingCount = tickets.filter(t => t.status === 'training').length;
  const evalCount = tickets.filter(t => t.status === 'evaluation').length;
  const unconfirmedHandover = tickets.filter(t => t.status === 'handover' && !t.tc?.outcome?.opsConfirmed).length;

  const hasAnyPipelineAccess = canAccess('dashboard') || canAccess('request') || canAccess('hr') || canAccess('tc') || canAccess('handover');

  return (
    <>
    {/* Mobile top bar */}
    <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-[#1C1D21] text-white flex items-center justify-between px-4 z-40 no-print">
      <button onClick={() => setMobileOpen(true)} aria-label="باز کردن منو" className="p-2 -mr-2">
        <Menu className="w-5 h-5" />
      </button>
      <b className="text-sm">Training Center</b>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#FE684F] flex items-center justify-center text-[#1C1D21] font-black text-xs">SK</div>
    </div>
    {mobileOpen && (
      <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} aria-hidden />
    )}
    <aside className={`w-64 bg-[#1C1D21] text-[#F1F0F5] h-screen fixed right-0 top-0 bottom-0 border-l border-[#2F3034] flex flex-col z-50 overflow-y-auto select-none no-print transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <button onClick={() => setMobileOpen(false)} aria-label="بستن منو" className="lg:hidden absolute left-3 top-3 p-1.5 text-[#D7C3AE]">
        <X className="w-5 h-5" />
      </button>
      {/* Brand Header */}
      <div className="p-5 border-b border-[#2F3034]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#FE684F] flex items-center justify-center shadow-lg shadow-amber-500/20 text-[#1C1D21] font-black text-lg">
            SK
          </div>
          <div>
            <b className="text-sm font-bold text-white block">Training Center</b>
            <span className="text-[11px] text-[#D7C3AE] block font-mono">Snapp Kitchen</span>
          </div>
        </div>

        {activeCandidateName && (
          <div className="mt-3 bg-[#2F3034] border border-[#F5A623]/30 rounded-xl p-2.5 text-right">
            <span className="text-[10px] text-[#FFB955] block">داوطلب در حال ارزیابی:</span>
            <span className="text-xs font-bold text-white truncate block">{activeCandidateName}</span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="p-3 space-y-1 flex-1">
        {/* Home */}
        <button
          onClick={() => onNavigate('v-home')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
            currentView === 'v-home'
              ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
              : 'text-[#D7C3AE] hover:text-white hover:bg-[#2F3034]'
          }`}
        >
          <Home className={`w-4 h-4 ${currentView === 'v-home' ? 'text-[#1C1D21]' : 'text-[#F5A623]'}`} />
          <span>🏠 صفحه اصلی</span>
        </button>

        {/* Group: Talent Pipeline */}
        {hasAnyPipelineAccess && (
          <div className="pt-2">
            <button
              onClick={() => toggleGroup('tp')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#F1F0F5] hover:bg-[#2F3034] transition-all"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#F5A623]" />
                <span>🧭 Talent Pipeline</span>
              </div>
              <ChevronLeft className={`w-3.5 h-3.5 text-[#857462] transition-transform ${openGroups.tp ? '-rotate-90' : ''}`} />
            </button>

            {openGroups.tp && (
              <div className="pr-4 space-y-1 pt-1">
                {canAccess('dashboard') && (
                  <button
                    onClick={() => onNavigate('v-pl-dashboard')}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                      currentView === 'v-pl-dashboard'
                        ? 'bg-[#F5A623] text-[#1C1D21] font-bold shadow-sm'
                        : 'text-[#D7C3AE] hover:text-white hover:bg-[#2F3034]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>داشبورد</span>
                      {renderAccessBadge('dashboard')}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      currentView === 'v-pl-dashboard' ? 'bg-[#1C1D21]/20 text-[#1C1D21]' : 'bg-[#2F3034] text-[#FFB955]'
                    }`}>
                      {tickets.length}
                    </span>
                  </button>
                )}

                {canAccess('request') && (
                  <button
                    onClick={() => onNavigate('v-pl-request')}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                      currentView === 'v-pl-request'
                        ? 'bg-[#F5A623] text-[#1C1D21] font-bold shadow-sm'
                        : 'text-[#D7C3AE] hover:text-white hover:bg-[#2F3034]'
                    }`}
                  >
                    <span>ثبت درخواست جدید</span>
                    {renderAccessBadge('request')}
                  </button>
                )}

                {canAccess('hr') && (
                  <button
                    onClick={() => onNavigate('v-pl-hr')}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                      currentView === 'v-pl-hr'
                        ? 'bg-[#F5A623] text-[#1C1D21] font-bold shadow-sm'
                        : 'text-[#D7C3AE] hover:text-white hover:bg-[#2F3034]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>HR (منابع انسانی)</span>
                      {renderAccessBadge('hr')}
                    </div>
                    {requestedCount > 0 && (
                      <span className="text-[10px] bg-[#FE684F] text-white font-bold px-1.5 py-0.2 rounded-full">
                        {requestedCount}
                      </span>
                    )}
                  </button>
                )}

                {canAccess('tc') && (
                  <button
                    onClick={() => onNavigate('v-pl-tc')}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                      currentView === 'v-pl-tc'
                        ? 'bg-[#F5A623] text-[#1C1D21] font-bold shadow-sm'
                        : 'text-[#D7C3AE] hover:text-white hover:bg-[#2F3034]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Training Center</span>
                      {renderAccessBadge('tc')}
                    </div>
                    {(trainingCount > 0 || evalCount > 0) && (
                      <span className="text-[10px] bg-[#F5A623]/20 text-[#FFB955] border border-[#F5A623]/40 font-bold px-1.5 py-0.2 rounded-full">
                        {trainingCount + evalCount}
                      </span>
                    )}
                  </button>
                )}

                {canAccess('handover') && (
                  <button
                    onClick={() => onNavigate('v-pl-handover')}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                      currentView === 'v-pl-handover'
                        ? 'bg-[#F5A623] text-[#1C1D21] font-bold shadow-sm'
                        : 'text-[#D7C3AE] hover:text-white hover:bg-[#2F3034]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>تحویل به عملیات</span>
                      {renderAccessBadge('handover')}
                    </div>
                    {unconfirmedHandover > 0 && (
                      <span className="text-[10px] bg-[#FE684F]/20 text-[#FE684F] font-bold px-1.5 py-0.2 rounded-full">
                        {unconfirmedHandover}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Group: Educational Docs */}
        {canAccess('docs') && (
          <div className="pt-2">
            <button
              onClick={() => toggleGroup('docs')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#F1F0F5] hover:bg-[#2F3034] transition-all"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#F5A623]" />
                <span>📚 داک آموزشی</span>
                {renderAccessBadge('docs')}
              </div>
              <ChevronLeft className={`w-3.5 h-3.5 text-[#857462] transition-transform ${openGroups.docs ? '-rotate-90' : ''}`} />
            </button>

            {openGroups.docs && (
              <div className="pr-4 space-y-0.5 pt-1">
                <button
                  onClick={() => onNavigate('v-doc')}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all font-semibold ${
                    currentView === 'v-doc' ? 'bg-[#F5A623] text-[#1C1D21] font-bold' : 'text-[#FFB955] hover:bg-[#2F3034]'
                  }`}
                >
                  🔍 جستجوی ۶۱ جزء عملیاتی
                </button>

                {(modules || MODS).map(m => (
                  <button
                    key={m.id}
                    onClick={() => onNavigate('v-module', m.id)}
                    className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all block truncate ${
                      currentView === 'v-module' && (window as any)._activeModuleId === m.id
                        ? 'bg-[#2F3034] text-[#FFB955] font-bold border-r-2 border-[#F5A623]'
                        : 'text-[#D7C3AE] hover:text-white hover:bg-[#2F3034]'
                    }`}
                  >
                    <span className="font-mono font-bold text-[#F5A623] ml-1">{m.id}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Group: Evaluations (C1 - C8) */}
        {canAccess('eval') && (
          <div className="pt-2">
            <button
              onClick={() => toggleGroup('eval')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#F1F0F5] hover:bg-[#2F3034] transition-all"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F5A623]" />
                <span>🏁 ارزیابی و تحویل</span>
                {renderAccessBadge('eval')}
              </div>
              <ChevronLeft className={`w-3.5 h-3.5 text-[#857462] transition-transform ${openGroups.eval ? '-rotate-90' : ''}`} />
            </button>

            {openGroups.eval && (
              <div className="pr-4 space-y-0.5 pt-1">
                {[
                  { id: 'v-eval', label: 'C1 — چارچوب ۴ سطحی Kirkpatrick' },
                  { id: 'v-eval-c2', label: 'C2 — آزمون تئوری (۳۰ سوال)' },
                  { id: 'v-eval-c3', label: 'C3 — چک‌لیست عملی ایستگاهی' },
                  { id: 'v-eval-c4', label: 'C4 — مصاحبه صلاحیت' },
                  { id: 'v-eval-c5', label: 'C5 — شبیه‌سازی پیک عملیاتی' },
                  { id: 'v-eval-c6', label: 'C6 — فرم نهایی صلاحیت' },
                  { id: 'v-eval-c7', label: 'C7 — پروتکل تحویل (Handover)' },
                  { id: 'v-eval-c8', label: 'C8 — پایش ۳۰/۶۰/۹۰ روزه' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all block truncate ${
                      currentView === item.id
                        ? 'bg-[#F5A623] text-[#1C1D21] font-bold shadow-sm'
                        : 'text-[#D7C3AE] hover:text-white hover:bg-[#2F3034]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Group: Admin Panel */}
        {canAccess('admin') && (
          <div className="pt-2 border-t border-[#2F3034] mt-3">
            <button
              onClick={() => onNavigate('v-admin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                currentView === 'v-admin' || currentView === 'v-admin-settings'
                  ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
                  : 'text-[#F1F0F5] hover:bg-[#2F3034]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className={`w-4 h-4 ${currentView === 'v-admin' ? 'text-[#1C1D21]' : 'text-[#F5A623]'}`} />
                <span>🛠️ پنل مدیریت سایت</span>
              </div>
              {renderAccessBadge('admin')}
            </button>
          </div>
        )}

        {/* Group: Project Overview */}
        {canAccess('overview') && (
          <div className="pt-1">
            <button
              onClick={() => toggleGroup('pres')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#F1F0F5] hover:bg-[#2F3034] transition-all"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D7C3AE]" />
                <span>توضیحات پروژه</span>
              </div>
              <ChevronLeft className={`w-3.5 h-3.5 text-[#857462] transition-transform ${openGroups.pres ? '-rotate-90' : ''}`} />
            </button>

            {openGroups.pres && (
              <div className="pr-4 space-y-0.5 pt-1">
                <button
                  onClick={() => onNavigate('v-flow')}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all ${
                    currentView === 'v-flow' ? 'bg-[#F5A623] text-[#1C1D21] font-bold' : 'text-[#D7C3AE] hover:text-white'
                  }`}
                >
                  فلوی کلی و Zone-Builder
                </button>
                <button
                  onClick={() => onNavigate('v-e2e')}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all ${
                    currentView === 'v-e2e' ? 'bg-[#F5A623] text-[#1C1D21] font-bold' : 'text-[#D7C3AE] hover:text-white'
                  }`}
                >
                  فلوچارت End-to-End
                </button>
                <button
                  onClick={() => onNavigate('v-mods')}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-all ${
                    currentView === 'v-mods' ? 'bg-[#F5A623] text-[#1C1D21] font-bold' : 'text-[#D7C3AE] hover:text-white'
                  }`}
                >
                  نمای کلی ۸ ماژول
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Auth Footer */}
      <div className="p-3 border-t border-[#2F3034] bg-[#15161A]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            {currentUserProfile.photoURL ? (
              <img
                src={currentUserProfile.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-[#F5A623]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#2F3034] text-[#FFB955] flex items-center justify-center text-xs font-bold">
                {(currentUserProfile.displayName || 'ک').charAt(0)}
              </div>
            )}
            <div className="truncate flex-1">
              <span className="text-xs font-bold text-white block truncate">{currentUserProfile.displayName}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] bg-[#F5A623]/20 text-[#FFB955] border border-[#F5A623]/40 px-1.5 py-0.2 rounded font-bold">
                  {ROLE_LABELS[currentUserProfile.role] || currentUserProfile.role}
                </span>
                <span className="text-[10px] text-[#D7C3AE] truncate font-mono">{currentUserProfile.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#2F3034] hover:bg-rose-950/40 text-[11px] text-[#FE684F] hover:text-rose-300 transition-colors border border-transparent hover:border-rose-900/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};
