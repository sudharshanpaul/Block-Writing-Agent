from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from agent import BlogAgent

app = FastAPI(title="Blog Writing Agent API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your Netlify domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get backend directory path
BACKEND_DIR = Path(__file__).parent

# Storage for conversation history
HISTORY_DIR = BACKEND_DIR / "history"
HISTORY_DIR.mkdir(exist_ok=True)

IMAGES_DIR = BACKEND_DIR / "images"
IMAGES_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")

# Models
class GenerateRequest(BaseModel):
    topic: str
    session_id: Optional[str] = None

class SessionResponse(BaseModel):
    session_id: str
    topic: str
    timestamp: str
    status: str
    plan: Optional[Dict[str, Any]] = None
    markdown: Optional[str] = None
    images: List[str] = []
    logs: List[Dict[str, Any]] = []

class HistoryItem(BaseModel):
    session_id: str
    topic: str
    timestamp: str
    status: str

# Initialize agent
agent = BlogAgent()

# In-memory session store (use database in production)
sessions: Dict[str, SessionResponse] = {}

# Track current active session
current_session_id: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Blog Writing Agent API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/generate")
async def generate_blog(request: GenerateRequest):
    """Start a new blog generation session"""
    global current_session_id
    
    session_id = request.session_id or str(uuid.uuid4())
    
    # Create session
    session = SessionResponse(
        session_id=session_id,
        topic=request.topic,
        timestamp=datetime.now().isoformat(),
        status="pending",
        logs=[]
    )
    sessions[session_id] = session
    current_session_id = session_id
    
    return {"session_id": session_id, "status": "queued"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for streaming agent progress"""
    global current_session_id
    await websocket.accept()
    
    if session_id not in sessions:
        await websocket.send_json({"error": "Session not found"})
        await websocket.close()
        return
    
    session = sessions[session_id]
    session.status = "in-progress"
    
    try:
        # Send initial status
        await websocket.send_json({
            "type": "status",
            "data": {"stage": "starting", "message": "Initializing blog generation..."}
        })
        session.logs.append({"timestamp": datetime.now().isoformat(), "stage": "starting", "message": "Initializing..."})
        
        # Run agent with streaming updates
        async for update in agent.run_streaming(session.topic):
            await websocket.send_json(update)
            
            # Store logs
            session.logs.append({
                "timestamp": datetime.now().isoformat(),
                "type": update.get("type"),
                "data": update.get("data")
            })
            
            # Update session data
            if update.get("type") == "plan":
                session.plan = update.get("data")
            elif update.get("type") == "section":
                # Accumulate sections
                pass
            elif update.get("type") == "images":
                session.images = update.get("data", {}).get("images", [])
            elif update.get("type") == "complete":
                session.markdown = update.get("data", {}).get("markdown")
                session.status = "completed"
        
        # Save to history
        save_session_to_history(session)
        
        # Note: Don't send another complete message - agent already sent it with markdown
        
        # Clear current session if this was the active one
        if current_session_id == session_id:
            current_session_id = None
        
    except WebSocketDisconnect:
        session.status = "disconnected"
        if current_session_id == session_id:
            current_session_id = None
    except Exception as e:
        session.status = "error"
        if current_session_id == session_id:
            current_session_id = None
        await websocket.send_json({
            "type": "error",
            "data": {"message": str(e)}
        })
    finally:
        await websocket.close()

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Get session details"""
    if session_id not in sessions:
        # Try loading from history
        history_file = HISTORY_DIR / f"{session_id}.json"
        if history_file.exists():
            return json.loads(history_file.read_text())
        raise HTTPException(status_code=404, detail="Session not found")
    
    return sessions[session_id]

@app.get("/api/current-session")
async def get_current_session():
    """Get current active session"""
    if current_session_id and current_session_id in sessions:
        return {"session_id": current_session_id, "has_active": True}
    return {"session_id": None, "has_active": False}

@app.get("/api/history")
async def get_history():
    """Get all conversation history including current session"""
    history_files = list(HISTORY_DIR.glob("*.json"))
    history = []
    
    # Add current active session at the top if exists
    if current_session_id and current_session_id in sessions:
        current = sessions[current_session_id]
        history.append(HistoryItem(
            session_id=current.session_id,
            topic=current.topic,
            timestamp=current.timestamp,
            status=current.status
        ))
    
    # Load all completed sessions from history
    completed_sessions = []
    for file in history_files:
        try:
            data = json.loads(file.read_text())
            # Skip if it's the current session (already added)
            if data["session_id"] == current_session_id:
                continue
            completed_sessions.append(HistoryItem(
                session_id=data["session_id"],
                topic=data["topic"],
                timestamp=data["timestamp"],
                status=data["status"]
            ))
        except Exception:
            continue
    
    # Sort by timestamp (most recent first)
    completed_sessions.sort(key=lambda x: x.timestamp, reverse=True)
    history.extend(completed_sessions)
    
    return history

@app.get("/api/history/{session_id}")
async def get_history_item(session_id: str):
    """Get a specific history item"""
    history_file = HISTORY_DIR / f"{session_id}.json"
    
    if not history_file.exists():
        raise HTTPException(status_code=404, detail="History item not found")
    
    try:
        data = json.loads(history_file.read_text())
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history/{session_id}")
async def delete_history_item(session_id: str):
    """Delete a history item"""
    history_file = HISTORY_DIR / f"{session_id}.json"
    
    if not history_file.exists():
        raise HTTPException(status_code=404, detail="History item not found")
    
    history_file.unlink()
    return {"message": "History item deleted"}

@app.get("/api/markdown/{session_id}")
async def get_markdown(session_id: str):
    """Get generated markdown"""
    session = sessions.get(session_id)
    if not session:
        # Try loading from history
        history_file = HISTORY_DIR / f"{session_id}.json"
        if history_file.exists():
            data = json.loads(history_file.read_text())
            return {"markdown": data.get("markdown", "")}
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"markdown": session.markdown or ""}

@app.get("/api/images/{session_id}")
async def get_images(session_id: str):
    """Get list of generated images"""
    session = sessions.get(session_id)
    if not session:
        # Try loading from history
        history_file = HISTORY_DIR / f"{session_id}.json"
        if history_file.exists():
            data = json.loads(history_file.read_text())
            return {"images": data.get("images", [])}
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"images": session.images}

@app.get("/api/logs/{session_id}")
async def get_logs(session_id: str):
    """Get session logs"""
    session = sessions.get(session_id)
    if not session:
        # Try loading from history
        history_file = HISTORY_DIR / f"{session_id}.json"
        if history_file.exists():
            data = json.loads(history_file.read_text())
            return {"logs": data.get("logs", [])}
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"logs": session.logs}

def save_session_to_history(session: SessionResponse):
    """Save session to history file"""
    history_file = HISTORY_DIR / f"{session.session_id}.json"
    history_file.write_text(json.dumps(session.model_dump(), indent=2))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
