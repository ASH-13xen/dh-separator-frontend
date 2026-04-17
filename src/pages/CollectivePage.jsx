import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Download, Loader2, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { getParsedSyllabus } from '../utils/upscSyllabus';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CollectivePage() {
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Phase handling
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Data tracking
  const [previewData, setPreviewData] = useState([]);
  const [conflictedQuestions, setConflictedQuestions] = useState([]);
  
  // Selections Object: { question_id: 'file_url' }
  const [selections, setSelections] = useState({});

  const { subjects: rawSubjects } = useMemo(() => getParsedSyllabus(), []);
  const subjects = useMemo(() => {
    const cleaned = new Set();
    rawSubjects.forEach(s => {
      if (s !== 'All') {
        const cleanName = s.replace(/\s*\(Paper [IV]+\)/i, '').trim();
        cleaned.add(cleanName);
      }
    });
    return Array.from(cleaned).sort();
  }, [rawSubjects]);

  const handleFetchPreview = async () => {
    if (!selectedSubject) return;
    setIsPreviewing(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/collective/preview?subject=${encodeURIComponent(selectedSubject)}`);
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to fetch subject format.');
        }

        const data = await response.json();
        setPreviewData(data);

        // Detect Conflicts (Questions with > 1 file_url uploaded)
        const conflicts = data.filter(q => q.file_urls && q.file_urls.length > 1);
        
        if (conflicts.length > 0) {
            setConflictedQuestions(conflicts);
            // Default select the first one for UX
            const initSelects = {};
            conflicts.forEach(c => {
                initSelects[c._id] = c.file_urls[0].url;
            });
            setSelections(initSelects);
            setShowModal(true);
        } else {
            // No conflicts, directly submit generate!
            submitGeneration({});
        }

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

  const submitGeneration = async (finalSelections) => {
    setIsGenerating(true);
    setShowModal(false);
    try {
        // Send POST Data via Fetch
        const response = await fetch(`${API_BASE_URL}/api/collective/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subject: selectedSubject,
                selections: finalSelections
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to generate collective PDF.');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Formal_UPSC_Book_${selectedSubject.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
        alert(err.message);
        setShowModal(true); // Pop back open in case they want to retry
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans overflow-x-hidden flex flex-col items-center justify-center relative">
      
      {/* Background Main Overlay */}
      <div className={`max-w-2xl w-full bg-gray-800/50 border border-gray-700 p-10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 backdrop-blur-sm transition-all ${showModal ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
         <div className="flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mb-6 shadow-indigo-500/20">
                 <BookOpen className="w-10 h-10 text-white" />
             </div>
             <h1 className="text-3xl font-bold text-white mb-3 tracking-wide">Publish Book</h1>
             <p className="text-gray-400 mb-8 max-w-lg">
                Compile massive structured documents perfectly aligned to your Subject. 
                Our engine draws formal Topic Separators, builds an interactive Index Segment, and stitches answers cleanly.
             </p>

             <div className="w-full text-left bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50 mb-8">
                 <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">Select Target Subject</label>
                 <select 
                   className="w-full bg-gray-800 border border-gray-600 rounded-xl py-3 px-4 text-lg text-white focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner"
                   value={selectedSubject}
                   onChange={(e) => setSelectedSubject(e.target.value)}
                 >
                   <option value="" disabled>-- Choose a Subject --</option>
                   {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                 </select>
             </div>

             <button
               onClick={handleFetchPreview}
               disabled={!selectedSubject || isPreviewing || isGenerating}
               className="w-full max-w-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 text-lg"
             >
               {isPreviewing || isGenerating ? (
                 <>
                   <Loader2 className="w-6 h-6 animate-spin" />
                   {isGenerating ? "Assembling Book..." : "Scanning Database..."}
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

      {/* Interactive Selection Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              
              <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 overflow-hidden">
                  
                  <div className="p-6 border-b border-gray-800 bg-gray-800/40 flex items-start gap-4">
                      <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 text-amber-400">
                          <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white mb-1">Conflicting Answers Detected</h2>
                          <p className="text-sm text-gray-400">
                              For the Subject "{selectedSubject}", several questions have been explicitly answered by multiple Toppers. To construct the book cleanly, please choose exactly <strong>one</strong> answer to integrate per question.
                          </p>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-900/50">
                      {conflictedQuestions.map((q, qIndex) => (
                          <div key={q._id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md">
                              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Question {qIndex + 1} | {q.topic}</h3>
                              <p className="text-white text-lg font-medium leading-snug mb-5">{q.question_text}</p>
                              
                              <div className="space-y-3 pl-2">
                                  {q.file_urls.map((fileObj, idx) => (
    <label 
        key={idx} 
        // 1. Added `justify-center` here to center the radio button + text block as a whole
        className={`flex items-center justify-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
            selections[q._id] === fileObj.url 
                ? 'bg-indigo-900/40 border-indigo-500 text-indigo-200' 
                : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-gray-500'
        }`}
    >
        <input 
            type="radio" 
            name={`q-${q._id}`}
            value={fileObj.url}
            checked={selections[q._id] === fileObj.url}
            onChange={() => handleSelectionChange(q._id, fileObj.url)}
            className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-600 focus:ring-2"
        />
        
        {/* 2. Added `justify-center` here to ensure inner content stays perfectly aligned */}
        <div className="flex items-center justify-center gap-2">
            <UserCheck className="w-5 h-5 opacity-70" />
            <span className="font-bold text-base">{fileObj.topper_name || 'Unknown Reference'}</span>
        </div>
    </label>
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
                          onClick={() => submitGeneration(selections)}
                          disabled={isGenerating}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-8 rounded-lg shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2"
                      >
                          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                          Confirm & Generate Matrix
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
