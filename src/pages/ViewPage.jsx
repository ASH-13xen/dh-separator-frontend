import React, { useState, useEffect, useMemo } from 'react';
import { fetchQuestions } from '../services/api';
import { FileQuestion, FileText, Download, Filter, Loader2, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { getParsedSyllabus } from '../utils/upscSyllabus';

// Setup your base API URL dynamically. 
// Note: If using Create React App, use process.env.REACT_APP_API_BASE_URL
// If using Vite, use import.meta.env.VITE_API_BASE_URL
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ViewPage() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering States
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // Hardcoded parsed lists combined with dynamic db lists
  const { subjects: rawSubjects, topicsBySub: rawTopicsBySub } = useMemo(() => getParsedSyllabus(), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchQuestions();
        setQuestions(data);
      } catch (err) {
        setError(err.error || "Failed to load document library.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute unique filters merging DB with Syllabus (Cleaning "Paper I/II" variations)
  const subjects = useMemo(() => {
    const dbSubs = new Set(questions.map((q) => q.subject).filter(Boolean));
    
    rawSubjects.forEach(s => { 
      if (s !== 'All') {
        const cleanName = s.replace(/\s*\(Paper [IV]+\)/i, '').trim();
        dbSubs.add(cleanName);
      }
    }); 
    
    return ['All', ...Array.from(dbSubs).sort()];
  }, [questions, rawSubjects]);

  const topics = useMemo(() => {
    const filteredBySub = selectedSubject === 'All' 
        ? questions 
        : questions.filter(q => q.subject === selectedSubject);
    
    const dbTops = new Set(filteredBySub.map((q) => q.topic).filter(Boolean));
    
    if (selectedSubject === 'All') {
       Object.values(rawTopicsBySub).flat().forEach(t => dbTops.add(t));
    } else {
       const matchingRawSubjectKeys = Object.keys(rawTopicsBySub).filter(k => {
         const cleanKey = k.replace(/\s*\(Paper [IV]+\)/i, '').trim();
         return cleanKey === selectedSubject || cleanKey.includes(selectedSubject) || selectedSubject.includes(cleanKey);
       });
       
       matchingRawSubjectKeys.forEach(k => {
           rawTopicsBySub[k].forEach(t => dbTops.add(t));
       });
    }

    return ['All', ...Array.from(dbTops).sort()];
  }, [questions, selectedSubject, rawTopicsBySub]);

  // Reset topic filter if subject changes and topic is no longer valid
  useEffect(() => {
    if (!topics.includes(selectedTopic)) {
      setSelectedTopic('All');
    }
  }, [topics, selectedTopic]);

  // Apply filters to data rendering
  const displayedQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSubject = selectedSubject === 'All' || q.subject === selectedSubject;
      const matchTopic = selectedTopic === 'All' || q.topic === selectedTopic;
      return matchSubject && matchTopic;
    });
  }, [questions, selectedSubject, selectedTopic]);

  const handleDownloadPdf = () => {
    if (displayedQuestions.length === 0) return;
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    const title = selectedSubject === 'All' ? 'UPSC Comprehensive Document Index' : `UPSC Index - ${selectedSubject}`;
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Topic Filter: ${selectedTopic}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);

    const tableData = displayedQuestions.map((item, index) => {
      const pdfs = item.file_urls || [];
      
      const linksText = pdfs.map((fileObj, i) => {
        const urlToParse = fileObj.url || '';
        let cleanUrl = urlToParse.replace('https//', 'https://').replace('http//', 'http://');
        
        if (cleanUrl.includes('res.cloudinary.com') && !cleanUrl.toLowerCase().endsWith('.pdf')) {
            cleanUrl = cleanUrl + '.pdf';
        }

        if (!cleanUrl.startsWith('http')) {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
          cleanUrl = `${baseUrl}${cleanUrl}`;
        }
        return `[${fileObj.topper_name || 'Answer'}]: ${cleanUrl}`;
      }).join('\n');
      
      return [
        index + 1,
        item.question_text || '-',
        linksText || 'No files'
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: [['#', 'Question', 'Extracted Files']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 4, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 100 },
        2: { cellWidth: 'auto' },
      },
    });

    const filenameSub = selectedSubject === 'All' ? 'Complete_Library' : selectedSubject.replace(/[^a-z0-9]/gi, '_');
    const filenameTop = selectedTopic === 'All' ? '' : `_${selectedTopic.replace(/[^a-z0-9]/gi, '_')}`;
    
    doc.save(`UPSC_Filtered_${filenameSub}${filenameTop}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col justify-center items-center">
         <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
         <p>Loading Document Library from Database...</p>
      </div>
    );
  }

  if (error) {
    return (
       <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col justify-center items-center">
         <div className="bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 shadow-lg">
            <AlertTriangle className="text-red-400 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans overflow-x-hidden">
      
      <header className="max-w-6xl mx-auto text-left mt-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-4">
          Library Viewer
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
          Browse, filter, and export the processed UPSC dataset. Duplicate instances of the same question automatically merge their extracted answers below.
        </p>
      </header>

      <main className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
         
         <div className="bg-gray-800/60 border border-gray-700 p-6 rounded-2xl flex flex-wrap md:flex-nowrap items-center gap-6 shadow-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2 md:mb-0 w-full md:w-auto">
              <Filter className="w-5 h-5" /> <span>FILTERS</span>
            </div>

            <div className="flex-1 w-full relative">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Subject</label>
              <select 
                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>

            <div className="flex-1 w-full relative">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Topic</label>
              <select 
                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                {topics.map(top => <option key={top} value={top}>{top}</option>)}
              </select>
            </div>

            <button
               onClick={handleDownloadPdf}
               disabled={displayedQuestions.length === 0}
               className="md:mt-5 ml-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500 text-white font-medium py-3 px-8 rounded-lg shadow-lg transition-all flex items-center justify-center gap-3 w-full md:w-auto"
             >
               <Download className="w-5 h-5" /> Export PDF
            </button>
         </div>

         <div className="flex items-center justify-between pb-4 border-b border-gray-700 pt-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileQuestion className="text-teal-400" /> 
              Filtered Index
            </h2>
            <div className="bg-teal-600 px-4 py-1 rounded-full text-sm font-medium text-white shadow-lg">
              {displayedQuestions.length} Questions
            </div>
         </div>

         {displayedQuestions.length === 0 ? (
           <div className="text-center py-20 text-gray-500">No questions match your selected filters.</div>
         ) : (
           <div className="space-y-6 pb-24">
              {displayedQuestions.map((qa, idx) => (
                <div key={idx} className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-2xl shadow-md hover:border-teal-500/50 transition-colors flex flex-col lg:flex-row gap-6">
                  
                  <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30">
                          {qa.subject}
                        </span>
                        <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full text-xs border border-gray-600">
                          {qa.topic}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Question Context</h4>
                      <p className="text-white font-medium text-lg leading-snug">{qa.question_text}</p>
                  </div>

                  <div className="lg:w-1/3 bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                     <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Extracted Source Sheets ({qa.file_urls?.length || 0})</h4>
                     <div className="flex flex-col gap-2">
                        {qa.file_urls && qa.file_urls.length > 0 ? (
                           qa.file_urls.map((fileObj, uIdx) => {
                              const getCleanUrl = (url) => {
                                if (!url) return '#';
                                let cleanUrl = url.replace('https//', 'https://').replace('http//', 'http://');
                                
                                if (cleanUrl.includes('res.cloudinary.com') && !cleanUrl.toLowerCase().endsWith('.pdf')) {
                                    cleanUrl = cleanUrl + '.pdf';
                                }

                                if (cleanUrl.startsWith('http')) return cleanUrl;
                                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                                return `${baseUrl}${cleanUrl}`;
                              };
                              return (
                                <a 
                                  key={uIdx}
                                  href={getCleanUrl(fileObj.url)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between gap-3 w-full bg-gray-800 hover:bg-teal-600 text-gray-200 hover:text-white px-4 py-3 rounded-lg transition-colors border border-gray-700 hover:border-teal-500 cursor-pointer"
                                >
                                  <span className="flex items-center gap-2 font-medium text-sm">
                                    <FileText className="w-4 h-4 text-teal-400" /> {fileObj.topper_name || 'Unknown Topper'}
                                  </span>
                                  <span className="text-xs opacity-50 bg-black/20 px-2 py-1 rounded">View PDF</span>
                                </a>
                              );
                           })
                        ) : (
                          <span className="text-sm text-gray-600 italic">No associated PDFs extracted.</span>
                        )}
                     </div>
                  </div>

                </div>
              ))}
           </div>
         )}

      </main>

    </div>
  );
}