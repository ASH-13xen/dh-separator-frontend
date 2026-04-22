import React, { useMemo, useState, useEffect } from 'react';
import { FileQuestion, FileText, Edit2, Check, X, Loader2, Plus } from 'lucide-react';
import { updateQuestion, fetchTags } from '../services/api';

export default function ResultsViewer({ results, onResultUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editFormTags, setEditFormTags] = useState([]);
  const [newTagToAdd, setNewTagToAdd] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validTags, setValidTags] = useState([]);

  useEffect(() => {
    fetchTags().then(setValidTags).catch(console.error);
  }, []);

  const getCleanUrl = (url) => {
    if (!url) return '#';
    let cleanUrl = url.replace('https//', 'https://').replace('http//', 'http://');
    if (cleanUrl.startsWith('http')) return cleanUrl;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanUrl}`;
  };

  const handleEditClick = (qa) => {
    setEditingId(qa._id);
    setEditFormTags(qa.tags || []);
    setNewTagToAdd('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormTags([]);
    setNewTagToAdd('');
  };

  const handleSaveEdit = async (id) => {
    if (!id) return;
    setIsSaving(true);
    try {
      const updated = await updateQuestion(id, { tags: editFormTags });
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

  const addTagToForm = () => {
    if (newTagToAdd && !editFormTags.includes(newTagToAdd)) {
        setEditFormTags([...editFormTags, newTagToAdd]);
        setNewTagToAdd('');
    }
  };

  const removeTagFromForm = (tagToRemove) => {
      setEditFormTags(editFormTags.filter(t => t !== tagToRemove));
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
          {results.length} Indexed Questions
        </div>
      </div>

      <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((qa, idx) => {
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
                        <div className="space-y-3 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Current Tags</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {editFormTags.map(t => (
                                      <span key={t} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30 flex items-center gap-1">
                                        {t} 
                                        <button onClick={() => removeTagFromForm(t)} className="hover:text-white ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                  ))}
                                  {editFormTags.length === 0 && <span className="text-xs text-gray-500">No tags added yet.</span>}
                                </div>
                                
                                <div className="flex gap-2">
                                    <select
                                        value={newTagToAdd}
                                        onChange={(e) => setNewTagToAdd(e.target.value)}
                                        className="flex-1 bg-gray-800 border border-indigo-500/50 rounded-lg py-1.5 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="" disabled>Select a Tag to Add</option>
                                        {validTags.filter(vt => !editFormTags.includes(vt)).map(vt => (
                                            <option key={vt} value={vt}>{vt}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={addTagToForm}
                                        disabled={!newTagToAdd}
                                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-3">
                              <button onClick={handleCancelEdit} disabled={isSaving} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                                <X className="w-4 h-4" /> Cancel
                              </button>
                              <button onClick={() => handleSaveEdit(qa._id)} disabled={isSaving} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                              </button>
                            </div>
                        </div>
                      ) : (
                        <>
                          <div className="sm:hidden mb-2">
                             <div className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded w-max text-xs font-bold border border-indigo-500/30">
                               Pgs {qa.start_page}-{qa.end_page}
                             </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Tags Classification</h4>
                            <div className="flex flex-wrap gap-2">
                               {qa.tags && qa.tags.length > 0 ? (
                                   qa.tags.map((t, idx) => (
                                      <span key={idx} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30">
                                        {t}
                                      </span>
                                   ))
                               ) : (
                                   <span className="text-gray-500 text-xs italic">Uncategorized</span>
                               )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

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
    </div>
  );
}