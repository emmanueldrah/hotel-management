from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.room import Room, Amenity, RoomType, RoomStatus
from app.schemas import room as room_schema
from app.models.user import User, UserRole

router = APIRouter()

@router.get("/", response_model=List[room_schema.Room])
def read_rooms(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    room_type: Optional[RoomType] = None,
    status: Optional[RoomStatus] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    query = db.query(Room)
    if room_type:
        query = query.filter(Room.room_type == room_type)
    if status:
        query = query.filter(Room.status == status)
    if min_price is not None:
        query = query.filter(Room.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Room.price_per_night <= max_price)

    rooms = query.offset(skip).limit(limit).all()
    return rooms

@router.post("/", response_model=room_schema.Room)
def create_room(
    *,
    db: Session = Depends(deps.get_db),
    room_in: room_schema.RoomCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=400, detail="Not enough privileges")

    room = Room(
        room_number=room_in.room_number,
        floor=room_in.floor,
        room_type=room_in.room_type,
        price_per_night=room_in.price_per_night,
        description=room_in.description,
        status=room_in.status,
        housekeeping_status=room_in.housekeeping_status,
    )

    if room_in.amenity_ids:
        amenities = db.query(Amenity).filter(Amenity.id.in_(room_in.amenity_ids)).all()
        room.amenities = amenities

    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/{room_id}", response_model=room_schema.Room)
def read_room(
    room_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{room_id}", response_model=room_schema.Room)
def update_room(
    *,
    db: Session = Depends(deps.get_db),
    room_id: int,
    room_in: room_schema.RoomUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=400, detail="Not enough privileges")

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    update_data = room_in.model_dump(exclude_unset=True)
    if "amenity_ids" in update_data:
        amenities = db.query(Amenity).filter(Amenity.id.in_(update_data["amenity_ids"])).all()
        room.amenities = amenities
        del update_data["amenity_ids"]

    for field in update_data:
        setattr(room, field, update_data[field])

    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}", response_model=room_schema.Room)
def delete_room(
    *,
    db: Session = Depends(deps.get_db),
    room_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Not enough privileges")
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
    return room
