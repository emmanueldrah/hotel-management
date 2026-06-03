import type { RoleName } from '@/types';

export type Permission =
  | 'rooms'
  | 'roomTypes'
  | 'reservations'
  | 'guests'
  | 'invoices'
  | 'payments'
  | 'housekeeping'
  | 'maintenance'
  | 'inventory'
  | 'suppliers'
  | 'staff'
  | 'restaurant'
  | 'events'
  | 'loyalty'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings'
  | 'hotels'
  | 'branches';

const ROLE_PERMS: Record<RoleName, Permission[] | '*'> = {
  SUPER_ADMIN: '*',
  HOTEL_OWNER: [
    'hotels', 'branches', 'rooms', 'roomTypes', 'reservations', 'guests', 'invoices',
    'payments', 'housekeeping', 'maintenance', 'inventory', 'suppliers', 'staff',
    'restaurant', 'events', 'loyalty', 'reports', 'users', 'audit', 'settings',
  ],
  RECEPTIONIST: [
    'rooms', 'reservations', 'guests', 'invoices', 'payments', 'housekeeping', 'reports',
  ],
  HOUSEKEEPING: ['rooms', 'housekeeping', 'maintenance'],
  RESTAURANT_MANAGER: ['restaurant', 'inventory', 'invoices', 'reports'],
  ACCOUNTANT: ['invoices', 'payments', 'reports', 'reservations'],
  MAINTENANCE: ['rooms', 'maintenance'],
};

export function can(role: RoleName | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMS[role];
  return perms === '*' || perms.includes(permission);
}
