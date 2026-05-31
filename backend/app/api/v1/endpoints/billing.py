from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.api import deps
from app.models.booking import Invoice, Payment, ExtraCharge, Booking
from app.models.notification import Notification
from app.schemas import billing as billing_schema
from app.models.user import User
from reportlab.pdfgen import canvas
from io import BytesIO

router = APIRouter()

def create_notification(db: Session, title: str, message: str, user_id: int = None):
    notif = Notification(title=title, message=message, user_id=user_id)
    db.add(notif)
    db.commit()

@router.get("/invoices", response_model=List[billing_schema.Invoice])
def read_invoices(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    invoices = db.query(Invoice).offset(skip).limit(limit).all()
    return invoices

@router.get("/invoices/{invoice_id}", response_model=billing_schema.Invoice)
def read_invoice(
    invoice_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/payments", response_model=billing_schema.Payment)
def create_payment(
    *,
    db: Session = Depends(deps.get_db),
    payment_in: billing_schema.PaymentCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    invoice = db.query(Invoice).filter(Invoice.id == payment_in.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payment = Payment(**payment_in.model_dump())
    db.add(payment)

    total_paid = sum([p.amount for p in invoice.payments]) + payment_in.amount
    if total_paid >= (invoice.total_amount + invoice.tax_amount):
        invoice.status = "paid"
    elif total_paid > 0:
        invoice.status = "partial"

    db.add(invoice)
    db.commit()

    create_notification(db, "Payment Received", f"Payment of ${payment_in.amount} received for invoice #{invoice.id}")

    db.refresh(payment)
    return payment

@router.post("/extra-charges", response_model=billing_schema.ExtraCharge)
def create_extra_charge(
    *,
    db: Session = Depends(deps.get_db),
    charge_in: billing_schema.ExtraChargeCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    invoice = db.query(Invoice).filter(Invoice.id == charge_in.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    charge = ExtraCharge(**charge_in.model_dump())
    db.add(charge)

    invoice.total_amount += (charge_in.quantity * charge_in.unit_price)
    invoice.tax_amount = invoice.total_amount * 0.1

    db.add(invoice)
    db.commit()
    db.refresh(charge)
    return charge

@router.get("/invoices/{invoice_id}/pdf")
def get_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    buffer = BytesIO()
    p = canvas.Canvas(buffer)
    p.drawString(100, 800, f"Invoice ID: {invoice.id}")
    p.drawString(100, 780, f"Booking ID: {invoice.booking_id}")
    p.drawString(100, 760, f"Total Amount: ${invoice.total_amount:.2f}")
    p.drawString(100, 740, f"Tax Amount: ${invoice.tax_amount:.2f}")
    p.drawString(100, 720, f"Status: {invoice.status}")

    y = 700
    p.drawString(100, y, "Extra Charges:")
    y -= 20
    for charge in invoice.extra_charges:
        p.drawString(120, y, f"{charge.description}: ${charge.unit_price} x {charge.quantity}")
        y -= 20

    p.showPage()
    p.save()

    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf")
