# Blog Writing Agent - Backend

FastAPI backend for the Blog Writing Agent with LangGraph workflow.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
   - `GOOGLE_API_KEY`: Get from Google AI Studio
   - `TAVILY_API_KEY`: Get from Tavily

## Run Locally

```bash
uvicorn main:app --reload --port 8000
```

API will be available at http://localhost:8000

## API Endpoints

- `POST /api/generate`: Start blog generation
- `GET /api/session/{session_id}`: Get session details
- `GET /api/history`: Get all history
- `GET /api/history/{session_id}`: Get specific history item
- `DELETE /api/history/{session_id}`: Delete history item
- `GET /api/markdown/{session_id}`: Get generated markdown
- `GET /api/images/{session_id}`: Get generated images list
- `GET /api/logs/{session_id}`: Get session logs
- `WS /ws/{session_id}`: WebSocket for streaming updates

## Deploy to Render

1. Push code to GitHub
2. Connect repository to Render
3. Render will auto-detect `render.yaml`
4. Add environment variables in Render dashboard:
   - `GOOGLE_API_KEY`
   - `TAVILY_API_KEY`
5. Deploy!

## Documentation

Interactive API docs available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
