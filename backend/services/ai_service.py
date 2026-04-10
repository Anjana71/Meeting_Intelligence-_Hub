from typing import List, Optional
import time
import json
import re
import random
import os
from google import genai
from google.genai import types
from pydantic import BaseModel
from sqlalchemy.orm import Session

def extract_speakers(text: str):
    pattern = re.compile(r"^([A-Z][a-zA-Z\s]+?):", re.MULTILINE)
    matches = pattern.findall(text)
    speakers = list(set([s.strip() for s in matches if len(s.strip()) > 1]))
    if not speakers:
        speakers = ["Speaker 1", "Speaker 2"]
    return speakers

def call_gemini_with_retry(client, primary_model, prompt, response_schema):
    # Try these models in order if primary fails
    models_to_try = [primary_model, 'gemini-1.5-flash', 'gemini-2.0-flash-lite']
    
    last_error = ""
    for attempt in range(3):
        for m in models_to_try:
            try:
                # Remove 'models/' prefix if present
                clean_name = m.split('/')[-1]
                response = client.models.generate_content(
                    model=clean_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=response_schema,
                    ),
                )
                return response
            except Exception as e:
                last_error = str(e)
                error_msg = last_error.lower()
                # If it's a transient server error (503) or rate limit (429), we wait and retry
                if "503" in error_msg or "429" in error_msg:
                    wait_time = (attempt + 1) * 2
                    print(f"Gemini {m} busy (Attempt {attempt+1}). Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    break # Break inner loop to retry with primary model again after sleep
                else:
                    print(f"Gemini {m} failed: {e}. Trying next available model...")
                    continue
                    
    raise Exception(f"AI Quota/Availability Exhausted. Last Error: {last_error}")

def fallback_process_transcript(meeting_id: str, text: str, store_module, db: Session):
    speakers = extract_speakers(text)
    
    mock_actions = [
        {"type": "Decision", "what": "Go ahead with the new API schema", "who": "All", "byWhen": "-"},
        {"type": "Action Item", "what": "Update the database credentials.", "who": speakers[0] if speakers else "John", "byWhen": "Next Tuesday"},
    ]
    
    timeline = []
    base_sentiment = random.uniform(-0.2, 0.4)
    for i in range(10):
        base_sentiment += random.uniform(-0.3, 0.3)
        base_sentiment = max(-1.0, min(1.0, base_sentiment))
        timeline.append({"time": f"{i*5}:00", "score": base_sentiment, "text": "Discussion snippet..."})
        
    avg_sentiment = sum([t["score"] for t in timeline]) / len(timeline)
    
    speaker_stats = []
    for sp in speakers:
        speaker_stats.append({
            "name": sp,
            "score": random.uniform(-0.5, 0.8),
            "positivity": random.uniform(0.3, 0.9)
        })

    store_module.update_meeting(db, meeting_id, {
        "speakerCount": len(speakers),
        "actionItemCount": len([a for a in mock_actions if a["type"] == "Action Item"]),
        "actionItems": mock_actions,
        "sentimentScore": avg_sentiment,
        "sentimentTimeline": timeline,
        "speakers": speaker_stats
    })

def process_transcript(meeting_id: str, text: str, store_module, db: Session):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        print("No valid Gemini API key found. Using mock AI processing.")
        return fallback_process_transcript(meeting_id, text, store_module)

    client = genai.Client(api_key=api_key)
    
    # Define Structured Output response model
    class ActionItem(BaseModel):
        type: str
        what: str
        who: str
        byWhen: str
        
    class TimelineSegment(BaseModel):
        time: str
        score: float
        text: str
        
    class Speaker(BaseModel):
        name: str
        score: float
        positivity: float

    class AiResponse(BaseModel):
        actionItems: List[ActionItem]
        sentimentScore: float
        sentimentTimeline: List[TimelineSegment]
        speakers: List[Speaker]

    # Call Gemini Model
    prompt = f"""
    Analyze this meeting transcript and extract structured data.
    
    Provide:
    1. Action items and Decisions (who, what, byWhen, type MUST BE EXACTLY "Action Item" or "Decision").
    2. Overall Sentiment Score (-1.0 to 1.0).
    3. Sentiment Timeline (list of segments, each with time like "05:00", score (-1.0 to 1.0), and a short text summary). Create around 4-5 segments for the flow.
    4. Speaker data (name, their overall score (-1.0 to 1.0), and positivity percentage (0.0 to 1.0) for visual bar length).

    Transcript:
    {text}
    """
    
    try:
        response = call_gemini_with_retry(client, 'gemini-flash-lite-latest', prompt, AiResponse)
        data = json.loads(response.text)
        
        # Save to store
        store_module.update_meeting(db, meeting_id, {
            "speakerCount": len(data.get("speakers", [])),
            "actionItemCount": len([a for a in data.get("actionItems", []) if a.get("type", "") == "Action Item"]),
            "actionItems": data.get("actionItems", []),
            "sentimentScore": data.get("sentimentScore", 0.0),
            "sentimentTimeline": data.get("sentimentTimeline", []),
            "speakers": data.get("speakers", [])
        })
        print("Gemini API processing complete.")
    except Exception as e:
        print(f"Gemini API failure: {e}. Falling back to mock data.")
        fallback_process_transcript(meeting_id, text, store_module)

def fallback_generate_chat(query: str):
    return {"answer": f"Mock Answer: I noticed you asked about '{query}'. Please configure your Gemini API key inside backend/.env to get real RAG answering.", "citations": ["No Key Provided"]}

def generate_chat_response(query: str, meeting_text: str):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return fallback_generate_chat(query)

    client = genai.Client(api_key=api_key)
    
    class ChatResponse(BaseModel):
        answer: str
        citations: List[str]

    prompt = f"""
    You are an intelligent AI assistant. Use the following meeting transcript to answer the user's question.
    Provide a clear, detailed answer based ONLY on the transcript. Include citations by quoting short phrases or timestamps if applicable as a list of strings in the 'citations' array. Example array: ["John: 'I'll fix it'", "Sarah: 'Timeline is tomorrow'"]
    
    Transcript Context:
    {meeting_text}
    
    User Question: {query}
    """
    
    try:
        response = call_gemini_with_retry(client, 'gemini-flash-lite-latest', prompt, ChatResponse)
        return json.loads(response.text)
    except Exception as e:
        return {"answer": f"API Error: {str(e)}", "citations": []}
