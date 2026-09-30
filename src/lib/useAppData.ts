import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from './firebase';
import { nowISO } from './date';
import { showToast } from '../components/Toast';
import { MODULE_COMPONENTS } from '../data/pipelineDocs';
import { QUIZ } from '../data/pipelineEval';
import { INITIAL_SITE_SETTINGS, MODS, TICKETS_SEED, ZONES_INIT } from '../data/pipelineSeed';
import {
  canUserViewSection,
  type ModuleComponentData,
  type PipelineTicket,
  type QuizQuestion,
  type SiteSectionId,
  type SiteSettings,
  type SystemUser,
  type TrainingModule,
  type ZoneType,
} from '../types/pipeline';

export type ZoneConfigs = Record<ZoneType, { mods: string[]; dur: string }>;
export type QuizBank = Record<ZoneType, QuizQuestion[]>;

/** Sections whose views read the `tickets` collection (mirrors `canReadTickets()` in firestore.rules). */
const TICKET_SECTIONS: SiteSectionId[] = ['dashboard', 'request', 'hr', 'tc', 'handover', 'eval'];

// Admin-managed content lives in single documents under `content/`.
// Until an admin saves a change, the bundled defaults are shown.
const CONTENT = {
  modules: () => doc(db, 'content', 'modules'),
  components: () => doc(db, 'content', 'components'),
  quizzes: () => doc(db, 'content', 'quizzes'),
};

export function reportError(err: unknown, action: string) {
  const code = (err as FirestoreError)?.code;
  console.error(`[firestore] ${action}`, err);
  showToast(
    code === 'permission-denied'
      ? `شما مجوز ${action} را ندارید.`
      : `خطا در ${action}. لطفاً اتصال اینترنت را بررسی کنید.`,
    'error'
  );
}

async function write(action: string, fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return true;
  } catch (err) {
    reportError(err, action);
    return false;
  }
}

/**
 * Subscribes to every Firestore collection the given profile is allowed to read and
 * exposes write helpers. Firestore's offline cache provides latency compensation,
 * so state is always derived from snapshots (no parallel local copies to drift).
 */
export function useAppData(profile: SystemUser | null) {
  const [tickets, setTickets] = useState<PipelineTicket[]>([]);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(INITIAL_SITE_SETTINGS);
  const [zoneConfigs, setZoneConfigs] = useState<ZoneConfigs>(ZONES_INIT);
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>(MODS);
  const [moduleComponents, setModuleComponents] = useState<ModuleComponentData[]>(MODULE_COMPONENTS);
  const [quizzes, setQuizzes] = useState<QuizBank>(QUIZ);

  const isActive = profile?.status === 'active';
  const isAdmin = isActive && profile?.role === 'admin';
  const canReadTickets = TICKET_SECTIONS.some(s => canUserViewSection(profile, s));

  // Tickets
  useEffect(() => {
    if (!canReadTickets) {
      setTickets([]);
      return;
    }
    return onSnapshot(
      collection(db, 'tickets'),
      snap => {
        const list = snap.docs.map(d => d.data() as PipelineTicket);
        list.sort((a, b) => (b.id > a.id ? 1 : -1));
        setTickets(list);
        setTicketsLoaded(true);
      },
      err => reportError(err, 'دریافت تیکت‌ها')
    );
  }, [canReadTickets]);

  // Users (admin only)
  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      return;
    }
    return onSnapshot(
      collection(db, 'users'),
      snap => setUsers(snap.docs.map(d => d.data() as SystemUser)),
      err => reportError(err, 'دریافت کاربران')
    );
  }, [isAdmin]);

  // Settings, zone configs and content (any active user)
  useEffect(() => {
    if (!isActive) return;
    const unsubs = [
      onSnapshot(doc(db, 'siteSettings', 'global'), s => {
        setSiteSettings(s.exists() ? ({ ...INITIAL_SITE_SETTINGS, ...s.data() } as SiteSettings) : INITIAL_SITE_SETTINGS);
      }, err => reportError(err, 'دریافت تنظیمات')),
      onSnapshot(collection(db, 'zoneConfigs'), snap => {
        const next = { ...ZONES_INIT };
        snap.docs.forEach(d => {
          const data = d.data();
          if (d.id in next) next[d.id as ZoneType] = { mods: data.mods ?? [], dur: data.dur ?? '' };
        });
        setZoneConfigs(next);
      }, err => reportError(err, 'دریافت پیکربندی زون‌ها')),
      onSnapshot(CONTENT.modules(), s => setTrainingModules(s.exists() ? s.data().items : MODS),
        err => reportError(err, 'دریافت ماژول‌ها')),
      onSnapshot(CONTENT.components(), s => setModuleComponents(s.exists() ? s.data().items : MODULE_COMPONENTS),
        err => reportError(err, 'دریافت اجزای ماژول‌ها')),
      onSnapshot(CONTENT.quizzes(), s => setQuizzes(s.exists() ? { ...QUIZ, ...s.data().byZone } : QUIZ),
        err => reportError(err, 'دریافت بانک سؤالات')),
    ];
    return () => unsubs.forEach(u => u());
  }, [isActive]);

  // ---------- Tickets ----------
  const saveTicket = (t: PipelineTicket) =>
    write('ذخیره تیکت', () => setDoc(doc(db, 'tickets', t.id), { ...t, updatedAt: nowISO() }));

  const addTicket = (t: PipelineTicket) =>
    write('ثبت درخواست', () =>
      setDoc(doc(db, 'tickets', t.id), { ...t, createdBy: profile?.userId, updatedAt: nowISO() })
    );

  const addEvaluation = (id: string, data: Record<string, unknown>) =>
    write('ثبت ارزیابی', () =>
      setDoc(doc(db, 'evaluations', id), { ...data, id, createdBy: profile?.userId, createdAt: nowISO() })
    );

  // ---------- Users ----------
  const saveUser = (u: SystemUser) =>
    write('ذخیره کاربر', () => setDoc(doc(db, 'users', u.userId), { ...u, updatedAt: nowISO() }));

  const deleteUser = (userId: string) => write('حذف کاربر', () => deleteDoc(doc(db, 'users', userId)));

  // ---------- Settings & content ----------
  const saveSettings = (s: SiteSettings) =>
    write('ذخیره تنظیمات', () => setDoc(doc(db, 'siteSettings', 'global'), { ...s, updatedAt: nowISO() }));

  const saveZoneConfig = (z: ZoneType, mods: string[], dur: string) =>
    write('ذخیره پیکربندی زون', () =>
      setDoc(doc(db, 'zoneConfigs', z), { zone: z, mods, dur, updatedAt: nowISO() })
    );

  const saveModules = (items: TrainingModule[]) =>
    write('ذخیره ماژول‌ها', () => setDoc(CONTENT.modules(), { items, updatedAt: nowISO() }));

  const saveComponents = (items: ModuleComponentData[]) =>
    write('ذخیره اجزای ماژول', () => setDoc(CONTENT.components(), { items, updatedAt: nowISO() }));

  const saveQuizzes = (byZone: QuizBank) =>
    write('ذخیره بانک سؤالات', () => setDoc(CONTENT.quizzes(), { byZone, updatedAt: nowISO() }));

  /** Writes a backup (or the bundled defaults) back to Firestore. Users are never imported. */
  const restore = (data: {
    tickets?: PipelineTicket[];
    siteSettings?: SiteSettings;
    zoneConfigs?: ZoneConfigs;
    trainingModules?: TrainingModule[];
    moduleComponents?: ModuleComponentData[];
    quizzes?: QuizBank;
  }) =>
    write('بازیابی داده‌ها', async () => {
      const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [];
      const ts = nowISO();
      data.tickets?.forEach(t => ops.push(b => b.set(doc(db, 'tickets', t.id), { ...t, updatedAt: ts })));
      if (data.siteSettings) ops.push(b => b.set(doc(db, 'siteSettings', 'global'), { ...data.siteSettings, updatedAt: ts }));
      if (data.zoneConfigs)
        (Object.keys(data.zoneConfigs) as ZoneType[]).forEach(z =>
          ops.push(b => b.set(doc(db, 'zoneConfigs', z), { zone: z, ...data.zoneConfigs![z], updatedAt: ts }))
        );
      if (data.trainingModules) ops.push(b => b.set(CONTENT.modules(), { items: data.trainingModules, updatedAt: ts }));
      if (data.moduleComponents) ops.push(b => b.set(CONTENT.components(), { items: data.moduleComponents, updatedAt: ts }));
      if (data.quizzes) ops.push(b => b.set(CONTENT.quizzes(), { byZone: data.quizzes, updatedAt: ts }));

      // Firestore batches are limited to 500 writes.
      for (let i = 0; i < ops.length; i += 450) {
        const batch = writeBatch(db);
        ops.slice(i, i + 450).forEach(op => op(batch));
        await batch.commit();
      }
    });

  const loadDefaults = (includeDemoTickets: boolean) =>
    restore({
      tickets: includeDemoTickets ? TICKETS_SEED : undefined,
      siteSettings: INITIAL_SITE_SETTINGS,
      zoneConfigs: ZONES_INIT,
      trainingModules: MODS,
      moduleComponents: MODULE_COMPONENTS,
      quizzes: QUIZ,
    });

  return {
    tickets,
    ticketsLoaded,
    users,
    siteSettings,
    zoneConfigs,
    trainingModules,
    moduleComponents,
    quizzes,
    saveTicket,
    addTicket,
    addEvaluation,
    saveUser,
    deleteUser,
    saveSettings,
    saveZoneConfig,
    saveModules,
    saveComponents,
    saveQuizzes,
    restore,
    loadDefaults,
  };
}
