from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from app.db.base_class import Base
from datetime import datetime

class Notification(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True) # null means for all staff
    title = Column(String)
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
