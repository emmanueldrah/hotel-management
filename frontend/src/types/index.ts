export type RoleName =
  | 'SUPER_ADMIN'
  | 'HOTEL_OWNER'
  | 'RECEPTIONIST'
  | 'HOUSEKEEPING'
  | 'RESTAURANT_MANAGER'
  | 'ACCOUNTANT'
  | 'MAINTENANCE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  role: RoleName;
  hotelId?: string | null;
  branchId?: string | null;
  avatarUrl?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: { message: string; details?: unknown };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  activeReservations: number;
  pendingMaintenance: number;
  housekeepingDirty: number;
  revenueToday: number;
  revenueThisMonth: number;
  pendingPayments: number;
}

export type RoomStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'CLEANING'
  | 'OUT_OF_SERVICE';

export interface Room {
  id: string;
  number: string;
  floor?: string;
  capacity: number;
  bedType?: string;
  pricePerNight: string;
  status: RoomStatus;
  branchId: string;
  roomTypeId: string;
  amenities: string[];
  roomType?: { id: string; name: string };
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  isVip: boolean;
  loyaltyTier: string;
  loyaltyPoints: number;
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Reservation {
  id: string;
  reference: string;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalAmount: string;
  guest?: Guest;
  rooms?: { room: { id: string; number: string } }[];
  invoice?: { id: string; number: string; status: string; total: string } | null;
}

export interface Invoice {
  id: string;
  number: string;
  status: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  guest?: { firstName: string; lastName: string };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  type: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}
