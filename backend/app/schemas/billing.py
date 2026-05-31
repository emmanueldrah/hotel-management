from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ExtraChargeBase(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float

class ExtraChargeCreate(ExtraChargeBase):
    invoice_id: int

class ExtraCharge(ExtraChargeBase):
    id: int
    invoice_id: int
    date: datetime
    model_config = ConfigDict(from_attributes=True)

class PaymentBase(BaseModel):
    amount: float
    payment_method: str

class PaymentCreate(PaymentBase):
    invoice_id: int

class Payment(PaymentBase):
    id: int
    invoice_id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class InvoiceBase(BaseModel):
    booking_id: int
    total_amount: float
    tax_amount: float
    status: str

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None

class Invoice(InvoiceBase):
    id: int
    created_at: datetime
    payments: List[Payment] = []
    extra_charges: List[ExtraCharge] = []
    model_config = ConfigDict(from_attributes=True)
