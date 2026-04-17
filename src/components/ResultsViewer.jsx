import React, { useMemo, useState } from 'react';
import { FileQuestion, FileText, Edit2, Check, X, Loader2 } from 'lucide-react';
import { updateQuestion } from '../services/api';
import { getParsedSyllabus } from '../utils/upscSyllabus';

export default function ResultsViewer({ results, onResultUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ subject: '', topic: '' });
  const [isSaving, setIsSaving] = useState(false);

  const { subjects: rawSubjects, topicsBySub: rawTopicsBySub } = useMemo(() => getParsedSyllabus(), []);

  const subjectsOptions = useMemo(() => {
    const dbSubs = new Set(results.map((q) => q.subject).filter(Boolean));
    rawSubjects.forEach(s => { 
      if (s !== 'All') {
        const cleanName = s.replace(/\s*\(Paper [IV]+\)/i, '').trim();
        dbSubs.add(cleanName);
      }
    }); 
    return Array.from(dbSubs).sort();
  }, [results, rawSubjects]);

  const topicsOptions = useMemo(() => {
    return Array.from(new Set([
      ...Object.values(rawTopicsBySub).flat(),
      ...results.map(q => q.topic).filter(Boolean)
    ])).sort();
  }, [rawTopicsBySub, results]);

  const groupedResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return {};
    
    return results.reduce((acc, curr) => {
      const subject = curr.subject || 'Uncategorized';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(curr);
      return acc;
    }, {});
  }, [results]);

  // Helper to fix missing colons and handle absolute/relative paths
  const getCleanUrl = (url) => {
    if (!url) return '#';
    let cleanUrl = url.replace('https//', 'https://').replace('http//', 'http://');
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanUrl}`;
  };

  const handleEditClick = (qa) => {
    setEditingId(qa._id);
    setEditForm({ subject: qa.subject || '', topic: qa.topic || '' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ subject: '', topic: '' });
  };

  const handleSaveEdit = async (id) => {
    if (!id) return;
    setIsSaving(true);
    try {
      const updated = await updateQuestion(id, editForm);
      if (onResultUpdate) {
        onResultUpdate(updated);
      }
      setEditingId(null);
    } catch (err) {
      alert(err.error || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!results || results.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 mb-24 space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between pb-4 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileQuestion className="text-indigo-400" /> 
          UPSC Document Index
        </h2>
        <div className="bg-indigo-600 px-3 py-1 rounded-full text-sm font-medium text-white shadow-lg">
          {results.length} Indexed Topics
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(groupedResults).map(([subjectKey, items], index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-xl font-semibold text-indigo-300 sticky top-0 bg-[#0f172a] py-2 z-10 flex items-center gap-2">
               <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block"></span>
               {subjectKey} <span className="text-sm font-normal text-gray-500 ml-2">({items.length} questions)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((qa, idx) => {
                const isEditing = editingId === qa._id && qa._id;

                return (
                  <div key={qa._id || idx} className="bg-gray-800/60 border border-gray-700 p-6 rounded-2xl shadow-xl hover:border-indigo-500/50 transition-colors flex flex-col justify-between relative group">
                    {!isEditing && qa._id && (
                      <button 
                        onClick={() => handleEditClick(qa)}
                        className="absolute top-4 right-4 bg-gray-700 hover:bg-indigo-600 p-2 rounded-lg text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Classification"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="pr-12 w-full">
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Question</h4>
                          <p className="text-white font-medium text-md leading-snug">{qa.question_text}</p>
                        </div>
                        <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30 whitespace-nowrap hidden sm:block">
                          Pgs {qa.start_page}-{qa.end_page}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6 space-y-4">
                      {isEditing ? (
                        <>
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Subject</h4>
                            <select
                              value={editForm.subject}
                              onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                              className="w-full bg-gray-900 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                            >
                              <option value="" disabled>Select Subject...</option>
                              {subjectsOptions.map(s => <option key={s} value={s}>{s}</option>)}
                              {!subjectsOptions.includes(editForm.subject) && editForm.subject && (
                                <option value={editForm.subject}>{editForm.subject}</option>
                              )}
                            </select>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Detailed Topic</h4>
                            <select
                              value={editForm.topic}
                              onChange={(e) => setEditForm(prev => ({ ...prev, topic: e.target.value }))}
                              className="w-full bg-gray-900 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                            >
                              <option value="" disabled>Select Topic...</option>
                              {topicsOptions.map(t => <option key={t} value={t}>{t}</option>)}
                              {!topicsOptions.includes(editForm.topic) && editForm.topic && (
                                <option value={editForm.topic}>{editForm.topic}</option>
                              )}
                            </select>
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" /> Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(qa._id)}
                              disabled={isSaving}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="sm:hidden mb-2">
                             <div className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded w-max text-xs font-bold border border-indigo-500/30">
                               Pgs {qa.start_page}-{qa.end_page}
                             </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Subject</h4>
                            <p className="text-indigo-200 text-sm font-medium">{qa.subject}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Detailed Topic</h4>
                            <p className="text-gray-300 leading-relaxed font-light text-sm">{qa.topic}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Updated Button logic to use our new smart URL helper */}
                    {!isEditing && qa.file_url && (
                      <a 
                        href={getCleanUrl(qa.file_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-auto flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-indigo-600 text-white py-2 rounded-lg transition-colors font-medium text-sm"
                      >
                        <FileText className="w-4 h-4" /> View Extracted PDF
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}