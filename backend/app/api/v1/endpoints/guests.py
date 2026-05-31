from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.booking import Guest
from app.schemas import booking as booking_schema
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[booking_schema.Guest])
def read_guests(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    query = db.query(Guest)
    if search:
        query = query.filter(
            (Guest.full_name.ilike(f"%{search}%")) |
            (Guest.email.ilike(f"%{search}%")) |
            (Guest.phone_number.ilike(f"%{search}%")) |
            (Guest.id_number.ilike(f"%{search}%"))
        )
    guests = query.offset(skip).limit(limit).all()
    return guests

@router.post("/", response_model=booking_schema.Guest)
def create_guest(
    *,
    db: Session = Depends(deps.get_db),
    guest_in: booking_schema.GuestCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    guest = Guest(**guest_in.model_dump())
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest

@router.get("/{guest_id}", response_model=booking_schema.Guest)
def read_guest(
    guest_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return guest

@router.put("/{guest_id}", response_model=booking_schema.Guest)
def update_guest(
    *,
    db: Session = Depends(deps.get_db),
    guest_id: int,
    guest_in: booking_schema.GuestUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    update_data = guest_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(guest, field, update_data[field])

    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest
