import React, { useState } from 'react';
import { UploadCloud, File, Loader2, Plus, Trash2 } from 'lucide-react';

export default function PdfUploader({ onFileSelect, metadataList, onUpdateMetadataList, isProcessing }) {
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

  const updateMetadata = (index, key, value) => {
    const newList = [...metadataList];
    newList[index] = { ...newList[index], [key]: value };
    onUpdateMetadataList(newList);
  };

  const handleAddTopper = () => {
    onUpdateMetadataList([...metadataList, { topperName: '', topperYear: '', topperRank: '', topperMarks: '' }]);
  };

  const handleRemoveTopper = (index) => {
    if (metadataList.length > 1) {
      const newList = metadataList.filter((_, i) => i !== index);
      onUpdateMetadataList(newList);
    }
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

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
           <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
             <span>Answer Sheets in PDF</span>
             <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{metadataList.length}</span>
           </h3>
           <button 
             onClick={handleAddTopper}
             disabled={isProcessing}
             className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
           >
             <Plus className="w-4 h-4" /> Add Topper
           </button>
        </div>

        <div className="space-y-6">
          {metadataList.map((meta, index) => (
            <div key={index} className="bg-gray-800/60 border border-gray-700 p-5 rounded-xl space-y-4 relative group">
               {metadataList.length > 1 && (
                 <button 
                   onClick={() => handleRemoveTopper(index)}
                   disabled={isProcessing}
                   className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                   title="Remove Sheet"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
               
               <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sheet #{index + 1} Topper Details</h4>
               
               <div>
                 <input 
                   type="text" 
                   value={meta.topperName || ''}
                   disabled={isProcessing}
                   onChange={(e) => updateMetadata(index, 'topperName', e.target.value)}
                   placeholder="e.g. Shruti Sharma"
                   className="w-full bg-gray-900/80 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                 />
               </div>
               <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                     <input 
                       type="text" value={meta.topperYear || ''}
                       onChange={(e) => updateMetadata(index, 'topperYear', e.target.value)} disabled={isProcessing}
                       placeholder="Year (e.g. 2021)"
                       className="w-full bg-gray-900/80 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 text-sm"
                     />
                  </div>
                  <div className="flex-1">
                     <input 
                       type="text" value={meta.topperRank || ''}
                       onChange={(e) => updateMetadata(index, 'topperRank', e.target.value)} disabled={isProcessing}
                       placeholder="Rank (e.g. AIR 1)"
                       className="w-full bg-gray-900/80 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 text-sm"
                     />
                  </div>
                  <div className="flex-1">
                     <input 
                       type="text" value={meta.topperMarks || ''}
                       onChange={(e) => updateMetadata(index, 'topperMarks', e.target.value)} disabled={isProcessing}
                       placeholder="Marks (Optional)"
                       className="w-full bg-gray-900/80 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 text-sm"
                     />
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}