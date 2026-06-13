import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Loader2, ArrowRight, UserCheck, AlertTriangle, CheckSquare, Square, Eye, FileText, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export default function PSIRBookPage() {
  // State for paper tabs: 'Paper 1A', 'Paper 1B', 'Paper 2A', 'Paper 2B'
  const [activePaper, setActivePaper] = useState('Paper 1A');
  
  // Phase handling
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // PSIR Hierarchical Data from CSV
  // Array of { paper: '...', section: '...', topics: [ { title: '...', questions: [ ... ] } ] }
  const [psirData, setPsirData] = useState([]);
  
  // Selections Object: { question_id: 'selected_file_url' }
  const [selections, setSelections] = useState({});
  // Included set: Set of question_ids that are checked to be included
  const [includedQuestions, setIncludedQuestions] = useState(new Set());
  
  // PDF Preview Urls
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

  // GitHub Actions compilation job states
  const [generationStatus, setGenerationStatus] = useState('pending');
  
  // Collapsed Topics state: { topicTitle: boolean }
  const [collapsedTopics, setCollapsedTopics] = useState({});

  // Fetch PSIR hierarchy on mount
  useEffect(() => {
    fetchPsirPreview();
  }, []);

  const fetchPsirPreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/psir/preview`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch PSIR layout.');
      }
      const data = await response.json();
      setPsirData(data);
      
      // Initialize selections and included questions
      const initSelects = {};
      const initIncluded = new Set();
      
      data.forEach(paperNode => {
        paperNode.topics.forEach(topNode => {
          topNode.questions.forEach(q => {
            initIncluded.add(q._id);
            if (q.file_urls && q.file_urls.length > 0) {
              initSelects[q._id] = [q.file_urls[0].url];
            } else {
              initSelects[q._id] = [];
            }
          });
        });
      });
      
      setSelections(initSelects);
      setIncludedQuestions(initIncluded);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get active paper node from parsed hierarchy
  const activePaperNode = psirData.find(p => p.paper === activePaper);

  const handleSelectionChange = (qId, urlStr) => {
    setSelections(prev => {
      const current = prev[qId] || [];
      if (current.includes(urlStr)) {
        return {
          ...prev,
          [qId]: current.filter(u => u !== urlStr)
        };
      } else {
        if (current.length >= 3) {
          alert("You can select up to 3 toppers per question.");
          return prev;
        }
        return {
          ...prev,
          [qId]: [...current, urlStr]
        };
      }
    });
  };

  const toggleIncludeQuestion = (qId) => {
    setIncludedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Toggle all questions inside active paper
  const handleSelectAllToggle = () => {
    if (!activePaperNode) return;
    
    // Find all IDs in current active paper
    const activeIds = [];
    activePaperNode.topics.forEach(t => t.questions.forEach(q => activeIds.push(q._id)));
    
    // Check how many of them are currently included
    const activeIncludedCount = activeIds.filter(id => includedQuestions.has(id)).length;
    
    setIncludedQuestions(prev => {
      const next = new Set(prev);
      if (activeIncludedCount === activeIds.length) {
        // Deselect all for this paper
        activeIds.forEach(id => next.delete(id));
      } else {
        // Select all for this paper
        activeIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Check if all questions in active paper are selected
  const isAllActiveSelected = () => {
    if (!activePaperNode) return false;
    let totalQ = 0;
    activePaperNode.topics.forEach(t => { totalQ += t.questions.length; });
    
    const activeIds = [];
    activePaperNode.topics.forEach(t => t.questions.forEach(q => activeIds.push(q._id)));
    const activeIncludedCount = activeIds.filter(id => includedQuestions.has(id)).length;
    
    return activeIncludedCount === totalQ && totalQ > 0;
  };

  // Toggle Topic Collapse
  const toggleTopicCollapse = (topicTitle) => {
    setCollapsedTopics(prev => {
      const current = prev[topicTitle] !== false;
      return {
        ...prev,
        [topicTitle]: !current
      };
    });
  };

  // Drag and drop within topics
  const handleDragStart = (e, topicIndex, qIndex) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ topicIndex, qIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, destTopicIndex, destQIndex) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { topicIndex: srcTopicIndex, qIndex: srcQIndex } = JSON.parse(dataStr);
      
      // Only allow reordering within the same topic
      if (srcTopicIndex !== destTopicIndex) return;
      if (srcQIndex === destQIndex) return;

      setPsirData(prev => {
        const newData = [...prev];
        const paperIdx = newData.findIndex(p => p.paper === activePaper);
        if (paperIdx === -1) return prev;
        
        newData[paperIdx] = { ...newData[paperIdx] };
        newData[paperIdx].topics = [...newData[paperIdx].topics];
        newData[paperIdx].topics[destTopicIndex] = { ...newData[paperIdx].topics[destTopicIndex] };
        
        const questions = [...newData[paperIdx].topics[destTopicIndex].questions];
        const [draggedItem] = questions.splice(srcQIndex, 1);
        questions.splice(destQIndex, 0, draggedItem);
        
        newData[paperIdx].topics[destTopicIndex].questions = questions;
        return newData;
      });
    } catch (err) {
      console.error("Drop failed:", err);
    }
  };

  // API POST request to generate PDF for active paper
  const generateAndPreviewPdf = async () => {
    if (!activePaperNode) return;
    setIsGenerating(true);
    setGenerationStatus('pending');
    setPdfBlobUrl(null);
    try {
      // Collect included question IDs in custom order
      const orderedIncludedIds = [];
      activePaperNode.topics.forEach(t => {
        t.questions.forEach(q => {
          if (includedQuestions.has(q._id)) {
            orderedIncludedIds.push(q._id);
          }
        });
      });

      if (orderedIncludedIds.length === 0) {
        throw new Error('Please select at least one question to include in the book.');
      }

      if (orderedIncludedIds.length > 35) {
        const proceed = window.confirm(
          `You have selected ${orderedIncludedIds.length} questions. Generating a book with more than 35 questions may take a long time. Do you want to proceed?`
        );
        if (!proceed) {
          setIsGenerating(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/psir/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paper: activePaper,
          selections: selections,
          includedQuestionIds: orderedIncludedIds
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to start PDF book generation.');
      }

      const data = await response.json();
      const jobId = data.jobId;
      console.log(`PDF compilation job created successfully. Job ID: ${jobId}`);
      
      // Start polling for status
      pollJobStatus(jobId);
    } catch (err) {
      alert(err.message);
      setIsGenerating(false);
    }
  };

  const pollJobStatus = (jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${API_BASE_URL}/api/psir/status/${jobId}`);
        if (!statusResponse.ok) {
          throw new Error('Failed to retrieve compilation progress.');
        }
        const jobData = await statusResponse.json();
        setGenerationStatus(jobData.status);

        if (jobData.status === 'completed') {
          clearInterval(intervalId);
          setPdfBlobUrl(`${API_BASE_URL}/api/psir/download/${jobId}`);
          setIsGenerating(false);
          setShowPreviewModal(true);
        } else if (jobData.status === 'failed') {
          clearInterval(intervalId);
          setIsGenerating(false);
          alert(`PDF Generation failed on the server: ${jobData.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Error polling job status:", err);
        clearInterval(intervalId);
        setIsGenerating(false);
        alert(err.message);
      }
    }, 4000);
  };

  const downloadFinalPdf = async () => {
    if (!pdfBlobUrl) return;
    try {
      if (pdfBlobUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = pdfBlobUrl;
        link.download = `Formal_PSIR_${activePaper.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }
      
      // Force direct download for remote Cloudinary URLs by fetching first to bypass browser cross-origin same-site restrictions
      const response = await fetch(pdfBlobUrl);
      const blob = await response.blob();
      const localUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = `Formal_PSIR_${activePaper.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(localUrl);
    } catch (err) {
      console.error("Failed to download PDF cleanly, opening in new tab:", err);
      window.open(pdfBlobUrl, '_blank');
    }
  };

  const getCleanUrl = (url) => {
    if (!url) return '#';
    let cleanUrl = url.replace('https//', 'https://').replace('http//', 'http://');
    if (cleanUrl.startsWith('http')) return cleanUrl;
    return `${API_BASE_URL}${cleanUrl}`;
  };

  // Count active paper stats
  let totalActiveQuestions = 0;
  let selectedActiveQuestions = 0;
  if (activePaperNode) {
    activePaperNode.topics.forEach(t => {
      t.questions.forEach(q => {
        totalActiveQuestions++;
        if (includedQuestions.has(q._id)) {
          selectedActiveQuestions++;
        }
      });
    });
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans relative flex flex-col items-center">
      
      {/* Upper Intro Banner */}
      <div className="max-w-6xl w-full text-center mb-10">
        <div className="inline-flex w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/10 mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">PSIR Topic-Wise Book Builder</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          Generate separate high-quality compiled answer books based on the PSIR questions dataset. Filter questions, pick matching topper papers, reorder sheets, and compile them instantly.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-gray-400 text-sm font-semibold tracking-wide">Parsing PSIR CSV file...</p>
        </div>
      ) : (
        <div className="max-w-6xl w-full flex flex-col gap-6">
          
          {/* Horizontal Paper Tabs */}
          <div className="w-full flex bg-gray-900 border border-gray-800 p-1.5 rounded-2xl gap-2 shadow-inner">
            {['Paper 1A', 'Paper 1B', 'Paper 2A', 'Paper 2B'].map(paperName => {
              const isActive = activePaper === paperName;
              const paperNode = psirData.find(p => p.paper === paperName);
              const totalQ = paperNode ? paperNode.topics.reduce((acc, t) => acc + t.questions.length, 0) : 0;
              
              return (
                <button
                  key={paperName}
                  onClick={() => setActivePaper(paperName)}
                  className={`flex-1 flex flex-col items-center py-3 px-4 rounded-xl transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/10' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-850'
                  }`}
                >
                  <span className="font-extrabold text-sm tracking-wide">{paperName}</span>
                  <span className={`text-[10px] mt-0.5 font-bold ${isActive ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {paperNode ? paperNode.section : 'Loading...'} ({totalQ} Qs)
                  </span>
                </button>
              );
            })}
          </div>

          {activePaperNode && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              
              {/* Paper Section Detail Banner */}
              <div className="bg-gray-800/40 border border-gray-700/60 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Selected Paper Section</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{activePaperNode.section}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage {totalActiveQuestions} questions grouped by topics. Drag items using <GripVertical className="inline w-3 h-3 mx-0.5 text-gray-500" /> to reorder inside topics.
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <button 
                    onClick={handleSelectAllToggle}
                    className={`px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      isAllActiveSelected() 
                        ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-750' 
                        : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    {isAllActiveSelected() ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4" />}
                    {isAllActiveSelected() ? 'Deselect All' : 'Select All'}
                  </button>
                  
                  <button
                    onClick={generateAndPreviewPdf}
                    disabled={isGenerating || selectedActiveQuestions === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    Generate {activePaper} Book
                  </button>
                </div>
              </div>

              {/* Topics Hierarchy Accordions */}
              <div className="space-y-4">
                {activePaperNode.topics.map((topNode, tIndex) => {
                  const isCollapsed = collapsedTopics[topNode.title] !== false;
                  const topicIncludedCount = topNode.questions.filter(q => includedQuestions.has(q._id)).length;
                  
                  return (
                    <div key={topNode.title} className="bg-gray-800/20 border border-gray-800/80 rounded-2xl overflow-hidden shadow-inner">
                      
                      {/* Topic Header bar */}
                      <div 
                        onClick={() => toggleTopicCollapse(topNode.title)}
                        className="bg-gray-900/60 px-6 py-4 border-b border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-900/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                          <h3 className="text-md font-extrabold text-indigo-300 tracking-wide">
                            Topic: {topNode.title}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold bg-gray-850 px-3 py-1 rounded-full text-gray-400">
                          {topicIncludedCount} / {topNode.questions.length} selected
                        </span>
                      </div>
                      
                      {/* Topic Questions List */}
                      {!isCollapsed && (
                        <div className="p-6 space-y-4 bg-gray-900/10">
                          {topNode.questions.map((q, qIndex) => {
                            const isIncluded = includedQuestions.has(q._id);
                            return (
                              <div 
                                key={q._id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, tIndex, qIndex)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, tIndex, qIndex)}
                                className={`rounded-xl p-4 border transition-all ${
                                  isIncluded 
                                    ? 'bg-[#131d31]/40 border-indigo-500/35 shadow-sm' 
                                    : 'bg-gray-850/20 border-gray-800/60 opacity-60'
                                } hover:border-indigo-400/60`}
                              >
                                <div className="flex items-start gap-4 mb-3">
                                  {/* Drag Handle */}
                                  <div className="cursor-grab hover:text-white text-gray-600 mt-1 flex-shrink-0">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  
                                  {/* Checkbox */}
                                  <button onClick={() => toggleIncludeQuestion(q._id)} className="mt-0.5 flex-shrink-0 cursor-pointer">
                                    {isIncluded ? <CheckSquare className="w-4 h-4 text-indigo-500"/> : <Square className="w-4 h-4 text-gray-500" />}
                                  </button>
                                  
                                  <div className="flex-1">
                                    <p className="text-white text-sm font-semibold leading-relaxed">{q.question_text}</p>
                                  </div>
                                </div>
                                
                                {/* Toppers radio mapping */}
                                {isIncluded && q.file_urls && q.file_urls.length > 0 && (
                                  <div className="pl-8 space-y-2 mt-2">
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Available Topper Answers</p>
                                    
                                    <div className={q.file_urls.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-3.5" : "space-y-2.5"}>
                                      {q.file_urls.map((fileObj, idx) => {
                                        const currentSelections = selections[q._id] || [];
                                        const isSelected = currentSelections.includes(fileObj.url);
                                        const isDisabled = !isSelected && currentSelections.length >= 3;
                                        
                                        if (q.file_urls.length > 1) {
                                          return (
                                            <div 
                                              key={idx} 
                                              className={`flex flex-col p-3.5 rounded-xl border transition-colors ${
                                                isSelected 
                                                  ? 'bg-[#1e293b]/40 border-indigo-500/60 text-indigo-200' 
                                                  : isDisabled
                                                    ? 'bg-gray-900/10 border-gray-850 text-gray-600 opacity-40'
                                                    : 'bg-gray-900/40 border-gray-800 text-gray-450 hover:border-gray-700'
                                              }`}
                                            >
                                              <div className="flex items-start justify-between gap-3 mb-2.5">
                                                <label className={`flex items-start gap-2.5 flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                  <input 
                                                    type="checkbox" 
                                                    name={`q-${q._id}`}
                                                    value={fileObj.url}
                                                    checked={isSelected}
                                                    disabled={isDisabled}
                                                    onChange={() => handleSelectionChange(q._id, fileObj.url)}
                                                    className="w-3.5 h-3.5 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500 rounded mt-1 cursor-pointer"
                                                  />
                                                  <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                                                      <span className="font-bold text-sm text-white">
                                                        {fileObj.topper_name || 'Ref Answer'}
                                                      </span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 mt-0.5 font-semibold">
                                                      Year: {fileObj.topper_year || 'N/A'} | Rank: {fileObj.topper_rank || 'N/A'} | Marks: {fileObj.topper_marks || 'N/A'}
                                                    </span>
                                                  </div>
                                                </label>
                                              </div>
                                              
                                              {/* Directly Embedded Scrollable PDF Preview */}
                                              <div className="w-full h-44 rounded-lg overflow-hidden border border-gray-800 bg-gray-950 shadow-inner">
                                                <iframe 
                                                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(getCleanUrl(fileObj.url))}&embedded=true`} 
                                                  className="w-full h-full border-0" 
                                                  title={`Preview-${fileObj.topper_name}`} 
                                                  loading="lazy"
                                                />
                                              </div>
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div key={idx} className="flex items-center gap-2 w-full">
                                              <label 
                                                className={`flex-1 flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                                                  isSelected 
                                                    ? 'bg-[#1e293b]/40 border-indigo-500/60 text-indigo-200 cursor-pointer' 
                                                    : isDisabled
                                                      ? 'bg-gray-900/10 border-gray-850 text-gray-600 opacity-40 cursor-not-allowed'
                                                      : 'bg-gray-900/40 border-gray-800 text-gray-450 hover:border-gray-700 cursor-pointer'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2.5">
                                                  <input 
                                                    type="checkbox" 
                                                    name={`q-${q._id}`}
                                                    value={fileObj.url}
                                                    checked={isSelected}
                                                    disabled={isDisabled}
                                                    onChange={() => handleSelectionChange(q._id, fileObj.url)}
                                                    className="w-3.5 h-3.5 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500 rounded cursor-pointer"
                                                  />
                                                  <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                                                      <span className="font-bold text-xs text-white">
                                                        {fileObj.topper_name || 'Ref Answer'}
                                                      </span>
                                                    </div>
                                                    <span className="text-[9px] text-gray-500 mt-0.5 font-medium">
                                                      Year: {fileObj.topper_year || 'N/A'} | Rank: {fileObj.topper_rank || 'N/A'} | Marks: {fileObj.topper_marks || 'N/A'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </label>
                                              
                                              <button 
                                                onClick={() => setPreviewPdfUrl(getCleanUrl(fileObj.url))}
                                                title="Preview Topper Note"
                                                className="flex-shrink-0 flex items-center justify-center p-3 bg-gray-805 hover:bg-gray-750 border border-gray-850 hover:border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                                              >
                                                <FileText className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          );
                                        }
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Info Status bar */}
              <div className="bg-gray-850 p-4 border border-gray-800 rounded-xl text-center text-xs text-gray-400">
                You have selected <strong className="text-white">{selectedActiveQuestions}</strong> out of <strong className="text-white">{totalActiveQuestions}</strong> questions in <strong className="text-indigo-400">{activePaper}</strong>.
              </div>

            </div>
          )}

        </div>
      )}

      {/* Compiled Document Preview Modal */}
      {showPreviewModal && pdfBlobUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-gray-900 shadow-2xl w-full h-full max-w-full max-h-screen flex flex-col animate-in zoom-in-95 overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">{activePaper} PDF Preview</h2>
                <p className="text-xs text-gray-400">Review layout & page organization before exporting</p>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer"
              >
                Back to Editing
              </button>
            </div>
            
            <div className="flex-1 bg-gray-950 p-2 overflow-hidden flex items-center justify-center">
              <iframe src={pdfBlobUrl} className="w-full h-full rounded-lg border border-gray-800" title="PSIR PDF Preview" />
            </div>
            
            <div className="p-4 border-t border-gray-800 bg-gray-900/90 flex justify-end gap-3">
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 rounded-lg text-xs font-black text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button 
                onClick={downloadFinalPdf}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer animate-pulse"
              >
                <Download className="w-4 h-4" /> Download PDF Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Actions Progress Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">Generating PDF Book</h3>
            <p className="text-gray-400 text-xs mb-6 max-w-xs leading-relaxed">
              We have offloaded PDF compilation to GitHub Actions. This prevents server timeouts and ensures high performance.
            </p>
            
            <div className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3.5 mb-6 text-left">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${generationStatus === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                <span className={`text-xs font-bold ${generationStatus === 'pending' ? 'text-white' : 'text-gray-400'}`}>
                  1. Queueing job in GitHub Actions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${generationStatus === 'processing' ? 'bg-indigo-500 animate-pulse' : generationStatus === 'completed' ? 'bg-green-500' : 'bg-gray-800'}`} />
                <span className={`text-xs font-bold ${generationStatus === 'processing' ? 'text-white' : generationStatus === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                  2. Downloading & merging topper sheets
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${generationStatus === 'completed' ? 'bg-green-500 animate-pulse' : 'bg-gray-800'}`} />
                <span className={`text-xs font-bold ${generationStatus === 'completed' ? 'text-white' : 'text-gray-600'}`}>
                  3. Uploading completed book
                </span>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
              Status: <span className={generationStatus === 'failed' ? 'text-red-500' : generationStatus === 'completed' ? 'text-green-500' : 'text-indigo-400'}>{generationStatus.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Topper Note PDF Preview Iframe Overlay */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="relative w-full h-full flex flex-col bg-gray-950">
            <div className="p-4 border-b border-gray-850 flex justify-between items-center bg-gray-900">
              <h3 className="text-white font-bold text-sm">Topper Answer Sheet View</h3>
              <button 
                onClick={() => setPreviewPdfUrl(null)} 
                className="px-4 py-2 bg-red-650 hover:bg-red-600 rounded text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe 
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewPdfUrl)}&embedded=true`} 
                className="w-full h-full border-0" 
                title="Topper Sheet Preview" 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
