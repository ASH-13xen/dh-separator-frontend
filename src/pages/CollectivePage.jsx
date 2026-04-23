import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Loader2, ArrowRight, UserCheck, AlertTriangle, CheckSquare, Square, Eye, FileText } from 'lucide-react';
import { fetchTags } from '../services/api';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CollectivePage() {
  const [selectedModule, setSelectedModule] = useState('');
  const [availableModules, setAvailableModules] = useState([]);
  
  // Phase handling
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Data tracking
  const [previewData, setPreviewData] = useState([]); // This is now hierarchical
  
  // Selections Object: { question_id: 'file_url' }
  const [selections, setSelections] = useState({});
  // Included set: question_ids that are checked to be included
  const [includedQuestions, setIncludedQuestions] = useState(new Set());
  
  // Final PDF View
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

  useEffect(() => {
     fetchTags().then(tags => {
         // Filter tags to only show Top-Level Modules (GS and Optionals)
         const modules = tags.filter(t => t.startsWith('GS-') || t.startsWith('OptionalSubject'));
         setAvailableModules(modules.sort());
     }).catch(console.error);
  }, []);

  const handleFetchPreview = async () => {
    if (!selectedModule) return;
    setIsPreviewing(true);
    setPdfBlobUrl(null); // Reset preview on new fetch
    try {
        const response = await fetch(`${API_BASE_URL}/api/collective/preview?moduleName=${encodeURIComponent(selectedModule)}`);
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to fetch module layout.');
        }

        const data = await response.json();
        setPreviewData(data); // hierarchical data

        const initSelects = {};
        const initIncluded = new Set();
        
        // Traverse the hierarchy to initialize states
        data.forEach(sec => {
            sec.topics.forEach(top => {
                top.questions.forEach(q => {
                    initIncluded.add(q._id);
                    if (q.file_urls && q.file_urls.length > 0) {
                        initSelects[q._id] = q.file_urls[0].url;
                    }
                });
            });
        });

        setSelections(initSelects);
        setIncludedQuestions(initIncluded);
        setShowModal(true);
    } catch (err) {
        alert(err.message);
    } finally {
        setIsPreviewing(false);
    }
  };

  const handleSelectionChange = (qId, urlStr) => {
      setSelections(prev => ({
          ...prev,
          [qId]: urlStr
      }));
  };

  const toggleIncludeQuestion = (qId) => {
      setIncludedQuestions(prev => {
          const next = new Set(prev);
          if (next.has(qId)) next.delete(qId);
          else next.add(qId);
          return next;
      });
  };

  const handleSelectAllToggle = () => {
      let totalQ = 0;
      previewData.forEach(s => s.topics.forEach(t => { totalQ += t.questions.length; }));
      
      if (includedQuestions.size === totalQ && totalQ > 0) {
          setIncludedQuestions(new Set()); // Deselect all
      } else {
          const allIds = new Set();
          previewData.forEach(s => s.topics.forEach(t => t.questions.forEach(q => allIds.add(q._id))));
          setIncludedQuestions(allIds);
      }
  };

  const generateAndPreviewPdf = async () => {
    setIsGenerating(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/collective/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                moduleName: selectedModule,
                selections: selections,
                includedQuestionIds: Array.from(includedQuestions)
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to generate collective PDF.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfBlobUrl(url);

    } catch (err) {
        alert(err.message);
    } finally {
        setIsGenerating(false);
    }
  };

  const downloadFinalPdf = () => {
      if (!pdfBlobUrl) return;
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = `Formal_UPSC_Book_${selectedModule.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
  };

  const getCleanUrl = (url) => {
    if (!url) return '#';
    let cleanUrl = url.replace('https//', 'https://').replace('http//', 'http://');
    if (cleanUrl.startsWith('http')) return cleanUrl;
    return `${API_BASE_URL}${cleanUrl}`;
  };

  let totalQuestionsCount = 0;
  previewData.forEach(s => s.topics.forEach(t => { totalQuestionsCount += t.questions.length; }));
  
  const isAllSelected = includedQuestions.size === totalQuestionsCount && totalQuestionsCount > 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans overflow-x-hidden flex flex-col items-center justify-center relative">
      
      <div className={`max-w-2xl w-full bg-gray-800/50 border border-gray-700 p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 backdrop-blur-sm transition-all ${showModal ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
         <div className="flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mb-6 shadow-indigo-500/20">
                 <BookOpen className="w-10 h-10 text-white" />
             </div>
             <h1 className="text-3xl font-bold text-white mb-3 tracking-wide">Publish Module Book</h1>
             <p className="text-gray-400 mb-8 max-w-lg">
                Compile massive structured documents perfectly aligned to your Target Module. 
                Our engine draws formal Topic Separators, builds an interactive Index Segment, and stitches answers cleanly.
             </p>

             <div className="w-full text-left bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50 mb-8">
                 <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Select Target Module</label>
                 <select 
                   className="w-full bg-gray-800 border border-gray-600 rounded-xl py-3 px-4 text-lg text-white focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner"
                   value={selectedModule}
                   onChange={(e) => setSelectedModule(e.target.value)}
                 >
                   <option value="" disabled>-- Choose a Module --</option>
                   {availableModules.map(mod => <option key={mod} value={mod}>{mod.replace(/([a-z])([A-Z])/g, '$1 $2')}</option>)}
                 </select>
             </div>

             <button
               onClick={handleFetchPreview}
               disabled={!selectedModule || isPreviewing || isGenerating}
               className="w-full max-w-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 text-lg"
             >
               {isPreviewing || isGenerating ? (
                 <>
                   <Loader2 className="w-6 h-6 animate-spin" />
                   {isGenerating ? "Assembling Book..." : "Fetching Hierarchy..."}
                 </>
               ) : (
                 <>
                   Continue <ArrowRight className="w-5 h-5" />
                 </>
               )}
             </button>
             
             {(isPreviewing || isGenerating) && (
                <p className="mt-4 text-xs text-indigo-400 animate-pulse font-medium">Please do not refresh the page...</p>
             )}
         </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!isGenerating) setShowModal(false) }} />
              
              <div className="relative bg-gray-900 shadow-2xl w-full h-full max-w-full max-h-screen flex flex-col animate-in zoom-in-95 overflow-hidden">
                  
                  {pdfBlobUrl ? (
                      <>
                          <div className="p-4 border-b border-gray-800 bg-gray-800/40 flex items-center justify-between">
                              <div>
                                  <h2 className="text-xl font-bold text-white mb-1">Document Preview</h2>
                                  <p className="text-sm text-gray-400">Verify the layout before downloading</p>
                              </div>
                              <button 
                                  onClick={() => setPdfBlobUrl(null)}
                                  className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                              >
                                  Back to Editing
                              </button>
                          </div>
                          <div className="flex-1 bg-gray-800/50 p-2 overflow-hidden">
                              <iframe src={pdfBlobUrl} className="w-full h-full rounded-xl border border-gray-700" title="PDF Preview" />
                          </div>
                          <div className="p-4 border-t border-gray-800 bg-gray-800/40 flex justify-end gap-4">
                              <button 
                                  onClick={() => setShowModal(false)}
                                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors"
                              >
                                  Close
                              </button>
                              <button 
                                  onClick={downloadFinalPdf}
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2"
                              >
                                  <Download className="w-5 h-5" /> Download PDF
                              </button>
                          </div>
                      </>
                  ) : (
                      <>
                          <div className="p-6 border-b border-gray-800 bg-gray-800/40 flex items-center justify-between gap-4">
                              <div>
                                  <h2 className="text-xl font-bold text-white mb-1">Assemble Sequence</h2>
                                  <p className="text-sm text-gray-400">
                                      Select topper answers mapped to {selectedModule} sections and topics.
                                  </p>
                              </div>
                              <button 
                                  onClick={handleSelectAllToggle}
                                  className={`px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold transition-colors ${isAllSelected ? 'bg-indigo-600 text-white border-indigo-500 border' : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'}`}
                              >
                                  {isAllSelected ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4" />}
                                  {isAllSelected ? 'Deselect All' : 'Select All'}
                              </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-900/50">
                              {previewData.length === 0 && (
                                  <div className="text-center text-gray-400 py-10">No questions mapped for this module.</div>
                              )}
                              
                              {previewData.map((secNode, sIndex) => (
                                  <div key={sIndex} className="bg-gray-800/30 border border-gray-700/60 rounded-2xl overflow-hidden">
                                      <div className="bg-gradient-to-r from-gray-800 to-gray-800/40 px-6 py-4 border-b border-gray-700/60">
                                          <h3 className="text-lg font-bold text-indigo-300 uppercase tracking-wide">
                                              Section: {secNode.section}
                                          </h3>
                                      </div>
                                      
                                      <div className="p-6 space-y-6">
                                          {secNode.topics.map((topNode, tIndex) => (
                                              <div key={tIndex} className="border-l-2 border-indigo-500/30 pl-4 space-y-4">
                                                  <h4 className="text-md font-bold text-white mb-3">Topic: {topNode.title}</h4>
                                                  
                                                  <div className="space-y-4 pl-4">
                                                      {topNode.questions.map((q, qIndex) => {
                                                          const isIncluded = includedQuestions.has(q._id);
                                                          return (
                                                              <div key={q._id} className={`rounded-xl p-4 border transition-colors ${isIncluded ? 'bg-gray-800 border-indigo-500/40' : 'bg-gray-800/40 border-gray-700/50 opacity-75'}`}>
                                                                  <div className="flex items-start gap-4 mb-3">
                                                                      <button onClick={() => toggleIncludeQuestion(q._id)} className="mt-0.5 flex-shrink-0">
                                                                          {isIncluded ? <CheckSquare className="w-5 h-5 text-indigo-500"/> : <Square className="w-5 h-5 text-gray-500" />}
                                                                      </button>
                                                                      <div>
                                                                          <p className="text-white text-md font-medium leading-snug">{q.question_text}</p>
                                                                      </div>
                                                                  </div>
                                                                  
                                                                  {isIncluded && q.file_urls && q.file_urls.length > 0 && (
                                                                      <div className="pl-9 space-y-2">
                                                                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Available Answers</p>
                                                                          {q.file_urls.map((fileObj, idx) => (
                                                                              <div key={idx} className="flex items-center gap-3">
                                                                                  <label 
                                                                                      className={`flex-1 flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                                                                          selections[q._id] === fileObj.url 
                                                                                              ? 'bg-indigo-900/40 border-indigo-500 text-indigo-200' 
                                                                                              : 'bg-gray-900/50 border-gray-700/50 text-gray-400 hover:border-gray-500'
                                                                                      }`}
                                                                                  >
                                                                                      <input 
                                                                                          type="radio" 
                                                                                          name={`q-${q._id}`}
                                                                                          value={fileObj.url}
                                                                                          checked={selections[q._id] === fileObj.url}
                                                                                          onChange={() => handleSelectionChange(q._id, fileObj.url)}
                                                                                          className="w-3.5 h-3.5 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-600"
                                                                                      />
                                                                                      <div className="flex items-center gap-2">
                                                                                          <UserCheck className="w-3.5 h-3.5 opacity-70" />
                                                                                          <span className="font-bold text-sm tracking-wide">
                                                                                              {fileObj.topper_name || 'Ref Answer'}
                                                                                          </span>
                                                                                      </div>
                                                                                  </label>
                                                                                  
                                                                                  <button 
                                                                                      onClick={() => setPreviewPdfUrl(getCleanUrl(fileObj.url))}
                                                                                      title='Preview Note'
                                                                                      className="flex-shrink-0 flex items-center justify-center p-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                                                                                  >
                                                                                      <FileText className="w-4 h-4" />
                                                                                  </button>
                                                                              </div>
                                                                          ))}
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          )
                                                      })}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="p-6 border-t border-gray-800 bg-gray-800/40 flex justify-end gap-4">
                              <button 
                                  onClick={() => setShowModal(false)}
                                  className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white transition-colors"
                              >
                                  Cancel
                              </button>
                              <button 
                                  onClick={generateAndPreviewPdf}
                                  disabled={isGenerating || includedQuestions.size === 0}
                                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg transition-all flex items-center gap-2"
                              >
                                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                                  Generate Preview
                              </button>
                          </div>
                      </>
                  )}
              </div>
          </div>
      )}

      {previewPdfUrl && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <div className="relative w-full h-full flex flex-col bg-gray-900">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800">
                      <h3 className="text-white font-bold text-lg">Topper Answer Sheet Preview</h3>
                      <button onClick={() => setPreviewPdfUrl(null)} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-bold transition-colors">
                          Close Preview
                      </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                      <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewPdfUrl)}&embedded=true`} className="w-full h-full border-0" title="Answer Preview" />
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
