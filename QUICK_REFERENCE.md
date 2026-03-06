# Quick Reference Guide

Quick commands and references for development.

## 📁 Project Structure

```
Blog-Writing-Agent/
├── backend/         # FastAPI + LangGraph
├── frontend/        # React + Vite
├── setup.ps1        # Setup script
├── start-dev.ps1    # Development server starter
├── PROJECT_README.md    # Main documentation
└── ARCHITECTURE.md      # Technical architecture
```

## 🚀 Quick Start

```powershell
# 1. Setup (first time only)
.\setup.ps1

# 2. Configure API keys
# Edit backend/.env and add:
#   GOOGLE_API_KEY=...
#   TAVILY_API_KEY=...

# 3. Start development servers
.\start-dev.ps1

# 4. Open http://localhost:3000
```

## 🔧 Development Commands

### Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run server (development)
uvicorn main:app --reload --port 8000

# Run server (production)
uvicorn main:app --host 0.0.0.0 --port 8000

# View API docs
# http://localhost:8000/docs
```

### Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌐 URLs

### Local Development
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔑 API Keys

### Google AI (Gemini)
- Get key: https://makersuite.google.com/app/apikey
- Set in: `backend/.env` as `GOOGLE_API_KEY`

### Tavily Search
- Get key: https://tavily.com
- Set in: `backend/.env` as `TAVILY_API_KEY`

## 📡 API Endpoints

### Blog Generation
```bash
# Start generation
POST /api/generate
Body: {"topic": "Your Topic"}

# WebSocket connection
WS /ws/{session_id}
```

### Session Management
```bash
# Get session
GET /api/session/{session_id}

# Get markdown
GET /api/markdown/{session_id}

# Get images
GET /api/images/{session_id}

# Get logs
GET /api/logs/{session_id}
```

### History
```bash
# List all
GET /api/history

# Get specific
GET /api/history/{session_id}

# Delete
DELETE /api/history/{session_id}
```

## 🔍 Testing

### Backend Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test generate endpoint
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test Topic"}'
```

### Frontend Testing
```bash
# Check build
npm run build

# Test production build
npm run preview
```

## 🐛 Debugging

### Backend Logs
```python
# Add to main.py or agent.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Frontend Logs
```javascript
// Browser console
console.log('Debug info:', data);

// Network tab for API calls
// WebSocket tab for WS messages
```

### Common Issues

**WebSocket won't connect**:
- Check CORS settings in backend
- Verify WebSocket URL (ws:// or wss://)
- Check browser console for errors

**Images not generating**:
- Verify GOOGLE_API_KEY
- Check API quota
- Look for errors in backend logs

**Frontend build fails**:
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)

## 📦 Dependencies

### Backend
```
fastapi
uvicorn
langchain
langchain-google-genai
langgraph
tavily-python
google-genai
websockets
pydantic
```

### Frontend
```
react
react-dom
react-router-dom
axios
react-markdown
react-syntax-highlighter
reactflow
lucide-react
date-fns
```

##  Environment Variables

### Backend (.env)
```bash
GOOGLE_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 🎯 Workflow States

```
pending → in-progress → completed
                    ↘ error
```

## 📝 Git Commands

```bash
# Initial setup
git init
git add .
git commit -m "Initial commit"
git remote add origin [URL]
git push -u origin main

# Regular workflow
git add .
git commit -m "Description"
git push

# Check status
git status

# View changes
git diff
```

##  Support Resources

- GitHub Issues: [Your Repo URL]
- FastAPI Docs: https://fastapi.tiangolo.com
- React Docs: https://react.dev
- LangGraph Docs: https://langchain-ai.github.io/langgraph

## 💡 Tips

1. **Development**: Use `start-dev.ps1` to start both servers
2. **API Testing**: Use FastAPI's `/docs` for interactive testing
3. **Debugging**: Check both browser console and backend logs
4. **Performance**: Monitor API response times in Network tab

## 🎓 Learning Resources

- LangGraph: https://langchain-ai.github.io/langgraph/tutorials/
- FastAPI: https://fastapi.tiangolo.com/tutorial/
- React: https://react.dev/learn
- WebSockets: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

**Quick Reference** | Last Updated: March 2026
