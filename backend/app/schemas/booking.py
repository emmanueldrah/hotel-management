from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.booking import BookingStatus

class GuestBase(BaseModel):
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    nationality: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    is_vip: Optional[bool] = False
    is_blacklisted: Optional[bool] = False
    notes: Optional[str] = None

class GuestCreate(GuestBase):
    pass

class GuestUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    nationality: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None
    is_vip: Optional[bool] = None
    is_blacklisted: Optional[bool] = None
    notes: Optional[str] = None

class Guest(GuestBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BookingBase(BaseModel):
    guest_id: int
    room_id: int
    check_in_date: datetime
    check_out_date: datetime
    status: Optional[BookingStatus] = BookingStatus.PENDING

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    room_id: Optional[int] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    status: Optional[BookingStatus] = None
    cancellation_reason: Optional[str] = None

class Booking(BookingBase):
    id: int
    booking_reference: str
    total_cost: Optional[float] = None
    created_at: datetime
    guest: Guest
    # room: Optional[Room] - circular import avoidance or just use basic room info
    model_config = ConfigDict(from_attributes=True)
