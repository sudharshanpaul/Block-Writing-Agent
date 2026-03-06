import React from 'react';
import { X } from 'lucide-react';
import { getImageUrl } from '../api/client';

const ImageViewer = ({ images, onClose }) => {
  if (!images || images.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Generated Images</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-500">No images generated yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
          <h2 className="text-xl font-bold">Generated Images ({images.length})</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((filename, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <img
                src={getImageUrl(filename)}
                alt={`Generated image ${index + 1}`}
                className="w-full h-auto"
              />
              <div className="p-2 bg-gray-50">
                <p className="text-sm text-gray-600 truncate">{filename}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
