import { lazy, Suspense, useState } from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { DashboardView } from './components/DashboardView';
import { RequestView } from './components/RequestView';
import { HrView } from './components/HrView';
import { TcView } from './components/TcView';
import { HandoverView } from './components/HandoverView';
import { DocsExplorerView } from './components/DocsExplorerView';
import { ModuleDocView } from './components/ModuleDocView';
const EvaluationViews = lazy(() => import('./components/EvaluationViews').then(m => ({ default: m.EvaluationViews })));
const ProjectOverviewViews = lazy(() => import('./components/ProjectOverviewViews').then(m => ({ default: m.ProjectOverviewViews })));
const AdminSettingsView = lazy(() => import('./components/AdminSettingsView').then(m => ({ default: m.AdminSettingsView })));
import { LoginView } from './components/LoginView';
import { BlockedScreen, LoadingScreen, PendingScreen, SetupRequiredScreen } from './components/StatusScreens';
import { ToastContainer, showToast } from './components/Toast';
import { isFirebaseConfigured, createAuthAccount } from './lib/firebase';
import { useAuth, logout } from './lib/useAuth';
import { useAppData } from './lib/useAppData';
import { nowISO } from './lib/date';
import { positionsOf } from './lib/assessment';
import { DEFAULT_QUESTIONS_PER_MODULE } from './data/pipelineSeed';
import {
  PipelineTicket,
  SystemUser,
  UserRole,
  SiteSettings,
  ModuleComponentData,
  QuizQuestion,
  TrainingModule,
  SiteSectionId,
  SectionPermissions,
  canUserViewSection,
  canUserEditSection,
} from './types/pipeline';

const VIEW_SECTIONS: Record<string, SiteSectionId> = {
  'v-pl-dashboard': 'dashboard',
  'v-pl-request': 'request',
  'v-pl-hr': 'hr',
  'v-pl-tc': 'tc',
  'v-pl-handover': 'handover',
  'v-doc': 'docs',
  'v-module': 'docs',
  'v-admin': 'admin',
  'v-admin-settings': 'admin',
  'v-flow': 'overview',
  'v-e2e': 'overview',
  'v-mods': 'overview',
};

const getSectionForView = (viewId: string): SiteSectionId | null =>
  viewId.startsWith('v-eval') ? 'eval' : VIEW_SECTIONS[viewId] ?? null;

export default function App() {
  if (!isFirebaseConfigured) return <SetupRequiredScreen />;
  return <AuthGate />;
}

function AuthGate() {
  const auth = useAuth();
  const onSignOut = () => void logout();

  if (auth.phase === 'loading') return <LoadingScreen />;
  if (auth.phase === 'signed-out') return <LoginView />;
  if (auth.phase === 'error') return <BlockedScreen message={auth.message} onSignOut={onSignOut} />;

  const { profile } = auth;
  if (profile.status === 'pending') return <PendingScreen email={profile.email} onSignOut={onSignOut} />;
  if (profile.status !== 'active') {
    return (
      <BlockedScreen
        message="حساب کاربری شما معلق شده است. لطفاً با مدیر کل سامانه تماس بگیرید."
        onSignOut={onSignOut}
      />
    );
  }
  return <MainApp profile={profile} onSignOut={onSignOut} />;
}

function MainApp({ profile, onSignOut }: { profile: SystemUser; onSignOut: () => void }) {
  const [currentView, setCurrentView] = useState<string>('v-home');
  const [activeModuleId, setActiveModuleId] = useState<string>('M1');
  const [activeCandidateTicketId, setActiveCandidateTicketId] = useState<string | null>(null);
  const data = useAppData(profile);
  const { tickets } = data;
  const positions = positionsOf(data.siteSettings);

  const findTicket = (id: string) => tickets.find(t => t.id === id);
  const handleUpdateTicket = (updated: PipelineTicket) => data.saveTicket(updated);

  const handleAddTicket = async (
    ticketData: Omit<PipelineTicket, 'id' | 'requestDate' | 'status' | 'hrSeen' | 'returnHistory' | 'hr' | 'tc'>
  ) => {
    const newTicket: PipelineTicket = {
      id: 't' + Date.now(),
      ...ticketData,
      requestDate: nowISO(),
      status: 'requested',
      hrSeen: false,
      returnHistory: [],
      hr: null,
      tc: null,
    };
    await data.addTicket(newTicket);
  };

  const handleSaveHrInfo = (
    ticketId: string,
    hrData: { candidateName: string; interviewDate: string; tcEntryDate: string; selfDeclaredTech: string },
    customFields?: Record<string, any>
  ) => {
    const t = findTicket(ticketId);
    if (!t) return;
    handleUpdateTicket({
      ...t,
      hr: hrData,
      hrSeen: true,
      customFields: customFields ? { ...(t.customFields || {}), ...customFields } : t.customFields,
    });
  };

  const handleReferToTC = (ticketId: string) => {
    const t = findTicket(ticketId);
    if (t) handleUpdateTicket({ ...t, status: 'referred_to_training' });
  };

  const handleMarkSeen = (ticketId: string) => {
    const t = findTicket(ticketId);
    if (t) handleUpdateTicket({ ...t, hrSeen: true });
  };

  const handleConfirmOpsReceipt = (ticketId: string) => {
    const t = findTicket(ticketId);
    if (!t?.tc?.outcome) return;
    handleUpdateTicket({
      ...t,
      tc: { ...t.tc, outcome: { ...t.tc.outcome, opsConfirmed: true, opsConfirmedDate: nowISO() } },
    });
  };

  const handleUpdateHandoverReport = (
    ticketId: string,
    report: { visits: number; nonConformities: number; durationDays?: string | number }
  ) => {
    const t = findTicket(ticketId);
    if (!t?.tc?.outcome) return;
    handleUpdateTicket({ ...t, tc: { ...t.tc, outcome: { ...t.tc.outcome, report } } });
  };

  const handleSaveEvaluationResult = async (stageKey: string, resultData: any) => {
    const t = activeCandidateTicketId ? findTicket(activeCandidateTicketId) : undefined;
    // Stage results live on the candidate's ticket; a cohort-level run without a candidate is only logged.
    if (t?.tc) {
      await handleUpdateTicket({
        ...t,
        tc: { ...t.tc, evalProgress: { ...(t.tc.evalProgress || {}), [stageKey]: resultData } },
      });
    }
    const ticketId = t?.id || 'cohort';
    const evalId = `eval_${ticketId}_${stageKey}_${Date.now()}`;
    await data.addEvaluation(evalId, {
      ticketId,
      stage: stageKey,
      zone: resultData.zone || t?.zone || 'hub',
      candidateName: resultData.candidateName || t?.hr?.candidateName || 'داوطلب',
      reviewer: resultData.reviewerName || profile.displayName,
      period: resultData.period || '',
      score: Number(resultData.score ?? resultData.avg ?? 0) || 0,
      pass: Boolean(resultData.pass),
      details: resultData,
    });
  };

  // ---------- Admin ----------
  const handleCreateAccount = async (input: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    sectionPermissions: SectionPermissions;
  }): Promise<boolean> => {
    let uid: string;
    try {
      uid = await createAuthAccount(input.email, input.password, input.displayName);
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'این ایمیل قبلاً ثبت شده است. اگر کاربر با گوگل وارد شده، او را از لیست «در انتظار تأیید» فعال کنید.',
        'auth/weak-password': 'کلمه عبور باید حداقل ۸ کاراکتر باشد.',
        'auth/invalid-email': 'قالب ایمیل نامعتبر است.',
        'auth/operation-not-allowed': 'ورود با ایمیل/رمز در Firebase Authentication فعال نشده است.',
      };
      showToast(messages[err?.code] || 'ساخت حساب کاربری ناموفق بود.', 'error');
      console.error('[admin] create account', err);
      return false;
    }
    const ts = nowISO();
    const ok = await data.saveUser({
      userId: uid,
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      role: input.role,
      status: 'active',
      sectionPermissions: input.sectionPermissions,
      createdAt: ts,
      updatedAt: ts,
    });
    if (ok) showToast('حساب کاربری ساخته شد.', 'success');
    return ok;
  };

  const handleAddComponent = (comp: ModuleComponentData) => data.saveComponents([comp, ...data.moduleComponents]);
  const handleUpdateComponent = (index: number, comp: ModuleComponentData) =>
    data.saveComponents(data.moduleComponents.map((c, i) => (i === index ? comp : c)));
  const handleDeleteComponent = (index: number) =>
    data.saveComponents(data.moduleComponents.filter((_, i) => i !== index));
  const handleUpdateModules = (mods: TrainingModule[]) => data.saveModules(mods);
  const handleUpdateSettings = (s: SiteSettings) => data.saveSettings(s);

  const handleAddQuizQuestion = (moduleId: string, question: QuizQuestion) =>
    data.saveQuizzes({ ...data.quizzes, [moduleId]: [...(data.quizzes[moduleId] || []), question] });
  const handleDeleteQuizQuestion = (moduleId: string, index: number) =>
    data.saveQuizzes({ ...data.quizzes, [moduleId]: (data.quizzes[moduleId] || []).filter((_, i) => i !== index) });

  const handleExportBackup = () => {
    const backupData = {
      version: '5.0.0',
      exportedAt: nowISO(),
      tickets,
      systemUsers: data.users,
      trainingModules: data.trainingModules,
      moduleComponents: data.moduleComponents,
      siteSettings: data.siteSettings,
      zoneConfigs: data.zoneConfigs,
      quizzes: data.quizzes,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snappkitchen_backup_${nowISO().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (backup: any) => {
    if (!backup || typeof backup !== 'object') return;
    // User accounts are intentionally not restored: roles must be granted explicitly.
    const ok = await data.restore({
      tickets: Array.isArray(backup.tickets) ? backup.tickets : undefined,
      siteSettings: backup.siteSettings,
      zoneConfigs: backup.zoneConfigs,
      trainingModules: backup.trainingModules,
      moduleComponents: backup.moduleComponents,
      // Backups made before the per-module question bank keyed questions by zone; those are skipped.
      quizzes:
        backup.quizzes && typeof backup.quizzes === 'object' && !('hub' in backup.quizzes) ? backup.quizzes : undefined,
    });
    if (ok) showToast('فایل پشتیبان با موفقیت بازیابی شد (کاربران بازیابی نمی‌شوند).', 'success');
  };

  // ---------- Navigation ----------
  const handleNavigate = (viewId: string, param?: string) => {
    setCurrentView(viewId);
    if (viewId === 'v-module' && param) setActiveModuleId(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToEvalFromTC = (stageViewId: string, candidateTicketId: string) => {
    setActiveCandidateTicketId(candidateTicketId);
    handleNavigate(stageViewId);
  };

  const activeCandidate = activeCandidateTicketId ? findTicket(activeCandidateTicketId) : undefined;
  const activeSectionId = getSectionForView(currentView);
  const viewPermitted = currentView === 'v-home' || (activeSectionId !== null && canUserViewSection(profile, activeSectionId));
  const canEditCurrentSection = activeSectionId !== null && canUserEditSection(profile, activeSectionId);

  return (
    <div className="min-h-screen bg-[#FAF8FE] text-[#1A1B1F] flex selection:bg-[#F5A623]/30 selection:text-[#1A1B1F]">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        tickets={tickets}
        currentUserProfile={profile}
        onSignOut={onSignOut}
        activeCandidateName={activeCandidate?.hr?.candidateName}
        modules={data.trainingModules}
      />

      <main className="flex-1 lg:mr-64 min-h-screen p-4 pt-20 md:p-10 lg:pt-10 max-w-6xl w-full min-w-0">
        {/* Permission Denied Banner */}
        {!viewPermitted && (
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 my-16 shadow-lg shadow-[#1C1D21]/5">
            <div className="w-14 h-14 rounded-2xl bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#835500] mx-auto flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1B1F]">دسترسی به این بخش برای حساب کاربری شما مجاز نیست</h2>
            <p className="text-xs text-[#524534] leading-relaxed">
              سطح دسترسی شما به این صفحه توسط مدیر سامانه محدود شده است. جهت ارتقا یا دریافت دسترسی با مدیر کل ارتباط برقرار کنید.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => handleNavigate('v-home')}
                className="md-btn-primary text-xs py-2 px-4 font-bold flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>بازگشت به صفحه اصلی</span>
              </button>
            </div>
          </div>
        )}

        {viewPermitted && (
          <Suspense fallback={<div className="py-24 text-center text-xs text-[#524534]">در حال بارگذاری…</div>}>
            {currentView === 'v-home' && (
              <HomeView
                onNavigate={handleNavigate}
                totalTickets={data.tickets.length}
              />
            )}

            {currentView === 'v-pl-dashboard' && (
              <DashboardView
                tickets={data.tickets}
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'v-pl-request' && (
              <RequestView
                canEdit={canEditCurrentSection}
                tickets={data.tickets}
                settings={data.siteSettings}
                positions={positions}
                onSubmitRequest={handleAddTicket}
              />
            )}

            {currentView === 'v-pl-hr' && (
              <HrView
                canEdit={canEditCurrentSection}
                tickets={data.tickets}
                settings={data.siteSettings}
                onSaveHrInfo={handleSaveHrInfo}
                onReferToTC={handleReferToTC}
                onMarkSeen={handleMarkSeen}
              />
            )}

            {currentView === 'v-pl-tc' && (
              <TcView
                canEdit={canEditCurrentSection}
                tickets={data.tickets}
                modules={data.trainingModules}
                zoneConfigs={data.zoneConfigs}
                positions={positions}
                onUpdateTicket={handleUpdateTicket}
                onNavigateToEval={handleNavigateToEvalFromTC}
                onNavigateToModuleDoc={modId => handleNavigate('v-module', modId)}
              />
            )}

            {currentView === 'v-pl-handover' && (
              <HandoverView
                canEdit={canEditCurrentSection}
                tickets={data.tickets}
                onConfirmReceipt={handleConfirmOpsReceipt}
                onUpdateReport={handleUpdateHandoverReport}
              />
            )}

            {currentView === 'v-doc' && (
              <DocsExplorerView
                onOpenModule={modId => handleNavigate('v-module', modId)}
                components={data.moduleComponents}
                settings={data.siteSettings}
                modules={data.trainingModules}
              />
            )}

            {currentView === 'v-module' && (
              <ModuleDocView
                moduleId={activeModuleId}
                onNavigateToExplorer={() => handleNavigate('v-doc')}
                components={data.moduleComponents}
                modules={data.trainingModules}
              />
            )}

            {/* SITE ADMINISTRATION & SETTINGS VIEW */}
            {(currentView === 'v-admin' || currentView === 'v-admin-settings') && (
              <AdminSettingsView
                canEdit={canEditCurrentSection}
                isAdmin={profile.role === 'admin'}
                currentUserId={profile.userId}
                users={data.users}
                onSaveUser={data.saveUser}
                onCreateAccount={handleCreateAccount}
                onDeleteUser={data.deleteUser}
                components={data.moduleComponents}
                onAddComponent={handleAddComponent}
                onUpdateComponent={handleUpdateComponent}
                onDeleteComponent={handleDeleteComponent}
                modules={data.trainingModules}
                onUpdateModules={handleUpdateModules}
                settings={data.siteSettings}
                onUpdateSettings={handleUpdateSettings}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onLoadDefaults={data.loadDefaults}
                quizzes={data.quizzes}
                positions={positions}
                onAddQuizQuestion={handleAddQuizQuestion}
                onDeleteQuizQuestion={handleDeleteQuizQuestion}
              />
            )}

            {currentView.startsWith('v-eval') && (
              <EvaluationViews
                canEdit={canEditCurrentSection}
                viewId={currentView}
                activeTicket={activeCandidate || null}
                onSaveResult={handleSaveEvaluationResult}
                onNavigate={handleNavigate}
                passingScorePct={data.siteSettings.passingScorePct}
                questionsPerModule={data.siteSettings.quizQuestionsPerModule ?? DEFAULT_QUESTIONS_PER_MODULE}
                quizBank={data.quizzes}
                modules={data.trainingModules}
                zoneConfigs={data.zoneConfigs}
                positions={positions}
              />
            )}

            {['v-flow', 'v-e2e', 'v-mods'].includes(currentView) && (
              <ProjectOverviewViews
                viewId={currentView}
                onNavigate={handleNavigate}
                zoneConfigs={data.zoneConfigs}
                onUpdateZoneConfig={data.saveZoneConfig}
                canEdit={canUserEditSection(profile, 'overview')}
              />
            )}
          </Suspense>
        )}
      </main>
      <ToastContainer />
    </div>
  );
}
