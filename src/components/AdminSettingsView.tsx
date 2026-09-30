import React, { useState } from 'react';
import { 
  SystemUser, 
  UserRole, 
  CustomFieldDefinition, 
  SiteSettings, 
  ModuleComponentData, 
  ZoneType, 
  QuizQuestion, 
  TrainingModule, 
  SiteSectionId, 
  SITE_SECTIONS, 
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_EDIT_PERMISSIONS,
  SectionPermissionLevel,
  SectionPermissions,
  buildDefaultPermissions,
  getUserSectionPermission,
  canUserEditSection
} from '../types/pipeline';
import { ROLE_LABELS, ZONE_LABEL, MODS } from '../data/pipelineSeed';
import { QUIZ } from '../data/pipelineEval';
import { showToast } from './Toast';
import { 
  Users, 
  Shield, 
  BookOpen, 
  Sliders, 
  HelpCircle, 
  Database, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Download, 
  RotateCcw, 
  UserCheck, 
  Lock, 
  Sparkles, 
  Eye, 
  EyeOff, 
  FolderPlus, 
  Upload, 
  AlertTriangle, 
  Search, 
  Layers, 
  Check, 
  X, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert,
  CheckSquare, 
  Square 
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { formatDate } from '../lib/date';

export interface AdminSettingsViewProps {
  canEdit?: boolean;
  users: SystemUser[];
  /** Only role=admin may manage accounts (enforced in firestore.rules). */
  isAdmin: boolean;
  currentUserId: string;
  onSaveUser: (user: SystemUser) => Promise<boolean>;
  onCreateAccount: (input: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    sectionPermissions: SectionPermissions;
  }) => Promise<boolean>;
  onDeleteUser?: (userId: string) => Promise<boolean>;
  components: ModuleComponentData[];
  onAddComponent: (comp: ModuleComponentData) => void;
  onUpdateComponent: (index: number, comp: ModuleComponentData) => void;
  onDeleteComponent: (index: number) => void;
  modules?: TrainingModule[];
  onUpdateModules?: (modules: TrainingModule[]) => void;
  settings: SiteSettings;
  onUpdateSettings: (newSettings: SiteSettings) => void;
  onExportBackup: () => void;
  onImportBackup?: (backupData: any) => void;
  onLoadDefaults: (includeDemoTickets: boolean) => Promise<boolean>;
  quizzes?: typeof QUIZ;
  onAddQuizQuestion?: (zone: ZoneType, question: QuizQuestion) => void;
  onDeleteQuizQuestion?: (zone: ZoneType, index: number) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  canEdit = true,
  users,
  isAdmin,
  currentUserId,
  onSaveUser,
  onCreateAccount,
  onDeleteUser,
  components,
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
  modules = MODS,
  onUpdateModules,
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onLoadDefaults,
  quizzes = QUIZ,
  onAddQuizQuestion,
  onDeleteQuizQuestion
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'modules' | 'components' | 'fields' | 'quizzes' | 'backup'>(isAdmin ? 'users' : 'modules');
  const [creatingUser, setCreatingUser] = useState(false);

  // Search & Filter for Users
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // New user modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('trainer');
  const [newUserPermissions, setNewUserPermissions] = useState<Record<SiteSectionId, SectionPermissionLevel>>(() => {
    const init: Record<SiteSectionId, SectionPermissionLevel> = {} as any;
    SITE_SECTIONS.forEach(s => {
      // Regular roles have VIEW ONLY by default!
      init[s.id] = DEFAULT_ROLE_PERMISSIONS.trainer.includes(s.id) ? 'view' : 'none';
    });
    return init;
  });

  // Edit user modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('trainer');
  const [editUserStatus, setEditUserStatus] = useState<SystemUser['status']>('active');
  const [editUserPermissions, setEditUserPermissions] = useState<Record<SiteSectionId, SectionPermissionLevel>>({} as any);

  // Module Modal (Add/Edit M1-M8 modules)
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleIdInput, setModuleIdInput] = useState('');
  const [moduleNameInput, setModuleNameInput] = useState('');
  const [moduleLocInput, setModuleLocInput] = useState('Hub + SuperHub + irancell');
  const [moduleDescInput, setModuleDescInput] = useState('');

  // Component modal
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingCompIndex, setEditingCompIndex] = useState<number | null>(null);
  const [compModule, setCompModule] = useState('M1');
  const [compTitle, setCompTitle] = useState('');
  const [compType, setCompType] = useState('SOP QC');
  const [compSource, setCompSource] = useState('مرجع عملیات اسنپ‌کیچن');
  const [compDesc, setCompDesc] = useState('');
  const [compLoc, setCompLoc] = useState('Hub + SuperHub');
  const [compCustomValues, setCompCustomValues] = useState<Record<string, any>>({});

  // Custom Field Form
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select' | 'textarea' | 'checkbox'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldTarget, setNewFieldTarget] = useState<'ticket' | 'component'>('ticket');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldVisible, setNewFieldVisible] = useState(true);
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [fieldTargetFilter, setFieldTargetFilter] = useState<'all' | 'ticket' | 'component'>('all');

  // Quiz Editor
  const [quizZone, setQuizZone] = useState<ZoneType>('hub');
  const [newQTitle, setNewQTitle] = useState('');
  const [newQOpt0, setNewQOpt0] = useState('');
  const [newQOpt1, setNewQOpt1] = useState('');
  const [newQOpt2, setNewQOpt2] = useState('');
  const [newQOpt3, setNewQOpt3] = useState('');
  const [newQCorrect, setNewQCorrect] = useState(0);

  // Search in components
  const [compSearch, setCompSearch] = useState('');
  const [compFilterMod, setCompFilterMod] = useState('');

  // Backup file upload ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchSearch = !userSearch.trim() || 
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    if (newUserPassword.length < 8) {
      showToast('کلمه عبور اولیه باید حداقل ۸ کاراکتر باشد.', 'error');
      return;
    }
    setCreatingUser(true);
    const ok = await onCreateAccount({
      displayName: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      password: newUserPassword,
      role: newUserRole,
      sectionPermissions: newUserRole === 'admin' ? buildDefaultPermissions('admin') : newUserPermissions,
    });
    setCreatingUser(false);
    if (!ok) return;
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setShowAddUserModal(false);
  };

  const handleSendReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast(`لینک تغییر رمز به ${email} ارسال شد.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('ارسال ایمیل تغییر رمز ناموفق بود.', 'error');
    }
  };

  const setUserStatus = (u: SystemUser, status: SystemUser['status']) =>
    onSaveUser({
      ...u,
      status,
      // Activating a pending account without explicit permissions grants the role's view-only defaults.
      sectionPermissions: u.sectionPermissions ?? buildDefaultPermissions(u.role),
    });

  // Open Edit User Modal
  const openEditUser = (user: SystemUser) => {
    setEditingUserId(user.userId);
    setEditUserName(user.displayName);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
    setEditUserStatus(user.status);

    const perms: Record<SiteSectionId, SectionPermissionLevel> = {} as any;
    SITE_SECTIONS.forEach(s => {
      perms[s.id] = getUserSectionPermission(user, s.id);
    });
    setEditUserPermissions(perms);
    setShowEditUserModal(true);
  };

  // Save Edit User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !editUserName.trim()) return;

    const targetUser = users.find(u => u.userId === editingUserId);
    if (!targetUser) return;

    const updated: SystemUser = {
      ...targetUser,
      displayName: editUserName.trim(),
      role: editUserRole,
      status: editUserStatus,
      sectionPermissions: editUserRole === 'admin' ? buildDefaultPermissions('admin') : editUserPermissions,
    };

    onSaveUser(updated);

    setShowEditUserModal(false);
    setEditingUserId(null);
  };

  // Update section permission in Add/Edit user
  const setPermissionForNewUser = (sectionId: SiteSectionId, level: SectionPermissionLevel) => {
    setNewUserPermissions(prev => ({ ...prev, [sectionId]: level }));
  };

  const setPermissionForEditUser = (sectionId: SiteSectionId, level: SectionPermissionLevel) => {
    setEditUserPermissions(prev => ({ ...prev, [sectionId]: level }));
  };

  const setAllPermissionsForNewUser = (level: SectionPermissionLevel) => {
    const next: Record<SiteSectionId, SectionPermissionLevel> = {} as any;
    SITE_SECTIONS.forEach(s => { next[s.id] = level; });
    setNewUserPermissions(next);
  };

  const setAllPermissionsForEditUser = (level: SectionPermissionLevel) => {
    const next: Record<SiteSectionId, SectionPermissionLevel> = {} as any;
    SITE_SECTIONS.forEach(s => { next[s.id] = level; });
    setEditUserPermissions(next);
  };

  // Handle Add/Edit Training Module
  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleIdInput.trim() || !moduleNameInput.trim()) return;

    const currentModules = modules || MODS;
    const cleanId = moduleIdInput.trim().toUpperCase();

    if (editingModuleId) {
      // Update
      const updated = currentModules.map(m => m.id === editingModuleId ? {
        ...m,
        id: cleanId,
        name: moduleNameInput.trim(),
        loc: moduleLocInput.trim(),
        description: moduleDescInput.trim()
      } : m);
      if (onUpdateModules) onUpdateModules(updated);
    } else {
      // Check duplicate ID
      if (currentModules.some(m => m.id === cleanId)) {
        showToast(`ماژول با شناسه «${cleanId}» قبلاً وجود دارد.`, 'error');
        return;
      }
      const newMod: TrainingModule = {
        id: cleanId,
        name: moduleNameInput.trim(),
        loc: moduleLocInput.trim(),
        count: 0,
        description: moduleDescInput.trim()
      };
      if (onUpdateModules) onUpdateModules([...currentModules, newMod]);
    }

    setShowModuleModal(false);
    setEditingModuleId(null);
    setModuleIdInput('');
    setModuleNameInput('');
    setModuleDescInput('');
  };

  const handleDeleteModule = (modId: string) => {
    if (!confirm(`آیا از حذف ماژول «${modId}» اطمینان دارید؟ تمام سرفصل‌های مرتبط با این ماژول باقی خواهند ماند.`)) return;
    const currentModules = modules || MODS;
    const updated = currentModules.filter(m => m.id !== modId);
    if (onUpdateModules) onUpdateModules(updated);
  };

  const openEditModule = (mod: TrainingModule) => {
    setEditingModuleId(mod.id);
    setModuleIdInput(mod.id);
    setModuleNameInput(mod.name);
    setModuleLocInput(mod.loc);
    setModuleDescInput(mod.description || '');
    setShowModuleModal(true);
  };

  // Handle Save Component
  const handleSaveComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle.trim() || !compDesc.trim()) return;
    const itemData: ModuleComponentData = {
      ماژول: compModule,
      جزء: compTitle.trim(),
      نوع: compType,
      منبع: compSource,
      توضیح: compDesc.trim(),
      موقعیت: compLoc,
      customValues: compCustomValues
    };

    if (editingCompIndex !== null) {
      onUpdateComponent(editingCompIndex, itemData);
    } else {
      onAddComponent(itemData);
    }

    setShowCompModal(false);
    setEditingCompIndex(null);
    setCompTitle('');
    setCompDesc('');
    setCompCustomValues({});
  };

  const openEditComp = (index: number) => {
    const it = components[index];
    setEditingCompIndex(index);
    setCompModule(it['ماژول']);
    setCompTitle(it['جزء']);
    setCompType(it['نوع']);
    setCompSource(it['منبع']);
    setCompDesc(it['توضیح']);
    setCompLoc(it['موقعیت']);
    setCompCustomValues(it.customValues || {});
    setShowCompModal(true);
  };

  // Handle Add Custom Field
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !newFieldKey.trim()) return;

    const sanitizedKey = newFieldKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    const optionsArray = newFieldType === 'select'
      ? newFieldOptions.split('\n').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newField: CustomFieldDefinition = {
      id: 'cf_' + Date.now(),
      label: newFieldLabel.trim(),
      key: sanitizedKey,
      type: newFieldType,
      options: optionsArray,
      required: newFieldRequired,
      visible: newFieldVisible,
      placeholder: newFieldPlaceholder.trim() || undefined,
      target: newFieldTarget
    };

    if (newFieldTarget === 'ticket') {
      onUpdateSettings({
        ...settings,
        ticketCustomFields: [...(settings.ticketCustomFields || []), newField]
      });
    } else {
      onUpdateSettings({
        ...settings,
        componentCustomFields: [...(settings.componentCustomFields || []), newField]
      });
    }

    setNewFieldLabel('');
    setNewFieldKey('');
    setNewFieldOptions('');
    setNewFieldPlaceholder('');
  };

  // Toggle Visibility of a Custom Field dynamically
  const handleToggleFieldVisibility = (fieldId: string, target: 'ticket' | 'component') => {
    if (target === 'ticket') {
      const updated = (settings.ticketCustomFields || []).map(f => {
        if (f.id === fieldId) {
          return { ...f, visible: f.visible === false ? true : false };
        }
        return f;
      });
      onUpdateSettings({ ...settings, ticketCustomFields: updated });
    } else {
      const updated = (settings.componentCustomFields || []).map(f => {
        if (f.id === fieldId) {
          return { ...f, visible: f.visible === false ? true : false };
        }
        return f;
      });
      onUpdateSettings({ ...settings, componentCustomFields: updated });
    }
  };

  const handleDeleteCustomField = (id: string, target: 'ticket' | 'component') => {
    if (!confirm('آیا از حذف این فیلد اطمینان دارید؟ داده‌های ثبت شده در این فیلد پاک نخواهند شد اما فیلد دیگر در فرم‌ها نمایش داده نمی‌شود.')) return;
    if (target === 'ticket') {
      onUpdateSettings({
        ...settings,
        ticketCustomFields: (settings.ticketCustomFields || []).filter(f => f.id !== id)
      });
    } else {
      onUpdateSettings({
        ...settings,
        componentCustomFields: (settings.componentCustomFields || []).filter(f => f.id !== id)
      });
    }
  };

  // Handle Add Quiz Question
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQTitle.trim() || !newQOpt0 || !newQOpt1 || !newQOpt2 || !newQOpt3) {
      showToast('لطفاً صورت سوال و هر ۴ گزینه را تکمیل کنید.', 'warning');
      return;
    }

    if (onAddQuizQuestion) {
      onAddQuizQuestion(quizZone, {
        q: newQTitle.trim(),
        options: [newQOpt0.trim(), newQOpt1.trim(), newQOpt2.trim(), newQOpt3.trim()],
        correct: newQCorrect
      });
      showToast('سوال با موفقیت به بانک آزمون اضافه شد.', 'success');
    }

    setNewQTitle('');
    setNewQOpt0('');
    setNewQOpt1('');
    setNewQOpt2('');
    setNewQOpt3('');
  };

  // Filtered components for editor
  const filteredComps = components.filter(c => {
    const matchMod = !compFilterMod || c['ماژول'] === compFilterMod;
    const matchQ = !compSearch.trim() || c['جزء'].includes(compSearch) || c['توضیح'].includes(compSearch);
    return matchMod && matchQ;
  });

  // Handle file import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (onImportBackup) {
          onImportBackup(json);
        }
      } catch (err) {
        showToast('فایل انتخاب شده معتبر نیست.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Active module list
  const activeModules = modules || MODS;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#F5A623]/15 text-[#835500] border border-[#F5A623]/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Shield className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>مرکز کنترل و مدیریت ارشد سامانه (Admin Management & Permissions)</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A1B1F]">
            پنل جامع مدیریت سایت و سطوح دسترسی
          </h1>
          <p className="text-xs text-[#524534] mt-1">
            مدیریت دسترسی هر اکانت به بخش‌های مختلف سایت، ساخت اکانت جدید، تغییر محتوای ماژول‌ها (M1-M8) و کم و زیاد کردن فیلدها
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={onExportBackup}
            className="md-btn-secondary text-xs flex items-center gap-1.5 shadow-xs"
            title="دانلود فایل پشتیبان کامل JSON"
          >
            <Download className="w-3.5 h-3.5 text-[#835500]" />
            <span>خروجی پشتیبان (JSON)</span>
          </button>

        </div>
      </div>

      {/* Read-Only Mode Banner if user doesn't have edit access */}
      {!canEdit && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-[#835500] shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <strong className="block font-bold mb-0.5">حالت فقط مشاهده تنظیمات ارشد (Read-Only)</strong>
            <span>
              حساب کاربری شما دارای دسترسی مشاهده تنظیمات است. اعمال تغییرات، ساخت یا ویرایش کاربر، ویرایش ماژول‌ها و فیلدها تنها در اختیار مدیر کل سامانه است.
            </span>
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E3E2E7] pb-3 overflow-x-auto">
        {[
          ...(isAdmin ? [{ id: 'users', label: 'مدیریت کاربران و دسترسی بخش‌ها', icon: Users, count: users.length }] : []),
          { id: 'modules', label: 'ساختار ماژول‌ها (M1-M8)', icon: Layers, count: activeModules.length },
          { id: 'components', label: 'محتوا و اجزای عملیاتی (SOPها)', icon: BookOpen, count: components.length },
          { id: 'fields', label: 'کم و زیاد کردن فیلدها و نمایش', icon: Sliders, count: (settings.ticketCustomFields?.length || 0) + (settings.componentCustomFields?.length || 0) },
          { id: 'quizzes', label: 'بانک آزمون تئوری', icon: HelpCircle },
          { id: 'backup', label: 'تنظیمات و پشتیبان‌گیری', icon: Database },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#F5A623] text-[#1C1D21] shadow-md shadow-amber-500/20'
                  : 'text-[#524534] hover:bg-[#F4F3F8] hover:text-[#1A1B1F]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-[#1C1D21]/15 text-[#1C1D21]' : 'bg-[#E3E2E7] text-[#524534]'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: USER & GRANULAR ACCESS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1A1B1F] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F5A623]" />
                <span>لیست کاربران و تفکیک دسترسی به بخش‌های مختلف سایت</span>
              </h3>
              <p className="text-xs text-[#524534] mt-0.5">
                تعریف اکانت جدید، تأیید کاربران در انتظار، تعیین دسترسی فقط مشاهده (View-Only) یا ویرایش کامل به هر صفحه و وضعیت حساب
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPassword('');
                  setNewUserRole('trainer');
                  setNewUserPermissions(buildDefaultPermissions('trainer'));
                  setShowAddUserModal(true);
                }}
                className="md-btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>ساخت اکانت کاربری جدید</span>
              </button>
            )}
          </div>

          {/* Granular Permission Policy Notice */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#835500]">
            <ShieldCheck className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-bold mb-0.5">سیاست دسترسی بخش‌ها: دسترسی پیش‌فرض فقط مشاهده (View-Only)</strong>
              <span>
                طبق تنظیمات سامانه، کاربران به بخش‌های مجاز خود به‌صورت پیش‌فرض دسترسی <b>فقط مشاهده (Read-Only)</b> دارند و امکان اعمال تغییرات یا ثبت اطلاعات را ندارند، مگر آنکه دسترسی «ویرایش ✏️» برای آن بخش به کاربر اختصاص داده شده باشد.
              </span>
            </div>
          </div>

          {/* User Filters */}
          <div className="bg-white border border-[#E3E2E7] rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-[#857462] absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در نام یا ایمیل کاربر..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="md-input text-xs w-full pr-8"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={e => setUserRoleFilter(e.target.value)}
              className="md-input text-xs min-w-[160px] w-full sm:w-auto"
            >
              <option value="all">همه نقش‌ها</option>
              <option value="admin">مدیر کل (Admin)</option>
              <option value="trainer">مربی (Trainer)</option>
              <option value="hr">منابع انسانی (HR)</option>
              <option value="ops">سرپرست عملیات (Ops Lead)</option>
              <option value="supervisor">سوپروایزر</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-[#E3E2E7] rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#F4F3F8] text-[#524534] border-b border-[#E3E2E7] font-bold">
                    <th className="py-3.5 px-4">کاربر</th>
                    <th className="py-3.5 px-4">ایمیل سازمانی</th>
                    <th className="py-3.5 px-4">نقش اصلی</th>
                    <th className="py-3.5 px-4">سطح دسترسی بخش‌های سایت (View / Edit)</th>
                    <th className="py-3.5 px-3">وضعیت حساب</th>
                    <th className="py-3.5 px-4">عملیات و مدیریت دسترسی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E2E7]/70">
                  {filteredUsers.map(u => {
                    const isCurrent = u.userId === currentUserId;
                    const allowed = SITE_SECTIONS.map(sec => sec.id).filter(id => getUserSectionPermission({ ...u, status: 'active' }, id) !== 'none');
                    return (
                      <tr key={u.userId} className="hover:bg-[#FAF8FE] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F5A623] to-[#FE684F] text-[#1C1D21] font-black flex items-center justify-center text-xs shadow-xs">
                              {u.displayName.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-[#1A1B1F] block">{u.displayName}</span>
                              <span className="text-[10px] text-[#524534]">
                                عضویت: {formatDate(u.createdAt)}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] text-[#835500] font-bold block">
                                  (حساب فعال فعلی شما)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[#524534]">
                          {u.email}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-xs bg-[#F4F3F8] border border-[#E3E2E7] px-2.5 py-1 rounded-xl font-bold text-[#1A1B1F]">
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="flex flex-wrap gap-1">
                            {allowed.length === 0 ? (
                              <span className="text-[10px] text-[#857462] italic">فاقد دسترسی به هر بخش</span>
                            ) : (
                              allowed.map(secId => {
                                const sec = SITE_SECTIONS.find(s => s.id === secId);
                                const permLevel = getUserSectionPermission(u, secId);
                                const isEdit = permLevel === 'edit';
                                return (
                                  <span 
                                    key={secId} 
                                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium inline-flex items-center gap-1 ${
                                      isEdit 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}
                                    title={isEdit ? 'دسترسی مشاهده و ویرایش کامل' : 'دسترسی فقط مشاهده (Read-Only)'}
                                  >
                                    <span>{sec?.label || secId}</span>
                                    <span className="text-[9px] opacity-80 font-bold">
                                      {isEdit ? '(ویرایش ✏️)' : '(مشاهده 👁️)'}
                                    </span>
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {u.status === 'active' ? 'فعال ✓' : u.status === 'pending' ? 'در انتظار تأیید' : 'معلق ✗'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {/* Granular edit button */}
                            <button
                              onClick={() => openEditUser(u)}
                              disabled={!canEdit}
                              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-[11px] transition-all border ${
                                canEdit 
                                  ? 'bg-[#F5A623]/15 hover:bg-[#F5A623] text-[#835500] hover:text-[#1C1D21] border-[#F5A623]/30' 
                                  : 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                              }`}
                              title={canEdit ? 'ویرایش مشخصات و تعیین سطح دسترسی (مشاهده / ویرایش)' : 'فقط مشاهده'}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>دسترسی‌ها و ویرایش</span>
                            </button>

                            {canEdit && !isCurrent && (
                              <button
                                onClick={() => setUserStatus(u, u.status === 'active' ? 'suspended' : 'active')}
                                className="text-[11px] text-[#524534] hover:text-[#1A1B1F] px-2.5 py-1.5 bg-[#F4F3F8] hover:bg-[#E3E2E7] rounded-xl border border-[#E3E2E7] font-medium transition-all"
                              >
                                {u.status === 'active' ? 'تعلیق' : u.status === 'pending' ? 'تأیید و فعال‌سازی' : 'فعال‌سازی'}
                              </button>
                            )}

                            {onDeleteUser && !isCurrent && canEdit && (
                              <button
                                onClick={() => {
                                  if (confirm(`آیا از حذف حساب کاربری «${u.displayName}» اطمینان دارید؟`)) {
                                    onDeleteUser(u.userId);
                                  }
                                }}
                                className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl border border-transparent hover:border-rose-200 transition-all"
                                title="حذف حساب کاربری"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TRAINING MODULES STRUCTURE (M1-M8 + NEW MODULES) */}
      {/* ======================================================== */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1A1B1F] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F5A623]" />
                <span>مدیریت ساختار ماژول‌های آموزشی (M1 تا M8)</span>
              </h3>
              <p className="text-xs text-[#524534] mt-0.5">
                افزودن ماژول جدید، تغییر نام، ویرایش موقعیت‌های تحت پوشش و توضیحات سرفصل‌ها
              </p>
            </div>

            <button
              onClick={() => {
                setEditingModuleId(null);
                setModuleIdInput(`M${activeModules.length + 1}`);
                setModuleNameInput('');
                setModuleLocInput('Hub + SuperHub');
                setModuleDescInput('');
                setShowModuleModal(true);
              }}
              className="md-btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-md"
            >
              <FolderPlus className="w-4 h-4" />
              <span>افزودن ماژول آموزشی جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeModules.map(m => {
              const compCount = components.filter(c => c['ماژول'] === m.id).length;
              return (
                <div
                  key={m.id}
                  className="bg-white p-5 rounded-3xl border border-[#E3E2E7] shadow-xs hover:border-[#F5A623]/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#F5A623]/15 text-[#835500] border border-[#F5A623]/30 px-2.5 py-0.5 rounded-xl font-mono font-bold text-xs">
                        {m.id}
                      </span>
                      <span className="text-[11px] bg-[#F4F3F8] text-[#524534] border border-[#E3E2E7] px-2.5 py-0.5 rounded-full font-mono">
                        {compCount} جزء عملیاتی
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#1A1B1F]">{m.name}</h4>
                    <p className="text-[11px] text-[#524534] line-clamp-2">
                      موقعیت: {m.loc}
                    </p>
                    {m.description && (
                      <p className="text-[11px] text-[#524534] bg-[#F4F3F8] p-2.5 rounded-xl border border-[#E3E2E7] leading-relaxed">
                        {m.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E3E2E7]">
                    <button
                      onClick={() => openEditModule(m)}
                      className="text-xs text-[#835500] hover:underline flex items-center gap-1 font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش عنوان و موقعیت</span>
                    </button>

                    <button
                      onClick={() => handleDeleteModule(m.id)}
                      className="text-xs text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-all"
                      title="حذف ماژول"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CONTENT & MODULE COMPONENTS (SOPs & Tasks) */}
      {/* ======================================================== */}
      {activeTab === 'components' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1A1B1F] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#F5A623]" />
                <span>محتوا و اجزای عملیاتی ماژول‌ها ({components.length} جزء و SOP)</span>
              </h3>
              <p className="text-xs text-[#524534] mt-0.5">
                تغییر ماژول‌ها از نظر محتوایی، ویرایش آیین‌نامه‌ها، SOPهای QC، تسک‌های شیفت و رسپی‌ها
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCompIndex(null);
                setCompTitle('');
                setCompDesc('');
                setCompCustomValues({});
                setShowCompModal(true);
              }}
              className="md-btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن جزء عملیاتی جدید</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-[#E3E2E7] rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-[#857462] absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در نام جزء یا توضیحات SOP..."
                value={compSearch}
                onChange={e => setCompSearch(e.target.value)}
                className="md-input text-xs w-full pr-8"
              />
            </div>
            <select
              value={compFilterMod}
              onChange={e => setCompFilterMod(e.target.value)}
              className="md-input text-xs min-w-[180px] w-full sm:w-auto font-bold"
            >
              <option value="">همه ماژول‌ها</option>
              {activeModules.map(m => (
                <option key={m.id} value={m.id}>{m.id} — {m.name}</option>
              ))}
            </select>
            <span className="text-xs text-[#524534] whitespace-nowrap font-medium">
              {filteredComps.length} جزء یافت شد
            </span>
          </div>

          {/* Components Grid/List */}
          <div className="space-y-2.5">
            {filteredComps.map((c, idx) => {
              const originalIndex = components.indexOf(c);
              return (
                <div
                  key={idx}
                  className="bg-white p-4.5 rounded-2xl border border-[#E3E2E7] hover:border-[#F5A623]/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs transition-all"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#F5A623]/15 text-[#835500] border border-[#F5A623]/30 px-2.5 py-0.5 rounded-lg font-mono font-bold">
                        {c['ماژول']}
                      </span>
                      <strong className="text-[#1A1B1F] text-sm font-bold">{c['جزء']}</strong>
                      <span className="bg-[#F4F3F8] text-[#524534] border border-[#E3E2E7] px-2 py-0.5 rounded-md font-bold text-[11px]">{c['نوع']}</span>
                      <span className="text-[#524534] font-mono text-[11px]">({c['موقعیت']})</span>
                    </div>

                    <p className="text-[#524534] line-clamp-2 leading-relaxed">
                      {c['توضیح']}
                    </p>

                    {/* Display Custom Field Values for this component */}
                    {c.customValues && Object.keys(c.customValues).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(c.customValues).map(([k, v]) => {
                          const def = settings.componentCustomFields?.find(f => f.key === k);
                          return (
                            <span key={k} className="text-[10px] bg-[#F4F3F8] text-[#524534] px-2 py-0.5 rounded-md border border-[#E3E2E7]">
                              {def?.label || k}: <strong className="text-[#1A1B1F]">{String(v)}</strong>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => openEditComp(originalIndex)}
                      className="px-3 py-1.5 rounded-xl bg-[#F5A623]/15 hover:bg-[#F5A623] text-[#835500] hover:text-[#1C1D21] flex items-center gap-1.5 font-bold transition-all border border-[#F5A623]/30"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش محتوا</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`آیا از حذف جزء «${c['جزء']}» اطمینان دارید؟`)) {
                          onDeleteComponent(originalIndex);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#F4F3F8] hover:bg-rose-50 text-rose-600 border border-[#E3E2E7] hover:border-rose-200 transition-all"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DYNAMIC CUSTOM FIELDS MANAGER */}
      {/* ======================================================== */}
      {activeTab === 'fields' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#1A1B1F] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#F5A623]" />
              <span>موتور فیلدهای سفارشی و کنترل پویای نمایش (Custom Fields Engine)</span>
            </h3>
            <p className="text-xs text-[#524534] mt-1">
              امکان افزودن فیلدهای دلخواه، حذف فیلدها، و سوئیچ پویای نمایش/عدم‌نمایش (Toggle Visibility) بدون از بین رفتن داده‌های قبلی.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add Field Form */}
            <div className="lg:col-span-5 bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-[#1A1B1F] flex items-center gap-1.5 border-b border-[#E3E2E7] pb-2">
                <PlusCircle className="w-4 h-4 text-[#F5A623]" />
                <span>تعریف فیلد سفارشی جدید</span>
              </h4>

              <form onSubmit={handleAddCustomField} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">بخش هدف (Target)</label>
                  <select
                    value={newFieldTarget}
                    onChange={e => setNewFieldTarget(e.target.value as any)}
                    className="w-full md-input font-bold"
                  >
                    <option value="ticket">تیکت‌های پایپ‌لاین (درخواست، مشخصات داوطلب در HR)</option>
                    <option value="component">اجزای ماژول‌های آموزشی (اطلاعات تکمیلی SOP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">عنوان فارسی فیلد (Label)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: وضعیت نظام وظیفه، سابقه کار در فست‌فود"
                    value={newFieldLabel}
                    onChange={e => setNewFieldLabel(e.target.value)}
                    className="w-full md-input"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">شناسه انگلیسی (Key)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: militaryStatus"
                    value={newFieldKey}
                    onChange={e => setNewFieldKey(e.target.value)}
                    className="w-full md-input font-mono dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">نوع داده فیلد</label>
                  <select
                    value={newFieldType}
                    onChange={e => setNewFieldType(e.target.value as any)}
                    className="w-full md-input font-bold"
                  >
                    <option value="text">متن تک‌خطی (Text)</option>
                    <option value="number">عددی (Number)</option>
                    <option value="select">انتخابی / کشویی (Dropdown Select)</option>
                    <option value="textarea">متن توضیحی چندخطی (Textarea)</option>
                    <option value="checkbox">تیک‌باکس / بله و خیر (Checkbox)</option>
                  </select>
                </div>

                {newFieldType === 'select' && (
                  <div>
                    <label className="block text-[#1A1B1F] font-bold mb-1">گزینه‌های انتخابی (هر گزینه در یک خط)</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="گزینه ۱&#10;گزینه ۲&#10;گزینه ۳"
                      value={newFieldOptions}
                      onChange={e => setNewFieldOptions(e.target.value)}
                      className="w-full md-input"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">متن راهنما (Placeholder - اختیاری)</label>
                  <input
                    type="text"
                    placeholder="متنی که داخل فیلد نمایش داده می‌شود..."
                    value={newFieldPlaceholder}
                    onChange={e => setNewFieldPlaceholder(e.target.value)}
                    className="w-full md-input"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E3E2E7]">
                  <label className="flex items-center gap-2 cursor-pointer text-[#1A1B1F]">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={e => setNewFieldRequired(e.target.checked)}
                      className="accent-[#F5A623]"
                    />
                    <span className="text-xs">تکمیل این فیلد در فرم‌ها الزامی باشد (Required)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[#1A1B1F]">
                    <input
                      type="checkbox"
                      checked={newFieldVisible}
                      onChange={e => setNewFieldVisible(e.target.checked)}
                      className="accent-[#F5A623]"
                    />
                    <span className="text-xs">نمایش فعال در فرم‌ها (Visible by default)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="md-btn-primary w-full text-xs font-bold py-2.5 mt-2 shadow-md"
                >
                  افزودن فیلد به سامانه
                </button>
              </form>
            </div>

            {/* Existing Fields List & Visibility Toggles */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E3E2E7]">
                <span className="text-xs font-bold text-[#1A1B1F]">فیلدهای سفارشی تعریف‌شده در سامانه</span>
                <div className="flex items-center gap-1.5 bg-[#F4F3F8] p-1 rounded-xl border border-[#E3E2E7]">
                  <button
                    onClick={() => setFieldTargetFilter('all')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${fieldTargetFilter === 'all' ? 'bg-[#F5A623] text-[#1C1D21] shadow-xs' : 'text-[#524534] hover:text-[#1A1B1F]'}`}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => setFieldTargetFilter('ticket')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${fieldTargetFilter === 'ticket' ? 'bg-[#F5A623] text-[#1C1D21] shadow-xs' : 'text-[#524534] hover:text-[#1A1B1F]'}`}
                  >
                    تیکت‌ها
                  </button>
                  <button
                    onClick={() => setFieldTargetFilter('component')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${fieldTargetFilter === 'component' ? 'bg-[#F5A623] text-[#1C1D21] shadow-xs' : 'text-[#524534] hover:text-[#1A1B1F]'}`}
                  >
                    اجزای آموزشی
                  </button>
                </div>
              </div>

              {/* Ticket Fields */}
              {(fieldTargetFilter === 'all' || fieldTargetFilter === 'ticket') && (
                <div className="bg-white border border-[#E3E2E7] rounded-3xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-[#835500] flex items-center justify-between">
                    <span>فیلدهای سفارشی تیکت‌های پایپ‌لاین (درخواست و پرونده HR)</span>
                    <span className="text-[10px] text-[#524534] font-mono">{settings.ticketCustomFields?.length || 0} فیلد</span>
                  </h4>

                  {(!settings.ticketCustomFields || settings.ticketCustomFields.length === 0) ? (
                    <p className="text-xs text-[#524534]">هیچ فیلد سفارشی برای تیکت‌ها ثبت نشده است.</p>
                  ) : (
                    <div className="space-y-2">
                      {settings.ticketCustomFields.map(f => {
                        const isVisible = f.visible !== false;
                        return (
                          <div
                            key={f.id}
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                              isVisible ? 'bg-white border-[#E3E2E7]' : 'bg-[#F4F3F8] border-[#E3E2E7]/60 opacity-60'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <strong className="text-[#1A1B1F] text-xs font-bold">{f.label}</strong>
                                <span className="font-mono text-[10px] bg-[#F4F3F8] text-[#524534] px-1.5 py-0.5 rounded border border-[#E3E2E7]">
                                  {f.key}
                                </span>
                                <span className="text-[10px] bg-[#F5A623]/15 text-[#835500] px-1.5 py-0.5 rounded font-bold border border-[#F5A623]/30">
                                  {f.type}
                                </span>
                                {f.required && (
                                  <span className="text-[10px] text-rose-600 font-bold">*الزامی</span>
                                )}
                              </div>

                              {f.options && (
                                <p className="text-[11px] text-[#835500]">
                                  گزینه‌ها: {f.options.join(' · ')}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {/* Dynamic Visibility Toggle */}
                              <button
                                onClick={() => handleToggleFieldVisibility(f.id, 'ticket')}
                                className={`px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold text-[11px] transition-colors ${
                                  isVisible 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                }`}
                                title={isVisible ? 'کلیک کنید تا در فرم‌ها پنهان شود' : 'کلیک کنید تا در فرم‌ها نمایش داده شود'}
                              >
                                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                <span>{isVisible ? 'نمایش در فرم' : 'مخفی در فرم'}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteCustomField(f.id, 'ticket')}
                                className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-all"
                                title="حذف دائمی فیلد"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Component Fields */}
              {(fieldTargetFilter === 'all' || fieldTargetFilter === 'component') && (
                <div className="bg-white border border-[#E3E2E7] rounded-3xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-[#835500] flex items-center justify-between">
                    <span>فیلدهای سفارشی اجزای آموزشی و SOPها</span>
                    <span className="text-[10px] text-[#524534] font-mono">{settings.componentCustomFields?.length || 0} فیلد</span>
                  </h4>

                  {(!settings.componentCustomFields || settings.componentCustomFields.length === 0) ? (
                    <p className="text-xs text-[#524534]">هیچ فیلد سفارشی برای اجزای آموزشی ثبت نشده است.</p>
                  ) : (
                    <div className="space-y-2">
                      {settings.componentCustomFields.map(f => {
                        const isVisible = f.visible !== false;
                        return (
                          <div
                            key={f.id}
                            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                              isVisible ? 'bg-white border-[#E3E2E7]' : 'bg-[#F4F3F8] border-[#E3E2E7]/60 opacity-60'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <strong className="text-[#1A1B1F] text-xs font-bold">{f.label}</strong>
                                <span className="font-mono text-[10px] bg-[#F4F3F8] text-[#524534] px-1.5 py-0.5 rounded border border-[#E3E2E7]">
                                  {f.key}
                                </span>
                                <span className="text-[10px] bg-[#F5A623]/15 text-[#835500] px-1.5 py-0.5 rounded font-bold border border-[#F5A623]/30">
                                  {f.type}
                                </span>
                              </div>

                              {f.options && (
                                <p className="text-[11px] text-[#835500]">
                                  گزینه‌ها: {f.options.join(' · ')}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => handleToggleFieldVisibility(f.id, 'component')}
                                className={`px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold text-[11px] transition-colors ${
                                  isVisible 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                }`}
                                title={isVisible ? 'کلیک کنید تا پنهان شود' : 'کلیک کنید تا نمایش داده شود'}
                              >
                                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                <span>{isVisible ? 'فعال' : 'مخفی'}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteCustomField(f.id, 'component')}
                                className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-all"
                                title="حذف فیلد"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: QUIZZES BANK */}
      {/* ======================================================== */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1A1B1F] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#F5A623]" />
                <span>بانک سوالات آزمون تئوری (C2 Theory Exam)</span>
              </h3>
              <p className="text-xs text-[#524534] mt-0.5">
                مدیریت و افزودن سوالات ۴ گزینه‌ای برای زون‌های Hub, SuperHub و irancell
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#F4F3F8] border border-[#E3E2E7] p-1 rounded-2xl">
              {(['hub', 'superhub', 'irancell'] as ZoneType[]).map(z => (
                <button
                  key={z}
                  onClick={() => setQuizZone(z)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    quizZone === z ? 'bg-[#F5A623] text-[#1C1D21] shadow-xs' : 'text-[#524534] hover:text-[#1A1B1F]'
                  }`}
                >
                  {ZONE_LABEL[z]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add Question Form */}
            <div className="lg:col-span-5 bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-[#1A1B1F] flex items-center gap-1.5 border-b border-[#E3E2E7] pb-2">
                <PlusCircle className="w-4 h-4 text-[#F5A623]" />
                <span>افزودن سوال جدید به {ZONE_LABEL[quizZone]}</span>
              </h4>

              <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">صورت سوال</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="متن سوال را وارد نمایید..."
                    value={newQTitle}
                    onChange={e => setNewQTitle(e.target.value)}
                    className="w-full md-input leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[#1A1B1F] font-bold">گزینه‌ها (گزینه صحیح را با دکمه رادیویی مشخص کنید)</label>
                  {[
                    { val: newQOpt0, set: setNewQOpt0, idx: 0 },
                    { val: newQOpt1, set: setNewQOpt1, idx: 1 },
                    { val: newQOpt2, set: setNewQOpt2, idx: 2 },
                    { val: newQOpt3, set: setNewQOpt3, idx: 3 },
                  ].map(opt => (
                    <div key={opt.idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={newQCorrect === opt.idx}
                        onChange={() => setNewQCorrect(opt.idx)}
                        className="accent-[#F5A623] cursor-pointer"
                        title="انتخاب به عنوان پاسخ صحیح"
                      />
                      <input
                        type="text"
                        required
                        placeholder={`گزینه ${opt.idx + 1}`}
                        value={opt.val}
                        onChange={e => opt.set(e.target.value)}
                        className="flex-1 md-input py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="md-btn-primary w-full text-xs font-bold py-2.5 mt-2 shadow-md"
                >
                  ثبت سوال در بانک آزمون
                </button>
              </form>
            </div>

            {/* List Existing Questions */}
            <div className="lg:col-span-7 bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-[#1A1B1F] flex items-center justify-between border-b border-[#E3E2E7] pb-2">
                <span>سوالات فعلی زون {ZONE_LABEL[quizZone]}</span>
                <span className="text-[10px] text-[#524534] font-mono font-bold">
                  {quizzes[quizZone]?.length || 0} سوال
                </span>
              </h4>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {(quizzes[quizZone] || []).map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F4F3F8] p-3.5 rounded-2xl border border-[#E3E2E7] text-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#835500] font-mono font-bold flex items-center justify-center text-[10px] border border-[#F5A623]/30">
                          {idx + 1}
                        </span>
                        <strong className="text-[#1A1B1F]">{q.q}</strong>
                      </div>

                      {onDeleteQuizQuestion && (
                        <button
                          onClick={() => {
                            if (confirm('آیا از حذف این سوال اطمینان دارید؟')) {
                              onDeleteQuizQuestion(quizZone, idx);
                            }
                          }}
                          className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-all"
                          title="حذف سوال"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                            oIdx === q.correct
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-2xs'
                              : 'bg-white text-[#524534] border-[#E3E2E7]'
                          }`}
                        >
                          <span className="font-mono text-[10px]">{oIdx + 1}.</span>
                          <span className="truncate">{opt}</span>
                          {oIdx === q.correct && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 mr-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: BACKUP, RESTORE & SYSTEM SETTINGS */}
      {/* ======================================================== */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#1A1B1F] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#F5A623]" />
              <span>پشتیبان‌گیری، بازنشانی داده‌ها و تنظیمات سیستمی</span>
            </h3>
            <p className="text-xs text-[#524534] mt-1">
              مدیریت حدنصاب‌های قبولی، خروجی پشتیبان JSON کامل از کل اطلاعات و بازنشانی داده‌های نمونه اولیه
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Global Thresholds */}
            <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-[#1A1B1F] flex items-center gap-2 border-b border-[#E3E2E7] pb-2">
                <Sliders className="w-4 h-4 text-[#F5A623]" />
                <span>حد نصاب قبولی در ارزیابی‌ها</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">
                    درصد قبولی آزمون تئوری و عملی (Passing Score)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={60}
                      max={100}
                      step={5}
                      value={settings.passingScorePct || 80}
                      onChange={e => onUpdateSettings({
                        ...settings,
                        passingScorePct: Number(e.target.value)
                      })}
                      className="flex-1 accent-[#F5A623]"
                    />
                    <span className="font-mono font-bold text-sm bg-[#F5A623]/15 text-[#835500] border border-[#F5A623]/30 px-3 py-1 rounded-xl">
                      {settings.passingScorePct || 80}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#524534] mt-1">
                    داوطلبانی که نمره کمتر از این مقدار کسب کنند در وضعیت تجدیدی/مردودی قرار می‌گیرند.
                  </p>
                </div>
              </div>
            </div>

            {/* Backup & Seed Actions */}
            <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-[#1A1B1F] flex items-center gap-2 border-b border-[#E3E2E7] pb-2">
                <Database className="w-4 h-4 text-[#F5A623]" />
                <span>پشتیبان‌گیری و انتقال داده‌ها</span>
              </h4>

              <div className="space-y-3">
                <button
                  onClick={onExportBackup}
                  className="w-full md-btn-primary flex items-center justify-center gap-2 text-xs py-2.5 font-bold shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل پشتیبان کامل سامانه (Export JSON)</span>
                </button>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full md-btn-secondary flex items-center justify-center gap-2 text-xs py-2.5 font-bold"
                  >
                    <Upload className="w-4 h-4 text-[#835500]" />
                    <span>بارگذاری فایل پشتیبان (Restore Backup JSON)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#E3E2E7] space-y-2">
                  <button
                    onClick={() => {
                      if (confirm('محتوای آموزشی (ماژول‌ها، اجزا، بانک سؤال، زون‌ها و فیلدها) به نسخه پیش‌فرض برگردد؟ تیکت‌ها و کاربران تغییری نمی‌کنند.')) {
                        onLoadDefaults(false);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>بازگرداندن محتوای آموزشی به پیش‌فرض</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('چند تیکت نمونه (داده آزمایشی) به دیتابیس اضافه شود؟ فقط برای محیط تست توصیه می‌شود.')) {
                        onLoadDefaults(true);
                      }
                    }}
                    className="w-full md-btn-secondary text-xs py-2.5 font-bold"
                  >
                    افزودن داده‌های نمونه (Demo)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD USER MODAL WITH GRANULAR PERMISSIONS */}
      {/* ======================================================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3E2E7] pb-3">
              <h3 className="text-sm font-bold text-[#1A1B1F] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F5A623]" />
                <span>ساخت اکانت کاربری جدید و تعیین دسترسی بخش‌ها</span>
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-[#524534] hover:text-[#1A1B1F] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: علیرضا حسینی"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="w-full md-input"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">ایمیل سازمانی / گوگل</label>
                  <input
                    type="email"
                    required
                    placeholder="name@snappkitchen.ir"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="w-full md-input font-mono dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">کلمه عبور اولیه (حداقل ۸ کاراکتر)</label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="کاربر بعداً می‌تواند آن را تغییر دهد"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    className="w-full md-input font-mono dir-ltr text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1A1B1F] font-bold mb-1">سطح دسترسی سازمانی (نقش پایه)</label>
                <select
                  value={newUserRole}
                  onChange={e => {
                    const r = e.target.value as UserRole;
                    setNewUserRole(r);
                    setNewUserPermissions(buildDefaultPermissions(r));
                  }}
                  className="w-full md-input font-bold"
                >
                  <option value="trainer">مربی مرکز آموزش (Trainer)</option>
                  <option value="hr">کارشناس منابع انسانی (HR)</option>
                  <option value="ops">سرپرست عملیات (Ops Lead)</option>
                  <option value="supervisor">سوپروایزر شعبه (Supervisor)</option>
                  <option value="admin">مدیر کل سامانه (Admin)</option>
                </select>
              </div>

              {/* Granular Section Permissions Checklist */}
              <div className="pt-2 border-t border-[#E3E2E7] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#835500] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
                    <span>سطح دسترسی به بخش‌های مختلف سایت:</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllPermissionsForNewUser('view')}
                      className="text-[11px] font-bold text-[#835500] hover:underline"
                    >
                      همه فقط مشاهده 👁️
                    </button>
                    <span className="text-[#D7C3AE]">·</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissionsForNewUser('edit')}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      همه با ویرایش ✏️
                    </button>
                    <span className="text-[#D7C3AE]">·</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissionsForNewUser('none')}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      عدم دسترسی به همه
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#F4F3F8] p-3 rounded-2xl border border-[#E3E2E7] max-h-72 overflow-y-auto">
                  {SITE_SECTIONS.map(sec => {
                    const level = newUserPermissions[sec.id] || 'none';
                    return (
                      <div
                        key={sec.id}
                        className="bg-white border border-[#E3E2E7] p-2.5 rounded-xl space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="block text-[11px] font-bold text-[#1A1B1F]">{sec.label}</strong>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            level === 'edit'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : level === 'view'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            {level === 'edit' ? 'ویرایش ✏️' : level === 'view' ? 'مشاهده 👁️' : 'عدم دسترسی'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#524534] block leading-tight">{sec.description}</span>

                        {/* 3-State Segmented Control */}
                        <div className="grid grid-cols-3 gap-1 bg-[#F4F3F8] p-1 rounded-xl text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setPermissionForNewUser(sec.id, 'none')}
                            className={`py-1 rounded-lg transition-all ${
                              level === 'none'
                                ? 'bg-white shadow-2xs text-rose-600'
                                : 'text-[#857462] hover:text-[#1A1B1F]'
                            }`}
                          >
                            عدم دسترسی
                          </button>
                          <button
                            type="button"
                            onClick={() => setPermissionForNewUser(sec.id, 'view')}
                            className={`py-1 rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                              level === 'view'
                                ? 'bg-[#F5A623] text-[#1C1D21] shadow-2xs font-bold'
                                : 'text-[#857462] hover:text-[#1A1B1F]'
                            }`}
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>فقط مشاهده</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPermissionForNewUser(sec.id, 'edit')}
                            className={`py-1 rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                              level === 'edit'
                                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                : 'text-[#857462] hover:text-[#1A1B1F]'
                            }`}
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>ویرایش</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E3E2E7]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-[#524534] hover:bg-[#F4F3F8] font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="md-btn-primary px-4 py-2 font-bold shadow-md disabled:opacity-60"
                >
                  {creatingUser ? 'در حال ساخت…' : 'ثبت اکانت جدید با دسترسی‌های تعیین‌شده'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT USER & PERMISSIONS MODAL */}
      {/* ======================================================== */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3E2E7] pb-3">
              <h3 className="text-sm font-bold text-[#1A1B1F] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
                <span>ویرایش مشخصات و دسترسی‌های کاربر ({editUserName})</span>
              </h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="text-[#524534] hover:text-[#1A1B1F] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    required
                    value={editUserName}
                    onChange={e => setEditUserName(e.target.value)}
                    className="w-full md-input"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">ایمیل ورود</label>
                  <input
                    type="email"
                    readOnly
                    value={editUserEmail}
                    className="w-full md-input font-mono bg-[#F4F3F8] text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 bg-[#F4F3F8] border border-[#E3E2E7] rounded-2xl p-3">
                <span className="text-[11px] text-[#524534]">کلمه عبور توسط خود کاربر مدیریت می‌شود.</span>
                <button
                  type="button"
                  onClick={() => handleSendReset(editUserEmail)}
                  className="md-btn-secondary text-[11px] py-1.5 px-3 font-bold whitespace-nowrap"
                >
                  ارسال لینک تغییر رمز
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">نقش سازمانی</label>
                  <select
                    value={editUserRole}
                    onChange={e => setEditUserRole(e.target.value as UserRole)}
                    className="w-full md-input font-bold"
                  >
                    <option value="admin">مدیر کل (Admin)</option>
                    <option value="trainer">مربی مرکز آموزش (Trainer)</option>
                    <option value="hr">کارشناس منابع انسانی (HR)</option>
                    <option value="ops">سرپرست عملیات (Ops Lead)</option>
                    <option value="supervisor">سوپروایزر شعبه (Supervisor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">وضعیت حساب</label>
                  <select
                    value={editUserStatus}
                    onChange={e => setEditUserStatus(e.target.value as any)}
                    className="w-full md-input font-bold"
                  >
                    <option value="active">فعال (Active)</option>
                    <option value="pending">در انتظار تأیید (Pending)</option>
                    <option value="suspended">معلق / غیرفعال (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Granular Section Permissions Checklist */}
              <div className="pt-2 border-t border-[#E3E2E7] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#835500] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
                    <span>سطح دسترسی به بخش‌های مختلف سایت:</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllPermissionsForEditUser('view')}
                      className="text-[11px] font-bold text-[#835500] hover:underline"
                    >
                      همه فقط مشاهده 👁️
                    </button>
                    <span className="text-[#D7C3AE]">·</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissionsForEditUser('edit')}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      همه با ویرایش ✏️
                    </button>
                    <span className="text-[#D7C3AE]">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultAllowed = DEFAULT_ROLE_PERMISSIONS[editUserRole] || [];
                        const nextPerms: Record<SiteSectionId, SectionPermissionLevel> = {} as any;
                        SITE_SECTIONS.forEach(s => {
                          if (editUserRole === 'admin') {
                            nextPerms[s.id] = 'edit';
                          } else if (defaultAllowed.includes(s.id)) {
                            // View only by default
                            nextPerms[s.id] = 'view';
                          } else {
                            nextPerms[s.id] = 'none';
                          }
                        });
                        setEditUserPermissions(nextPerms);
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      پیش‌فرض نقش
                    </button>
                    <span className="text-[#D7C3AE]">·</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissionsForEditUser('none')}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      پاک کردن همه
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#F4F3F8] p-3 rounded-2xl border border-[#E3E2E7] max-h-72 overflow-y-auto">
                  {SITE_SECTIONS.map(sec => {
                    const level = editUserPermissions[sec.id] || 'none';
                    return (
                      <div
                        key={sec.id}
                        className="bg-white border border-[#E3E2E7] p-2.5 rounded-xl space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="block text-[11px] font-bold text-[#1A1B1F]">{sec.label}</strong>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            level === 'edit'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : level === 'view'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            {level === 'edit' ? 'ویرایش ✏️' : level === 'view' ? 'مشاهده 👁️' : 'عدم دسترسی'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#524534] block leading-tight">{sec.description}</span>

                        {/* 3-State Segmented Control */}
                        <div className="grid grid-cols-3 gap-1 bg-[#F4F3F8] p-1 rounded-xl text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setPermissionForEditUser(sec.id, 'none')}
                            className={`py-1 rounded-lg transition-all ${
                              level === 'none'
                                ? 'bg-white shadow-2xs text-rose-600'
                                : 'text-[#857462] hover:text-[#1A1B1F]'
                            }`}
                          >
                            عدم دسترسی
                          </button>
                          <button
                            type="button"
                            onClick={() => setPermissionForEditUser(sec.id, 'view')}
                            className={`py-1 rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                              level === 'view'
                                ? 'bg-[#F5A623] text-[#1C1D21] shadow-2xs font-bold'
                                : 'text-[#857462] hover:text-[#1A1B1F]'
                            }`}
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>فقط مشاهده</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPermissionForEditUser(sec.id, 'edit')}
                            className={`py-1 rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                              level === 'edit'
                                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                : 'text-[#857462] hover:text-[#1A1B1F]'
                            }`}
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>ویرایش</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E3E2E7]">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 rounded-xl text-[#524534] hover:bg-[#F4F3F8] font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="md-btn-primary px-4 py-2 font-bold shadow-md"
                >
                  ذخیره تغییرات و دسترسی‌ها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD/EDIT MODULE MODAL */}
      {/* ======================================================== */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3E2E7] pb-3">
              <h3 className="text-sm font-bold text-[#1A1B1F] flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#F5A623]" />
                <span>{editingModuleId ? `ویرایش ماژول ${editingModuleId}` : 'افزودن ماژول آموزشی جدید'}</span>
              </h3>
              <button
                onClick={() => setShowModuleModal(false)}
                className="text-[#524534] hover:text-[#1A1B1F] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#1A1B1F] font-bold mb-1">شناسه ماژول (Module ID)</label>
                <input
                  type="text"
                  required
                  placeholder="M1, M2, M9..."
                  value={moduleIdInput}
                  onChange={e => setModuleIdInput(e.target.value)}
                  className="w-full md-input font-mono dir-ltr text-right"
                  disabled={Boolean(editingModuleId)}
                />
              </div>

              <div>
                <label className="block text-[#1A1B1F] font-bold mb-1">عنوان ماژول</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: ایمنی کار با فر و خط داغ"
                  value={moduleNameInput}
                  onChange={e => setModuleNameInput(e.target.value)}
                  className="w-full md-input"
                />
              </div>

              <div>
                <label className="block text-[#1A1B1F] font-bold mb-1">موقعیت‌های تحت پوشش</label>
                <input
                  type="text"
                  required
                  placeholder="Hub + SuperHub + irancell"
                  value={moduleLocInput}
                  onChange={e => setModuleLocInput(e.target.value)}
                  className="w-full md-input"
                />
              </div>

              <div>
                <label className="block text-[#1A1B1F] font-bold mb-1">توضیحات کلی سرفصل (اختیاری)</label>
                <textarea
                  rows={3}
                  placeholder="اهداف آموزشی و خروجی مورد انتظار این ماژول..."
                  value={moduleDescInput}
                  onChange={e => setModuleDescInput(e.target.value)}
                  className="w-full md-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E3E2E7]">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 rounded-xl text-[#524534] hover:bg-[#F4F3F8] font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="md-btn-primary px-4 py-2 font-bold shadow-md"
                >
                  {editingModuleId ? 'ذخیره تغییرات' : 'افزودن ماژول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: COMPONENT MODAL (ADD / EDIT COMPONENT) */}
      {/* ======================================================== */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E3E2E7] rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E3E2E7] pb-3">
              <h3 className="text-sm font-bold text-[#1A1B1F] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#F5A623]" />
                <span>{editingCompIndex !== null ? 'ویرایش جزء عملیاتی / SOP' : 'افزودن جزء عملیاتی جدید'}</span>
              </h3>
              <button
                onClick={() => setShowCompModal(false)}
                className="text-[#524534] hover:text-[#1A1B1F] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComponent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">ماژول مربوطه</label>
                  <select
                    value={compModule}
                    onChange={e => setCompModule(e.target.value)}
                    className="w-full md-input font-bold"
                  >
                    {activeModules.map(m => (
                      <option key={m.id} value={m.id}>{m.id} — {m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">نوع جزء عملیاتی</label>
                  <select
                    value={compType}
                    onChange={e => setCompType(e.target.value)}
                    className="w-full md-input font-bold"
                  >
                    <option value="SOP QC">SOP QC</option>
                    <option value="آموزش فردی">آموزش فردی</option>
                    <option value="تسک عملیاتی">تسک عملیاتی</option>
                    <option value="محتوای آموزشی">محتوای آموزشی</option>
                    <option value="ویدیوی آموزشی">ویدیوی آموزشی</option>
                    <option value="جدول/داده مرجع">جدول/داده مرجع</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#1A1B1F] font-bold mb-1">عنوان جزء (نام SOP یا تسک)</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: Personal Hygiene SOP — آیین‌نامه بهداشت فردی"
                  value={compTitle}
                  onChange={e => setCompTitle(e.target.value)}
                  className="w-full md-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">موقعیت اجرایی</label>
                  <input
                    type="text"
                    required
                    placeholder="Hub + SuperHub + irancell"
                    value={compLoc}
                    onChange={e => setCompLoc(e.target.value)}
                    className="w-full md-input"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1B1F] font-bold mb-1">منبع سند</label>
                  <input
                    type="text"
                    required
                    placeholder="دارایی واقعی / استخراج محدود"
                    value={compSource}
                    onChange={e => setCompSource(e.target.value)}
                    className="w-full md-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#1A1B1F] font-bold mb-1">شرح کامل، مراحل SOP و دستورالعمل اجرایی</label>
                <textarea
                  rows={4}
                  required
                  placeholder="هدف، گام‌های اجرایی، چک‌پوینت‌های کیفی و نکات بهداشتی..."
                  value={compDesc}
                  onChange={e => setCompDesc(e.target.value)}
                  className="w-full md-input leading-relaxed"
                />
              </div>

              {/* Dynamic Custom Fields for Components */}
              {settings.componentCustomFields && settings.componentCustomFields.length > 0 && (
                <div className="pt-2 border-t border-[#E3E2E7] space-y-2">
                  <span className="block text-[11px] font-bold text-[#835500]">
                    مقادیر فیلدهای سفارشی این جزء:
                  </span>
                  {settings.componentCustomFields.filter(f => f.visible !== false).map(cf => (
                    <div key={cf.id}>
                      <label className="block text-[11px] text-[#1A1B1F] font-medium mb-1">
                        {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                      </label>
                      {cf.type === 'select' ? (
                        <select
                          value={compCustomValues[cf.key] || ''}
                          onChange={e => setCompCustomValues({
                            ...compCustomValues,
                            [cf.key]: e.target.value
                          })}
                          className="w-full md-input py-1 text-xs"
                        >
                          <option value="">-- انتخاب کنید --</option>
                          {cf.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={cf.type === 'number' ? 'number' : 'text'}
                          placeholder={cf.placeholder || ''}
                          value={compCustomValues[cf.key] || ''}
                          onChange={e => setCompCustomValues({
                            ...compCustomValues,
                            [cf.key]: e.target.value
                          })}
                          className="w-full md-input py-1 text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E3E2E7]">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 rounded-xl text-[#524534] hover:bg-[#F4F3F8] font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="md-btn-primary px-4 py-2 font-bold shadow-md"
                >
                  {editingCompIndex !== null ? 'ذخیره تغییرات' : 'افزودن جزء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsView;
