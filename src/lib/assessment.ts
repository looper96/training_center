import {
  CHECKLIST,
  DEFAULT_POSITIONS,
  INTERVIEW_BY_MODULE,
  INTERVIEW_GENERAL,
  SIM_BY_MODULE,
  SIM_GENERAL,
} from '../data/pipelineEval';
import type {
  ChecklistItem,
  JobPosition,
  PipelineTicket,
  QuizBank,
  QuizQuestion,
  SimCriterion,
  SiteSettings,
  ZoneConfigs,
  ZoneType,
} from '../types/pipeline';

/**
 * Module-based evaluation: every stage (C2–C5) is built only from the modules the
 * candidate is trained on, and each result is broken down per module so weak
 * modules can be sent back to training.
 */

/** A module scoring below this in the C2 exam fails the exam even if the total passes. */
export const MODULE_MIN_PCT = 50;

export interface ModuleScore {
  correct: number;
  total: number;
  pct: number;
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export const sortModules = (ids: string[]) =>
  [...new Set(ids)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

// ---------------------------------------------------------------------------
// Positions & modules
// ---------------------------------------------------------------------------
export const positionsOf = (settings?: Pick<SiteSettings, 'positions'>): JobPosition[] =>
  settings?.positions?.length ? settings.positions : DEFAULT_POSITIONS;

export const positionLabel = (positions: JobPosition[], id?: string) =>
  positions.find(p => p.id === id)?.label ?? 'تعیین‌نشده';

/** Training modules a new hire needs: the position's modules within the zone (all zone modules for a general position). */
export function defaultModulesFor(
  zone: ZoneType,
  positionId: string | undefined,
  zoneConfigs: ZoneConfigs,
  positions: JobPosition[]
): string[] {
  const zoneMods = zoneConfigs[zone]?.mods ?? [];
  const pos = positions.find(p => p.id === positionId);
  if (!pos || pos.mods.length === 0) return sortModules(zoneMods);
  const inZone = pos.mods.filter(m => zoneMods.includes(m));
  return sortModules(inZone.length ? inZone : pos.mods);
}

/** Modules a candidate is evaluated on: the modules assigned in TC, else the position defaults. */
export function evaluationModules(
  ticket: PipelineTicket,
  zoneConfigs: ZoneConfigs,
  positions: JobPosition[]
): string[] {
  const assigned = ticket.tc?.assignedModules?.map(m => m.id) ?? [];
  return assigned.length ? sortModules(assigned) : defaultModulesFor(ticket.zone, ticket.position, zoneConfigs, positions);
}

// ---------------------------------------------------------------------------
// C2 — theory exam
// ---------------------------------------------------------------------------
export interface ExamQuestion extends QuizQuestion {
  moduleId: string;
  /** Stable id within the bank: `${moduleId}:${index}`. */
  key: string;
}

/**
 * Builds the exam from the given modules. With `perModule` > 0 a random sample of that
 * many questions is drawn from each module (kept in bank order); 0 uses every question.
 */
export function buildExam(
  modules: string[],
  bank: QuizBank,
  perModule: number,
  random: () => number = Math.random
): ExamQuestion[] {
  return modules.flatMap(moduleId => {
    const all = (bank[moduleId] ?? []).map((q, i) => ({ ...q, moduleId, key: `${moduleId}:${i}` }));
    if (perModule <= 0 || all.length <= perModule) return all;
    const idx = all.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx.slice(0, perModule).sort((a, b) => a - b).map(i => all[i]);
  });
}

export interface ExamResult {
  score: number;
  correct: number;
  total: number;
  pass: boolean;
  byModule: Record<string, ModuleScore>;
  weakModules: string[];
}

export function gradeExam(questions: ExamQuestion[], answers: Record<string, number>, passingPct: number): ExamResult {
  const byModule: Record<string, ModuleScore> = {};
  let correct = 0;
  for (const q of questions) {
    const m = (byModule[q.moduleId] ??= { correct: 0, total: 0, pct: 0 });
    m.total++;
    if (answers[q.key] === q.correct) {
      m.correct++;
      correct++;
    }
  }
  for (const m of Object.values(byModule)) m.pct = pct(m.correct, m.total);
  const score = pct(correct, questions.length);
  const weakModules = sortModules(Object.keys(byModule).filter(id => byModule[id].pct < passingPct));
  const pass =
    questions.length > 0 &&
    score >= passingPct &&
    Object.values(byModule).every(m => m.pct >= MODULE_MIN_PCT);
  return { score, correct, total: questions.length, pass, byModule, weakModules };
}

// ---------------------------------------------------------------------------
// C3 — practical checklist
// ---------------------------------------------------------------------------
export interface ChecklistEntry extends ChecklistItem {
  moduleId: string;
  key: string;
}

export const buildChecklist = (modules: string[], bank: Record<string, ChecklistItem[]> = CHECKLIST): ChecklistEntry[] =>
  modules.flatMap(moduleId => (bank[moduleId] ?? []).map((it, i) => ({ ...it, moduleId, key: `${moduleId}:${i}` })));

export interface ChecklistResult {
  score: number;
  pass: boolean;
  reason: string;
  byModule: Record<string, ModuleScore>;
  weakModules: string[];
}

/** Scores are 0 (needs practice), 1 (on track) or 2 (strong); unscored items count as 1. */
export function gradeChecklist(items: ChecklistEntry[], scores: Record<string, number>): ChecklistResult {
  const byModule: Record<string, ModuleScore> = {};
  const weak = new Set<string>();
  let sum = 0;
  let safetyFail = false;
  let nonSafetyWeak = 0;
  for (const it of items) {
    const s = scores[it.key] ?? 1;
    sum += s;
    const m = (byModule[it.moduleId] ??= { correct: 0, total: 0, pct: 0 });
    m.correct += s;
    m.total += 2;
    if (s === 0) {
      weak.add(it.moduleId);
      if (it.safety) safetyFail = true;
      else nonSafetyWeak++;
    }
  }
  for (const m of Object.values(byModule)) m.pct = pct(m.correct, m.total);
  let reason = '';
  if (items.length === 0) reason = 'برای ماژول‌های این نیرو مورد چک‌لیستی تعریف نشده است.';
  else if (safetyFail) reason = 'حداقل یک مورد ایمنی‌محور «نیاز به تمرین» دارد — مردودی مستقل از میانگین نمره.';
  else if (nonSafetyWeak > 1) reason = `${nonSafetyWeak} مورد غیرایمنی «نیاز به تمرین» وجود دارد (حداکثر ۱ مورد مجاز است).`;
  return {
    score: pct(sum, items.length * 2),
    pass: items.length > 0 && !safetyFail && nonSafetyWeak <= 1,
    reason,
    byModule,
    weakModules: sortModules([...weak]),
  };
}

// ---------------------------------------------------------------------------
// C4 — competency interview
// ---------------------------------------------------------------------------
export interface InterviewQuestion {
  key: string;
  text: string;
  moduleId?: string;
}

export const buildInterview = (modules: string[]): InterviewQuestion[] => [
  ...INTERVIEW_GENERAL.map((text, i) => ({ key: `g:${i}`, text })),
  ...modules.flatMap(moduleId =>
    (INTERVIEW_BY_MODULE[moduleId] ?? []).map((text, i) => ({ key: `${moduleId}:${i}`, text, moduleId }))
  ),
];

/** Modules whose scenario questions were rated "needs improvement". */
export const interviewWeakModules = (questions: InterviewQuestion[], ratings: Record<string, 'ok' | 'bad'>) =>
  sortModules(questions.filter(q => q.moduleId && ratings[q.key] === 'bad').map(q => q.moduleId!));

// ---------------------------------------------------------------------------
// C5 — peak simulation
// ---------------------------------------------------------------------------
export interface SimEntry extends SimCriterion {
  key: string;
  moduleId?: string;
}

export const buildSimCriteria = (modules: string[]): SimEntry[] => [
  ...SIM_GENERAL.map((c, i) => ({ ...c, key: `g:${i}` })),
  ...modules.flatMap(moduleId => (SIM_BY_MODULE[moduleId] ?? []).map((c, i) => ({ ...c, moduleId, key: `${moduleId}:${i}` }))),
];

export interface SimResult {
  avg: number;
  pass: boolean;
  reason: string;
  weakModules: string[];
}

/** Scores are 1–5 (unscored = 4). Safety criteria need 5/5; the average must be ≥ 4. Module criteria below 4 are flagged. */
export function gradeSim(criteria: SimEntry[], scores: Record<string, number>): SimResult {
  let sum = 0;
  let safetyLow = false;
  const weak = new Set<string>();
  for (const c of criteria) {
    const v = scores[c.key] ?? 4;
    sum += v;
    if (c.safety && v < 5) safetyLow = true;
    if (c.moduleId && (v < 4 || (c.safety && v < 5))) weak.add(c.moduleId);
  }
  const avg = criteria.length ? Number((sum / criteria.length).toFixed(1)) : 0;
  let reason = '';
  if (safetyLow) reason = 'معیار رعایت ایمنی باید امتیاز کامل (۵ از ۵) بگیرد.';
  else if (avg < 4) reason = 'میانگین کل زیر حد نصاب قبولی (۴.۰) است.';
  return { avg, pass: criteria.length > 0 && !safetyLow && avg >= 4, reason, weakModules: sortModules([...weak]) };
}

// ---------------------------------------------------------------------------
// C6 — summary
// ---------------------------------------------------------------------------
/** Union of the weak modules reported by every recorded stage. */
export function collectWeakModules(evalProgress: Record<string, any> | undefined): string[] {
  const ids: string[] = [];
  for (const stage of ['c2', 'c3', 'c4', 'c5']) {
    const w = evalProgress?.[stage]?.weakModules;
    if (Array.isArray(w)) ids.push(...w);
  }
  return sortModules(ids);
}
