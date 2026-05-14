import React, { useState } from 'react';
import PdfUploader from '../components/PdfUploader';
import ResultsViewer from '../components/ResultsViewer';
import { uploadPdf, updateToppers } from '../services/api';
import { AlertTriangle, CheckCircle2, Download, Save, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [topperForms, setTopperForms] = useState([]);
  const [isUpdatingToppers, setIsUpdatingToppers] = useState(false);

  const handleFileSubmit = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await uploadPdf(file, []); // No initial metadata
      const generatedResults = response.data || [];
      setResults(generatedResults);

      // Detect unique answer sheets
      let maxSheetIndex = 0;
      generatedResults.forEach(r => {
        if (r.answer_sheet_index > maxSheetIndex) {
          maxSheetIndex = r.answer_sheet_index;
        }
      });

      if (maxSheetIndex > 0) {
        const initialForms = Array.from({ length: maxSheetIndex }, () => ({
          topper_name: '',
          topper_year: '',
          topper_rank: '',
          topper_marks: ''
        }));
        setTopperForms(initialForms);
        setShowModal(true);
      }

    } catch (err) {
      setError(err.error || err.message || "Failed to process document.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTopperField = (index, field, value) => {
    const newForms = [...topperForms];
    newForms[index][field] = value;
    setTopperForms(newForms);
  };

  const handleSaveToppers = async () => {
    setIsUpdatingToppers(true);
    try {
      const updates = [];
      const updatedResults = [...results];

      results.forEach((record, rIdx) => {
        const sheetIdx = (record.answer_sheet_index || 1) - 1;
        const formData = topperForms[sheetIdx] || {};
        
        updates.push({
          file_url: record.file_url,
          topper_name: formData.topper_name || 'Unknown Topper',
          topper_year: formData.topper_year || '',
          topper_rank: formData.topper_rank || '',
          topper_marks: formData.topper_marks || ''
        });

        // Update local results
        updatedResults[rIdx] = {
          ...record,
          topper_name: formData.topper_name || 'Unknown Topper',
          topper_year: formData.topper_year || '',
          topper_rank: formData.topper_rank || '',
          topper_marks: formData.topper_marks || ''
        };
      });

      await updateToppers(updates);
      setResults(updatedResults);
      setShowModal(false);
    } catch (err) {
      alert("Failed to save topper details: " + (err.error || err.message));
    } finally {
      setIsUpdatingToppers(false);
    }
  };

 const handleDownloadPdf = () => {
  if (!results || results.length === 0) return;
  
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('UPSC Document Index Report', 14, 22);
  
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = results.map((item, index) => [
    index + 1,
    item.subject || 'Uncategorized',
    item.question_text || '-',
    item.topic || '', 
    `Pgs ${item.start_page || '?'}-${item.end_page || '?'}`
  ]);

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
            setFile(selected);
            setError(''); 
          }} 
          isProcessing={isLoading} 
        />

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 max-w-2xl mx-auto shadow-lg animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="text-red-400 flex-shrink-0" />
            <p className="font-medium text-sm md:text-base">{error}</p>
          </div>
        )}

        {file && !isLoading && !results.length && !error && (
          <div className="flex justify-center mt-6 animate-in fade-in zoom-in-95">
             <button
               onClick={handleFileSubmit}
               className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 px-12 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-lg"
             >
               <CheckCircle2 /> Process Document
             </button>
          </div>
        )}

        {results.length > 0 && (
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4 gap-4">
             <button
               onClick={handleDownloadPdf}
               className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all flex items-center gap-2"
             >
               <Download className="w-5 h-5" /> Download as PDF
             </button>
          </div>
        )}

        <ResultsViewer 
          results={results} 
          onResultUpdate={(updated) => {
            setResults(prev => prev.map(r => r._id === updated._id ? updated : r));
          }}
        />

      </main>

      {/* Topper Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-gray-900 border border-gray-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-indigo-400">Answer Sheets Detected</h2>
                <p className="text-sm text-gray-400 mt-1">We found {topperForms.length} distinct answer sheets. Please provide details (optional).</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {topperForms.map((form, idx) => (
                <div key={idx} className="bg-gray-800/50 border border-gray-700 p-5 rounded-xl space-y-4">
                  <h3 className="text-indigo-300 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    <span className="bg-indigo-600/30 px-2 py-0.5 rounded">Sheet {idx + 1}</span>
                  </h3>
                  
                  <div>
                    <input 
                      type="text" 
                      value={form.topper_name}
                      onChange={(e) => handleUpdateTopperField(idx, 'topper_name', e.target.value)}
                      placeholder="Topper Name (e.g. Shruti Sharma)"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={form.topper_year}
                      onChange={(e) => handleUpdateTopperField(idx, 'topper_year', e.target.value)}
                      placeholder="Year"
                      className="w-1/3 bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                    <input 
                      type="text" 
                      value={form.topper_rank}
                      onChange={(e) => handleUpdateTopperField(idx, 'topper_rank', e.target.value)}
                      placeholder="Rank (e.g. AIR 1)"
                      className="w-1/3 bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                    <input 
                      type="text" 
                      value={form.topper_marks}
                      onChange={(e) => handleUpdateTopperField(idx, 'topper_marks', e.target.value)}
                      placeholder="Marks"
                      className="w-1/3 bg-gray-900 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-800 bg-gray-800/30 flex justify-end gap-4 rounded-b-2xl">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button 
                onClick={handleSaveToppers}
                disabled={isUpdatingToppers}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2"
              >
                {isUpdatingToppers ? "Saving..." : "Save Details"} <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
