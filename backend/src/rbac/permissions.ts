import { RoleName } from '@prisma/client';

/**
 * Static role -> permission map. Permissions use `resource:action` keys, plus
 * the wildcard `*` which grants everything (Super Admin). These mirror the
 * `Permission` / `RolePermission` tables and are the source of truth used by
 * the `authorize` middleware so checks stay fast and side-effect free.
 */
export const ALL_PERMISSIONS = [
  'hotels:read', 'hotels:write',
  'branches:read', 'branches:write',
  'rooms:read', 'rooms:write',
  'roomTypes:read', 'roomTypes:write',
  'reservations:read', 'reservations:write',
  'checkin:write', 'checkout:write',
  'guests:read', 'guests:write',
  'invoices:read', 'invoices:write',
  'payments:read', 'payments:write',
  'housekeeping:read', 'housekeeping:write',
  'maintenance:read', 'maintenance:write',
  'inventory:read', 'inventory:write',
  'suppliers:read', 'suppliers:write',
  'staff:read', 'staff:write',
  'restaurant:read', 'restaurant:write',
  'events:read', 'events:write',
  'loyalty:read', 'loyalty:write',
  'reports:read',
  'notifications:read', 'notifications:write',
  'audit:read',
  'settings:read', 'settings:write',
  'users:read', 'users:write',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number] | '*';

const owner: Permission[] = [
  'hotels:read', 'hotels:write',
  'branches:read', 'branches:write',
  'rooms:read', 'rooms:write',
  'roomTypes:read', 'roomTypes:write',
  'reservations:read', 'reservations:write',
  'checkin:write', 'checkout:write',
  'guests:read', 'guests:write',
  'invoices:read', 'invoices:write',
  'payments:read', 'payments:write',
  'housekeeping:read', 'housekeeping:write',
  'maintenance:read', 'maintenance:write',
  'inventory:read', 'inventory:write',
  'suppliers:read', 'suppliers:write',
  'staff:read', 'staff:write',
  'restaurant:read', 'restaurant:write',
  'events:read', 'events:write',
  'loyalty:read', 'loyalty:write',
  'reports:read',
  'notifications:read', 'notifications:write',
  'audit:read',
  'settings:read', 'settings:write',
  'users:read', 'users:write',
];

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  SUPER_ADMIN: ['*'],
  HOTEL_OWNER: owner,
  RECEPTIONIST: [
    'rooms:read', 'roomTypes:read',
    'reservations:read', 'reservations:write',
    'checkin:write', 'checkout:write',
    'guests:read', 'guests:write',
    'invoices:read', 'invoices:write',
    'payments:read', 'payments:write',
    'housekeeping:read',
    'reports:read',
    'notifications:read',
  ],
  HOUSEKEEPING: [
    'rooms:read',
    'housekeeping:read', 'housekeeping:write',
    'maintenance:read', 'maintenance:write',
    'notifications:read',
  ],
  RESTAURANT_MANAGER: [
    'restaurant:read', 'restaurant:write',
    'inventory:read', 'inventory:write',
    'invoices:read',
    'reports:read',
    'notifications:read',
  ],
  ACCOUNTANT: [
    'invoices:read', 'invoices:write',
    'payments:read', 'payments:write',
    'reports:read',
    'reservations:read',
    'notifications:read',
  ],
  MAINTENANCE: [
    'rooms:read',
    'maintenance:read', 'maintenance:write',
    'notifications:read',
  ],
};

export function roleHasPermission(role: RoleName, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission);
}
