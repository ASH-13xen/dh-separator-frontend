import React, { useState, useEffect } from 'react';
import { BookOpen, Loader2, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { fetchUsedSubjects, classifySubject, activateSubject } from '../services/api';
import SubjectCombobox from '../components/SubjectCombobox';

export default function SubjectSetupPage({ onActivated }) {
  const [subject, setSubject] = useState('');
  const [usedSubjects, setUsedSubjects] = useState([]);
  const [syllabusText, setSyllabusText] = useState('');

  const [isClassifying, setIsClassifying] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[SubjectSetupPage] Fetching list of used subjects...');
    fetchUsedSubjects()
      .then((subjects) => {
        console.log(`[SubjectSetupPage] Loaded ${subjects.length} used subject(s):`, subjects);
        setUsedSubjects(subjects);
      })
      .catch((err) => console.error('[SubjectSetupPage] Failed to load used subjects:', err));
  }, []);

  const handleClassify = async () => {
    if (!subject.trim()) {
      setError('Please specify which subject to classify.');
      return;
    }
    if (!syllabusText.trim()) {
      setError('Please paste the syllabus text for this subject.');
      return;
    }

    console.log(`[SubjectSetupPage] Classifying subject '${subject.trim()}' with ${syllabusText.length} char(s) of syllabus text...`);
    setError('');
    setResult(null);
    setIsClassifying(true);
    try {
      const data = await classifySubject(subject.trim(), syllabusText);
      console.log(`[SubjectSetupPage] Classify succeeded. Slug: '${data.subject.slug}', questionCount: ${data.questionCount}.`, data);
      setResult(data);
    } catch (err) {
      console.error('[SubjectSetupPage] Classify failed:', err);
      setError([err.error, err.details].filter(Boolean).join(' — ') || 'Failed to classify subject questions.');
    } finally {
      setIsClassifying(false);
      console.log('[SubjectSetupPage] handleClassify finished.');
    }
  };

  const handleProceed = async () => {
    if (!result) return;
    console.log(`[SubjectSetupPage] Activating subject '${result.subject.slug}'...`);
    setIsActivating(true);
    setError('');
    try {
      const activated = await activateSubject(result.subject.slug);
      console.log(`[SubjectSetupPage] Subject activated:`, activated);
      onActivated(activated.slug, activated.name);
    } catch (err) {
      console.error('[SubjectSetupPage] Activate failed:', err);
      setError([err.error, err.details].filter(Boolean).join(' — ') || 'Failed to activate subject.');
    } finally {
      setIsActivating(false);
      console.log('[SubjectSetupPage] handleProceed finished.');
    }
  };

  return (
    <div className="min-h-screen text-gray-100 p-6 md:p-12 font-sans flex justify-center items-start">
      <div className="w-full max-w-4xl bg-gray-800/50 border border-gray-700 p-8 md:p-12 rounded-3xl shadow-2xl backdrop-blur-sm">

        <div className="flex flex-col text-left border-b border-gray-700/50 pb-6 mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-wide">New Subject Setup</h1>
          </div>
          <p className="text-gray-400">
            Pick a subject that already has uploaded questions, paste its syllabus, and classify every question into sections/topics/papers strictly based on that syllabus.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 shadow-lg">
            <AlertTriangle className="text-red-400 flex-shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Subject *</label>
            <SubjectCombobox
              value={subject}
              onChange={setSubject}
              subjects={usedSubjects}
              placeholder="Type a new subject name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block">Syllabus Text *</label>
            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              rows={14}
              placeholder="Paste the full syllabus for this subject here. If it distinguishes between multiple papers (e.g. Paper 1 / Paper 2), say so explicitly — otherwise every question will be placed under a single Paper 1."
              className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner font-mono text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleClassify}
              disabled={isClassifying}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              {isClassifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {isClassifying ? 'Classifying...' : 'Classify'}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-10 border-t border-gray-700/50 pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{result.subject.name}</h2>
                <p className="text-sm text-gray-400">{result.questionCount} distinct questions classified</p>
              </div>
              <button
                onClick={handleProceed}
                disabled={isActivating}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                {isActivating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {isActivating ? 'Activating...' : 'Proceed'}
              </button>
            </div>

            <div className="space-y-4">
              {result.hierarchy.map((paperNode) => {
                const totalQ = paperNode.topics.reduce((acc, t) => acc + t.questions.length, 0);
                return (
                  <div key={paperNode.paper} className="bg-gray-900/40 border border-gray-700 rounded-2xl p-5">
                    <div className="flex items-baseline justify-between mb-3">
                      <h3 className="font-extrabold text-indigo-400">{paperNode.paper}</h3>
                      <span className="text-xs text-gray-500">{totalQ} Qs</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{paperNode.section}</p>
                    <ul className="space-y-1.5">
                      {paperNode.topics.map((topic) => (
                        <li key={topic.title} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{topic.title}</span>
                          <span className="text-gray-500">{topic.questions.length}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
