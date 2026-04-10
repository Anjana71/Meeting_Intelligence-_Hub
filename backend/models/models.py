from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.data.database import Base
import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)

    meetings = relationship("Meeting", back_populates="owner")

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    date = Column(String, default=lambda: datetime.datetime.now().strftime("%Y-%m-%d"))
    textContent = Column(Text)
    
    sentimentScore = Column(Float, default=0.0)
    speakerCount = Column(Integer, default=0)
    actionItemCount = Column(Integer, default=0)
    
    
    actionItems = Column(Text, default="[]")
    sentimentTimeline = Column(Text, default="[]")
    speakers = Column(Text, default="[]")

    owner = relationship("User", back_populates="meetings")
