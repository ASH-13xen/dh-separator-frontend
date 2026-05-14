import React, { useState } from 'react';
import { UploadCloud, File, Loader2 } from 'lucide-react';

export default function PdfUploader({ onFileSelect, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF document.");
      return;
    }
    setSelectedFileName(file.name);
    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors duration-200 ease-in-out ${dragActive ? 'border-indigo-500 bg-indigo-50/10' : 'border-gray-600 bg-gray-800/40'} ${isProcessing ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-800'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-upload" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept="application/pdf"
          onChange={handleChange}
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center text-indigo-400">
            <Loader2 className="w-12 h-12 mb-4 animate-spin" />
            <p className="text-lg font-semibold tracking-wide">Processing Document...</p>
            <p className="text-sm text-gray-400 mt-2">Iterating through chunks and calling AI...</p>
          </div>
        ) : selectedFileName ? (
          <div className="flex flex-col items-center text-green-400">
             <File className="w-12 h-12 mb-4" />
             <p className="text-lg font-medium">{selectedFileName}</p>
             <p className="text-sm text-gray-400 mt-2">Click to change file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-300">
            <UploadCloud className="w-12 h-12 mb-4 text-gray-400" />
            <p className="mb-2 text-lg font-semibold">
               <span className="text-indigo-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">PDF documents only</p>
          </div>
        )}
      </div>
    </div>
  );
}