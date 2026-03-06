# Architecture Overview

This document explains the architecture and workflow of the Blog Writing Agent application.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Interface                          │
│                    React Frontend (Netlify)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   Chat     │  │  Workflow  │  │   Image    │  │  Markdown │ │
│  │ Interface  │  │Visualization│  │   Viewer   │  │  Preview  │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTP/WebSocket (REST + WS)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       Backend API Layer                          │
│                   FastAPI Server (Render)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   REST     │  │ WebSocket  │  │  Session   │  │  History  │ │
│  │  Endpoints │  │  Streaming │  │  Manager   │  │  Storage  │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                         LangGraph
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Agent Workflow (LangGraph)                  │
│                                                                   │
│    ┌──────────┐                                                  │
│    │  Router  │  ──►  Decides if research needed                │
│    └────┬─────┘                                                  │
│         │                                                         │
│    ┌────▼─────┐                                                  │
│    │ Research │  ──►  Web search (Tavily)                       │
│    └────┬─────┘                                                  │
│         │                                                         │
│  ┌──────▼────────┐                                               │
│  │ Orchestrator  │  ──►  Creates blog plan                      │
│  └──────┬────────┘                                               │
│         │                                                         │
│  ┌──────▼────────┐                                               │
│  │  Worker(s)    │  ──►  Parallel section writing               │
│  └──────┬────────┘                                               │
│         │                                                         │
│  ┌──────▼────────┐                                               │
│  │   Reducer     │  ──►  Merge + generate images                │
│  └───────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                    External Services
                              │
┌─────────────────────────────────────────────────────────────────┐
│  ┌────────────┐        ┌────────────┐       ┌────────────┐     │
│  │   Google   │        │   Tavily   │       │   File     │     │
│  │   Gemini   │        │   Search   │       │  Storage   │     │
│  │    API     │        │    API     │       │  (Images)  │     │
│  └────────────┘        └────────────┘       └────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (React + Vite)

**Location**: `frontend/`

**Key Components**:

1. **App.jsx**: Main application container with sidebar and routing
2. **Chat.jsx**: Main chat interface with message handling
3. **History.jsx**: Conversation history sidebar
4. **WorkflowVisualization.jsx**: Real-time node graph using ReactFlow
5. **ImageViewer.jsx**: Gallery for generated images
6. **MarkdownPreview.jsx**: Rendered blog content
7. **LogsViewer.jsx**: Detailed execution logs

**Communication**:
- REST API calls for CRUD operations
- WebSocket for real-time streaming updates

**State Management**:
- Local React state (useState, useEffect)
- WebSocket connection management
- Session persistence

### Backend (FastAPI + LangGraph)

**Location**: `backend/`

**Key Files**:

1. **main.py**: FastAPI application with endpoints and WebSocket
2. **agent.py**: LangGraph agent implementation

**Endpoints**:
- `POST /api/generate`: Start blog generation
- `GET /api/session/{id}`: Get session data
- `GET /api/history`: List conversations
- `WS /ws/{id}`: WebSocket streaming

**Session Management**:
- In-memory storage for active sessions
- File-based persistence for history
- WebSocket connection per session

### Agent Workflow (LangGraph)

**Location**: `backend/agent.py`

#### Node 1: Router
**Purpose**: Decide if web research is needed

**Input**: Topic string

**Output**:
- `mode`: "closed_book", "hybrid", or "open_book"
- `needs_research`: boolean
- `queries`: List of search queries

**Logic**:
```
Evergreen topics (concepts) → closed_book
Mixed topics → hybrid
Current events/news → open_book
```

#### Node 2: Research (Conditional)
**Purpose**: Gather web information

**Input**: Search queries

**Output**: Evidence items (title, URL, snippet, date)

**Process**:
1. Execute Tavily searches for each query
2. Deduplicate results by URL
3. Extract and format evidence

#### Node 3: Orchestrator
**Purpose**: Create detailed blog plan

**Input**:
- Topic
- Mode
- Evidence (if available)

**Output**: Plan object with:
- Blog title
- Audience & tone
- 5-9 tasks (sections) with:
  - Goal
  - 3-6 bullets
  - Target word count
  - Flags (research, citations, code)

**Logic**:
- Analyzes topic complexity
- Designs section structure
- Allocates word counts
- Determines requirements

#### Node 4: Workers (Parallel)
**Purpose**: Write individual sections

**Input** (per worker):
- Task details
- Plan context
- Evidence

**Output**: Section markdown

**Process**:
- Follows task bullets
- Includes code if required
- Cites evidence URLs
- Maintains target word count

**Parallelization**: One worker per section

#### Node 5: Reducer
**Purpose**: Merge and finalize

**Input**: All section markdown

**Output**: Complete blog

**Process**:
1. Order sections by task ID
2. Merge into single document
3. Decide if images needed
4. Generate images (Gemini)
5. Insert images into markdown
6. Save to file

### Data Flow

#### Creating a Blog

```
1. User enters topic in frontend
   ↓
2. Frontend calls POST /api/generate
   ↓
3. Backend creates session, returns session_id
   ↓
4. Frontend opens WebSocket to /ws/{session_id}
   ↓
5. Backend runs LangGraph workflow:
   
   Router → Research → Orchestrator → Workers → Reducer
   
   Each node sends updates via WebSocket:
   - workflow: Node status updates
   - plan: Blog plan created
   - section: Section completed
   - images: Images generated
   - complete: Final markdown
   ↓
6. Frontend receives updates and updates UI:
   - Adds messages to chat
   - Updates workflow visualization
   - Stores logs
   ↓
7. Backend saves to history
   ↓
8. User can view markdown, images, logs
```

#### Loading History

```
1. User clicks history item
   ↓
2. Frontend calls GET /api/history/{session_id}
   ↓
3. Backend loads from history file
   ↓
4. Frontend displays:
   - Original topic
   - Generated markdown
   - Images
   - Logs
```

### State Management

#### Backend State

**Session State** (in-memory):
```python
{
  "session_id": str,
  "topic": str,
  "status": str,
  "plan": dict,
  "markdown": str,
  "images": list[str],
  "logs": list[dict]
}
```

**History State** (file system):
- JSON files in `backend/history/`
- One file per session
- Same structure as session state

#### Frontend State

**Chat Component**:
- `messages`: Chat messages
- `isGenerating`: Loading state
- `currentSession`: Active session
- `workflowUpdates`: Node updates
- `plan`: Blog plan
- `sections`: Completed sections
- `generatedImages`: Image filenames
- `markdown`: Final markdown
- `logs`: Execution logs

**History Component**:
- `history`: List of past sessions

### WebSocket Protocol

**Message Format**:
```json
{
  "type": "workflow|plan|section|images|complete|error",
  "data": {
    // Type-specific data
  }
}
```

**Message Types**:

1. **workflow**: Node status update
```json
{
  "type": "workflow",
  "data": {
    "node": "router|research|orchestrator|worker|reducer",
    "status": "completed|in-progress|error"
  }
}
```

2. **plan**: Blog plan created
```json
{
  "type": "plan",
  "data": {
    "blog_title": str,
    "tasks": [...]
  }
}
```

3. **section**: Section completed
```json
{
  "type": "section",
  "data": {
    "task_id": int,
    "content": str
  }
}
```

4. **images**: Images generated
```json
{
  "type": "images",
  "data": {
    "images": ["filename1.png", ...]
  }
}
```

5. **complete**: Generation finished
```json
{
  "type": "complete",
  "data": {
    "markdown": str,
    "images": [...]
  }
}
```

### External Services

#### Google Gemini AI
**Purpose**: 
- LLM for text generation (planning, writing)
- Image generation

**Models**:
- `gemini-2.5-flash`: Text generation
- `gemini-2.5-flash-image`: Image generation

**Rate Limits**: Check Google AI quota

#### Tavily Search
**Purpose**: Web research

**Usage**: 3-10 queries per generation

**Rate Limits**: Free tier available

### Performance Considerations

1. **Parallel Processing**: Workers run concurrently
2. **Streaming**: Real-time updates via WebSocket
3. **Caching**: Consider caching research results
4. **Cold Starts**: Render free tier has cold starts
5. **Image Generation**: Slowest step (5-15 seconds per image)

### Security

1. **API Keys**: Stored in environment variables
2. **CORS**: Restricted to frontend domain
3. **WebSocket**: Session-based authentication
4. **Rate Limiting**: Not implemented (consider adding)
5. **Input Validation**: Pydantic models

### Scalability

**Current Limitations**:
- In-memory session storage (use Redis for scale)
- File-based history (use database for scale)
- Single server (use load balancer for scale)
- Synchronous image generation (use job queue)

**Recommended for Production**:
- Redis for session management
- PostgreSQL for history
- S3 for image storage
- Celery for background tasks
- Multiple backend instances

### Error Handling

**Frontend**:
- WebSocket reconnection logic
- Error message display
- Graceful degradation

**Backend**:
- Try-catch in each node
- Error messages via WebSocket
- Fallback for image generation failures

### Monitoring

**Logs**:
- Backend: Uvicorn access logs
- Frontend: Browser console
- Deployment: Render/Netlify logs

**Metrics**:
- Generation time
- API call counts
- Error rates
- WebSocket connections

## Workflow Explanation

The Blog Writing Agent follows a structured workflow to generate high-quality blog content. Below is a detailed explanation of the workflow:

### 1. User Input
- The user provides a topic for the blog through the frontend interface.
- The topic is sent to the backend via a `POST /api/generate` request.

### 2. Backend Processing
- The backend initializes a session and assigns a unique `session_id`.
- A WebSocket connection is established to stream real-time updates to the frontend.

#### Workflow Nodes
The backend uses a LangGraph-based workflow with the following nodes:

1. **Router**:
   - Decides whether web research is needed based on the topic.
   - Outputs:
     - `mode`: Determines the workflow type (`closed_book`, `hybrid`, or `open_book`).
     - `needs_research`: Boolean indicating if research is required.
     - `queries`: List of search queries for research.

2. **Research** (Conditional):
   - Conducts web searches using Tavily API.
   - Outputs:
     - Evidence items (title, URL, snippet, date).

3. **Orchestrator**:
   - Creates a detailed blog plan, including:
     - Blog title.
     - Audience and tone.
     - Tasks for each section (goal, bullets, word count, etc.).

4. **Workers**:
   - Write individual sections of the blog in parallel.
   - Outputs:
     - Markdown content for each section.

5. **Reducer**:
   - Merges all sections into a complete blog.
   - Generates images using Google Gemini API if required.
   - Outputs:
     - Final markdown with embedded images.

### 3. Real-Time Updates
- The backend streams updates to the frontend via WebSocket:
  - Node status updates.
  - Blog plan creation.
  - Section completion.
  - Image generation.
  - Final markdown.

### 4. Frontend Display
- The frontend updates the user interface based on WebSocket messages:
  - Displays the workflow visualization.
  - Shows the generated blog content and images.
  - Logs the execution process.

### 5. History Management
- The backend saves session data to the history directory.
- Users can view past sessions by loading history files.

### 6. External Services
- **Google Gemini API**: Used for text and image generation.
- **Tavily Search API**: Used for web research.

### Summary
This workflow ensures efficient and high-quality blog generation by leveraging modular nodes, parallel processing, and real-time updates.
