from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.room import RoomType, RoomStatus, HousekeepingStatus

class AmenityBase(BaseModel):
    name: str
    icon: Optional[str] = None

class AmenityCreate(AmenityBase):
    pass

class Amenity(AmenityBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RoomBase(BaseModel):
    room_number: str
    floor: int
    room_type: RoomType
    price_per_night: float
    description: Optional[str] = None
    status: Optional[RoomStatus] = RoomStatus.AVAILABLE
    housekeeping_status: Optional[HousekeepingStatus] = HousekeepingStatus.CLEAN

class RoomCreate(RoomBase):
    amenity_ids: List[int] = []

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    floor: Optional[int] = None
    room_type: Optional[RoomType] = None
    price_per_night: Optional[float] = None
    description: Optional[str] = None
    status: Optional[RoomStatus] = None
    housekeeping_status: Optional[HousekeepingStatus] = None
    amenity_ids: Optional[List[int]] = None

class Room(RoomBase):
    id: int
    amenities: List[Amenity] = []
    model_config = ConfigDict(from_attributes=True)

class HousekeepingTaskBase(BaseModel):
    room_id: int
    staff_id: Optional[int] = None
    status: HousekeepingStatus
    priority: bool = False
    notes: Optional[str] = None

class HousekeepingTaskCreate(HousekeepingTaskBase):
    pass

class HousekeepingTask(HousekeepingTaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MaintenanceRequestBase(BaseModel):
    room_id: int
    description: str
    status: Optional[str] = "pending"

class MaintenanceRequestCreate(MaintenanceRequestBase):
    pass

class MaintenanceRequest(MaintenanceRequestBase):
    id: int
    reported_by: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
