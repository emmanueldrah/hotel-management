from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.base_class import Base
from app.db.session import engine
from app.models.user import User, UserRole, Department
from app.models.room import Room, RoomType, RoomStatus, Amenity
from app.models.booking import Guest, Booking, BookingStatus, Invoice, Payment, ExtraCharge
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import random

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already seeded")
        return

    # Seed Staff
    staff_data = [
        ("Admin User", "admin@hotel.com", UserRole.ADMIN, Department.MANAGEMENT),
        ("Manager User", "manager@hotel.com", UserRole.MANAGER, Department.MANAGEMENT),
        ("Receptionist 1", "receptionist1@hotel.com", UserRole.RECEPTIONIST, Department.FRONT_DESK),
        ("Receptionist 2", "receptionist2@hotel.com", UserRole.RECEPTIONIST, Department.FRONT_DESK),
        ("Housekeeper 1", "housekeeper1@hotel.com", UserRole.RECEPTIONIST, Department.HOUSEKEEPING),
    ]

    users = []
    for full_name, email, role, dept in staff_data:
        user = User(
            full_name=full_name,
            email=email,
            hashed_password=get_password_hash("password123"),
            role=role,
            department=dept,
            is_active=True
        )
        db.add(user)
        users.append(user)

    # Seed Amenities
    amenities_names = ["WiFi", "AC", "TV", "Minibar", "Balcony", "Coffee Maker", "Safe"]
    amenities = []
    for name in amenities_names:
        amenity = Amenity(name=name)
        db.add(amenity)
        amenities.append(amenity)

    db.commit()

    # Seed Rooms (20 rooms)
    room_types = list(RoomType)
    rooms = []
    for i in range(1, 21):
        rt = random.choice(room_types)
        price = {"single": 80, "double": 120, "twin": 130, "suite": 250, "vip": 500, "presidential": 1500}[rt.value]
        room = Room(
            room_number=f"{100+i}",
            floor=(i-1)//10 + 1,
            room_type=rt,
            price_per_night=float(price),
            status=RoomStatus.AVAILABLE,
            description=f"Beautiful {rt.value} room on floor {(i-1)//10 + 1}"
        )
        room.amenities = random.sample(amenities, k=random.randint(2, 5))
        db.add(room)
        rooms.append(room)

    # Seed Guests (10 guests)
    guests = []
    for i in range(1, 11):
        guest = Guest(
            full_name=f"Guest {i}",
            email=f"guest{i}@example.com",
            phone_number=f"+123456789{i}",
            nationality="Global",
            id_type="Passport",
            id_number=f"PASS-{i*1000}",
            is_vip=(i % 5 == 0)
        )
        db.add(guest)
        guests.append(guest)

    db.commit()

    # Seed Bookings (15 bookings)
    bookings = []
    for i in range(1, 16):
        guest = random.choice(guests)
        room = random.choice(rooms)
        check_in = datetime.utcnow() + timedelta(days=random.randint(-10, 10))
        check_out = check_in + timedelta(days=random.randint(1, 5))

        status = random.choice(list(BookingStatus))
        booking = Booking(
            booking_reference=f"BK-SEED-{i}",
            guest_id=guest.id,
            room_id=room.id,
            check_in_date=check_in,
            check_out_date=check_out,
            total_cost=room.price_per_night * (check_out - check_in).days,
            status=status
        )
        db.add(booking)
        bookings.append(booking)

    db.commit()

    # Seed Invoices for completed bookings
    for booking in bookings:
        if booking.status == BookingStatus.COMPLETED:
            invoice = Invoice(
                booking_id=booking.id,
                total_amount=booking.total_cost,
                tax_amount=booking.total_cost * 0.1,
                status="paid",
                created_at=booking.check_out_date
            )
            db.add(invoice)
            db.flush()

            payment = Payment(
                invoice_id=invoice.id,
                amount=invoice.total_amount + invoice.tax_amount,
                payment_method="credit_card",
                timestamp=booking.check_out_date
            )
            db.add(payment)

            charge = ExtraCharge(
                invoice_id=invoice.id,
                description="Minibar",
                quantity=1,
                unit_price=15.0,
                date=booking.check_in_date + timedelta(days=1)
            )
            db.add(charge)

    db.commit()
    db.close()
    print("Database seeded successfully with rooms, guests, staff, bookings, and invoices")

if __name__ == "__main__":
    seed_db()
