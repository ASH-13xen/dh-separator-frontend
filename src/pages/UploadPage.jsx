import React, { useState } from 'react';
import PdfUploader from '../components/PdfUploader';
import ResultsViewer from '../components/ResultsViewer';
import { uploadPdf, updateToppers } from '../services/api';
import { AlertTriangle, CheckCircle2, Download, Save, X, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UploadPage({ 
  persistedFile, setPersistedFile,
  persistedResults, setPersistedResults,
  persistedError, setPersistedError
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Post-Processing Modal State
  const [showTopperModal, setShowTopperModal] = useState(false);
  const [detectedToppers, setDetectedToppers] = useState([]);
  const [isUpdatingToppers, setIsUpdatingToppers] = useState(false);

  const handleFileSubmit = async () => {
    if (!persistedFile) {
      setPersistedError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setPersistedError('');
    setPersistedResults([]);

    try {
      const response = await uploadPdf(persistedFile);
      const generatedData = response.data;
      setPersistedResults(generatedData);

      // Detect number of unique toppers based on answer_sheet_index
      const maxIndex = Math.max(0, ...generatedData.map(q => q.answer_sheet_index || 1));
      
      if (maxIndex > 0) {
        // Prepare initial empty states for each detected topper sheet
        const initialToppers = Array.from({ length: maxIndex }).map((_, i) => ({
          sheetIndex: i + 1,
          topperName: '',
          topperYear: '',
          topperRank: '',
          topperMarks: ''
        }));
        setDetectedToppers(initialToppers);
        setShowTopperModal(true); // Open Modal
      }

    } catch (err) {
      setPersistedError(err.error || err.message || "Failed to process document.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopperUpdate = (index, field, value) => {
    const updated = [...detectedToppers];
    updated[index][field] = value;
    setDetectedToppers(updated);
  };

  const handleSaveTopperDetails = async () => {
    setIsUpdatingToppers(true);
    try {
      const updates = [];
      
      persistedResults.forEach(result => {
         const sheetIdx = result.answer_sheet_index || 1;
         const topperInfo = detectedToppers.find(t => t.sheetIndex === sheetIdx);
         
         if (topperInfo && result.file_urls && result.file_urls.length > 0) {
           // We assume the first file_url represents this upload chunk
           updates.push({
             file_url: result.file_urls[0].url,
             topper_name: topperInfo.topperName || 'Unknown Topper',
             topper_year: topperInfo.topperYear,
             topper_rank: topperInfo.topperRank,
             topper_marks: topperInfo.topperMarks
           });
         }
      });

      if (updates.length > 0) {
        await updateToppers(updates);
        
        // Update local state to reflect new names
        setPersistedResults(prev => {
          try {
            return prev.map(result => {
               if (!result) return result;
               const sheetIdx = result.answer_sheet_index || 1;
               const topperInfo = detectedToppers.find(t => t.sheetIndex === sheetIdx);
               if (topperInfo && result.file_urls && Array.isArray(result.file_urls) && result.file_urls.length > 0) {
                 const updatedUrlObj = { 
                   ...result.file_urls[0], 
                   topper_name: topperInfo.topperName ? String(topperInfo.topperName) : 'Unknown Topper',
                   topper_year: topperInfo.topperYear ? String(topperInfo.topperYear) : undefined,
                   topper_rank: topperInfo.topperRank ? String(topperInfo.topperRank) : undefined,
                   topper_marks: topperInfo.topperMarks ? String(topperInfo.topperMarks) : undefined
                 };
                 return { ...result, file_urls: [updatedUrlObj] };
               }
               return result;
            });
          } catch (e) {
            console.error("Error updating local state:", e);
            return prev;
          }
        });
      }

      setShowTopperModal(false);
    } catch (err) {
      console.error("Failed to update topper details:", err);
      alert("Failed to save topper details. Continuing with defaults.");
      setShowTopperModal(false);
    } finally {
      setIsUpdatingToppers(false);
    }
  };

 const handleDownloadPdf = () => {
  if (!persistedResults || persistedResults.length === 0) return;
  
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('UPSC Document Index Report', 14, 22);
  
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = persistedResults.map((item, index) => {
    let subject = 'Uncategorized';
    let topic = '';
    
    if (item.tags && item.tags.length > 0) {
      subject = item.tags[0];
      topic = item.tags.slice(1).join(' > ');
    }

    return [
      index + 1,
      subject,
      item.question_text || '-',
      topic,
      `Pgs ${item.start_page || '?'}-${item.end_page || '?'}`
    ];
  });

  autoTable(doc, {
    startY: 35,
    head: [['#', 'Subject', 'Question', 'Syllabus Topic', 'Pages']], 
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 35 },
      2: { cellWidth: 60 },
      3: { cellWidth: 'auto' }, 
      4: { cellWidth: 20 },
    },
  });

  doc.save('UPSC_Document_Index.pdf');
};

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans relative">
      
      <header className="max-w-4xl mx-auto text-center mt-10 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
          UPSC AI Transcriber
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload massive handwritten notes and automatically extract, categorize, and reconstruct Q&A pairs into standard syllabus topics utilizing intelligent stateful chunking.
        </p>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        
        <PdfUploader 
          onFileSelect={(selected) => {
            setPersistedFile(selected);
            setPersistedError(''); 
          }} 
          isProcessing={isLoading} 
        />

        {persistedError && (
          <div className="bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 max-w-2xl mx-auto shadow-lg animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="text-red-400 flex-shrink-0" />
            <p className="font-medium text-sm md:text-base">{persistedError}</p>
          </div>
        )}

        {persistedFile && !isLoading && !persistedResults.length && !persistedError && (
          <div className="flex justify-center mt-6 animate-in fade-in zoom-in-95">
             <button
               onClick={handleFileSubmit}
               className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 px-12 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-lg"
             >
               <CheckCircle2 /> Process Document
             </button>
          </div>
        )}

        {persistedResults.length > 0 && (
          <div className="flex justify-end gap-4 animate-in fade-in slide-in-from-bottom-4">
             <button
               onClick={() => {
                 setPersistedFile(null);
                 setPersistedResults([]);
                 setPersistedError('');
               }}
               className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 hover:text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all flex items-center gap-2"
             >
               <RefreshCw className="w-5 h-5" /> Upload New
             </button>
             <button
               onClick={handleDownloadPdf}
               className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all flex items-center gap-2"
             >
               <Download className="w-5 h-5" /> Download as PDF
             </button>
          </div>
        )}

        <ResultsViewer 
          results={persistedResults} 
          onResultUpdate={(updated) => {
            setPersistedResults(prev => prev.map(r => r._id === updated._id ? updated : r));
          }}
        />

      </main>

      {/* Post-Processing Topper Details Modal */}
      {showTopperModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="text-green-400" />
                  Document Processed!
                </h2>
                <p className="text-gray-400 mt-1">
                  We detected <strong className="text-indigo-400">{detectedToppers.length}</strong> distinct answer sheet(s). Please enter the candidate details below.
                </p>
              </div>
              <button 
                onClick={() => setShowTopperModal(false)}
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
               {detectedToppers.map((topper, index) => (
                 <div key={index} className="bg-gray-800/40 border border-gray-700 p-5 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="bg-indigo-500/20 px-2 py-1 rounded">Sheet #{topper.sheetIndex}</span>
                    </h4>
                    
                    <div>
                      <input 
                        type="text" 
                        value={topper.topperName}
                        onChange={(e) => handleTopperUpdate(index, 'topperName', e.target.value)}
                        placeholder="Candidate Name (e.g. Shruti Sharma)"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                       <input 
                         type="text" value={topper.topperYear}
                         onChange={(e) => handleTopperUpdate(index, 'topperYear', e.target.value)}
                         placeholder="Year (e.g. 2021)"
                         className="flex-1 bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                       />
                       <input 
                         type="text" value={topper.topperRank}
                         onChange={(e) => handleTopperUpdate(index, 'topperRank', e.target.value)}
                         placeholder="Rank (e.g. AIR 1)"
                         className="flex-1 bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                       />
                       <input 
                         type="text" value={topper.topperMarks}
                         onChange={(e) => handleTopperUpdate(index, 'topperMarks', e.target.value)}
                         placeholder="Marks (Optional)"
                         className="flex-1 bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                       />
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-4 items-center">
               <button 
                 onClick={() => setShowTopperModal(false)}
                 className="text-gray-400 hover:text-white px-4 py-2 font-medium transition-colors"
               >
                 Skip for now
               </button>
               <button 
                 onClick={handleSaveTopperDetails}
                 disabled={isUpdatingToppers}
                 className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/50 transition-all disabled:opacity-50"
               >
                 {isUpdatingToppers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                 {isUpdatingToppers ? "Saving..." : "Save Details"}
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}