from sqlalchemy import Column, Integer, String, Float, Enum, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum
from datetime import datetime

class BookingStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    PENDING = "pending"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Guest(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=False)
    phone_number = Column(String, index=True)
    email = Column(String, index=True)
    nationality = Column(String)
    id_type = Column(String)
    id_number = Column(String, index=True)
    date_of_birth = Column(DateTime)
    address = Column(Text)
    is_vip = Column(Boolean, default=False)
    is_blacklisted = Column(Boolean, default=False)
    notes = Column(Text)

    bookings = relationship("Booking", back_populates="guest")

class Booking(Base):
    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String, unique=True, index=True)
    guest_id = Column(Integer, ForeignKey("guest.id"))
    room_id = Column(Integer, ForeignKey("room.id"))
    check_in_date = Column(DateTime, nullable=False)
    check_out_date = Column(DateTime, nullable=False)
    total_cost = Column(Float)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    cancellation_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    guest = relationship("Guest", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    invoice = relationship("Invoice", back_populates="booking", uselist=False)

class Invoice(Base):
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("booking.id"))
    total_amount = Column(Float)
    tax_amount = Column(Float)
    status = Column(String) # paid, pending, partial
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice")
    extra_charges = relationship("ExtraCharge", back_populates="invoice")

class Payment(Base):
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoice.id"))
    amount = Column(Float)
    payment_method = Column(String) # cash, credit_card, etc.
    timestamp = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")

class ExtraCharge(Base):
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoice.id"))
    description = Column(String)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="extra_charges")
