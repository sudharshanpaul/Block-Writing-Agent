import React from 'react';
import { X, Download, Copy } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const MarkdownPreview = ({ markdown, onClose, title = "Markdown Preview" }) => {
  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    alert('Markdown copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Copy to clipboard"
            >
              <Copy size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Download"
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
        
        <div className="overflow-auto flex-1 bg-white p-6">
          {markdown ? (
            <MarkdownRenderer content={markdown} />
          ) : (
            <p className="text-gray-500">No markdown content available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkdownPreview;
