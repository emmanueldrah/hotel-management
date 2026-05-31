from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    RECEPTIONIST = "receptionist"

class Department(str, enum.Enum):
    FRONT_DESK = "front_desk"
    HOUSEKEEPING = "housekeeping"
    MANAGEMENT = "management"
    KITCHEN = "kitchen"
    SECURITY = "security"
    MAINTENANCE = "maintenance"

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.RECEPTIONIST)
    is_active = Column(Boolean(), default=True)
    phone = Column(String)
    department = Column(Enum(Department))
    employment_date = Column(DateTime, default=datetime.utcnow)
    profile_photo = Column(String)

    # Activity logs
    logs = relationship("ActivityLog", back_populates="user")
    # Shifts
    shifts = relationship("StaffSchedule", back_populates="user")

class ActivityLog(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logs")

class StaffSchedule(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"))
    shift_start = Column(DateTime)
    shift_end = Column(DateTime)
    day_of_week = Column(String) # or use date

    user = relationship("User", back_populates="shifts")
