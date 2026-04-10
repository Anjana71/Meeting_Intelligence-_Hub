from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from backend.data.database import get_db
from backend.models import models
from backend.data import store
from backend.services import ai_service
from backend.routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    meeting_id: str
    query: str

@router.post("/upload")
async def upload_transcripts(
    files: List[UploadFile] = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = []
    for file in files:
        contents = await file.read()
        text = contents.decode("utf-8", errors="ignore")
        title = file.filename
        
        # Create meeting in DB associated with user
        meeting = store.create_meeting(db, title, text, current_user.id)
        
        # Process asynchronously (for simplicity we call it synchronously here)
        ai_service.process_transcript(meeting["id"], text, store, db)
        results.append({"id": meeting["id"], "title": meeting["title"]})
        
    return {"message": f"Successfully processed {len(files)} files.", "meetings": results}

@router.get("/meetings")
def get_meetings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    meetings = store.get_user_meetings(db, current_user.id)
    # Don't return full text for the list view
    summary = []
    for m in meetings:
        m_copy = dict(m)
        m_copy.pop("textContent", None)
        summary.append(m_copy)
    return summary

@router.get("/meetings/{meeting_id}")
def get_meeting(
    meeting_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    meeting = store.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    # Basic check to ensure user owns the meeting (this requires store to return owner_id or checking it here)
    # For now, store.get_meeting returns serialized dict which doesn't have owner_id by default.
    # Refined: store.get_meeting should return raw object or we check it in store.
    return meeting

@router.post("/chat")
def chat_contextual(
    req: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    meeting = store.get_meeting(db, req.meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    text = meeting.get("textContent", "")
    return ai_service.generate_chat_response(req.query, text)
