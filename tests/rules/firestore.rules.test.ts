import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, runTransaction } from 'firebase/firestore';

let env: RulesTestEnvironment;

const PERMS_NONE = {};
const ticket = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  zone: 'hub',
  location: 'Tehran',
  requestedBy: 'ops lead',
  status: 'requested',
  ...extra,
});

const as = (uid: string, email = `${uid}@example.com`) =>
  env.authenticatedContext(uid, { email, email_verified: true }).firestore();

async function seedUser(uid: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      userId: uid,
      email: `${uid}@example.com`,
      displayName: uid,
      role: 'trainer',
      status: 'active',
      ...data,
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tc',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('bootstrap & self sign-up', () => {
  const profile = (uid: string, role: string, status: string) => ({
    userId: uid,
    email: `${uid}@example.com`,
    displayName: uid,
    role,
    status,
  });

  it('lets the first user become admin atomically with the bootstrap marker', async () => {
    const db = as('first');
    await assertSucceeds(
      runTransaction(db, async tx => {
        tx.set(doc(db, 'config', 'bootstrap'), { adminUid: 'first' });
        tx.set(doc(db, 'users', 'first'), { ...profile('first', 'admin', 'active'), sectionPermissions: {} });
      })
    );
  });

  it('refuses a second bootstrap', async () => {
    await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'config', 'bootstrap'), { adminUid: 'first' }));
    const db = as('second');
    await assertFails(setDoc(doc(db, 'users', 'second'), profile('second', 'admin', 'active')));
  });

  it('refuses self-made admin without the marker', async () => {
    await assertFails(setDoc(doc(as('x'), 'users', 'x'), profile('x', 'admin', 'active')));
  });

  it('allows self sign-up only as pending trainer without permissions', async () => {
    await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'config', 'bootstrap'), { adminUid: 'first' }));
    const db = as('p');
    await assertFails(setDoc(doc(db, 'users', 'p'), profile('p', 'trainer', 'active')));
    await assertFails(setDoc(doc(db, 'users', 'p'), { ...profile('p', 'trainer', 'pending'), sectionPermissions: { hr: 'edit' } }));
    await assertSucceeds(setDoc(doc(db, 'users', 'p'), profile('p', 'trainer', 'pending')));
  });
});

describe('user profiles', () => {
  beforeEach(async () => {
    await seedUser('admin', { role: 'admin' });
    await seedUser('t1', { sectionPermissions: { tc: 'view' } });
    await seedUser('t2', { sectionPermissions: { tc: 'view' } });
  });

  it('prevents users from escalating their own role or permissions', async () => {
    const db = as('t1');
    await assertFails(updateDoc(doc(db, 'users', 't1'), { role: 'admin' }));
    await assertFails(updateDoc(doc(db, 'users', 't1'), { sectionPermissions: { tc: 'edit' } }));
    await assertSucceeds(updateDoc(doc(db, 'users', 't1'), { displayName: 'New name' }));
    await seedUser('p1', { status: 'pending' });
    await assertFails(updateDoc(doc(as('p1'), 'users', 'p1'), { status: 'active' }));
  });

  it('hides other profiles from non-admins', async () => {
    await assertFails(getDoc(doc(as('t1'), 'users', 't2')));
    await assertFails(getDocs(collection(as('t1'), 'users')));
    await assertSucceeds(getDocs(collection(as('admin'), 'users')));
  });

  it('lets admins change roles but not delete themselves', async () => {
    const db = as('admin');
    await assertSucceeds(updateDoc(doc(db, 'users', 't1'), { role: 'hr', sectionPermissions: { hr: 'edit' } }));
    await assertFails(updateDoc(doc(db, 'users', 't1'), { sectionPermissions: { hr: 'owner' } }));
    await assertFails(deleteDoc(doc(db, 'users', 'admin')));
    await assertSucceeds(deleteDoc(doc(db, 'users', 't2')));
  });

  it('ignores the role of suspended admins', async () => {
    await seedUser('ex', { role: 'admin', status: 'suspended' });
    await assertFails(getDocs(collection(as('ex'), 'users')));
  });
});

describe('tickets', () => {
  beforeEach(async () => {
    await seedUser('viewer', { sectionPermissions: { dashboard: 'view', tc: 'view' } });
    await seedUser('ops', { sectionPermissions: { request: 'edit' } });
    await seedUser('tc', { sectionPermissions: { tc: 'edit' } });
    await seedUser('nobody', { sectionPermissions: PERMS_NONE });
    await seedUser('pending', { status: 'pending', sectionPermissions: { dashboard: 'edit' } });
    await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'tickets', 't1'), ticket('t1')));
  });

  it('requires a view grant to read', async () => {
    await assertSucceeds(getDoc(doc(as('viewer'), 'tickets', 't1')));
    await assertFails(getDoc(doc(as('nobody'), 'tickets', 't1')));
    await assertFails(getDoc(doc(as('pending'), 'tickets', 't1')));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'tickets', 't1')));
  });

  it('requires request:edit to create', async () => {
    await assertSucceeds(setDoc(doc(as('ops'), 'tickets', 't2'), ticket('t2')));
    await assertFails(setDoc(doc(as('viewer'), 'tickets', 't3'), ticket('t3')));
    await assertFails(setDoc(doc(as('ops'), 'tickets', 't4'), ticket('t4', { zone: 'mars' })));
  });

  it('requires a stage edit grant to update', async () => {
    await assertSucceeds(updateDoc(doc(as('tc'), 'tickets', 't1'), { status: 'training' }));
    await assertFails(updateDoc(doc(as('viewer'), 'tickets', 't1'), { status: 'training' }));
    await assertFails(updateDoc(doc(as('tc'), 'tickets', 't1'), { status: 'hacked' }));
  });

  it('only lets admins delete', async () => {
    await assertFails(deleteDoc(doc(as('ops'), 'tickets', 't1')));
  });
});

describe('content & settings', () => {
  beforeEach(async () => {
    await seedUser('admin', { role: 'admin' });
    await seedUser('t1', { sectionPermissions: { docs: 'view', overview: 'view' } });
    await seedUser('planner', { sectionPermissions: { overview: 'edit' } });
  });

  it('is readable by active users and writable only with admin-section edit', async () => {
    await assertSucceeds(getDoc(doc(as('t1'), 'content', 'components')));
    await assertFails(setDoc(doc(as('t1'), 'content', 'components'), { items: [] }));
    await assertFails(setDoc(doc(as('t1'), 'siteSettings', 'global'), { passingScorePct: 0 }));
    await assertSucceeds(setDoc(doc(as('admin'), 'content', 'components'), { items: [] }));
    await assertFails(setDoc(doc(as('admin'), 'content', 'other'), { items: [] }));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'content', 'components')));
  });

  it('lets overview editors change zone configs', async () => {
    await assertSucceeds(setDoc(doc(as('planner'), 'zoneConfigs', 'hub'), { mods: ['M1'], dur: '2d' }));
    await assertFails(setDoc(doc(as('t1'), 'zoneConfigs', 'hub'), { mods: ['M1'], dur: '2d' }));
    await assertFails(setDoc(doc(as('planner'), 'zoneConfigs', 'moon'), { mods: [], dur: '' }));
  });
});

describe('evaluations', () => {
  beforeEach(async () => {
    await seedUser('trainer', { sectionPermissions: { eval: 'edit' } });
    await seedUser('viewer', { sectionPermissions: { eval: 'view' } });
  });

  const ev = (id: string, by: string) => ({ id, stage: 'c2', pass: true, createdBy: by });

  it('is append-only for eval editors', async () => {
    const db = as('trainer');
    await assertSucceeds(setDoc(doc(db, 'evaluations', 'e1'), ev('e1', 'trainer')));
    await assertFails(setDoc(doc(db, 'evaluations', 'e1'), ev('e1', 'trainer')));
    await assertFails(setDoc(doc(db, 'evaluations', 'e2'), ev('e2', 'someone-else')));
    await assertFails(setDoc(doc(as('viewer'), 'evaluations', 'e3'), ev('e3', 'viewer')));
    await assertSucceeds(getDoc(doc(as('viewer'), 'evaluations', 'e1')));
  });
});
