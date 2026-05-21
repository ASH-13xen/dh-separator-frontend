import React, { useState, useEffect } from 'react';
import { UploadCloud, FileEdit, Check, Loader2, AlertTriangle, X, Plus } from 'lucide-react';
import { fetchHierarchy, uploadManualQuestion, addCustomTag } from '../services/api';

export default function ManualPage() {
  const [hierarchyData, setHierarchyData] = useState(null);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true);
  
  const [questionText, setQuestionText] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedOptional, setSelectedOptional] = useState('');
  const [selectedOptionalPaper, setSelectedOptionalPaper] = useState('');
  const [selectedOptionalSection, setSelectedOptionalSection] = useState('');
  const [selectedOptionalTopic, setSelectedOptionalTopic] = useState('');
  
  const [topperName, setTopperName] = useState('');
  const [topperYear, setTopperYear] = useState('');
  const [topperRank, setTopperRank] = useState('');
  const [topperMarks, setTopperMarks] = useState('');
  const [file, setFile] = useState(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add custom tag modal states
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [addTagType, setAddTagType] = useState(null);
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
        setSelectedModule(value);
        setSelectedSection('');
        setSelectedTopic('');
      } else if (type === 'gsSection') {
        setSelectedSection(value);
        setSelectedTopic('');
      } else if (type === 'gsTopic') {
        setSelectedTopic(value);
      } else if (type === 'optionalSubject') {
        setSelectedOptional(value);
        setSelectedOptionalPaper('');
        setSelectedOptionalSection('');
        setSelectedOptionalTopic('');
      } else if (type === 'optionalSection') {
        setSelectedOptionalSection(value);
        setSelectedOptionalTopic('');
      } else if (type === 'optionalTopic') {
        setSelectedOptionalTopic(value);
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
      payload.parentModule = selectedModule;
    }
    if (addTagType === 'gsTopic') {
      payload.parentSection = selectedSection;
    }
    if (addTagType === 'optionalSection' || addTagType === 'optionalTopic') {
      payload.parentModule = selectedOptional;
    }
    if (addTagType === 'optionalTopic') {
      payload.parentSection = selectedOptionalSection;
    }
    
    try {
      await addCustomTag(payload);
      
      setHierarchyData(prev => {
        const next = { ...prev };
        const name = payload.name;
        
        if (addTagType === 'gsModule') {
          if (!next.gsModules) next.gsModules = {};
          next.gsModules[name] = next.gsModules[name] || [];
        } else if (addTagType === 'gsSection') {
          const mod = selectedModule;
          if (mod && next.gsModules[mod]) {
            const exists = next.gsModules[mod].some(s => s.section === name);
            if (!exists) {
              next.gsModules[mod].push({ section: name, topics: [] });
            }
          }
        } else if (addTagType === 'gsTopic') {
          const mod = selectedModule;
          const sec = selectedSection;
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
          const sub = selectedOptional;
          if (sub && next.optionalSubjects[sub]) {
            const exists = next.optionalSubjects[sub].some(s => s.section === name);
            if (!exists) {
              next.optionalSubjects[sub].push({ section: name, topics: [] });
            }
          }
        } else if (addTagType === 'optionalTopic') {
          const sub = selectedOptional;
          const sec = selectedOptionalSection;
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
        setSelectedModule(payload.name);
        setSelectedSection('');
        setSelectedTopic('');
      } else if (addTagType === 'gsSection') {
        setSelectedSection(payload.name);
        setSelectedTopic('');
      } else if (addTagType === 'gsTopic') {
        setSelectedTopic(payload.name);
      } else if (addTagType === 'optionalSubject') {
        setSelectedOptional(payload.name);
        setSelectedOptionalPaper('');
        setSelectedOptionalSection('');
        setSelectedOptionalTopic('');
      } else if (addTagType === 'optionalSection') {
        setSelectedOptionalSection(payload.name);
        setSelectedOptionalTopic('');
      } else if (addTagType === 'optionalTopic') {
        setSelectedOptionalTopic(payload.name);
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
    if (addTagType === 'gsModule') setSelectedModule(addTagPrevValue);
    else if (addTagType === 'gsSection') setSelectedSection(addTagPrevValue);
    else if (addTagType === 'gsTopic') setSelectedTopic(addTagPrevValue);
    else if (addTagType === 'optionalSubject') setSelectedOptional(addTagPrevValue);
    else if (addTagType === 'optionalSection') setSelectedOptionalSection(addTagPrevValue);
    else if (addTagType === 'optionalTopic') setSelectedOptionalTopic(addTagPrevValue);
    
    setShowAddTagModal(false);
    setNewTagName('');
  };

  useEffect(() => {
    fetchHierarchy()
      .then(data => {
        setHierarchyData(data);
        setIsLoadingHierarchy(false);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg('Failed to load tag hierarchy.');
        setIsLoadingHierarchy(false);
      });
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setQuestionText('');
    setSelectedModule('');
    setSelectedSection('');
    setSelectedTopic('');
    setSelectedOptional('');
    setSelectedOptionalPaper('');
    setSelectedOptionalSection('');
    setSelectedOptionalTopic('');
    setTopperName('');
    setTopperYear('');
    setTopperRank('');
    setTopperMarks('');
    setFile(null);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText || !file) {
      setErrorMsg('Question text and a PDF file are required.');
      return;
    }
    
    setErrorMsg('');
    setSuccessMsg('');
    setIsUploading(true);

    const tags = [
        selectedModule, selectedSection, selectedTopic, 
        selectedOptional, selectedOptionalPaper, selectedOptionalSection, selectedOptionalTopic
    ].filter(Boolean);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question_text', questionText);
    formData.append('topper_name', topperName || 'Unknown Topper');
    formData.append('topper_year', topperYear);
    formData.append('topper_rank', topperRank);
    formData.append('topper_marks', topperMarks);
    formData.append('tags', JSON.stringify(tags));

    try {
      await uploadManualQuestion(formData);
      setSuccessMsg('Successfully added manual question and uploaded the document!');
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (err) {
      setErrorMsg(err.error || 'Failed to upload manual question.');
    } finally {
      setIsUploading(false);
    }
  };

  let availableSections = [];
  let availableTopics = [];
  if (selectedModule && hierarchyData && hierarchyData.gsModules[selectedModule]) {
      availableSections = hierarchyData.gsModules[selectedModule];
      const secObj = availableSections.find(s => s.section === selectedSection);
      if (secObj && secObj.topics) {
          availableTopics = secObj.topics;
      }
  }

  let availableOptionalSections = [];
  let availableOptionalTopics = [];
  if (selectedOptional && hierarchyData && hierarchyData.optionalSubjects[selectedOptional]) {
      availableOptionalSections = hierarchyData.optionalSubjects[selectedOptional];
      const secObj = availableOptionalSections.find(s => s.section === selectedOptionalSection);
      if (secObj && secObj.topics) {
          availableOptionalTopics = secObj.topics;
      }
  }

  if (isLoadingHierarchy) {
      return (
        <div className="min-h-screen flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      );
  }

  return (
    <div className="min-h-screen text-gray-100 p-6 md:p-12 font-sans overflow-x-hidden flex justify-center items-start">
      <div className="w-full max-w-4xl bg-gray-800/50 border border-gray-700 p-8 md:p-12 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 backdrop-blur-sm">
        
        <div className="flex flex-col text-left border-b border-gray-700/50 pb-6 mb-8">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileEdit className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-wide">Manual Questions</h1>
            </div>
            <p className="text-gray-400">
               Directly add specific questions and topper answers to the library. This bypasses the automated AI extraction completely.
            </p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 shadow-lg">
            <AlertTriangle className="text-red-400 flex-shrink-0" />
            <p className="font-medium text-sm">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-emerald-900/40 border border-emerald-500 text-emerald-200 px-6 py-4 rounded-xl flex items-center gap-3 shadow-lg">
            <Check className="text-emerald-400 flex-shrink-0" />
            <p className="font-medium text-sm">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Question Text */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Question Text *</label>
                <textarea 
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={3}
                    placeholder="Type the full question here..."
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors resize-none shadow-inner"
                    required
                />
            </div>

            {/* Hierarchical Tags */}
            <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-700 space-y-4">
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">Classification Tags</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">GS Module</label>
                        <select
                            value={selectedModule}
                            onChange={(e) => handleSelectChange('gsModule', e.target.value, selectedModule)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Module --</option>
                            {hierarchyData && Object.keys(hierarchyData.gsModules).sort().map(mod => (
                                <option key={mod} value={mod}>{mod}</option>
                            ))}
                            <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Subject</label>
                        <select
                            value={selectedOptional}
                            onChange={(e) => handleSelectChange('optionalSubject', e.target.value, selectedOptional)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Optional --</option>
                            {hierarchyData && Object.keys(hierarchyData.optionalSubjects).sort().map(sub => (
                                <option key={sub} value={sub}>{sub.replace('OptionalSubject', '')}</option>
                            ))}
                            <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                        </select>
                    </div>

                    {selectedModule && (
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Section</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => handleSelectChange('gsSection', e.target.value, selectedSection)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Section --</option>
                            {availableSections.map((sec, i) => (
                                <option key={i} value={sec.section}>{sec.section}</option>
                            ))}
                            <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                        </select>
                    </div>
                    )}

                    {selectedSection && (
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Topic</label>
                        <select
                            value={selectedTopic}
                            onChange={(e) => handleSelectChange('gsTopic', e.target.value, selectedTopic)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Topic --</option>
                            {availableTopics.map((top, i) => (
                                <option key={i} value={top.title}>{top.title}</option>
                            ))}
                            <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                        </select>
                    </div>
                    )}

                    {selectedOptional && (
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Paper</label>
                        <select
                            value={selectedOptionalPaper}
                            onChange={(e) => setSelectedOptionalPaper(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Paper --</option>
                            <option value="Paper 1">Paper 1</option>
                            <option value="Paper 2">Paper 2</option>
                        </select>
                    </div>
                    )}

                    {selectedOptional && (
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Section</label>
                        <select
                            value={selectedOptionalSection}
                            onChange={(e) => handleSelectChange('optionalSection', e.target.value, selectedOptionalSection)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Optional Section --</option>
                            {availableOptionalSections.map((sec, i) => (
                                <option key={i} value={sec.section}>{sec.section.substring(0, 60)}...</option>
                            ))}
                            <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                        </select>
                    </div>
                    )}

                    {(selectedOptional && selectedOptionalSection) && (
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Topic</label>
                        <select
                            value={selectedOptionalTopic}
                            onChange={(e) => handleSelectChange('optionalTopic', e.target.value, selectedOptionalTopic)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Optional Topic --</option>
                            {availableOptionalTopics.map((top, i) => (
                                <option key={i} value={top.title}>{top.title.substring(0, 60)}...</option>
                            ))}
                            <option value="__add_new__" className="text-indigo-400 font-bold">+ Add New...</option>
                        </select>
                    </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topper Details */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Topper Name</label>
                        <input 
                            type="text"
                            value={topperName}
                            onChange={(e) => setTopperName(e.target.value)}
                            placeholder="e.g. Shruti Sharma"
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
                        />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Year</label>
                            <input 
                                type="text"
                                value={topperYear}
                                onChange={(e) => setTopperYear(e.target.value)}
                                placeholder="e.g. 2021"
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors shadow-inner text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Rank</label>
                            <input 
                                type="text"
                                value={topperRank}
                                onChange={(e) => setTopperRank(e.target.value)}
                                placeholder="e.g. AIR 1"
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors shadow-inner text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Marks</label>
                            <input 
                                type="text"
                                value={topperMarks}
                                onChange={(e) => setTopperMarks(e.target.value)}
                                placeholder="e.g. 1050"
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors shadow-inner text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* PDF File Upload */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Answer Sheet PDF *</label>
                    <div className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-2 px-3 flex items-center justify-between transition-colors shadow-inner focus-within:border-orange-500 overflow-hidden">
                        <input 
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            required
                            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer w-full"
                        />
                        {file && (
                            <button type="button" onClick={() => setFile(null)} className="text-gray-500 hover:text-red-400 ml-2">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-700/50 flex justify-end gap-4">
                <button 
                    type="button"
                    onClick={handleClear}
                    disabled={isUploading}
                    className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                    Clear Form
                </button>
                <button 
                    type="submit"
                    disabled={isUploading || !questionText || !file}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                    {isUploading ? 'Uploading...' : 'Save Question'}
                </button>
            </div>

        </form>
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
                  <div className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-2 rounded-lg">
                    Adding to: <span className="font-semibold">{addTagType.startsWith('gs') ? selectedModule : selectedOptional}</span>
                    {(addTagType === 'gsTopic' || addTagType === 'optionalTopic') && (
                      <>
                        {' > '}
                        <span className="font-semibold">{addTagType.startsWith('gs') ? selectedSection : selectedOptionalSection}</span>
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
                    className="w-full bg-gray-850 border border-gray-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
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
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-lg text-sm flex items-center gap-1.5 transition-colors"
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