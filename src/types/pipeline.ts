export type ZoneType = 'hub' | 'superhub' | 'irancell';

export type TicketStatus = 'requested' | 'referred_to_training' | 'training' | 'evaluation' | 'handover';

export type UserRole = 'admin' | 'trainer' | 'hr' | 'ops' | 'supervisor';

export type SiteSectionId = 
  | 'dashboard'
  | 'request'
  | 'hr'
  | 'tc'
  | 'handover'
  | 'docs'
  | 'eval'
  | 'admin'
  | 'overview';

export interface SiteSectionInfo {
  id: SiteSectionId;
  label: string;
  description: string;
  views: string[];
}

export const SITE_SECTIONS: SiteSectionInfo[] = [
  { id: 'dashboard', label: 'داشبورد پایپ‌لاین', description: 'مشاهده آمار کلی، وضعیت کاندیداها و فیلترها', views: ['v-pl-dashboard', 'v-home'] },
  { id: 'request', label: 'ثبت درخواست جدید', description: 'ثبت نیاز نیروی انسانی توسط عملیات', views: ['v-pl-request'] },
  { id: 'hr', label: 'منابع انسانی (HR)', description: 'بررسی متقاضیان، مصاحبه اولیه و ارجاع به آموزش', views: ['v-pl-hr'] },
  { id: 'tc', label: 'مرکز آموزش (TC)', description: 'برنامه‌ریزی آموزشی، منتورینگ و پیشرفت ماژول‌ها', views: ['v-pl-tc'] },
  { id: 'handover', label: 'تحویل به عملیات', description: 'پروتکل تحویل نیرو، بادی روز اول و گزارش پایش', views: ['v-pl-handover'] },
  { id: 'docs', label: 'داک آموزشی و SOPها', description: 'جستجو در ۶۱ جزء عملیاتی و داک ماژول‌های M1 تا M8', views: ['v-doc', 'v-module'] },
  { id: 'eval', label: 'ارزیابی و آزمون‌ها (C1 تا C8)', description: 'آزمون تئوری، چک‌لیست عملی، مصاحبه و شبیه‌سازی پیک', views: ['v-eval', 'v-eval-c2', 'v-eval-c3', 'v-eval-c4', 'v-eval-c5', 'v-eval-c6', 'v-eval-c7', 'v-eval-c8'] },
  { id: 'admin', label: 'پنل مدیریت ارشد سایت', description: 'مدیریت کاربران، تغییر دسترسی‌ها، ویرایش ماژول‌ها و فیلدها', views: ['v-admin', 'v-admin-settings'] },
  { id: 'overview', label: 'معماری و Zone-Builder', description: 'فلوی کلی، دیاگرام فرآیندها و پیکربندی زون‌ها', views: ['v-flow', 'v-e2e', 'v-mods'] }
];

export type SectionPermissionLevel = 'none' | 'view' | 'edit';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, SiteSectionId[]> = {
  admin: ['dashboard', 'request', 'hr', 'tc', 'handover', 'docs', 'eval', 'admin', 'overview'],
  trainer: ['dashboard', 'tc', 'docs', 'eval', 'overview'],
  hr: ['dashboard', 'request', 'hr', 'tc', 'docs'],
  ops: ['dashboard', 'request', 'handover', 'docs', 'overview'],
  supervisor: ['dashboard', 'handover', 'docs', 'eval']
};

export const DEFAULT_ROLE_EDIT_PERMISSIONS: Record<UserRole, SiteSectionId[]> = {
  admin: ['dashboard', 'request', 'hr', 'tc', 'handover', 'docs', 'eval', 'admin', 'overview'],
  trainer: [],
  hr: [],
  ops: [],
  supervisor: []
};

export type UserStatus = 'active' | 'suspended' | 'pending';

export type SectionPermissions = Partial<Record<SiteSectionId, SectionPermissionLevel>>;

/**
 * User profile stored at `users/{uid}` in Firestore.
 * Authentication itself is handled by Firebase Auth; no credentials are ever
 * stored in this document. `role`, `status` and `sectionPermissions` can only be
 * changed by an admin (enforced in firestore.rules).
 */
export interface SystemUser {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  /** Full per-section map. A missing key means 'none' (same as firestore.rules). */
  sectionPermissions?: SectionPermissions;
  createdAt?: string;
  updatedAt?: string;
}

/** Builds the full permission map for a role: default sections are view-only, admins get edit everywhere. */
export function buildDefaultPermissions(role: UserRole): Record<SiteSectionId, SectionPermissionLevel> {
  const perms = {} as Record<SiteSectionId, SectionPermissionLevel>;
  for (const s of SITE_SECTIONS) {
    if (DEFAULT_ROLE_EDIT_PERMISSIONS[role].includes(s.id)) perms[s.id] = 'edit';
    else if (DEFAULT_ROLE_PERMISSIONS[role].includes(s.id)) perms[s.id] = 'view';
    else perms[s.id] = 'none';
  }
  return perms;
}

/** Mirrors `sectionLevel()` in firestore.rules — keep both in sync. */
export function getUserSectionPermission(
  user: SystemUser | null | undefined,
  sectionId: SiteSectionId
): SectionPermissionLevel {
  if (!user || user.status !== 'active') return 'none';
  if (user.role === 'admin') return 'edit';
  return user.sectionPermissions?.[sectionId] ?? 'none';
}

export function canUserViewSection(
  user: SystemUser | null | undefined,
  sectionId: SiteSectionId
): boolean {
  const perm = getUserSectionPermission(user, sectionId);
  return perm === 'view' || perm === 'edit';
}

export function canUserEditSection(
  user: SystemUser | null | undefined,
  sectionId: SiteSectionId
): boolean {
  return getUserSectionPermission(user, sectionId) === 'edit';
}

export interface TrainingModule {
  id: string;
  name: string;
  count?: number;
  loc: string;
  description?: string;
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  key: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  options?: string[];
  required: boolean;
  visible?: boolean;
  placeholder?: string;
  target: 'ticket' | 'component';
}

export interface ReturnHistoryItem {
  date: string;
  reason: string;
  by: string;
  name: string;
}

export interface CandidateHR {
  candidateName: string;
  interviewDate: string;
  tcEntryDate: string;
  selfDeclaredTech: string;
  [customKey: string]: any;
}

export interface AssignedModule {
  id: string;
  done: boolean;
  startDate?: string;
  endDate?: string;
}

export interface CandidateOutcome {
  type: string;
  date: string;
  buddy: string;
  opsConfirmed: boolean;
  opsConfirmedDate: string | null;
  report: {
    visits: number;
    nonConformities: number;
    durationDays?: string | number;
  };
}

export interface CandidateTC {
  mentor: string | null;
  interviewDate: string | null;
  docsReceived: boolean;
  initialReview: 'approved' | 'rejected' | null;
  initialReviewNote: string;
  assignedModules: AssignedModule[];
  classStartDate?: string;
  evalAttempts: number;
  evalDecision: 'pass' | 'fail' | null;
  evalProgress: Record<string, any>;
  outcome: CandidateOutcome | null;
}

export interface PipelineTicket {
  id: string;
  zone: ZoneType;
  location: string;
  requiredSkills: string[];
  requestedBy: string;
  requestDate: string;
  status: TicketStatus;
  hrSeen: boolean;
  returnHistory: ReturnHistoryItem[];
  hr: CandidateHR | null;
  tc: CandidateTC | null;
  customFields?: Record<string, any>;
  createdBy?: string;
  updatedAt?: string;
}

export interface ModuleDocItem {
  t: string;
  h: string;
}

export interface ModuleComponentData {
  id?: string;
  ماژول: string;
  جزء: string;
  نوع: string;
  منبع: string;
  توضیح: string;
  موقعیت: string;
  customValues?: Record<string, any>;
}

export interface QuizQuestion {
  id?: string;
  q: string;
  options: string[];
  correct: number;
}

export interface ChecklistItem {
  id?: string;
  step: string;
  ref: string;
  safety: boolean;
}

export interface SimScenario {
  desc: string;
  criteria: string[];
}

export interface SiteSettings {
  id: string;
  passingScorePct: number;
  ticketCustomFields: CustomFieldDefinition[];
  componentCustomFields: CustomFieldDefinition[];
  modules?: TrainingModule[];
  updatedAt?: string;
}
