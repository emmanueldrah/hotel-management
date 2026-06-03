import { describe, expect, it } from 'vitest';
import { can } from './permissions';

describe('frontend permissions', () => {
  it('super admin can access everything', () => {
    expect(can('SUPER_ADMIN', 'users')).toBe(true);
    expect(can('SUPER_ADMIN', 'settings')).toBe(true);
  });

  it('receptionist can manage reservations but not maintenance', () => {
    expect(can('RECEPTIONIST', 'reservations')).toBe(true);
    expect(can('RECEPTIONIST', 'maintenance')).toBe(false);
  });

  it('returns false when role is undefined', () => {
    expect(can(undefined, 'rooms')).toBe(false);
  });
});
