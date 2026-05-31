from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.room import Room, HousekeepingTask, HousekeepingStatus
from app.models.notification import Notification
from app.schemas import room as room_schema
from app.models.user import User, UserRole

router = APIRouter()

def create_notification(db: Session, title: str, message: str, user_id: int = None):
    notif = Notification(title=title, message=message, user_id=user_id)
    db.add(notif)
    db.commit()

@router.get("/tasks", response_model=List[room_schema.HousekeepingTask])
def read_tasks(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    tasks = db.query(HousekeepingTask).offset(skip).limit(limit).all()
    return tasks

@router.post("/tasks", response_model=room_schema.HousekeepingTask)
def create_task(
    *,
    db: Session = Depends(deps.get_db),
    task_in: room_schema.HousekeepingTaskCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    task = HousekeepingTask(**task_in.model_dump())
    db.add(task)
    db.commit()

    if task.staff_id:
        create_notification(db, "Task Assigned", f"You have been assigned to clean room {task.room_id}", user_id=task.staff_id)

    db.refresh(task)
    return task

@router.patch("/rooms/{room_id}/status", response_model=room_schema.Room)
def update_room_housekeeping_status(
    room_id: int,
    status: HousekeepingStatus,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.housekeeping_status = status
    db.add(room)
    db.commit()
    db.refresh(room)
    return room
