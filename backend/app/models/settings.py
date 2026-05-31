from sqlalchemy import Column, Integer, String, Float, JSON, Text
from app.db.base_class import Base

class SystemSettings(Base):
    id = Column(Integer, primary_key=True, index=True)
    hotel_name = Column(String, default="Grand Hotel")
    address = Column(Text)
    phone = Column(String)
    email = Column(String)
    website = Column(String)
    logo_url = Column(String)
    tax_rate = Column(Float, default=10.0)
    currency = Column(String, default="USD")
    check_in_time = Column(String, default="14:00")
    check_out_time = Column(String, default="11:00")
    smtp_settings = Column(JSON) # host, port, user, password
