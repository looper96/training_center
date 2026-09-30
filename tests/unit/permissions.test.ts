import { describe, expect, it } from 'vitest';
import {
  buildDefaultPermissions,
  canUserEditSection,
  canUserViewSection,
  getUserSectionPermission,
  type SystemUser,
} from '../../src/types/pipeline';
import { formatDate } from '../../src/lib/date';

const user = (over: Partial<SystemUser> = {}): SystemUser => ({
  userId: 'u1',
  email: 'u1@example.com',
  displayName: 'U1',
  role: 'trainer',
  status: 'active',
  sectionPermissions: buildDefaultPermissions('trainer'),
  ...over,
});

describe('section permissions', () => {
  it('gives non-admin roles view-only access to their default sections', () => {
    const perms = buildDefaultPermissions('trainer');
    expect(perms.tc).toBe('view');
    expect(perms.hr).toBe('none');
    expect(Object.values(perms)).not.toContain('edit');
  });

  it('gives admins edit everywhere', () => {
    expect(Object.values(buildDefaultPermissions('admin')).every(p => p === 'edit')).toBe(true);
    expect(getUserSectionPermission(user({ role: 'admin', sectionPermissions: {} }), 'hr')).toBe('edit');
  });

  it('treats a missing key as none (same as firestore.rules)', () => {
    expect(getUserSectionPermission(user({ sectionPermissions: {} }), 'tc')).toBe('none');
    expect(getUserSectionPermission(user({ sectionPermissions: undefined }), 'tc')).toBe('none');
  });

  it('honours explicit edit grants', () => {
    const u = user({ sectionPermissions: { tc: 'edit' } });
    expect(canUserEditSection(u, 'tc')).toBe(true);
    expect(canUserViewSection(u, 'hr')).toBe(false);
  });

  it('denies everything to pending or suspended users, admins included', () => {
    expect(canUserViewSection(user({ status: 'pending' }), 'tc')).toBe(false);
    expect(canUserViewSection(user({ status: 'suspended', role: 'admin' }), 'dashboard')).toBe(false);
    expect(canUserViewSection(null, 'dashboard')).toBe(false);
  });
});

describe('formatDate', () => {
  it('formats ISO dates and passes legacy strings through', () => {
    expect(formatDate('2025-09-01T10:00:00.000Z')).toMatch(/[۰-۹]/);
    expect(formatDate('1404/06/01')).toBe('1404/06/01');
    expect(formatDate(null)).toBe('—');
  });
});
