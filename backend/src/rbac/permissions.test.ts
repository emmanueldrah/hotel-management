import { roleHasPermission } from './permissions';

describe('RBAC permissions', () => {
  it('grants everything to super admin', () => {
    expect(roleHasPermission('SUPER_ADMIN', 'rooms:write')).toBe(true);
    expect(roleHasPermission('SUPER_ADMIN', 'audit:read')).toBe(true);
  });

  it('lets receptionists manage reservations but not rooms', () => {
    expect(roleHasPermission('RECEPTIONIST', 'reservations:write')).toBe(true);
    expect(roleHasPermission('RECEPTIONIST', 'checkin:write')).toBe(true);
    expect(roleHasPermission('RECEPTIONIST', 'rooms:write')).toBe(false);
  });

  it('limits housekeeping to housekeeping/maintenance', () => {
    expect(roleHasPermission('HOUSEKEEPING', 'housekeeping:write')).toBe(true);
    expect(roleHasPermission('HOUSEKEEPING', 'invoices:write')).toBe(false);
  });

  it('limits accountants to finance', () => {
    expect(roleHasPermission('ACCOUNTANT', 'payments:write')).toBe(true);
    expect(roleHasPermission('ACCOUNTANT', 'rooms:write')).toBe(false);
  });
});
