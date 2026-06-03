import { Prisma, ReservationStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { generateReference } from '../../utils/reference';
import { nightsBetween, round2 } from '../../utils/billing';

const reservationInclude = {
  guest: true,
  branch: { select: { id: true, name: true } },
  rooms: { include: { room: { select: { id: true, number: true, status: true } } } },
  invoice: { select: { id: true, number: true, status: true, total: true } },
} satisfies Prisma.ReservationInclude;

/** Rooms in a branch that are not booked for the given date window. */
export async function findAvailableRooms(params: {
  branchId: string;
  checkIn: Date;
  checkOut: Date;
  roomTypeId?: string;
}) {
  const overlapping = await prisma.reservationRoom.findMany({
    where: {
      reservation: {
        branchId: params.branchId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { lt: params.checkOut },
        checkOutDate: { gt: params.checkIn },
      },
    },
    select: { roomId: true },
  });
  const bookedIds = overlapping.map((r) => r.roomId);

  return prisma.room.findMany({
    where: {
      branchId: params.branchId,
      ...(params.roomTypeId ? { roomTypeId: params.roomTypeId } : {}),
      status: { notIn: ['MAINTENANCE', 'OUT_OF_SERVICE'] },
      id: { notIn: bookedIds },
    },
    include: { roomType: { select: { id: true, name: true } } },
    orderBy: { number: 'asc' },
  });
}

export async function createReservation(input: {
  branchId: string;
  guestId: string;
  roomIds: string[];
  checkInDate: Date;
  checkOutDate: Date;
  numGuests?: number;
  source?: 'ONLINE' | 'WALK_IN' | 'PHONE' | 'OTA';
  specialRequests?: string;
  promoCode?: string;
  createdById?: string;
}) {
  if (input.checkOutDate <= input.checkInDate) {
    throw ApiError.badRequest('Check-out date must be after check-in date');
  }
  if (!input.roomIds.length) throw ApiError.badRequest('At least one room is required');

  const nights = nightsBetween(input.checkInDate, input.checkOutDate);

  // Validate rooms belong to the branch and are free for the window.
  const available = await findAvailableRooms({
    branchId: input.branchId,
    checkIn: input.checkInDate,
    checkOut: input.checkOutDate,
  });
  const availableIds = new Set(available.map((r) => r.id));
  const rooms = await prisma.room.findMany({ where: { id: { in: input.roomIds } } });
  if (rooms.length !== input.roomIds.length) throw ApiError.badRequest('Some rooms do not exist');
  for (const room of rooms) {
    if (room.branchId !== input.branchId) {
      throw ApiError.badRequest(`Room ${room.number} is not in this branch`);
    }
    if (!availableIds.has(room.id)) {
      throw ApiError.conflict(`Room ${room.number} is not available for the selected dates`);
    }
  }

  const total = round2(
    rooms.reduce((sum, room) => sum + Number(room.pricePerNight) * nights, 0),
  );

  return prisma.reservation.create({
    data: {
      reference: generateReference('RSV'),
      branchId: input.branchId,
      guestId: input.guestId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      numGuests: input.numGuests ?? 1,
      source: input.source ?? 'WALK_IN',
      status: 'CONFIRMED',
      specialRequests: input.specialRequests,
      promoCode: input.promoCode,
      totalAmount: total,
      createdById: input.createdById,
      rooms: {
        create: rooms.map((room) => ({
          roomId: room.id,
          pricePerNight: room.pricePerNight,
          nights,
        })),
      },
    },
    include: reservationInclude,
  });
}

export async function listReservations(params: {
  branchId?: string;
  status?: ReservationStatus;
  guestId?: string;
  skip: number;
  take: number;
}) {
  const where: Prisma.ReservationWhereInput = {
    ...(params.branchId ? { branchId: params.branchId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.guestId ? { guestId: params.guestId } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: reservationInclude,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    }),
    prisma.reservation.count({ where }),
  ]);
  return { items, total };
}

export async function getReservation(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: reservationInclude,
  });
  if (!reservation) throw ApiError.notFound('Reservation not found');
  return reservation;
}

export async function updateStatus(id: string, status: ReservationStatus) {
  await getReservation(id);
  return prisma.reservation.update({
    where: { id },
    data: { status },
    include: reservationInclude,
  });
}

export async function checkIn(id: string) {
  const reservation = await getReservation(id);
  if (reservation.status === 'CHECKED_IN') throw ApiError.badRequest('Already checked in');
  if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
    throw ApiError.badRequest(`Cannot check in a ${reservation.status} reservation`);
  }
  const roomIds = reservation.rooms.map((r) => r.roomId);
  return prisma.$transaction(async (tx) => {
    await tx.room.updateMany({ where: { id: { in: roomIds } }, data: { status: 'OCCUPIED' } });
    return tx.reservation.update({
      where: { id },
      data: { status: 'CHECKED_IN', checkedInAt: new Date() },
      include: reservationInclude,
    });
  });
}

export async function checkOut(id: string) {
  const reservation = await getReservation(id);
  if (reservation.status !== 'CHECKED_IN') {
    throw ApiError.badRequest('Only checked-in reservations can be checked out');
  }
  const roomIds = reservation.rooms.map((r) => r.roomId);

  return prisma.$transaction(async (tx) => {
    await tx.room.updateMany({ where: { id: { in: roomIds } }, data: { status: 'CLEANING' } });

    // Queue housekeeping for each room.
    await tx.housekeeping.createMany({
      data: roomIds.map((roomId) => ({
        branchId: reservation.branchId,
        roomId,
        status: 'DIRTY' as const,
      })),
    });

    // Generate invoice if one does not yet exist.
    let invoiceId = reservation.invoice?.id;
    if (!invoiceId) {
      const items = reservation.rooms.map((rr) => ({
        type: 'ROOM' as const,
        description: `Room ${rr.room.number} x ${rr.nights} night(s)`,
        quantity: rr.nights,
        unitPrice: rr.pricePerNight,
        amount: Number(rr.pricePerNight) * rr.nights,
      }));
      const subtotal = items.reduce((s, i) => s + i.amount, 0);
      const invoice = await tx.invoice.create({
        data: {
          number: generateReference('INV'),
          branchId: reservation.branchId,
          reservationId: reservation.id,
          guestId: reservation.guestId,
          status: 'ISSUED',
          issuedAt: new Date(),
          subtotal,
          total: subtotal,
          balanceDue: subtotal,
          items: { create: items },
        },
      });
      invoiceId = invoice.id;
    }

    const updated = await tx.reservation.update({
      where: { id },
      data: { status: 'CHECKED_OUT', checkedOutAt: new Date() },
      include: reservationInclude,
    });
    return { reservation: updated, invoiceId };
  });
}
