from fastapi import APIRouter
from app.api.v1.endpoints import (
    login, users, rooms, housekeeping,
    guests, bookings, billing, dashboard,
    notifications, settings
)

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(housekeeping.router, prefix="/housekeeping", tags=["housekeeping"])
api_router.include_router(guests.router, prefix="/guests", tags=["guests"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
