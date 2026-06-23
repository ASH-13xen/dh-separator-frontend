import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, ArrowLeft, BookOpen } from 'lucide-react';
import { fetchSubjectRegistry } from '../services/api';
import SubjectSetupPage from './SubjectSetupPage';
import SubjectBookPage from './SubjectBookPage';

export default function SubjectBooksHubPage() {
  const [view, setView] = useState('switcher'); // 'switcher' | 'setup' | 'book'
  const [selected, setSelected] = useState(null); // { slug, name }
  const [activeSubjects, setActiveSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActiveSubjects = useCallback(() => {
    console.log('[SubjectBooksHubPage] Loading active subjects...');
    setIsLoading(true);
    fetchSubjectRegistry('active')
      .then((subjects) => {
        console.log(`[SubjectBooksHubPage] Loaded ${subjects.length} active subject(s):`, subjects);
        setActiveSubjects(subjects);
      })
      .catch((err) => console.error('[SubjectBooksHubPage] Failed to load active subjects:', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (view === 'switcher') loadActiveSubjects();
  }, [view, loadActiveSubjects]);

  if (view === 'setup') {
    return (
      <SubjectSetupPage
        onActivated={(slug, name) => {
          console.log(`[SubjectBooksHubPage] Subject activated, switching to book view: slug='${slug}', name='${name}'.`);
          setSelected({ slug, name });
          setView('book');
        }}
      />
    );
  }

  if (view === 'book' && selected) {
    return (
      <div>
        <div className="max-w-6xl mx-auto pt-6 px-6">
          <button
            onClick={() => setView('switcher')}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Subjects
          </button>
        </div>
        <SubjectBookPage subject={selected.slug} subjectName={selected.name} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-100 p-6 md:p-12 font-sans flex justify-center items-start">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/10 mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Subject Books</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Pick a subject to build its topic-wise compiled answer book, or set up a new subject.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSubjects.map((s) => (
              <button
                key={s.slug}
                onClick={() => {
                  setSelected({ slug: s.slug, name: s.name });
                  setView('book');
                }}
                className="text-left bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-2xl p-6 transition-colors"
              >
                <h3 className="text-lg font-bold text-white">{s.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{s.questionCount} questions classified</p>
              </button>
            ))}

            <button
              onClick={() => setView('setup')}
              className="text-left bg-gray-900/40 hover:bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-6 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="font-bold text-gray-300">New Subject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
