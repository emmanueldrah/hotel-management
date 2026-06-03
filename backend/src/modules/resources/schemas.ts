import { z } from 'zod';

const decimal = z.union([z.number(), z.string()]);

const body = <T extends z.ZodRawShape>(shape: T) => z.object({ body: z.object(shape) });
const partialBody = <T extends z.ZodRawShape>(shape: T) =>
  z.object({ body: z.object(shape).partial() });

// ----- Hotels -----
const hotelShape = {
  name: z.string().min(2),
  legalName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  currency: z.string().default('USD'),
  logoUrl: z.string().optional(),
  isActive: z.boolean().optional(),
};
export const hotelCreate = body(hotelShape);
export const hotelUpdate = partialBody(hotelShape);

// ----- Branches -----
const branchShape = {
  hotelId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  isActive: z.boolean().optional(),
};
export const branchCreate = body(branchShape);
export const branchUpdate = partialBody({ ...branchShape, hotelId: z.string().uuid().optional() });

// ----- Room Types -----
const roomTypeShape = {
  branchId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: decimal,
  maxOccupancy: z.number().int().positive().optional(),
  bedType: z.string().optional(),
  amenities: z.array(z.string()).optional(),
};
export const roomTypeCreate = body(roomTypeShape);
export const roomTypeUpdate = partialBody(roomTypeShape);

// ----- Rooms -----
const roomShape = {
  branchId: z.string().uuid().optional(),
  roomTypeId: z.string().uuid(),
  number: z.string().min(1),
  floor: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  bedType: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  pricePerNight: decimal,
  status: z
    .enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CLEANING', 'OUT_OF_SERVICE'])
    .optional(),
  images: z.array(z.string()).optional(),
};
export const roomCreate = body(roomShape);
export const roomUpdate = partialBody({ ...roomShape, roomTypeId: z.string().uuid().optional() });

// ----- Guests -----
const guestShape = {
  hotelId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  passportNumber: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  photoUrl: z.string().optional(),
  isVip: z.boolean().optional(),
  isBlacklisted: z.boolean().optional(),
  notes: z.string().optional(),
};
export const guestCreate = body(guestShape);
export const guestUpdate = partialBody(guestShape);

// ----- Suppliers -----
const supplierShape = {
  branchId: z.string().uuid().optional(),
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
};
export const supplierCreate = body(supplierShape);
export const supplierUpdate = partialBody(supplierShape);

// ----- Inventory -----
const inventoryShape = {
  branchId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  quantity: decimal.optional(),
  reorderLevel: decimal.optional(),
  unitCost: decimal.optional(),
  expiryDate: z.coerce.date().optional(),
};
export const inventoryCreate = body(inventoryShape);
export const inventoryUpdate = partialBody(inventoryShape);

// ----- Menu Items -----
const menuItemShape = {
  branchId: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  price: decimal,
  available: z.boolean().optional(),
  imageUrl: z.string().optional(),
};
export const menuItemCreate = body(menuItemShape);
export const menuItemUpdate = partialBody(menuItemShape);

// ----- Restaurant Tables -----
const tableShape = {
  branchId: z.string().uuid().optional(),
  name: z.string().min(1),
  capacity: z.number().int().positive().optional(),
};
export const tableCreate = body(tableShape);
export const tableUpdate = partialBody(tableShape);

// ----- Events -----
const eventShape = {
  branchId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  name: z.string().min(1),
  venue: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  attendees: z.number().int().nonnegative().optional(),
  packageName: z.string().optional(),
  cost: decimal.optional(),
  status: z.enum(['INQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
};
export const eventCreate = body(eventShape);
export const eventUpdate = partialBody(eventShape);

// ----- Employees -----
const employeeShape = {
  branchId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  employeeNo: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  position: z.string().optional(),
  department: z.string().optional(),
  salary: decimal.optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  hiredAt: z.coerce.date().optional(),
};
export const employeeCreate = body(employeeShape);
export const employeeUpdate = partialBody(employeeShape);
