import React, { useEffect, useState } from 'react';
import { Trash2, Clock, ChevronRight, Zap } from 'lucide-react';
import { getHistory, deleteHistoryItem } from '../api/client';
import { format } from 'date-fns';

const History = ({ onSelectSession, currentSessionId, isGenerating }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    
    // Refresh history periodically when generating
    let interval;
    if (isGenerating) {
      interval = setInterval(loadHistory, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteHistoryItem(sessionId);
        setHistory(history.filter(item => item.session_id !== sessionId));
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete conversation');
      }
    }
  };

  const formatDate = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMM d, HH:mm');
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2">Loading history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p>No history yet</p>
        <p className="text-sm mt-1">Your conversations will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b text-center">
        <h2 className="font-bold text-lg">History</h2>
        <p className="text-xs text-gray-500 mt-1">{history.length} conversations</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {history.map((item, index) => {
          const isActive = item.session_id === currentSessionId;
          const isInProgress = item.status === 'in-progress' || item.status === 'pending';
          const isFirst = index === 0 && isInProgress;
          
          return (
            <div key={item.session_id}>
              {isFirst && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                    <Zap size={12} className="animate-pulse" />
                    Current Blog
                  </p>
                </div>
              )}
              <div
                onClick={() => onSelectSession(item.session_id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                } ${isInProgress && isFirst ? 'bg-gradient-to-r from-blue-50 to-transparent' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.topic}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{formatDate(item.timestamp)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        item.status === 'completed' ? 'bg-green-100 text-green-700' :
                        item.status === 'error' ? 'bg-red-100 text-red-700' :
                        item.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {(item.status === 'in-progress' || item.status === 'pending') && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        )}
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.status === 'completed' && (
                      <button
                        onClick={(e) => handleDelete(item.session_id, e)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;
