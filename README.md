# Blog Writing Agent - Full Stack Application

An intelligent blog writing agent powered by LangGraph, Google Gemini, and Tavily Search. This application features a React frontend and FastAPI backend, deployed on Netlify and Render respectively.

## 🌟 Features

### Backend (FastAPI + LangGraph)
- **Intelligent Routing**: Automatically determines if web research is needed
- **Web Research**: Uses Tavily API for up-to-date information
- **Multi-Node Workflow**: Router → Research → Orchestrator → Workers → Reducer
- **Parallel Processing**: Multiple sections written concurrently
- **Image Generation**: Creates relevant diagrams using Gemini
- **WebSocket Streaming**: Real-time progress updates

### Frontend (React)
- **Chat Interface**: ChatGPT-like conversation UI
- **Workflow Visualization**: Real-time node graph showing agent progress
- **Image Viewer**: Gallery of generated images
- **Markdown Preview**: Rendered blog with syntax highlighting
- **Logs Viewer**: Detailed execution logs
- **History Management**: Persistent conversation storage

## 📁 Project Structure

```
Blog-Writing-Agent/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── agent.py             # LangGraph agent logic
│   ├── requirements.txt     # Python dependencies
│   ├── render.yaml          # Render deployment config
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── History.jsx
│   │   │   ├── WorkflowVisualization.jsx
│   │   │   ├── ImageViewer.jsx
│   │   │   ├── MarkdownPreview.jsx
│   │   │   └── LogsViewer.jsx
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── netlify.toml          # Netlify deployment config
│   └── README.md
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google AI API Key ([Get it here](https://makersuite.google.com/app/apikey))
- Tavily API Key ([Get it here](https://tavily.com))

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key
```

5. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Run development server:
```bash
npm run dev
```

Frontend will be available at http://localhost:3000


## 🔑 API Endpoints

- `POST /api/generate` - Start blog generation
- `GET /api/session/{session_id}` - Get session details
- `GET /api/history` - Get all conversation history
- `GET /api/history/{session_id}` - Get specific conversation
- `DELETE /api/history/{session_id}` - Delete conversation
- `GET /api/markdown/{session_id}` - Get generated markdown
- `GET /api/images/{session_id}` - Get generated images
- `GET /api/logs/{session_id}` - Get execution logs
- `WS /ws/{session_id}` - WebSocket for real-time updates

## 🛠️ Tech Stack

### Backend
- FastAPI
- LangGraph
- LangChain
- Google Gemini AI
- Tavily Search
- Pydantic
- WebSockets

### Frontend
- React 18
- Vite
- TailwindCSS
- ReactFlow
- React Markdown
- Axios
- Lucide React

## 📝 Usage

1. Enter a blog topic in the chat interface
2. Watch the workflow visualization as the agent processes:
   - **Router**: Decides if research is needed
   - **Research**: Gathers information from the web (if needed)
   - **Orchestrator**: Creates a detailed blog plan
   - **Workers**: Write individual sections in parallel
   - **Reducer**: Merges sections and generates images
3. View the results:
   - Click "Markdown" to see the formatted blog
   - Click "Images" to view generated diagrams
   - Click "Logs" to see execution details
   - Click "Workflow" to see the node graph

## 🎯 Example Topics

- "Introduction to Transformers in Deep Learning"
- "Building a REST API with FastAPI"
- "React Hooks: A Complete Guide"
- "State of AI in 2026"
- "Microservices Architecture Patterns"

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

If you encounter any issues, please create an issue on GitHub.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.
