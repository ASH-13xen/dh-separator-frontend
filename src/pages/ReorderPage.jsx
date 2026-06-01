import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, Loader2, AlertTriangle, 
  Download, Trash2, Edit2, Save, X, History, Calendar, ExternalLink,
  ArrowUp, ArrowDown, GripVertical, RefreshCw, Eye, Sparkles, ArrowRight
} from 'lucide-react';
import { 
  processReorderPdf, 
  fetchReorderHistory, 
  updateReorderRecord, 
  compileReorderPdf, 
  deleteReorderRecord,
  fetchTags
} from '../services/api';

export default function ReorderPage() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentRecord, setCurrentRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Compile overlays
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState(0);

  // Inline editing state
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingText, setEditingText] = useState('');

  // PDF Preview url for the side iframe modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

  // Subject Selection Modal States
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  // Load history and tags on mount
  useEffect(() => {
    loadHistory();
    fetchTags().then(tags => {
      const modules = tags.filter(t => t.startsWith('GS-') || t.startsWith('OptionalSubject'));
      setAvailableSubjects(modules.sort());
    }).catch(console.error);
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await fetchReorderHistory();
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

    // Beautiful progressive feedback
    const timer1 = setTimeout(() => setProgressStep(2), 2500); // 2. Gemini Scanning
    const timer2 = setTimeout(() => setProgressStep(3), 10000); // 3. Splitting
    const timer3 = setTimeout(() => setProgressStep(4), 16000); // 4. Cloudinary upload

    try {
      const result = await processReorderPdf(file);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setProgressStep(5); // Complete
      
      setCurrentRecord(result.data);
      setFile(null);
      loadHistory();
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setErrorMsg(err.error || err.message || 'Failed to process PDF.');
      setIsProcessing(false);
    } finally {
      setTimeout(() => setIsProcessing(false), 800);
    }
  };

  const saveNewChunksSequence = async (newChunks) => {
    if (!currentRecord) return;
    
    // Optimistic UI update (and reset compiled PDF state since it is now dirty)
    setCurrentRecord(prev => ({ ...prev, chunks: newChunks, pdfUrl: null }));

    try {
      const response = await updateReorderRecord(currentRecord._id, newChunks);
      setCurrentRecord(response.data);
    } catch (err) {
      console.error(err);
      alert('Failed to save updated sequence to database.');
    }
  };

  const handleMoveChunk = (index, direction) => {
    if (!currentRecord) return;
    const newChunks = [...currentRecord.chunks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newChunks.length) return;

    // Swap
    const temp = newChunks[index];
    newChunks[index] = newChunks[targetIndex];
    newChunks[targetIndex] = temp;

    saveNewChunksSequence(newChunks);
  };

  const handleDeleteChunk = (index) => {
    if (!currentRecord) return;
    if (!window.confirm("Are you sure you want to exclude this chunk? It will be removed from the compiled PDF.")) return;

    const newChunks = [...currentRecord.chunks];
    newChunks.splice(index, 1);
    saveNewChunksSequence(newChunks);
  };

  // Drag and drop handlers for flat reordering
  const handleChunkDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleChunkDrop = (e, destIndex) => {
    e.preventDefault();
    const srcIndexStr = e.dataTransfer.getData('text/plain');
    if (srcIndexStr === '') return;
    const srcIndex = parseInt(srcIndexStr, 10);
    if (srcIndex === destIndex) return;

    const newChunks = [...currentRecord.chunks];
    const [moved] = newChunks.splice(srcIndex, 1);
    newChunks.splice(destIndex, 0, moved);

    saveNewChunksSequence(newChunks);
  };

  const handleStartEditingText = (index, text) => {
    setEditingIndex(index);
    setEditingText(text);
  };

  const handleSaveTextEdit = () => {
    if (!currentRecord || editingIndex === -1) return;
    const newChunks = [...currentRecord.chunks];
    newChunks[editingIndex].question_text = editingText;
    
    saveNewChunksSequence(newChunks);
    setEditingIndex(-1);
  };

  const handleDeleteRecord = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this PDF reorder project?')) return;

    try {
      await deleteReorderRecord(id);
      if (currentRecord && currentRecord._id === id) {
        setCurrentRecord(null);
      }
      loadHistory();
    } catch (err) {
      alert(err.error || 'Failed to delete record.');
    }
  };

  const handleCompile = async (subjectVal) => {
    if (!currentRecord) return;
    setIsCompiling(true);
    setCompileStep(1); // 1. Initializing

    const timer1 = setTimeout(() => setCompileStep(2), 2000); // 2. Tagging & Downloading
    const timer2 = setTimeout(() => setCompileStep(3), 6000); // 3. Structuring & Merging
    const timer3 = setTimeout(() => setCompileStep(4), 11000); // 4. Finalizing

    try {
      const response = await compileReorderPdf(currentRecord._id, subjectVal);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setCompileStep(5);
      
      setCurrentRecord(response.data);
      loadHistory();
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      alert(err.error || err.message || 'Failed to compile PDF.');
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans relative">
      
      <header className="max-w-4xl mx-auto text-center mt-10 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-4 flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
          PDF Split & Reorder
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload large Q&A handwritten exam scripts. We scan, split the PDF into question-answer page chunks, and let you reorder or remove sections to reconstruct a polished, final document.
        </p>
      </header>

      <main className="max-w-5xl mx-auto space-y-12">
        
        {/* Upload Container */}
        {!isProcessing && !currentRecord && (
          <div className="bg-gray-800/40 border border-gray-700 p-8 rounded-3xl shadow-2xl backdrop-blur-sm max-w-3xl mx-auto">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-600 hover:border-violet-500 rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 bg-gray-900/40 relative group"
            >
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-lg text-white">
                    {file ? file.name : "Drag & Drop your Q&A PDF here"}
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
                  className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white font-extrabold py-4 px-12 rounded-xl shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-lg"
                >
                  <CheckCircle2 className="w-5 h-5" /> Upload & Parse Document
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-gray-800/40 border border-gray-700 p-10 rounded-3xl shadow-2xl max-w-2xl mx-auto text-center space-y-8 backdrop-blur-sm">
            <div className="flex justify-center relative">
              <Loader2 className="w-16 h-16 animate-spin text-violet-400" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">Analyzing & Splitting PDF</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Gemini is identifying questions and page ranges, then we split and cache your segments safely on Cloudinary.
              </p>
            </div>

            {/* Stepper Display */}
            <div className="max-w-md mx-auto space-y-3.5 text-left border-t border-gray-700/50 pt-6">
              {[
                { label: "Uploading file buffer to parsing pipeline", step: 1 },
                { label: "Gemini executing page-by-page QA boundaries search", step: 2 },
                { label: "Splitting PDF pages into distinct chunk files", step: 3 },
                { label: "Caching individual PDF chunks to Cloudinary", step: 4 }
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    progressStep > s.step 
                      ? 'bg-violet-500 text-gray-900' 
                      : progressStep === s.step 
                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/50 animate-pulse' 
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

        {/* Compile/Merge Processing Overlay */}
        {isCompiling && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 p-10 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-8 animate-in zoom-in-95">
              <Loader2 className="w-14 h-14 animate-spin text-violet-400 mx-auto" />
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">Reconstructing Document</h3>
                <p className="text-sm text-gray-400">Please do not close this tab. We are compiling your custom sequence into a final PDF.</p>
              </div>

              <div className="space-y-3 text-left border-t border-gray-800 pt-6 max-w-xs mx-auto">
                {[
                  { label: "Downloading sequence chunks", step: 2 },
                  { label: "Merging PDF buffers using pdf-lib", step: 3 },
                  { label: "Uploading final document to Cloudinary", step: 4 }
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      compileStep > s.step 
                        ? 'bg-violet-500 text-gray-900' 
                        : compileStep === s.step 
                          ? 'bg-violet-500/25 text-violet-400 border border-violet-500/50 animate-pulse' 
                          : 'bg-gray-800 text-gray-650'
                    }`}>
                      {compileStep > s.step ? "✓" : s.step - 1}
                    </div>
                    <span className={`text-xs ${
                      compileStep >= s.step ? 'text-gray-200' : 'text-gray-650'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active PDF Editor Workspace */}
        {currentRecord && (
          <div className="bg-gray-800/40 border border-gray-700 p-8 rounded-3xl shadow-2xl space-y-8 backdrop-blur-sm max-w-4xl mx-auto animate-in fade-in zoom-in-98">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-700/50 pb-6">
              <div>
                <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-widest uppercase">
                  Active workspace
                </span>
                <h2 className="text-2xl font-bold text-white mt-3 flex items-center gap-2">
                  <FileText className="text-violet-400 w-6 h-6" />
                  {currentRecord.originalName}
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Uploaded {new Date(currentRecord.createdAt).toLocaleString()} | Current: <strong className="text-violet-400">{currentRecord.chunks.length}</strong> active segments.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentRecord(null)}
                  className="bg-gray-750 hover:bg-gray-700 border border-gray-600 text-gray-300 font-bold py-2.5 px-5 rounded-xl transition-all text-sm flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Close
                </button>
                <button
                  onClick={() => { setSelectedSubject(''); setShowSubjectModal(true); }}
                  disabled={currentRecord.chunks.length === 0}
                  className="bg-violet-650 hover:bg-violet-500 disabled:opacity-50 text-white font-extrabold py-2.5 px-6 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" /> Compile & Merge PDF
                </button>
              </div>
            </div>

            {/* Generated PDF Output Alert */}
            {currentRecord.pdfUrl && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-md">Rearranged PDF Compiled!</h4>
                    <p className="text-xs text-gray-400">All chunks have been merged successfully into a single document.</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <a
                    href={currentRecord.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg text-sm text-center flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </a>
                  <button 
                    onClick={() => setPreviewPdfUrl(currentRecord.pdfUrl)}
                    className="flex-1 md:flex-initial bg-gray-800 hover:bg-gray-700 text-white border border-gray-750 font-bold py-2 px-6 rounded-lg text-sm text-center flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4" /> Full Preview
                  </button>
                </div>
              </div>
            )}

            {/* Chunks Sequence */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Arrange Segment Sequence</h3>
                <span className="text-xs text-gray-400">Drag items to reorder, or use up/down arrows. Changes auto-save.</span>
              </div>
              
              {currentRecord.chunks.length === 0 ? (
                <div className="bg-gray-900/30 border border-gray-700/50 p-12 text-center text-gray-400 rounded-2xl text-sm">
                  All chunks have been excluded. Add a PDF or reset sequence.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentRecord.chunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => handleChunkDragStart(e, idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleChunkDrop(e, idx)}
                      className="bg-gray-900/40 border border-gray-750 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-violet-500/50 transition-all group relative"
                    >
                      {/* Left: Drag Handle, Number and Range */}
                      <div className="flex items-center gap-3.5 w-full md:w-auto">
                        <div className="cursor-grab text-gray-500 hover:text-white p-1">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 md:flex-initial min-w-[120px]">
                          <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block">Segment #{idx + 1}</span>
                          <span className="text-xs font-medium text-gray-400">Pages {chunk.start_page} - {chunk.end_page}</span>
                        </div>
                      </div>

                      {/* Middle: Question Text Content */}
                      <div className="flex-1 w-full text-left">
                        {editingIndex === idx ? (
                          <div className="flex items-end gap-2 w-full">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={2}
                              className="flex-1 bg-gray-800 border border-violet-500 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                            />
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={handleSaveTextEdit}
                                className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingIndex(-1)}
                                className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <p className="text-sm font-medium text-gray-150 leading-relaxed line-clamp-2 md:line-clamp-none whitespace-pre-wrap">
                              {chunk.question_text}
                            </p>
                            <button
                              onClick={() => handleStartEditingText(idx, chunk.question_text)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-all flex-shrink-0"
                              title="Edit text"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Swap controls, preview and delete */}
                      <div className="flex items-center justify-end gap-2 w-full md:w-auto border-t border-gray-800 md:border-none pt-3 md:pt-0">
                        {/* Swap Buttons */}
                        <div className="flex items-center bg-gray-800/80 border border-gray-700/60 rounded-xl p-0.5">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveChunk(idx, 'up')}
                            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <div className="w-[1px] h-4 bg-gray-700" />
                          <button
                            disabled={idx === currentRecord.chunks.length - 1}
                            onClick={() => handleMoveChunk(idx, 'down')}
                            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Preview chunk PDF */}
                        <button
                          onClick={() => setPreviewPdfUrl(chunk.file_url)}
                          className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-750 text-gray-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs"
                          title="Preview chunk pages"
                        >
                          <Eye className="w-4 h-4 text-violet-400" /> Preview
                        </button>

                        {/* Exclude chunk */}
                        <button
                          onClick={() => handleDeleteChunk(idx)}
                          className="p-2.5 bg-gray-850 hover:bg-red-950 border border-transparent hover:border-red-900/50 text-gray-400 hover:text-red-400 rounded-xl transition-all"
                          title="Exclude segment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* History List */}
        <div className="bg-gray-800/40 border border-gray-700 p-8 rounded-3xl shadow-2xl space-y-6 backdrop-blur-sm max-w-4xl mx-auto">
          <div className="flex items-center gap-3 border-b border-gray-700/50 pb-5">
            <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Reorder History Library</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Retrieve and continue working on prior PDF reordering sessions. Compile or remove records.
              </p>
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Your reordering library is empty. Upload a PDF script to start.
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
                  className="bg-gray-900/30 border border-gray-700 hover:border-violet-500/50 p-5 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-white group-hover:text-violet-400 transition-colors text-sm line-clamp-1">
                        {record.originalName}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteRecord(record._id, e)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors flex-shrink-0"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-y-2 text-xs text-gray-400 gap-x-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-violet-400" />
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                      <span className="bg-violet-500/10 px-2.5 py-0.5 rounded text-violet-400 font-extrabold text-[10px]">
                        {record.chunks?.length || 0} Chunks
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-800 mt-4 pt-3.5">
                    <span className="text-xs text-violet-400 font-medium group-hover:underline flex items-center gap-1">
                      Load Sequences <ExternalLink className="w-3 h-3" />
                    </span>
                    {record.pdfUrl ? (
                      <a
                        href={record.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-emerald-400 hover:text-emerald-350 bg-emerald-950/20 hover:bg-emerald-950/40 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-emerald-900/30"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" /> Download PDF
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">Uncompiled</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* PDF Viewer Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-8 animate-in fade-in">
          <div className="relative w-full max-w-5xl h-full flex flex-col bg-gray-900 border border-gray-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/40">
              <div className="flex items-center gap-2">
                <FileText className="text-violet-400 w-5 h-5" />
                <h3 className="text-white font-bold text-base">Segment Preview</h3>
              </div>
              <button 
                onClick={() => setPreviewPdfUrl(null)} 
                className="px-4 py-2 bg-violet-650 hover:bg-violet-600 rounded-lg text-white font-bold transition-all text-sm flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Close Preview
              </button>
            </div>
            
            {/* Displaying PDF */}
            <div className="flex-1 bg-gray-950 overflow-hidden">
              <iframe 
                src={previewPdfUrl} 
                className="w-full h-full border-0" 
                title="Segment PDF Preview" 
              />
            </div>
          </div>
        </div>
      )}

      {/* Subject Selection Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
              <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
              <div>
                <h3 className="text-xl font-bold text-white">Select Subject for Tagging</h3>
                <p className="text-xs text-gray-400">Questions will be tagged and compiled into a book</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Target Subject / Module</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500 cursor-pointer transition-all"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="" disabled>-- Choose a Subject --</option>
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub}>
                    {sub.replace(/([a-z])([A-Z])/g, '$1 $2').replace('OptionalSubject', 'Optional: ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <button
                onClick={() => setShowSubjectModal(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all text-sm font-bold border border-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={!selectedSubject}
                onClick={() => {
                  setShowSubjectModal(false);
                  handleCompile(selectedSubject);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-lg transition-all text-sm flex items-center gap-2"
              >
                Tag & Compile <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
