import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Loader2, Eye, UserCheck, CheckSquare, Square, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Pencil, Check, X } from 'lucide-react';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export default function PSIRBookPage() {
  const [activePaper, setActivePaper] = useState('Paper 1A');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [psirData, setPsirData] = useState([]);
  const [selections, setSelections] = useState({});
  const [includedQuestions, setIncludedQuestions] = useState(new Set());
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [generationStatus, setGenerationStatus] = useState('pending');
  const [collapsedTopics, setCollapsedTopics] = useState({});

  // Inline editing state
  const [editingTopicIndex, setEditingTopicIndex] = useState(null);
  const [editingTopicValue, setEditingTopicValue] = useState('');
  const [editingTopper, setEditingTopper] = useState(null); // { tIndex, qIndex, fIndex }
  const [editingTopperValues, setEditingTopperValues] = useState({});
  const [positionDrafts, setPositionDrafts] = useState({}); // { [questionId]: rawInputString }

  useEffect(() => { fetchPsirPreview(); }, []);

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
      const initSelects = {};
      const initIncluded = new Set();
      data.forEach(paperNode => {
        paperNode.topics.forEach(topNode => {
          topNode.questions.forEach(q => {
            initIncluded.add(q._id);
            initSelects[q._id] = q.file_urls?.length > 0 ? [q.file_urls[0].url] : [];
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

  const activePaperNode = psirData.find(p => p.paper === activePaper);

  const handleSelectionChange = (qId, urlStr) => {
    setSelections(prev => {
      const current = prev[qId] || [];
      if (current.includes(urlStr)) return { ...prev, [qId]: current.filter(u => u !== urlStr) };
      if (current.length >= 3) { alert('You can select up to 3 toppers per question.'); return prev; }
      return { ...prev, [qId]: [...current, urlStr] };
    });
  };

  const toggleIncludeQuestion = (qId) => {
    setIncludedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    if (!activePaperNode) return;
    const activeIds = activePaperNode.topics.flatMap(t => t.questions.map(q => q._id));
    const allSelected = activeIds.every(id => includedQuestions.has(id));
    setIncludedQuestions(prev => {
      const next = new Set(prev);
      if (allSelected) activeIds.forEach(id => next.delete(id));
      else activeIds.forEach(id => next.add(id));
      return next;
    });
  };

  const isAllActiveSelected = () => {
    if (!activePaperNode) return false;
    const activeIds = activePaperNode.topics.flatMap(t => t.questions.map(q => q._id));
    return activeIds.length > 0 && activeIds.every(id => includedQuestions.has(id));
  };

  const toggleTopicCollapse = (topicTitle) => {
    setCollapsedTopics(prev => ({ ...prev, [topicTitle]: prev[topicTitle] !== false ? false : true }));
  };

  // Move a question to an arbitrary 0-based position within its topic
  const moveQuestionToPosition = (tIndex, fromIndex, toIndex) => {
    setPsirData(prev => {
      const newData = [...prev];
      const paperIdx = newData.findIndex(p => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const newTopics = [...newData[paperIdx].topics];
      const questions = [...newTopics[tIndex].questions];
      if (toIndex < 0 || toIndex >= questions.length || toIndex === fromIndex) return prev;
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, moved);
      newTopics[tIndex] = { ...newTopics[tIndex], questions };
      newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      return newData;
    });
  };

  // Commit a typed "jump to position" value for a question, then clear its draft
  const commitPositionChange = (tIndex, qIndex, qId, rawValue, totalInTopic) => {
    const parsed = parseInt(rawValue, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, 1), totalInTopic);
      moveQuestionToPosition(tIndex, qIndex, clamped - 1);
    }
    setPositionDrafts(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  // Move topic up (-1) or down (+1) within the active paper
  const moveTopic = (tIndex, direction) => {
    const targetIndex = tIndex + direction;
    setPsirData(prev => {
      const newData = [...prev];
      const paperIdx = newData.findIndex(p => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const topics = [...newData[paperIdx].topics];
      if (targetIndex < 0 || targetIndex >= topics.length) return prev;
      [topics[tIndex], topics[targetIndex]] = [topics[targetIndex], topics[tIndex]];
      newData[paperIdx] = { ...newData[paperIdx], topics };
      return newData;
    });
  };

  const saveTopicName = (tIndex, oldTitle) => {
    const newTitle = editingTopicValue.trim();
    if (!newTitle || newTitle === oldTitle) { setEditingTopicIndex(null); return; }
    setPsirData(prev => {
      const newData = [...prev];
      const paperIdx = newData.findIndex(p => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const newTopics = [...newData[paperIdx].topics];
      newTopics[tIndex] = { ...newTopics[tIndex], title: newTitle };
      newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      return newData;
    });
    setCollapsedTopics(prev => {
      const next = { ...prev };
      if (oldTitle in next) { next[newTitle] = next[oldTitle]; delete next[oldTitle]; }
      return next;
    });
    setEditingTopicIndex(null);
  };

  const saveTopperDetails = (tIndex, qIndex, fIndex) => {
    setPsirData(prev => {
      const newData = [...prev];
      const paperIdx = newData.findIndex(p => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const newTopics = [...newData[paperIdx].topics];
      const newQuestions = [...newTopics[tIndex].questions];
      const newFileUrls = [...newQuestions[qIndex].file_urls];
      newFileUrls[fIndex] = { ...newFileUrls[fIndex], ...editingTopperValues };
      newQuestions[qIndex] = { ...newQuestions[qIndex], file_urls: newFileUrls };
      newTopics[tIndex] = { ...newTopics[tIndex], questions: newQuestions };
      newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      return newData;
    });
    setEditingTopper(null);
  };

  const generateAndPreviewPdf = async () => {
    if (!activePaperNode) return;
    setIsGenerating(true);
    setGenerationStatus('pending');
    setPdfBlobUrl(null);
    try {
      const orderedIncludedIds = activePaperNode.topics.flatMap(t =>
        t.questions.filter(q => includedQuestions.has(q._id)).map(q => q._id)
      );
      if (orderedIncludedIds.length === 0) throw new Error('Please select at least one question to include in the book.');
      if (orderedIncludedIds.length > 35) {
        if (!window.confirm(`You have selected ${orderedIncludedIds.length} questions. This may take a long time. Proceed?`)) {
          setIsGenerating(false);
          return;
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/psir/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper: activePaper, selections, includedQuestionIds: orderedIncludedIds })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to start PDF book generation.');
      }
      const data = await response.json();
      pollJobStatus(data.jobId);
    } catch (err) {
      alert(err.message);
      setIsGenerating(false);
    }
  };

  const pollJobStatus = (jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${API_BASE_URL}/api/psir/status/${jobId}`);
        if (!statusResponse.ok) throw new Error('Failed to retrieve compilation progress.');
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
          alert(`PDF Generation failed: ${jobData.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(intervalId);
        setIsGenerating(false);
        alert(err.message);
      }
    }, 4000);
  };

  const downloadFinalPdf = async () => {
    if (!pdfBlobUrl) return;
    try {
      // ?download=true marks this as an explicit download so the server deletes the
      // GridFS file afterward; the preview iframe omits this and never consumes it.
      const response = await fetch(`${pdfBlobUrl}?download=true`);
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
      console.error('Download failed:', err);
      window.open(`${pdfBlobUrl}?download=true`, '_blank');
    }
  };

  const getCleanUrl = (url) => {
    if (!url) return '#';
    const cleanUrl = url.replace('https//', 'https://').replace('http//', 'http://');
    return cleanUrl.startsWith('http') ? cleanUrl : `${API_BASE_URL}${cleanUrl}`;
  };

  let totalActiveQuestions = 0;
  let selectedActiveQuestions = 0;
  if (activePaperNode) {
    activePaperNode.topics.forEach(t => {
      t.questions.forEach(q => {
        totalActiveQuestions++;
        if (includedQuestions.has(q._id)) selectedActiveQuestions++;
      });
    });
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans relative flex flex-col items-center">

      {/* Header */}
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

          {/* Paper Tabs */}
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
                    isActive ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/10' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-850'
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

              {/* Paper Banner */}
              <div className="bg-gray-800/40 border border-gray-700/60 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Selected Paper Section</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{activePaperNode.section}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage {totalActiveQuestions} questions grouped by topics. Type a position number next to a question to move it there instantly. Use ↑↓ to move whole topics up/down.
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <button
                    onClick={handleSelectAllToggle}
                    className={`px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      isAllActiveSelected() ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700' : 'bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800'
                    }`}
                  >
                    {isAllActiveSelected() ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
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

              {/* Topics */}
              <div className="space-y-4">
                {activePaperNode.topics.map((topNode, tIndex) => {
                  const isCollapsed = collapsedTopics[topNode.title] !== false;
                  const topicIncludedCount = topNode.questions.filter(q => includedQuestions.has(q._id)).length;
                  const isEditingThisTopic = editingTopicIndex === tIndex;

                  return (
                    <div key={`${tIndex}-${topNode.title}`} className="bg-gray-800/20 border border-gray-800/80 rounded-2xl overflow-hidden shadow-inner">

                      {/* Topic Header */}
                      <div
                        onClick={() => !isEditingThisTopic && toggleTopicCollapse(topNode.title)}
                        className="bg-gray-900/60 px-6 py-4 border-b border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-900/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isCollapsed
                            ? <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            : <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          }

                          {/* Topic Up / Down buttons */}
                          <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => moveTopic(tIndex, -1)}
                              disabled={tIndex === 0}
                              className="p-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors cursor-pointer"
                              title="Move topic up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveTopic(tIndex, 1)}
                              disabled={tIndex === activePaperNode.topics.length - 1}
                              className="p-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-white transition-colors cursor-pointer"
                              title="Move topic down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {isEditingThisTopic ? (
                            <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={editingTopicValue}
                                onChange={e => setEditingTopicValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveTopicName(tIndex, topNode.title);
                                  if (e.key === 'Escape') setEditingTopicIndex(null);
                                }}
                                className="flex-1 bg-gray-800 border border-indigo-500 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => saveTopicName(tIndex, topNode.title)}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingTopicIndex(null)}
                                className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <h3 className="text-md font-extrabold text-indigo-300 tracking-wide truncate">
                                Topic: {topNode.title}
                              </h3>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingTopicIndex(tIndex);
                                  setEditingTopicValue(topNode.title);
                                }}
                                className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-indigo-300 transition-colors flex-shrink-0 cursor-pointer"
                                title="Edit topic name"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full text-gray-400 flex-shrink-0 ml-3">
                          {topicIncludedCount} / {topNode.questions.length} selected
                        </span>
                      </div>

                      {/* Questions List */}
                      {!isCollapsed && (
                        <div className="p-6 space-y-4 bg-gray-900/10">
                          {topNode.questions.map((q, qIndex) => {
                            const isIncluded = includedQuestions.has(q._id);
                            return (
                              <div
                                key={q._id}
                                className={`rounded-xl p-4 border transition-all ${
                                  isIncluded
                                    ? 'bg-[#131d31]/40 border-indigo-500/35 shadow-sm'
                                    : 'bg-gray-850/20 border-gray-800/60 opacity-60'
                                } hover:border-indigo-400/60`}
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  {/* Jump-to-position control */}
                                  <div className="flex flex-col items-center flex-shrink-0 mt-0.5 gap-0.5">
                                    <input
                                      type="number"
                                      min={1}
                                      max={topNode.questions.length}
                                      value={positionDrafts[q._id] ?? String(qIndex + 1)}
                                      onChange={e => setPositionDrafts(prev => ({ ...prev, [q._id]: e.target.value }))}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') commitPositionChange(tIndex, qIndex, q._id, e.target.value, topNode.questions.length);
                                      }}
                                      onBlur={e => commitPositionChange(tIndex, qIndex, q._id, e.target.value, topNode.questions.length)}
                                      onFocus={e => e.target.select()}
                                      className="w-12 text-center bg-gray-800 border border-gray-700 rounded-md py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      title="Type a position and press Enter to move this question there"
                                    />
                                    <span className="text-[8px] text-gray-500 font-bold">/ {topNode.questions.length}</span>
                                  </div>

                                  {/* Include checkbox */}
                                  <button onClick={() => toggleIncludeQuestion(q._id)} className="mt-0.5 flex-shrink-0 cursor-pointer">
                                    {isIncluded
                                      ? <CheckSquare className="w-4 h-4 text-indigo-500" />
                                      : <Square className="w-4 h-4 text-gray-500" />
                                    }
                                  </button>

                                  <p className="text-white text-sm font-semibold leading-relaxed flex-1">{q.question_text}</p>
                                </div>

                                {/* Topper answers — always show embedded preview */}
                                {isIncluded && q.file_urls && q.file_urls.length > 0 && (
                                  <div className="pl-10 space-y-2 mt-2">
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Available Topper Answers</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                      {q.file_urls.map((fileObj, fIndex) => {
                                        const currentSelections = selections[q._id] || [];
                                        const isSelected = currentSelections.includes(fileObj.url);
                                        const isDisabled = !isSelected && currentSelections.length >= 3;
                                        const isEditingThisTopper =
                                          editingTopper?.tIndex === tIndex &&
                                          editingTopper?.qIndex === qIndex &&
                                          editingTopper?.fIndex === fIndex;

                                        return (
                                          <div
                                            key={fIndex}
                                            className={`flex flex-col p-3.5 rounded-xl border transition-colors ${
                                              isSelected
                                                ? 'bg-[#1e293b]/40 border-indigo-500/60 text-indigo-200'
                                                : isDisabled
                                                  ? 'bg-gray-900/10 border-gray-800 text-gray-600 opacity-40'
                                                  : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                          >
                                            {/* Topper header row */}
                                            <div className="flex items-start justify-between gap-3 mb-2.5">
                                              <label className={`flex items-start gap-2.5 flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                <input
                                                  type="checkbox"
                                                  checked={isSelected}
                                                  disabled={isDisabled}
                                                  onChange={() => handleSelectionChange(q._id, fileObj.url)}
                                                  className="w-3.5 h-3.5 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500 rounded mt-1 cursor-pointer flex-shrink-0"
                                                />
                                                <div className="flex flex-col flex-1 min-w-0">
                                                  {isEditingThisTopper ? (
                                                    <div className="flex flex-col gap-1.5" onClick={e => e.preventDefault()}>
                                                      <input
                                                        autoFocus
                                                        placeholder="Topper name"
                                                        value={editingTopperValues.topper_name || ''}
                                                        onChange={e => setEditingTopperValues(p => ({ ...p, topper_name: e.target.value }))}
                                                        className="bg-gray-800 border border-indigo-500/60 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                      />
                                                      <div className="grid grid-cols-3 gap-1">
                                                        <input
                                                          placeholder="Year"
                                                          value={editingTopperValues.topper_year || ''}
                                                          onChange={e => setEditingTopperValues(p => ({ ...p, topper_year: e.target.value }))}
                                                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        <input
                                                          placeholder="Rank"
                                                          value={editingTopperValues.topper_rank || ''}
                                                          onChange={e => setEditingTopperValues(p => ({ ...p, topper_rank: e.target.value }))}
                                                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        <input
                                                          placeholder="Marks"
                                                          value={editingTopperValues.topper_marks || ''}
                                                          onChange={e => setEditingTopperValues(p => ({ ...p, topper_marks: e.target.value }))}
                                                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                      </div>
                                                      <div className="flex gap-1.5">
                                                        <button
                                                          onClick={() => saveTopperDetails(tIndex, qIndex, fIndex)}
                                                          className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-[10px] font-bold cursor-pointer"
                                                        >
                                                          <Check className="w-3 h-3" /> Save
                                                        </button>
                                                        <button
                                                          onClick={() => setEditingTopper(null)}
                                                          className="flex-1 flex items-center justify-center gap-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-[10px] font-bold cursor-pointer"
                                                        >
                                                          <X className="w-3 h-3" /> Cancel
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <div className="flex items-center gap-1.5">
                                                        <UserCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                                        <span className="font-bold text-sm text-white truncate">{fileObj.topper_name || 'Ref Answer'}</span>
                                                      </div>
                                                      <span className="text-[10px] text-gray-400 mt-0.5 font-semibold">
                                                        Year: {fileObj.topper_year || 'N/A'} | Rank: {fileObj.topper_rank || 'N/A'} | Marks: {fileObj.topper_marks || 'N/A'}
                                                      </span>
                                                    </>
                                                  )}
                                                </div>
                                              </label>

                                              {!isEditingThisTopper && (
                                                <button
                                                  onClick={() => {
                                                    setEditingTopper({ tIndex, qIndex, fIndex });
                                                    setEditingTopperValues({
                                                      topper_name: fileObj.topper_name || '',
                                                      topper_year: fileObj.topper_year || '',
                                                      topper_rank: fileObj.topper_rank || '',
                                                      topper_marks: fileObj.topper_marks || '',
                                                    });
                                                  }}
                                                  className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-indigo-300 transition-colors flex-shrink-0 cursor-pointer"
                                                  title="Edit topper details"
                                                >
                                                  <Pencil className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>

                                            {/* Lazily embedded PDF preview */}
                                            <div className="w-full h-44 rounded-lg overflow-hidden border border-gray-800 bg-gray-950 shadow-inner">
                                              <iframe
                                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(getCleanUrl(fileObj.url))}&embedded=true`}
                                                className="w-full h-full border-0"
                                                title={`Preview-${fileObj.topper_name || fIndex}`}
                                                loading="lazy"
                                              />
                                            </div>
                                          </div>
                                        );
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

              {/* Status bar */}
              <div className="bg-gray-850 p-4 border border-gray-800 rounded-xl text-center text-xs text-gray-400">
                You have selected <strong className="text-white">{selectedActiveQuestions}</strong> out of <strong className="text-white">{totalActiveQuestions}</strong> questions in <strong className="text-indigo-400">{activePaper}</strong>.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compiled PDF Preview Modal */}
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

      {/* Generation Progress Modal */}
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
              Status: <span className={generationStatus === 'failed' ? 'text-red-500' : generationStatus === 'completed' ? 'text-green-500' : 'text-indigo-400'}>
                {generationStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
