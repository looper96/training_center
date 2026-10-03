import { describe, expect, it } from 'vitest';
import {
  buildChecklist,
  buildExam,
  buildInterview,
  buildSimCriteria,
  collectWeakModules,
  defaultModulesFor,
  evaluationModules,
  gradeChecklist,
  gradeExam,
  gradeSim,
  interviewWeakModules,
} from '../../src/lib/assessment';
import { CHECKLIST, DEFAULT_POSITIONS, QUIZ } from '../../src/data/pipelineEval';
import { MODS, ZONES_INIT } from '../../src/data/pipelineSeed';
import type { PipelineTicket, QuizBank } from '../../src/types/pipeline';

const ticket = (over: Partial<PipelineTicket> = {}): PipelineTicket => ({
  id: 't1',
  zone: 'hub',
  location: 'هاب ۳',
  requiredSkills: [],
  requestedBy: 'ops',
  requestDate: '2026-01-01',
  status: 'evaluation',
  hrSeen: true,
  returnHistory: [],
  hr: null,
  tc: null,
  ...over,
});

describe('default modules per position', () => {
  it('uses the position modules that exist in the zone', () => {
    expect(defaultModulesFor('hub', 'packing', ZONES_INIT, DEFAULT_POSITIONS)).toEqual(['M1', 'M3', 'M4']);
    // M7 is not taught in Hub, so a kitchen hire there only gets M1 + M6.
    expect(defaultModulesFor('hub', 'kitchen', ZONES_INIT, DEFAULT_POSITIONS)).toEqual(['M1', 'M6']);
  });

  it('falls back to every zone module for a general or unknown position', () => {
    expect(defaultModulesFor('irancell', 'general', ZONES_INIT, DEFAULT_POSITIONS)).toEqual(['M1', 'M6', 'M8']);
    expect(defaultModulesFor('superhub', undefined, ZONES_INIT, DEFAULT_POSITIONS)).toEqual(ZONES_INIT.superhub.mods);
  });

  it('evaluates on the modules assigned in TC when present', () => {
    const t = ticket({
      position: 'packing',
      tc: {
        mentor: null, interviewDate: null, docsReceived: true, initialReview: 'approved', initialReviewNote: '',
        assignedModules: [{ id: 'M5', done: true }, { id: 'M1', done: true }],
        evalAttempts: 0, evalDecision: null, evalProgress: {}, outcome: null,
      },
    });
    expect(evaluationModules(t, ZONES_INIT, DEFAULT_POSITIONS)).toEqual(['M1', 'M5']);
    expect(evaluationModules(ticket({ position: 'delivery' }), ZONES_INIT, DEFAULT_POSITIONS)).toEqual(['M1', 'M4', 'M5']);
  });
});

describe('C2 exam', () => {
  it('only contains questions from the candidate modules', () => {
    const exam = buildExam(['M1', 'M4'], QUIZ, 0);
    expect(new Set(exam.map(q => q.moduleId))).toEqual(new Set(['M1', 'M4']));
    expect(exam).toHaveLength(QUIZ.M1.length + QUIZ.M4.length);
  });

  it('samples a fixed number of questions per module', () => {
    const exam = buildExam(['M1', 'M7', 'M3'], QUIZ, 5, () => 0.42);
    expect(exam.filter(q => q.moduleId === 'M1')).toHaveLength(5);
    expect(exam.filter(q => q.moduleId === 'M7')).toHaveLength(5);
    expect(new Set(exam.map(q => q.key)).size).toBe(exam.length);
  });

  it('grades per module and fails a module below the minimum', () => {
    const bank: QuizBank = {
      A: Array.from({ length: 8 }, () => ({ q: 'a', options: ['x', 'y'], correct: 0 })),
      B: Array.from({ length: 2 }, () => ({ q: 'b', options: ['x', 'y'], correct: 0 })),
    };
    const exam = buildExam(['A', 'B'], bank, 0);
    const answers: Record<string, number> = {};
    exam.forEach(q => (answers[q.key] = q.moduleId === 'A' ? 0 : 1));
    const res = gradeExam(exam, answers, 80);
    expect(res.score).toBe(80);
    expect(res.byModule.A).toEqual({ correct: 8, total: 8, pct: 100 });
    expect(res.byModule.B.pct).toBe(0);
    expect(res.weakModules).toEqual(['B']);
    expect(res.pass).toBe(false);
  });

  it('every module has questions in the default bank', () => {
    for (const m of MODS) expect(QUIZ[m.id]?.length).toBeGreaterThanOrEqual(5);
  });
});

describe('C3 checklist', () => {
  it('fails on a safety item and reports its module', () => {
    const items = buildChecklist(['M1', 'M2']);
    expect(items).toHaveLength(CHECKLIST.M1.length + CHECKLIST.M2.length);
    const safety = items.find(i => i.moduleId === 'M2' && i.safety)!;
    const res = gradeChecklist(items, { [safety.key]: 0 });
    expect(res.pass).toBe(false);
    expect(res.weakModules).toEqual(['M2']);
    expect(gradeChecklist(items, {}).pass).toBe(true);
  });
});

describe('C4 / C5 / C6', () => {
  it('adds one scenario per module and flags weak modules', () => {
    const qs = buildInterview(['M4', 'M5']);
    const m5 = qs.find(q => q.moduleId === 'M5')!;
    expect(qs.filter(q => q.moduleId).map(q => q.moduleId)).toEqual(['M4', 'M5']);
    expect(interviewWeakModules(qs, { [m5.key]: 'bad', 'g:0': 'bad' })).toEqual(['M5']);
  });

  it('requires 5/5 on safety and flags low module criteria', () => {
    const crit = buildSimCriteria(['M1', 'M4']);
    const safety = crit.find(c => c.safety)!;
    const m4 = crit.find(c => c.moduleId === 'M4')!;
    expect(gradeSim(crit, { [safety.key]: 5 }).pass).toBe(true);
    const res = gradeSim(crit, { [safety.key]: 4, [m4.key]: 2 });
    expect(res.pass).toBe(false);
    expect(res.weakModules).toEqual(['M1', 'M4']);
  });

  it('collects weak modules across stages', () => {
    expect(
      collectWeakModules({ c2: { weakModules: ['M4'] }, c3: { weakModules: ['M1', 'M4'] }, c6: { weakModules: ['M9'] } })
    ).toEqual(['M1', 'M4']);
  });
});
