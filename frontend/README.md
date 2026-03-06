# Blog Writing Agent - Frontend

React frontend for the Blog Writing Agent with real-time workflow visualization.

## Features

- 💬 ChatGPT-like interface
- 📊 Real-time workflow visualization
- 🖼️ Image viewer for generated images
- 📝 Markdown preview with syntax highlighting
- 📋 Execution logs viewer
- 💾 Conversation history
- 🔄 WebSocket streaming for live updates

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Development

Run the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Build

Build for production:
```bash
npm run build
```

The build output will be in the `dist` directory.

## Deploy to Netlify

### Option 1: Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Deploy:
```bash
netlify deploy --prod
```

### Option 2: Git Deploy

1. Push code to GitHub
2. Connect repository to Netlify
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables:
   - `VITE_API_URL`: Your backend URL from Render
   - `VITE_WS_URL`: Your backend WebSocket URL from Render
5. Deploy!

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)
- `VITE_WS_URL`: Backend WebSocket URL (default: ws://localhost:8000)

## Tech Stack

- React 18
- Vite
- TailwindCSS
- ReactFlow (workflow visualization)
- React Markdown
- Axios
- Lucide React (icons)
