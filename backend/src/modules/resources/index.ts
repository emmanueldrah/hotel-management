import { Router } from 'express';
import prisma from '../../config/prisma';
import { createCrudRouter, CrudDelegate } from '../../utils/crudFactory';
import * as s from './schemas';

/** Cast helper: Prisma delegates are structurally compatible with CrudDelegate. */
const asDelegate = (d: unknown) => d as CrudDelegate;

/**
 * Standard CRUD resources. Business-heavy resources (reservations, invoices,
 * payments, housekeeping, maintenance, restaurant orders) have dedicated
 * modules instead.
 */
export function buildResourceRouters(): Record<string, Router> {
  return {
    hotels: createCrudRouter({
      resource: 'Hotel',
      permission: 'hotels',
      delegate: asDelegate(prisma.hotel),
      createSchema: s.hotelCreate,
      updateSchema: s.hotelUpdate,
      searchableFields: ['name', 'email', 'phone'],
      filterableFields: ['currency'],
    }),
    branches: createCrudRouter({
      resource: 'Branch',
      permission: 'branches',
      delegate: asDelegate(prisma.branch),
      createSchema: s.branchCreate,
      updateSchema: s.branchUpdate,
      searchableFields: ['name', 'city', 'country'],
      filterableFields: ['hotelId'],
      hotelScoped: true,
      defaultInclude: { hotel: { select: { id: true, name: true } } },
    }),
    'room-types': createCrudRouter({
      resource: 'RoomType',
      permission: 'roomTypes',
      delegate: asDelegate(prisma.roomType),
      createSchema: s.roomTypeCreate,
      updateSchema: s.roomTypeUpdate,
      searchableFields: ['name', 'bedType'],
      filterableFields: ['branchId'],
      branchScoped: true,
    }),
    rooms: createCrudRouter({
      resource: 'Room',
      permission: 'rooms',
      delegate: asDelegate(prisma.room),
      createSchema: s.roomCreate,
      updateSchema: s.roomUpdate,
      searchableFields: ['number', 'floor'],
      filterableFields: ['branchId', 'status', 'roomTypeId'],
      branchScoped: true,
      defaultInclude: { roomType: { select: { id: true, name: true } } },
      defaultOrderBy: { number: 'asc' },
    }),
    guests: createCrudRouter({
      resource: 'Guest',
      permission: 'guests',
      delegate: asDelegate(prisma.guest),
      createSchema: s.guestCreate,
      updateSchema: s.guestUpdate,
      searchableFields: ['firstName', 'lastName', 'email', 'phone', 'passportNumber'],
      filterableFields: ['hotelId', 'loyaltyTier'],
      hotelScoped: true,
    }),
    suppliers: createCrudRouter({
      resource: 'Supplier',
      permission: 'suppliers',
      delegate: asDelegate(prisma.supplier),
      createSchema: s.supplierCreate,
      updateSchema: s.supplierUpdate,
      searchableFields: ['name', 'contactName', 'email'],
      filterableFields: ['branchId'],
      branchScoped: true,
    }),
    inventory: createCrudRouter({
      resource: 'InventoryItem',
      permission: 'inventory',
      delegate: asDelegate(prisma.inventoryItem),
      createSchema: s.inventoryCreate,
      updateSchema: s.inventoryUpdate,
      searchableFields: ['name', 'sku', 'category'],
      filterableFields: ['branchId', 'category', 'supplierId'],
      branchScoped: true,
    }),
    'menu-items': createCrudRouter({
      resource: 'MenuItem',
      permission: 'restaurant',
      delegate: asDelegate(prisma.menuItem),
      createSchema: s.menuItemCreate,
      updateSchema: s.menuItemUpdate,
      searchableFields: ['name', 'category'],
      filterableFields: ['branchId', 'category'],
      branchScoped: true,
    }),
    'restaurant-tables': createCrudRouter({
      resource: 'RestaurantTable',
      permission: 'restaurant',
      delegate: asDelegate(prisma.restaurantTable),
      createSchema: s.tableCreate,
      updateSchema: s.tableUpdate,
      searchableFields: ['name'],
      filterableFields: ['branchId'],
      branchScoped: true,
    }),
    events: createCrudRouter({
      resource: 'Event',
      permission: 'events',
      delegate: asDelegate(prisma.event),
      createSchema: s.eventCreate,
      updateSchema: s.eventUpdate,
      searchableFields: ['name', 'venue', 'packageName'],
      filterableFields: ['branchId', 'status'],
      branchScoped: true,
    }),
    staff: createCrudRouter({
      resource: 'Employee',
      permission: 'staff',
      delegate: asDelegate(prisma.employee),
      createSchema: s.employeeCreate,
      updateSchema: s.employeeUpdate,
      searchableFields: ['firstName', 'lastName', 'employeeNo', 'department', 'position'],
      filterableFields: ['branchId', 'department'],
      branchScoped: true,
    }),
  };
}
