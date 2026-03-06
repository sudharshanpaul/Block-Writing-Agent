import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, FileText, Activity, Workflow, Loader2 } from 'lucide-react';
import { generateBlog, connectWebSocket, getHistoryItem } from '../api/client';
import WorkflowVisualization from './WorkflowVisualization';
import ImageViewer from './ImageViewer';
import MarkdownPreview from './MarkdownPreview';
import LogsViewer from './LogsViewer';
import MarkdownRenderer from './MarkdownRenderer';

const Chat = ({ sessionId, onNewSession, onGeneratingChange }) => {
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [workflowUpdates, setWorkflowUpdates] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [plan, setPlan] = useState(null);
  const [sections, setSections] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [markdown, setMarkdown] = useState('');
  const [logs, setLogs] = useState([]);
  
  // View states
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  
  // Update parent when generating state changes
  useEffect(() => {
    if (onGeneratingChange) {
      onGeneratingChange(isGenerating);
    }
  }, [isGenerating, onGeneratingChange]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async (sid) => {
    try {
      const data = await getHistoryItem(sid);
      setCurrentSession(data);
      setMessages([
        { role: 'user', content: data.topic },
      ]);
      setPlan(data.plan);
      setMarkdown(data.markdown || '');
      setGeneratedImages(data.images || []);
      setLogs(data.logs || []);
      
      // Set generating state based on status
      const isInProgress = data.status === 'in-progress' || data.status === 'pending';
      setIsGenerating(isInProgress);
      
      // If blog is complete, scroll to show it after a brief delay
      if (data.markdown && !isInProgress) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 200);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    const userMessage = { role: 'user', content: topic };
    setMessages([userMessage]);
    setIsGenerating(true);
    setWorkflowUpdates([]);
    setPlan(null);
    setSections([]);
    setGeneratedImages([]);
    setMarkdown('');
    setLogs([]);

    try {
      // Start generation
      const { session_id } = await generateBlog(topic);
      setCurrentSession({ session_id, topic });
      onNewSession(session_id);

      // Connect WebSocket
      wsRef.current = connectWebSocket(session_id, {
        onMessage: (data) => {
          console.log('WebSocket message:', data);
          
          // Add to logs
          setLogs(prev => [...prev, {
            timestamp: new Date().toISOString(),
            type: data.type,
            data: data.data
          }]);

          if (data.type === 'workflow') {
            setWorkflowUpdates(prev => [...prev, data]);
            const { node, status } = data.data;
            // Only update current node, don't add messages for each step
            if (status === 'in-progress') {
              setCurrentNode(node);
            } else if (status === 'completed') {
              setCurrentNode(null);
            }
          } else if (data.type === 'plan') {
            setPlan(data.data);
          } else if (data.type === 'section') {
            setSections(prev => [...prev, data.data]);
          } else if (data.type === 'images') {
            setGeneratedImages(data.data.images || []);
          } else if (data.type === 'complete') {
            const finalMarkdown = data.data.markdown || '';
            setMarkdown(finalMarkdown);
            setCurrentNode(null);
            setIsGenerating(false);
            // Auto-scroll to bottom to show the blog
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
          } else if (data.type === 'error') {
            addMessage('assistant', `❌ Error: ${data.data.message}`);
            setIsGenerating(false);
          }
        },
        onError: (error) => {
          console.error('WebSocket error:', error);
          addMessage('assistant', '❌ Connection error');
          setIsGenerating(false);
        },
        onClose: () => {
          setIsGenerating(false);
        }
      });

    } catch (error) {
      console.error('Failed to generate:', error);
      addMessage('assistant', `❌ Error: ${error.message}`);
      setIsGenerating(false);
    }

    setTopic('');
  };

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date().toISOString() }]);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSession(null);
    setWorkflowUpdates([]);
    setCurrentNode(null);
    setPlan(null);
    setSections([]);
    setGeneratedImages([]);
    setMarkdown('');
    setLogs([]);
    setIsGenerating(false);
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <h1 className="text-xl font-bold text-center flex-1">Blog Writing Agent</h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              New Chat
            </button>
          </div>
        </div>
        
        {/* Action buttons */}
        {(plan || markdown || generatedImages.length > 0 || workflowUpdates.length > 0) && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {plan && (
              <button
                onClick={() => setShowWorkflow(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
              >
                <Workflow size={16} />
                Workflow
              </button>
            )}
            {workflowUpdates.length > 0 && (
              <button
                onClick={() => setShowLogs(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <Activity size={16} />
                Logs ({logs.length})
              </button>
            )}
            {markdown && (
              <button
                onClick={() => setShowMarkdown(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                <FileText size={16} />
                Markdown
              </button>
            )}
            {generatedImages.length > 0 && (
              <button
                onClick={() => setShowImages(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                <Image size={16} />
                Images ({generatedImages.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <h2 className="text-2xl font-bold mb-2">Welcome to Blog Writing Agent</h2>
            <p className="mb-4">Enter a topic to generate a comprehensive blog post</p>
            <div className="text-left max-w-md mx-auto space-y-2">
              <p className="text-sm">✨ Try examples like:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• "Transformers in Deep Learning"</li>
                <li>• "Introduction to LangGraph"</li>
                <li>• "State of AI in 2026"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* Show current node being processed */}
            {currentNode && isGenerating && (
              <div className="flex justify-start">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg flex items-center gap-3">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="font-medium">Working on: {currentNode}</span>
                </div>
              </div>
            )}
            
            {/* Display blog inline after completion */}
            {markdown && !isGenerating && (
              <div className="w-full">
                <div className="w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <FileText size={20} className="text-green-600" />
                      Generated Blog
                    </h3>
                    <button
                      onClick={() => {
                        const blob = new Blob([markdown], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${currentSession?.topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'blog'}.md`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download Blog
                    </button>
                  </div>
                  <div className="p-8 max-h-[calc(100vh-300px)] overflow-auto bg-white">
                    <MarkdownRenderer content={markdown} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {isGenerating && !currentNode && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              <span>Initializing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic for your blog post..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
            <span>Generate</span>
          </button>
        </form>
      </div>

      {/* Modals */}
      {showWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Workflow Visualization</h2>
              <button
                onClick={() => setShowWorkflow(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <WorkflowVisualization workflowUpdates={workflowUpdates} />
            </div>
          </div>
        </div>
      )}
      
      {showImages && (
        <ImageViewer
          images={generatedImages}
          onClose={() => setShowImages(false)}
        />
      )}
      
      {showMarkdown && markdown && (
        <MarkdownPreview
          markdown={markdown}
          title={currentSession?.topic || 'Generated Blog'}
          onClose={() => setShowMarkdown(false)}
        />
      )}
      
      {showLogs && (
        <LogsViewer
          logs={logs}
          onClose={() => setShowLogs(false)}
        />
      )}
    </div>
  );
};

export default Chat;
