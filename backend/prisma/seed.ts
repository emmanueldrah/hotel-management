import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from '../src/rbac/permissions';

const prisma = new PrismaClient();

const PASSWORD = 'Password123';

async function main() {
  console.log('Seeding HMS database...');
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ---- Permissions ----
  await Promise.all(
    ALL_PERMISSIONS.map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } }),
    ),
  );
  const permissions = await prisma.permission.findMany();
  const permByKey = new Map(permissions.map((p) => [p.key, p.id]));

  // ---- Roles + RolePermissions ----
  const roleNames = Object.keys(ROLE_PERMISSIONS) as RoleName[];
  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
    const perms = ROLE_PERMISSIONS[name];
    const keys = perms.includes('*') ? ALL_PERMISSIONS : perms;
    for (const key of keys) {
      const permissionId = permByKey.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
  const roles = await prisma.role.findMany();
  const roleByName = new Map(roles.map((r) => [r.name, r.id]));

  // ---- Hotel + Subscription ----
  const hotel = await prisma.hotel.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Grand Horizon Hotels',
      legalName: 'Grand Horizon Hospitality Ltd.',
      email: 'info@grandhorizon.example',
      phone: '+1-555-0100',
      website: 'https://grandhorizon.example',
      taxNumber: 'TAX-001',
      currency: 'USD',
      subscription: { create: { plan: 'PRO', seats: 50 } },
    },
  });

  // ---- Branches ----
  const main = await prisma.branch.upsert({
    where: { hotelId_code: { hotelId: hotel.id, code: 'HQ' } },
    update: {},
    create: {
      hotelId: hotel.id,
      name: 'Grand Horizon Downtown',
      code: 'HQ',
      city: 'New York',
      country: 'USA',
      phone: '+1-555-0101',
      email: 'downtown@grandhorizon.example',
    },
  });
  const resort = await prisma.branch.upsert({
    where: { hotelId_code: { hotelId: hotel.id, code: 'RST' } },
    update: {},
    create: {
      hotelId: hotel.id,
      name: 'Grand Horizon Beach Resort',
      code: 'RST',
      city: 'Miami',
      country: 'USA',
    },
  });

  // ---- Users (one per role) ----
  const users: Array<{ name: string; email: string; role: RoleName; branchId?: string }> = [
    { name: 'Sarah Admin', email: 'superadmin@hms.com', role: 'SUPER_ADMIN' },
    { name: 'Owen Owner', email: 'owner@hms.com', role: 'HOTEL_OWNER', branchId: main.id },
    { name: 'Rita Reception', email: 'receptionist@hms.com', role: 'RECEPTIONIST', branchId: main.id },
    { name: 'Holly Keeper', email: 'housekeeping@hms.com', role: 'HOUSEKEEPING', branchId: main.id },
    { name: 'Remy Chef', email: 'restaurant@hms.com', role: 'RESTAURANT_MANAGER', branchId: main.id },
    { name: 'Aaron Books', email: 'accountant@hms.com', role: 'ACCOUNTANT', branchId: main.id },
    { name: 'Max Fixit', email: 'maintenance@hms.com', role: 'MAINTENANCE', branchId: main.id },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        emailVerified: true,
        roleId: roleByName.get(u.role)!,
        hotelId: hotel.id,
        branchId: u.branchId,
      },
    });
  }

  // ---- Room types + rooms ----
  const typeDefs = [
    { name: 'Standard Room', basePrice: 120, maxOccupancy: 2, bedType: 'Queen' },
    { name: 'Deluxe Room', basePrice: 180, maxOccupancy: 3, bedType: 'King' },
    { name: 'Executive Room', basePrice: 240, maxOccupancy: 3, bedType: 'King' },
    { name: 'Suite', basePrice: 380, maxOccupancy: 4, bedType: 'King + Sofa' },
    { name: 'Presidential Suite', basePrice: 900, maxOccupancy: 5, bedType: '2 King' },
    { name: 'Family Room', basePrice: 260, maxOccupancy: 5, bedType: '2 Queen' },
  ];

  for (const branch of [main, resort]) {
    const createdTypes = [];
    for (const t of typeDefs) {
      const rt = await prisma.roomType.upsert({
        where: { branchId_name: { branchId: branch.id, name: t.name } },
        update: {},
        create: {
          branchId: branch.id,
          name: t.name,
          basePrice: t.basePrice,
          maxOccupancy: t.maxOccupancy,
          bedType: t.bedType,
          amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
        },
      });
      createdTypes.push(rt);
    }

    let roomNo = 100;
    for (const rt of createdTypes) {
      for (let i = 0; i < 4; i++) {
        roomNo += 1;
        await prisma.room.upsert({
          where: { branchId_number: { branchId: branch.id, number: String(roomNo) } },
          update: {},
          create: {
            branchId: branch.id,
            roomTypeId: rt.id,
            number: String(roomNo),
            floor: String(Math.floor(roomNo / 100)),
            capacity: rt.maxOccupancy,
            bedType: rt.bedType,
            pricePerNight: rt.basePrice,
            amenities: rt.amenities,
            status: 'AVAILABLE',
          },
        });
      }
    }
  }

  // ---- Guests ----
  const guestDefs = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', nationality: 'USA', isVip: true },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', nationality: 'UK' },
    { firstName: 'Carlos', lastName: 'Ruiz', email: 'carlos.ruiz@example.com', nationality: 'Spain' },
  ];
  for (const g of guestDefs) {
    const existing = await prisma.guest.findFirst({
      where: { hotelId: hotel.id, email: g.email },
    });
    if (!existing) {
      await prisma.guest.create({ data: { ...g, hotelId: hotel.id } });
    }
  }

  // ---- Menu items ----
  const menu = [
    { name: 'Continental Breakfast', category: 'Breakfast', price: 18 },
    { name: 'Club Sandwich', category: 'Lunch', price: 14 },
    { name: 'Grilled Salmon', category: 'Dinner', price: 28 },
    { name: 'House Wine (Glass)', category: 'Beverages', price: 9 },
  ];
  for (const m of menu) {
    const existing = await prisma.menuItem.findFirst({
      where: { branchId: main.id, name: m.name },
    });
    if (!existing) await prisma.menuItem.create({ data: { ...m, branchId: main.id } });
  }

  console.log('Seed complete.');
  console.log(`Default password for all users: ${PASSWORD}`);
  console.log('Logins: superadmin@hms.com, owner@hms.com, receptionist@hms.com, ...');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
