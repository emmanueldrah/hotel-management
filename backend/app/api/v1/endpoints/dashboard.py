import json
from typing import Any
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.room import Room, RoomStatus
from app.models.booking import Booking, BookingStatus, Invoice, Guest
from app.models.user import User
from datetime import datetime, timedelta
import pandas as pd
from io import BytesIO

router = APIRouter()

@router.get("/stats")
def get_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    total_rooms = db.query(Room).count()
    occupied_rooms = db.query(Room).filter(Room.status == RoomStatus.OCCUPIED).count()
    available_rooms = db.query(Room).filter(Room.status == RoomStatus.AVAILABLE).count()
    maintenance_rooms = db.query(Room).filter(Room.status == RoomStatus.MAINTENANCE).count()

    occupancy_rate = (occupied_rooms / total_rooms * 100) if total_rooms > 0 else 0

    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    today_check_ins = db.query(Booking).filter(
        Booking.check_in_date >= today_start,
        Booking.check_in_date <= today_end
    ).count()

    today_check_outs = db.query(Booking).filter(
        Booking.check_out_date >= today_start,
        Booking.check_out_date <= today_end
    ).count()

    today_revenue = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.created_at >= today_start
    ).scalar() or 0

    return {
        "total_rooms": total_rooms,
        "occupied_rooms": occupied_rooms,
        "available_rooms": available_rooms,
        "maintenance_rooms": maintenance_rooms,
        "occupancy_rate": occupancy_rate,
        "today_check_ins": today_check_ins,
        "today_check_outs": today_check_outs,
        "today_revenue": today_revenue
    }

@router.get("/export/excel")
def export_excel(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    bookings = db.query(Booking).all()
    data = []
    for b in bookings:
        data.append({
            "Reference": b.booking_reference,
            "Check-in": b.check_in_date,
            "Check-out": b.check_out_date,
            "Status": b.status,
            "Cost": b.total_cost
        })
    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Bookings')
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=report.xlsx"}
    )

@router.get("/backup")
def backup_data(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Simplified backup
    rooms = db.query(Room).all()
    data = {"rooms": [{"number": r.room_number, "type": r.room_type} for r in rooms]}
    return Response(
        content=json.dumps(data),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=backup.json"}
    )
