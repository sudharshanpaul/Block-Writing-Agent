import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateBlog = async (topic, sessionId = null) => {
  const response = await api.post('/api/generate', { topic, session_id: sessionId });
  return response.data;
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/api/session/${sessionId}`);
  return response.data;
};

export const getHistory = async () => {
  const response = await api.get('/api/history');
  return response.data;
};

export const getHistoryItem = async (sessionId) => {
  const response = await api.get(`/api/history/${sessionId}`);
  return response.data;
};

export const deleteHistoryItem = async (sessionId) => {
  const response = await api.delete(`/api/history/${sessionId}`);
  return response.data;
};

export const getMarkdown = async (sessionId) => {
  const response = await api.get(`/api/markdown/${sessionId}`);
  return response.data;
};

export const getImages = async (sessionId) => {
  const response = await api.get(`/api/images/${sessionId}`);
  return response.data;
};

export const getLogs = async (sessionId) => {
  const response = await api.get(`/api/logs/${sessionId}`);
  return response.data;
};

export const getCurrentSession = async () => {
  const response = await api.get('/api/current-session');
  return response.data;
};

export const connectWebSocket = (sessionId, callbacks) => {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/${sessionId}`);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    callbacks.onOpen?.();
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callbacks.onMessage?.(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    callbacks.onError?.(error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket closed');
    callbacks.onClose?.();
  };
  
  return ws;
};

export const getImageUrl = (filename) => {
  return `${API_BASE_URL}/images/${filename}`;
};

export default api;
