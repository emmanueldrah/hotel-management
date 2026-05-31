import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.api import deps
from app.models.booking import Booking, BookingStatus, Guest, Invoice
from app.models.room import Room, RoomStatus
from app.models.notification import Notification
from app.schemas import booking as booking_schema
from app.models.user import User

router = APIRouter()

def create_notification(db: Session, title: str, message: str, user_id: int = None):
    notif = Notification(title=title, message=message, user_id=user_id)
    db.add(notif)
    db.commit()

@router.get("/", response_model=List[booking_schema.Booking])
def read_bookings(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[BookingStatus] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    query = db.query(Booking)
    if status:
        query = query.filter(Booking.status == status)
    bookings = query.offset(skip).limit(limit).all()
    return bookings

@router.post("/", response_model=booking_schema.Booking)
def create_booking(
    *,
    db: Session = Depends(deps.get_db),
    booking_in: booking_schema.BookingCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    overlap = db.query(Booking).filter(
        and_(
            Booking.room_id == booking_in.room_id,
            Booking.status != BookingStatus.CANCELLED,
            or_(
                and_(Booking.check_in_date <= booking_in.check_in_date, Booking.check_out_date > booking_in.check_in_date),
                and_(Booking.check_in_date < booking_in.check_out_date, Booking.check_out_date >= booking_in.check_out_date),
                and_(Booking.check_in_date >= booking_in.check_in_date, Booking.check_out_date <= booking_in.check_out_date)
            )
        )
    ).first()

    if overlap:
        raise HTTPException(status_code=400, detail="Room is already booked for selected dates")

    room = db.query(Room).filter(Room.id == booking_in.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    num_nights = (booking_in.check_out_date - booking_in.check_in_date).days
    if num_nights <= 0:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date")

    total_cost = num_nights * room.price_per_night
    booking_ref = f"BK-{uuid.uuid4().hex[:8].upper()}"

    booking = Booking(
        **booking_in.model_dump(),
        booking_reference=booking_ref,
        total_cost=total_cost
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    create_notification(db, "New Booking", f"Booking {booking_ref} created for {booking.guest_id}")

    return booking

@router.post("/{booking_id}/check-in")
def check_in(
    booking_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    room = db.query(Room).filter(Room.id == booking.room_id).first()
    room.status = RoomStatus.OCCUPIED
    booking.status = BookingStatus.CONFIRMED

    db.add(room)
    db.add(booking)
    db.commit()

    create_notification(db, "Guest Checked In", f"Guest in room {room.room_number} has checked in.")

    return {"message": "Checked in successfully"}

@router.post("/{booking_id}/check-out")
def check_out(
    booking_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    room = db.query(Room).filter(Room.id == booking.room_id).first()
    room.status = RoomStatus.CLEANING
    booking.status = BookingStatus.COMPLETED

    invoice = Invoice(
        booking_id=booking.id,
        total_amount=booking.total_cost,
        tax_amount=booking.total_cost * 0.1,
        status="pending"
    )

    db.add(room)
    db.add(booking)
    db.add(invoice)
    db.commit()

    create_notification(db, "Guest Checked Out", f"Guest in room {room.room_number} has checked out.")

    return {"message": "Checked out successfully", "invoice_id": invoice.id}
