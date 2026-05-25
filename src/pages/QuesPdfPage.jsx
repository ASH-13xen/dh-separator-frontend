import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, Loader2, AlertTriangle, 
  Download, Trash2, Edit2, Save, X, History, Calendar, ExternalLink 
} from 'lucide-react';
import { 
  processQuesPdf, fetchQuesPdfHistory, updateQuesPdf, deleteQuesPdf 
} from '../services/api';

export default function QuesPdfPage() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentRecord, setCurrentRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Inline editing state
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingText, setEditingText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await fetchQuesPdfHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setCurrentRecord(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setErrorMsg('');
        setCurrentRecord(null);
      } else {
        setErrorMsg('Please upload a valid PDF file.');
      }
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg('');
    setCurrentRecord(null);
    setProgressStep(1); // 1. Uploading

    // Simulate progressive steps to keep UX beautiful and engaging
    const timer1 = setTimeout(() => setProgressStep(2), 2500); // 2. Gemini Scanning
    const timer2 = setTimeout(() => setProgressStep(3), 12000); // 3. Overlaying boxes
    const timer3 = setTimeout(() => setProgressStep(4), 16000); // 4. Saving

    try {
      const result = await processQuesPdf(file);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setProgressStep(5); // Complete
      
      setCurrentRecord(result.data);
      setFile(null);
      // Reload history to include the new one
      loadHistory();
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setErrorMsg(err.error || err.message || 'Failed to process PDF.');
      setIsProcessing(false);
    } finally {
      // Keep processing state active for a tiny split second so the completion check renders nicely
      setTimeout(() => setIsProcessing(false), 800);
    }
  };

  const handleDeleteRecord = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      await deleteQuesPdf(id);
      if (currentRecord && currentRecord._id === id) {
        setCurrentRecord(null);
      }
      loadHistory();
    } catch (err) {
      alert(err.error || 'Failed to delete record.');
    }
  };

  const startEditing = (index, currentText) => {
    setEditingIndex(index);
    setEditingText(currentText);
  };

  const cancelEditing = () => {
    setEditingIndex(-1);
    setEditingText('');
  };

  const saveEdit = async () => {
    if (!currentRecord) return;
    setIsSavingEdit(true);
    try {
      const updatedQuestions = [...currentRecord.questions];
      updatedQuestions[editingIndex].question_text = editingText;
      
      const response = await updateQuesPdf(currentRecord._id, updatedQuestions);
      setCurrentRecord(response.data);
      setEditingIndex(-1);
      setEditingText('');
      loadHistory();
    } catch (err) {
      alert(err.error || 'Failed to update question text.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans relative">
      
      <header className="max-w-4xl mx-auto text-center mt-10 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 mb-4">
          QuesPDF Maker
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload answer sheet PDFs containing text questions and handwritten answers. Our AI detects questions page-by-page and overlays a clean, high-contrast, formatted version at the top 20% of each page.
        </p>
      </header>

      <main className="max-w-5xl mx-auto space-y-12">
        
        {/* Upload Container */}
        {!isProcessing && !currentRecord && (
          <div className="bg-gray-800/40 border border-gray-700 p-8 rounded-3xl shadow-2xl backdrop-blur-sm max-w-3xl mx-auto">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-600 hover:border-teal-500 rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 bg-gray-900/40 relative group"
            >
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-lg text-white">
                    {file ? file.name : "Drag & Drop your Answer Sheet PDF here"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "or click to browse files from your disk"}
                  </p>
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Supports PDF only</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-6 bg-red-900/30 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 shadow-lg">
                <AlertTriangle className="text-red-400 flex-shrink-0" />
                <p className="font-medium text-sm">{errorMsg}</p>
              </div>
            )}

            {file && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleProcess}
                  className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold py-4 px-12 rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.3)] hover:shadow-[0_0_35px_rgba(20,184,166,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-lg"
                >
                  <CheckCircle2 className="w-5 h-5" /> Process & Inject Questions
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-gray-800/40 border border-gray-700 p-10 rounded-3xl shadow-2xl max-w-2xl mx-auto text-center space-y-8 backdrop-blur-sm">
            <div className="flex justify-center relative">
              <Loader2 className="w-16 h-16 animate-spin text-teal-400" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">Analyzing & Structuring PDF</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Please wait. This process takes a moment as we scan page-by-page, compile layouts, and draw overlaid content.
              </p>
            </div>

            {/* Stepper Display */}
            <div className="max-w-md mx-auto space-y-3.5 text-left border-t border-gray-700/50 pt-6">
              {[
                { label: "Uploading document buffer to AI pipeline", step: 1 },
                { label: "Gemini executing page-by-page questions search", step: 2 },
                { label: "Rendering question overlay text boxes on pages", step: 3 },
                { label: "Finalizing file compilation & database indexing", step: 4 }
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    progressStep > s.step 
                      ? 'bg-teal-500 text-gray-900' 
                      : progressStep === s.step 
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50 animate-pulse' 
                        : 'bg-gray-800 text-gray-500'
                  }`}>
                    {progressStep > s.step ? "✓" : s.step}
                  </div>
                  <span className={`text-sm ${
                    progressStep >= s.step ? 'text-gray-250 font-medium' : 'text-gray-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Panel */}
        {currentRecord && (
          <div className="bg-gray-800/40 border border-gray-700 p-8 rounded-3xl shadow-2xl space-y-8 backdrop-blur-sm max-w-4xl mx-auto animate-in fade-in zoom-in-98">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-700/50 pb-6">
              <div>
                <span className="bg-teal-500/10 border border-teal-500/20 text-teal-400 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase">
                  Processing Complete
                </span>
                <h2 className="text-2xl font-bold text-white mt-3 flex items-center gap-2">
                  <FileText className="text-teal-400 w-6 h-6" />
                  {currentRecord.originalName}
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Processed on {new Date(currentRecord.createdAt).toLocaleString()} | Found <strong className="text-teal-400">{currentRecord.questions.length}</strong> question(s).
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentRecord(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-2.5 px-6 rounded-xl transition-all text-sm flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Close Result
                </button>
                <a
                  href={currentRecord.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-2.5 px-6 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-all flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" /> Download Processed PDF
                </a>
              </div>
            </div>

            {/* Questions Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Extracted Questions & Map</span>
              </h3>
              
              <div className="border border-gray-700 rounded-2xl overflow-hidden bg-gray-900/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/60 border-b border-gray-700">
                      <th className="p-4 text-xs font-extrabold uppercase text-gray-400 tracking-wider w-24">Page</th>
                      <th className="p-4 text-xs font-extrabold uppercase text-gray-400 tracking-wider">Question Text</th>
                      <th className="p-4 text-xs font-extrabold uppercase text-gray-400 tracking-wider w-28 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecord.questions.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-gray-500 text-sm">
                          No questions were found/registered in this document.
                        </td>
                      </tr>
                    ) : (
                      currentRecord.questions.map((q, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/20 transition-all">
                          <td className="p-4 text-sm font-bold text-teal-400 align-top">
                            Page {q.page_number}
                          </td>
                          <td className="p-4 text-sm text-gray-200">
                            {editingIndex === idx ? (
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={3}
                                className="w-full bg-gray-800 border border-teal-500 rounded-xl py-2 px-3 text-white text-sm focus:outline-none"
                              />
                            ) : (
                              <p className="whitespace-pre-wrap">{q.question_text}</p>
                            )}
                          </td>
                          <td className="p-4 text-center align-top">
                            {editingIndex === idx ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={saveEdit}
                                  disabled={isSavingEdit}
                                  className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors disabled:opacity-50"
                                  title="Save changes"
                                >
                                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-2 bg-gray-700 hover:bg-gray-650 text-gray-300 rounded-lg transition-colors"
                                  title="Cancel editing"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditing(idx, q.question_text)}
                                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center mx-auto"
                                title="Edit Question Text"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="bg-gray-800/40 border border-gray-700 p-8 rounded-3xl shadow-2xl space-y-6 backdrop-blur-sm max-w-4xl mx-auto">
          <div className="flex items-center gap-3 border-b border-gray-700/50 pb-5">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">QuesPDF Log Library</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Browse through all previously processed files, check extracted question counts, edit contents, and re-download.
              </p>
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Your log library is empty. Upload a PDF answer sheet above to start tracking.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((record) => (
                <div 
                  key={record._id}
                  onClick={() => {
                    setCurrentRecord(record);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-gray-900/30 border border-gray-700 hover:border-teal-500/50 p-5 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-white group-hover:text-teal-400 transition-colors text-sm line-clamp-1">
                        {record.originalName}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteRecord(record._id, e)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-y-2 text-xs text-gray-400 gap-x-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                      <span className="bg-teal-500/10 px-2.5 py-0.5 rounded text-teal-400 font-extrabold text-[10px]">
                        {record.questions?.length || 0} Questions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-800 mt-4 pt-3.5">
                    <span className="text-xs text-teal-400 font-medium group-hover:underline flex items-center gap-1">
                      Inspect & Edit <ExternalLink className="w-3 h-3" />
                    </span>
                    <a
                      href={record.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-750 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-gray-700"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-400" /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
}
