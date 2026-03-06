import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Chat from './components/Chat';
import History from './components/History';

function App() {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  const handleNewSession = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  const handleGeneratingChange = (generating) => {
    setIsGenerating(generating);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-80' : 'w-0'
        } bg-white border-r transition-all duration-300 overflow-hidden relative`}
      >
        {/* Close Button - Circular in left corner */}
        <button
          onClick={() => setShowSidebar(false)}
          className="absolute top-4 left-4 z-20 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors shadow-sm"
          title="Close sidebar"
        >
          <X size={18} />
        </button>
        
        {/* History Content */}
        <History
          onSelectSession={handleSelectSession}
          currentSessionId={currentSessionId}
          isGenerating={isGenerating}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toggle Sidebar Button (only show when sidebar is closed) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Chat Area */}
        <div className="flex-1">
          <Chat
            sessionId={currentSessionId}
            onGeneratingChange={handleGeneratingChange}
            onNewSession={handleNewSession}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
