import React, { useState, useEffect, useMemo } from 'react';
import { fetchQuestions, updateQuestion, fetchTags, fetchHierarchy } from '../services/api';
import { FileQuestion, FileText, Download, Filter, Loader2, AlertTriangle, Edit2, Check, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export default function ViewPage() {
  const [questions, setQuestions] = useState([]);
  const [validTags, setValidTags] = useState([]);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering States
  const [selectedTag, setSelectedTag] = useState('All');

  // Editing States
  const [editingId, setEditingId] = useState(null);
  const [editModule, setEditModule] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editOptional, setEditOptional] = useState('');
  const [editFileUrls, setEditFileUrls] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [qData, tData, hData] = await Promise.all([fetchQuestions(), fetchTags(), fetchHierarchy()]);
        setQuestions(qData);
        setValidTags(tData);
        setHierarchyData(hData);
      } catch (err) {
        setError(err.error || "Failed to load document library or tags.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filterTagsList = useMemo(() => {
      const qsTags = new Set();
      questions.forEach(q => {
          if (q.tags) q.tags.forEach(t => qsTags.add(t));
      });
      return ['All', ...Array.from(qsTags).sort()];
  }, [questions]);

  const displayedQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedTag === 'All') return true;
      return q.tags && q.tags.includes(selectedTag);
    });
  }, [questions, selectedTag]);

  const handleDownloadPdf = () => {
    if (displayedQuestions.length === 0) return;
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    const title = selectedTag === 'All' ? 'UPSC Comprehensive Document Index' : `UPSC Index - ${selectedTag}`;
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = displayedQuestions.map((item, index) => {
      const pdfs = item.file_urls || [];
      const linksText = pdfs.map((fileObj) => {
        let cleanUrl = (fileObj.url || '').replace('https//', 'https://').replace('http//', 'http://');
        if (!cleanUrl.startsWith('http')) {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
          cleanUrl = `${baseUrl}${cleanUrl}`;
        }
        return `[${fileObj.topper_name || 'Answer'}]: ${cleanUrl}`;
      }).join('\n');
      
      return [
        index + 1,
        item.question_text || '-',
        (item.tags || []).join(', '),
        linksText || 'No files'
      ];
    });

    autoTable(doc, {
      startY: 38,
      head: [['#', 'Question', 'Tags', 'Extracted Files']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' },
      },
    });

    const filenameTag = selectedTag === 'All' ? 'Complete_Library' : selectedTag.replace(/[^a-z0-9]/gi, '_');
    doc.save(`UPSC_Filtered_${filenameTag}.pdf`);
  };

  const handleEditClick = (qa) => {
    setEditingId(qa._id);
    
    // Reverse engineer current tags based on hierarchy
    let foundMod = '';
    let foundSec = '';
    let foundTop = '';
    let foundOpt = '';
    
    const tags = qa.tags || [];
    
    if (hierarchyData) {
        // Find GS Module
        for (const mod of Object.keys(hierarchyData.gsModules)) {
            if (tags.includes(mod)) {
                foundMod = mod;
                break;
            }
        }
        
        if (foundMod) {
            const sections = hierarchyData.gsModules[foundMod];
            for (const secObj of sections) {
                // If the section text is a tag, set it. 
                // Alternatively, just search topics. If we find a topic, its parent is the section.
                let topicMatch = false;
                if (secObj.topics) {
                    for (const t of secObj.topics) {
                        if (tags.includes(t.title)) {
                            foundSec = secObj.section;
                            foundTop = t.title;
                            topicMatch = true;
                            break;
                        }
                    }
                }
                if (topicMatch) break;
            }
        }
        
        // Find Optional
        for (const opt of hierarchyData.optionalSubjects) {
            if (tags.includes(opt)) {
                foundOpt = opt;
                break;
            }
        }
    }
    
    setEditModule(foundMod);
    setEditSection(foundSec);
    setEditTopic(foundTop);
    setEditOptional(foundOpt);
    setEditFileUrls(qa.file_urls ? JSON.parse(JSON.stringify(qa.file_urls)) : []);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditModule('');
    setEditSection('');
    setEditTopic('');
    setEditOptional('');
    setEditFileUrls([]);
  };

  const handleSaveEdit = async (id) => {
    if (!id) return;
    setIsSaving(true);
    try {
      const newTags = [editModule, editSection, editTopic, editOptional].filter(Boolean);
      const updated = await updateQuestion(id, { tags: newTags, file_urls: editFileUrls });
      setQuestions(prev => prev.map(q => q._id === id ? updated : q));
      setEditingId(null);
    } catch (err) {
      alert(err.error || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
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

  // Derive Dropdown Options dynamically while editing
  let availableSections = [];
  let availableTopics = [];
  if (editModule && hierarchyData.gsModules[editModule]) {
      availableSections = hierarchyData.gsModules[editModule];
      const secObj = availableSections.find(s => s.section === editSection);
      if (secObj && secObj.topics) {
          availableTopics = secObj.topics;
      }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans overflow-x-hidden">
      
      <header className="max-w-6xl mx-auto text-left mt-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mb-4">
          Library Viewer
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
          Browse, filter, and export the processed UPSC dataset using dynamic tags. Duplicate instances of the same question automatically merge their extracted answers below.
        </p>
      </header>

      <main className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
         
         <div className="bg-gray-800/60 border border-gray-700 p-6 rounded-2xl flex flex-wrap md:flex-nowrap items-center gap-6 shadow-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2 md:mb-0 w-full md:w-auto">
              <Filter className="w-5 h-5" /> <span>FILTERS</span>
            </div>

            <div className="flex-1 w-full relative">
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Filter By Tag</label>
              <select 
                className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                {filterTagsList.map(tag => <option key={tag} value={tag}>{tag}</option>)}
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
              {displayedQuestions.map((qa, idx) => {
                const isEditing = editingId === qa._id && qa._id;
                return (
                 <div key={qa._id || idx} className="relative group bg-gray-800/40 border border-gray-700/50 p-6 rounded-2xl shadow-md hover:border-teal-500/50 transition-colors flex flex-col lg:flex-row gap-6">
                   
                   {!isEditing && qa._id && (
                     <button 
                       onClick={() => handleEditClick(qa)}
                       className="absolute top-4 right-4 bg-gray-700 hover:bg-teal-600 p-2 rounded-lg text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                       title="Edit Classification"
                     >
                       <Edit2 className="w-4 h-4" />
                     </button>
                   )}

                   <div className="flex-1 pr-8">
                       <div className="flex flex-col gap-3 mb-4">
                         {isEditing ? (
                             <div className="space-y-4 bg-gray-900/50 p-5 rounded-xl border border-gray-700">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase">Edit Hierarchical Classification</h4>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Module Dropdown */}
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase mb-1 block">GS Module</label>
                                        <select
                                            value={editModule}
                                            onChange={(e) => {
                                                setEditModule(e.target.value);
                                                setEditSection('');
                                                setEditTopic('');
                                            }}
                                            className="w-full bg-gray-800 border border-teal-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-teal-400 cursor-pointer"
                                        >
                                            <option value="">-- None --</option>
                                            {hierarchyData && Object.keys(hierarchyData.gsModules).sort().map(mod => (
                                                <option key={mod} value={mod}>{mod}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Section Dropdown */}
                                    {editModule && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase mb-1 block">Section</label>
                                        <select
                                            value={editSection}
                                            onChange={(e) => {
                                                setEditSection(e.target.value);
                                                setEditTopic('');
                                            }}
                                            className="w-full bg-gray-800 border border-teal-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-teal-400 cursor-pointer"
                                        >
                                            <option value="">-- None --</option>
                                            {availableSections.map((sec, i) => (
                                                <option key={i} value={sec.section}>{sec.section.substring(0, 80)}...</option>
                                            ))}
                                        </select>
                                    </div>
                                    )}

                                    {/* Topic Dropdown */}
                                    {editSection && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase mb-1 block">Topic</label>
                                        <select
                                            value={editTopic}
                                            onChange={(e) => setEditTopic(e.target.value)}
                                            className="w-full bg-gray-800 border border-teal-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-teal-400 cursor-pointer"
                                        >
                                            <option value="">-- None --</option>
                                            {availableTopics.map((top, i) => (
                                                <option key={i} value={top.title}>{top.title.substring(0, 80)}...</option>
                                            ))}
                                        </select>
                                    </div>
                                    )}

                                    {/* Optional Subject */}
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Subject (Additional)</label>
                                        <select
                                            value={editOptional}
                                            onChange={(e) => setEditOptional(e.target.value)}
                                            className="w-full bg-gray-800 border border-teal-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-teal-400 cursor-pointer"
                                        >
                                            <option value="">-- None --</option>
                                            {hierarchyData && hierarchyData.optionalSubjects.map(sub => (
                                                <option key={sub} value={sub}>{sub.replace('OptionalSubject', '')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Topper Details */}
                                    <div className="pt-2 border-t border-gray-700/50 mt-2">
                                        <label className="text-xs text-gray-500 uppercase mb-2 block">Extracted Toppers</label>
                                        {editFileUrls.length === 0 && <span className="text-xs text-gray-600">No topper files associated.</span>}
                                        {editFileUrls.map((fileObj, idx) => (
                                            <div key={idx} className="flex gap-2 mb-2 items-center">
                                                <input 
                                                    type="text" 
                                                    value={fileObj.topper_name || ''}
                                                    onChange={(e) => {
                                                        const newUrls = [...editFileUrls];
                                                        newUrls[idx].topper_name = e.target.value;
                                                        setEditFileUrls(newUrls);
                                                    }}
                                                    className="w-full bg-gray-800 border border-teal-500/50 rounded-lg py-1.5 px-3 text-white text-sm focus:outline-none focus:border-teal-400"
                                                    placeholder="Topper Name"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-3 border-t border-gray-700/50 mt-2">
                                 <button onClick={handleCancelEdit} disabled={isSaving} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                                   <X className="w-4 h-4" /> Cancel
                                 </button>
                                 <button onClick={() => handleSaveEdit(qa._id)} disabled={isSaving} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                                 </button>
                               </div>
                             </div>
                         ) : (
                             <div className="flex flex-wrap gap-2">
                               {qa.tags && qa.tags.length > 0 ? (
                                   qa.tags.map((t, idx) => (
                                      <span key={idx} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30">
                                        {t.length > 45 ? t.substring(0,45) + '...' : t}
                                      </span>
                                   ))
                               ) : (
                                   <span className="text-gray-500 text-xs italic">Uncategorized</span>
                               )}
                             </div>
                         )}
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
              )}
              )}
           </div>
         )}

      </main>

    </div>
  );
}