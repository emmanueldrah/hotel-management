from sqlalchemy import Column, Integer, String, Float, Enum, Text, ForeignKey, Table, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum
from datetime import datetime

class RoomType(str, enum.Enum):
    SINGLE = "single"
    DOUBLE = "double"
    TWIN = "twin"
    SUITE = "suite"
    VIP = "vip"
    PRESIDENTIAL = "presidential"

class RoomStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"
    CLEANING = "cleaning"

class HousekeepingStatus(str, enum.Enum):
    CLEAN = "clean"
    DIRTY = "dirty"
    BEING_CLEANED = "being_cleaned"
    INSPECTED = "inspected"
    OUT_OF_ORDER = "out_of_order"

room_amenity = Table(
    "room_amenity",
    Base.metadata,
    Column("room_id", Integer, ForeignKey("room.id"), primary_key=True),
    Column("amenity_id", Integer, ForeignKey("amenity.id"), primary_key=True),
)

class Room(Base):
    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True, index=True, nullable=False)
    floor = Column(Integer)
    room_type = Column(Enum(RoomType), nullable=False)
    price_per_night = Column(Float, nullable=False)
    status = Column(Enum(RoomStatus), default=RoomStatus.AVAILABLE)
    housekeeping_status = Column(Enum(HousekeepingStatus), default=HousekeepingStatus.CLEAN)
    description = Column(Text)
    photos = Column(String)

    amenities = relationship("Amenity", secondary=room_amenity, back_populates="rooms")
    housekeeping_tasks = relationship("HousekeepingTask", back_populates="room")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="room")
    # bookings will be added later in booking model
    bookings = relationship("Booking", back_populates="room")

class Amenity(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    icon = Column(String)

    rooms = relationship("Room", secondary=room_amenity, back_populates="amenities")

class HousekeepingTask(Base):
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("room.id"))
    staff_id = Column(Integer, ForeignKey("user.id"))
    status = Column(Enum(HousekeepingStatus))
    priority = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    room = relationship("Room", back_populates="housekeeping_tasks")
    staff = relationship("User")

class MaintenanceRequest(Base):
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("room.id"))
    reported_by = Column(Integer, ForeignKey("user.id"))
    description = Column(Text)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="maintenance_requests")
