import React from 'react';
import { X, Download } from 'lucide-react';
import { format } from 'date-fns';

const LogsViewer = ({ logs, onClose }) => {
  const handleDownload = () => {
    const logsText = logs
      .map(log => `[${log.timestamp}] ${log.stage || log.type}: ${JSON.stringify(log.data || log.message, null, 2)}`)
      .join('\n\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm:ss.SSS');
    } catch {
      return timestamp;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'workflow':
        return 'text-blue-600 bg-blue-50';
      case 'plan':
        return 'text-purple-600 bg-purple-50';
      case 'section':
        return 'text-green-600 bg-green-50';
      case 'complete':
        return 'text-emerald-600 bg-emerald-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-xl font-bold">Execution Logs ({logs?.length || 0})</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Download logs"
              disabled={!logs || logs.length === 0}
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="overflow-auto flex-1 font-mono text-sm">
          {logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${getLogColor(log.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs opacity-70 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className="font-semibold">
                      [{log.stage || log.type || 'INFO'}]
                    </span>
                  </div>
                  <div className="mt-1 pl-20">
                    {typeof log.data === 'string' ? (
                      <span>{log.data}</span>
                    ) : log.message ? (
                      <span>{log.message}</span>
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-8">No logs available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
