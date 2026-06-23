import React, { useState, useEffect } from 'react';
import { UploadCloud, FileEdit, Check, Loader2, AlertTriangle, X } from 'lucide-react';
import { uploadManualQuestion, fetchUsedSubjects } from '../services/api';
import SubjectCombobox from '../components/SubjectCombobox';

export default function ManualPage() {
  const [questionText, setQuestionText] = useState('');
  const [subject, setSubject] = useState('');
  const [usedSubjects, setUsedSubjects] = useState([]);

  const [topperName, setTopperName] = useState('');
  const [topperYear, setTopperYear] = useState('');
  const [topperRank, setTopperRank] = useState('');
  const [topperMarks, setTopperMarks] = useState('');
  const [file, setFile] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    console.log('[ManualPage] Fetching list of used subjects...');
    fetchUsedSubjects()
      .then((subjects) => {
        console.log(`[ManualPage] Loaded ${subjects.length} used subject(s):`, subjects);
        setUsedSubjects(subjects);
      })
      .catch((err) => console.error('[ManualPage] Failed to load used subjects:', err));
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setQuestionText('');
    setSubject('');
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
    if (!subject.trim()) {
      setErrorMsg('Please specify which subject this question belongs to.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('question_text', questionText);
    formData.append('topper_name', topperName || 'Unknown Topper');
    formData.append('topper_year', topperYear);
    formData.append('topper_rank', topperRank);
    formData.append('topper_marks', topperMarks);
    formData.append('subject', subject.trim());

    console.log(`[ManualPage] Submitting manual question for subject '${subject.trim()}', file '${file.name}' (${file.size} bytes)...`);
    try {
      const data = await uploadManualQuestion(formData);
      console.log('[ManualPage] Manual upload succeeded:', data);
      setSuccessMsg('Successfully added manual question and uploaded the document!');
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (err) {
      console.error('[ManualPage] Manual upload failed:', err);
      setErrorMsg([err.error, err.details].filter(Boolean).join(' — ') || 'Failed to upload manual question.');
    } finally {
      setIsUploading(false);
    }
  };

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

            {/* Subject */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Subject *</label>
                <SubjectCombobox
                    value={subject}
                    onChange={setSubject}
                    subjects={usedSubjects}
                    placeholder="Type a new subject name"
                    accentClassName="focus:border-orange-500"
                />
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
