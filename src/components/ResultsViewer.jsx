import React, { useMemo, useState, useEffect } from 'react';
import { FileQuestion, FileText, Edit2, Check, X, Loader2, Plus } from 'lucide-react';
import { updateQuestion, fetchHierarchy, addCustomTag } from '../services/api';

export default function ResultsViewer({ results, onResultUpdate }) {
  const [editingId, setEditingId] = useState(null);
  
  const [hierarchyData, setHierarchyData] = useState(null);
  
  const [editModule, setEditModule] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editOptional, setEditOptional] = useState('');
  const [editOptionalPaper, setEditOptionalPaper] = useState('');
  const [editOptionalSection, setEditOptionalSection] = useState('');
  const [editOptionalTopic, setEditOptionalTopic] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  // Add custom tag modal states
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [addTagType, setAddTagType] = useState(null); // 'gsModule' | 'gsSection' | 'gsTopic' | 'optionalSubject' | 'optionalSection' | 'optionalTopic'
  const [newTagName, setNewTagName] = useState('');
  const [addTagPrevValue, setAddTagPrevValue] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const handleSelectChange = (type, value, prevValue) => {
    if (value === '__add_new__') {
      setAddTagType(type);
      setAddTagPrevValue(prevValue);
      setNewTagName('');
      setShowAddTagModal(true);
    } else {
      if (type === 'gsModule') {
        setEditModule(value);
        setEditSection('');
        setEditTopic('');
      } else if (type === 'gsSection') {
        setEditSection(value);
        setEditTopic('');
      } else if (type === 'gsTopic') {
        setEditTopic(value);
      } else if (type === 'optionalSubject') {
        setEditOptional(value);
        setEditOptionalPaper('');
        setEditOptionalSection('');
        setEditOptionalTopic('');
      } else if (type === 'optionalSection') {
        setEditOptionalSection(value);
        setEditOptionalTopic('');
      } else if (type === 'optionalTopic') {
        setEditOptionalTopic(value);
      }
    }
  };

  const handleAddTagSubmit = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setIsCreatingTag(true);
    
    const payload = {
      type: addTagType,
      name: newTagName.trim()
    };
    
    if (addTagType === 'gsSection' || addTagType === 'gsTopic') {
      payload.parentModule = editModule;
    }
    if (addTagType === 'gsTopic') {
      payload.parentSection = editSection;
    }
    if (addTagType === 'optionalSection' || addTagType === 'optionalTopic') {
      payload.parentModule = editOptional;
    }
    if (addTagType === 'optionalTopic') {
      payload.parentSection = editOptionalSection;
    }
    
    try {
      const response = await addCustomTag(payload);
      const createdName = response.name || payload.name;
      
      setHierarchyData(prev => {
        const next = { ...prev };
        const name = createdName;
        
        if (addTagType === 'gsModule') {
          if (!next.gsModules) next.gsModules = {};
          next.gsModules[name] = next.gsModules[name] || [];
        } else if (addTagType === 'gsSection') {
          const mod = editModule;
          if (mod && next.gsModules[mod]) {
            const exists = next.gsModules[mod].some(s => s.section === name);
            if (!exists) {
              next.gsModules[mod].push({ section: name, topics: [] });
            }
          }
        } else if (addTagType === 'gsTopic') {
          const mod = editModule;
          const sec = editSection;
          if (mod && sec && next.gsModules[mod]) {
            const secObj = next.gsModules[mod].find(s => s.section === sec);
            if (secObj) {
              if (!secObj.topics) secObj.topics = [];
              const exists = secObj.topics.some(t => t.title === name);
              if (!exists) {
                secObj.topics.push({ title: name });
              }
            }
          }
        } else if (addTagType === 'optionalSubject') {
          if (!next.optionalSubjects) next.optionalSubjects = {};
          next.optionalSubjects[name] = next.optionalSubjects[name] || [];
        } else if (addTagType === 'optionalSection') {
          const sub = editOptional;
          if (sub && next.optionalSubjects[sub]) {
            const exists = next.optionalSubjects[sub].some(s => s.section === name);
            if (!exists) {
              next.optionalSubjects[sub].push({ section: name, topics: [] });
            }
          }
        } else if (addTagType === 'optionalTopic') {
          const sub = editOptional;
          const sec = editOptionalSection;
          if (sub && sec && next.optionalSubjects[sub]) {
            const secObj = next.optionalSubjects[sub].find(s => s.section === sec);
            if (secObj) {
              if (!secObj.topics) secObj.topics = [];
              const exists = secObj.topics.some(t => t.title === name);
              if (!exists) {
                secObj.topics.push({ title: name });
              }
            }
          }
        }
        
        return next;
      });
      
      if (addTagType === 'gsModule') {
        setEditModule(createdName);
        setEditSection('');
        setEditTopic('');
      } else if (addTagType === 'gsSection') {
        setEditSection(createdName);
        setEditTopic('');
      } else if (addTagType === 'gsTopic') {
        setEditTopic(createdName);
      } else if (addTagType === 'optionalSubject') {
        setEditOptional(createdName);
        setEditOptionalPaper('');
        setEditOptionalSection('');
        setEditOptionalTopic('');
      } else if (addTagType === 'optionalSection') {
        setEditOptionalSection(createdName);
        setEditOptionalTopic('');
      } else if (addTagType === 'optionalTopic') {
        setEditOptionalTopic(createdName);
      }
      
      setShowAddTagModal(false);
      setNewTagName('');
    } catch (err) {
      alert(err.error || 'Failed to add custom tag.');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleAddTagCancel = () => {
    if (addTagType === 'gsModule') setEditModule(addTagPrevValue);
    else if (addTagType === 'gsSection') setEditSection(addTagPrevValue);
    else if (addTagType === 'gsTopic') setEditTopic(addTagPrevValue);
    else if (addTagType === 'optionalSubject') setEditOptional(addTagPrevValue);
    else if (addTagType === 'optionalSection') setEditOptionalSection(addTagPrevValue);
    else if (addTagType === 'optionalTopic') setEditOptionalTopic(addTagPrevValue);
    
    setShowAddTagModal(false);
    setNewTagName('');
  };

  useEffect(() => {
    fetchHierarchy().then(setHierarchyData).catch(console.error);
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
    
    let foundMod = '';
    let foundSec = '';
    let foundTop = '';
    let foundOpt = '';
    let foundOptSec = '';
    let foundOptTop = '';
    let foundOptPaper = '';
    
    const tags = qa.tags || [];
    
    if (hierarchyData) {
        for (const mod of Object.keys(hierarchyData.gsModules)) {
            if (tags.includes(mod)) {
                foundMod = mod;
                break;
            }
        }
        
        if (foundMod) {
            const sections = hierarchyData.gsModules[foundMod];
            for (const secObj of sections) {
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
        
        for (const opt of Object.keys(hierarchyData.optionalSubjects)) {
            if (tags.includes(opt)) {
                foundOpt = opt;
                break;
            }
        }

        if (foundOpt) {
            if (tags.includes('Paper 1')) foundOptPaper = 'Paper 1';
            else if (tags.includes('Paper 2')) foundOptPaper = 'Paper 2';

            const sections = hierarchyData.optionalSubjects[foundOpt];
            for (const secObj of sections) {
                let topicMatch = false;
                if (secObj.topics) {
                    for (const t of secObj.topics) {
                        if (tags.includes(t.title)) {
                            foundOptSec = secObj.section;
                            foundOptTop = t.title;
                            topicMatch = true;
                            break;
                        }
                    }
                }
                if (topicMatch) break;
            }
        }
    }
    
    setEditModule(foundMod);
    setEditSection(foundSec);
    setEditTopic(foundTop);
    setEditOptional(foundOpt);
    setEditOptionalPaper(foundOptPaper);
    setEditOptionalSection(foundOptSec);
    setEditOptionalTopic(foundOptTop);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditModule('');
    setEditSection('');
    setEditTopic('');
    setEditOptional('');
    setEditOptionalPaper('');
    setEditOptionalSection('');
    setEditOptionalTopic('');
  };

  const handleSaveEdit = async (id) => {
    if (!id) return;
    setIsSaving(true);
    try {
      const newTags = [
          editModule, editSection, editTopic, 
          editOptional, editOptionalPaper, editOptionalSection, editOptionalTopic
      ].filter(Boolean);
      const updated = await updateQuestion(id, { tags: newTags });
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
          {results.length} Indexed Questions
        </div>
      </div>

      <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((qa, idx) => {
                const isEditing = editingId === qa._id && qa._id;
                
                let availableSections = [];
                let availableTopics = [];
                if (isEditing && editModule && hierarchyData?.gsModules[editModule]) {
                    availableSections = hierarchyData.gsModules[editModule];
                    const secObj = availableSections.find(s => s.section === editSection);
                    if (secObj && secObj.topics) {
                        availableTopics = secObj.topics;
                    }
                }

                let availableOptionalSections = [];
                let availableOptionalTopics = [];
                if (isEditing && editOptional && hierarchyData?.optionalSubjects[editOptional]) {
                    availableOptionalSections = hierarchyData.optionalSubjects[editOptional];
                    const secObj = availableOptionalSections.find(s => s.section === editOptionalSection);
                    if (secObj && secObj.topics) {
                        availableOptionalTopics = secObj.topics;
                    }
                }

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
                        <div className="space-y-4 bg-gray-900/50 p-5 rounded-xl border border-gray-700">
                            <h4 className="text-xs font-bold text-indigo-400 uppercase">Edit Classification</h4>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase mb-1 block">GS Module</label>
                                    <select
                                        value={editModule}
                                        onChange={(e) => handleSelectChange('gsModule', e.target.value, editModule)}
                                        className="w-full bg-gray-800 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="">-- None --</option>
                                        {hierarchyData && Object.keys(hierarchyData.gsModules).sort().map(mod => (
                                            <option key={mod} value={mod}>{mod}</option>
                                        ))}
                                        <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                                    </select>
                                </div>
                                
                                {editModule && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase mb-1 block">Section</label>
                                    <select
                                        value={editSection}
                                        onChange={(e) => handleSelectChange('gsSection', e.target.value, editSection)}
                                        className="w-full bg-gray-800 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="">-- None --</option>
                                        {availableSections.map((sec, i) => (
                                            <option key={i} value={sec.section}>{sec.section.substring(0, 60)}...</option>
                                        ))}
                                        <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                                    </select>
                                </div>
                                )}

                                {editSection && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase mb-1 block">Topic</label>
                                    <select
                                        value={editTopic}
                                        onChange={(e) => handleSelectChange('gsTopic', e.target.value, editTopic)}
                                        className="w-full bg-gray-800 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="">-- None --</option>
                                        {availableTopics.map((top, i) => (
                                            <option key={i} value={top.title}>{top.title.substring(0, 60)}...</option>
                                        ))}
                                        <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                                    </select>
                                </div>
                                )}

                                <div>
                                    <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Subject (Additional)</label>
                                    <select
                                        value={editOptional}
                                        onChange={(e) => handleSelectChange('optionalSubject', e.target.value, editOptional)}
                                        className="w-full bg-gray-800 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="">-- None --</option>
                                        {hierarchyData && Object.keys(hierarchyData.optionalSubjects).sort().map(sub => (
                                            <option key={sub} value={sub}>{sub.replace('OptionalSubject', '')}</option>
                                        ))}
                                        <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                                    </select>
                                </div>

                                {editOptional && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Paper</label>
                                    <select
                                        value={editOptionalPaper}
                                        onChange={(e) => setEditOptionalPaper(e.target.value)}
                                        className="w-full bg-gray-800 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="">-- None --</option>
                                        <option value="Paper 1">Paper 1</option>
                                        <option value="Paper 2">Paper 2</option>
                                    </select>
                                </div>
                                )}

                                {editOptional && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Section</label>
                                    <select
                                        value={editOptionalSection}
                                        onChange={(e) => handleSelectChange('optionalSection', e.target.value, editOptionalSection)}
                                        className="w-full bg-gray-800 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="">-- None --</option>
                                        {availableOptionalSections.map((sec, i) => (
                                            <option key={i} value={sec.section}>{sec.section.substring(0, 60)}...</option>
                                        ))}
                                        <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                                    </select>
                                </div>
                                )}

                                {(editOptional && editOptionalSection) && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Topic</label>
                                    <select
                                        value={editOptionalTopic}
                                        onChange={(e) => handleSelectChange('optionalTopic', e.target.value, editOptionalTopic)}
                                        className="w-full bg-gray-800 border border-indigo-500/50 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-400 cursor-pointer"
                                    >
                                        <option value="">-- None --</option>
                                        {availableOptionalTopics.map((top, i) => (
                                            <option key={i} value={top.title}>{top.title.substring(0, 60)}...</option>
                                        ))}
                                        <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                                    </select>
                                </div>
                                )}
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
                                        {t.length > 45 ? t.substring(0,45) + '...' : t}
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

      {/* Modal for adding custom tags */}
      {showAddTagModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-left">
            <form onSubmit={handleAddTagSubmit}>
              <div className="p-6 border-b border-gray-800 bg-gray-800/30 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  Add New {addTagType?.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h3>
                <button
                  type="button"
                  onClick={handleAddTagCancel}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {(addTagType === 'gsSection' || addTagType === 'gsTopic' || addTagType === 'optionalSection' || addTagType === 'optionalTopic') && (
                  <div className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-lg">
                    Adding to: <span className="font-semibold">{addTagType.startsWith('gs') ? editModule : editOptional}</span>
                    {(addTagType === 'gsTopic' || addTagType === 'optionalTopic') && (
                      <>
                        {' > '}
                        <span className="font-semibold">{addTagType.startsWith('gs') ? editSection : editOptionalSection}</span>
                      </>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-gray-500 uppercase mb-1 block">Name / Title</label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder={`Enter ${addTagType?.replace(/([A-Z])/g, ' $1').toLowerCase()} name...`}
                    className="w-full bg-gray-850 border border-gray-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleAddTagCancel}
                  disabled={isCreatingTag}
                  className="px-4 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTag || !newTagName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm flex items-center gap-1.5 transition-colors"
                >
                  {isCreatingTag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}