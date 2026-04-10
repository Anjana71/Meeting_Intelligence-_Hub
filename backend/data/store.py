from sqlalchemy.orm import Session
from backend.models import models
import json

def get_meeting(db: Session, meeting_id: str):
    m = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if m:
        return serialize_meeting(m)
    return None

def get_user_meetings(db: Session, user_id: int):
    meetings = db.query(models.Meeting).filter(models.Meeting.owner_id == user_id).all()
    return [serialize_meeting(m) for m in meetings]

def create_meeting(db: Session, title: str, text_content: str, user_id: int):
    new_meeting = models.Meeting(
        title=title,
        textContent=text_content,
        owner_id=user_id
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return serialize_meeting(new_meeting)

def update_meeting(db: Session, meeting_id: str, updates: dict):
    db_meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if db_meeting:
        # Handle JSON fields
        for key, value in updates.items():
            if key in ['actionItems', 'sentimentTimeline', 'speakers']:
                setattr(db_meeting, key, json.dumps(value))
            else:
                setattr(db_meeting, key, value)
        db.commit()
        db.refresh(db_meeting)
        return serialize_meeting(db_meeting)
    return None

def serialize_meeting(m):
    # Helper to convert SQL object + JSON strings back to dict
    return {
        "id": m.id,
        "title": m.title,
        "date": m.date,
        "textContent": m.textContent,
        "sentimentScore": m.sentimentScore,
        "speakerCount": m.speakerCount,
        "actionItemCount": m.actionItemCount,
        "actionItems": json.loads(m.actionItems) if m.actionItems else [],
        "sentimentTimeline": json.loads(m.sentimentTimeline) if m.sentimentTimeline else [],
        "speakers": json.loads(m.speakers) if m.speakers else []
    }
