import React, { useState, useEffect } from 'react';
import { UploadCloud, FileEdit, Check, Loader2, AlertTriangle, X } from 'lucide-react';
import { fetchHierarchy, uploadManualQuestion } from '../services/api';

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
                            onChange={(e) => {
                                setSelectedModule(e.target.value);
                                setSelectedSection('');
                                setSelectedTopic('');
                            }}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Module --</option>
                            {hierarchyData && Object.keys(hierarchyData.gsModules).sort().map(mod => (
                                <option key={mod} value={mod}>{mod}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Subject</label>
                        <select
                            value={selectedOptional}
                            onChange={(e) => {
                                setSelectedOptional(e.target.value);
                                setSelectedOptionalPaper('');
                                setSelectedOptionalSection('');
                                setSelectedOptionalTopic('');
                            }}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Optional --</option>
                            {hierarchyData && Object.keys(hierarchyData.optionalSubjects).sort().map(sub => (
                                <option key={sub} value={sub}>{sub.replace('OptionalSubject', '')}</option>
                            ))}
                        </select>
                    </div>

                    {selectedModule && (
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Section</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => {
                                setSelectedSection(e.target.value);
                                setSelectedTopic('');
                            }}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Section --</option>
                            {availableSections.map((sec, i) => (
                                <option key={i} value={sec.section}>{sec.section}</option>
                            ))}
                        </select>
                    </div>
                    )}

                    {selectedSection && (
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Topic</label>
                        <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Topic --</option>
                            {availableTopics.map((top, i) => (
                                <option key={i} value={top.title}>{top.title}</option>
                            ))}
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
                            onChange={(e) => {
                                setSelectedOptionalSection(e.target.value);
                                setSelectedOptionalTopic('');
                            }}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Optional Section --</option>
                            {availableOptionalSections.map((sec, i) => (
                                <option key={i} value={sec.section}>{sec.section.substring(0, 60)}...</option>
                            ))}
                        </select>
                    </div>
                    )}

                    {(selectedOptional && selectedOptionalSection) && (
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500 uppercase mb-1 block">Optional Topic</label>
                        <select
                            value={selectedOptionalTopic}
                            onChange={(e) => setSelectedOptionalTopic(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                            <option value="">-- Select Optional Topic --</option>
                            {availableOptionalTopics.map((top, i) => (
                                <option key={i} value={top.title}>{top.title.substring(0, 60)}...</option>
                            ))}
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
    </div>
  );
}