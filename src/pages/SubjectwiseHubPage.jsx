import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Loader2, RefreshCw, ArrowRight, ClipboardList } from "lucide-react";
import SubjectwiseSetupPage from "./SubjectwiseSetupPage";
import SubjectwiseBookPage from "./SubjectwiseBookPage";
import AllUploadsPage from "./AllUploadsPage";

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

export default function SubjectwiseHubPage() {
  const [view, setView] = useState("hub"); // "hub" | "setup" | "book" | "uploads"
  const [activeSubject, setActiveSubject] = useState(null); // { slug, name }
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/registry?status=active`);
      if (!res.ok) throw new Error("Failed to load subjects.");
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openSubject = (subject) => {
    setActiveSubject({ slug: subject.slug, name: subject.name });
    setView("book");
  };

  if (view === "setup") {
    return (
      <SubjectwiseSetupPage
        onBack={() => { setView("hub"); fetchSubjects(); }}
        onActivated={(subjectInfo) => {
          setActiveSubject(subjectInfo);
          setView("book");
          fetchSubjects();
        }}
      />
    );
  }

  if (view === "uploads") {
    return (
      <div>
        {/* Back bar */}
        <div className="bg-[#0f172a] border-b border-gray-800 px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setView("hub")}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            All Subjects
          </button>
          <span className="text-gray-700">/</span>
          <span className="text-xs font-bold text-indigo-300">All Uploads</span>
        </div>
        <AllUploadsPage />
      </div>
    );
  }

  if (view === "book" && activeSubject) {
    return (
      <div>
        {/* Back bar */}
        <div className="bg-[#0f172a] border-b border-gray-800 px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => { setView("hub"); setActiveSubject(null); }}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            All Subjects
          </button>
          <span className="text-gray-700">/</span>
          <span className="text-xs font-bold text-indigo-300">{activeSubject.name}</span>
        </div>
        <SubjectwiseBookPage subject={activeSubject.slug} subjectName={activeSubject.name} />
      </div>
    );
  }

  // Hub view
  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-500 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/10 mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Subjectwise Collective Books</h1>
          <p className="text-gray-400 max-w-lg mx-auto text-sm">
            Define a syllabus (Paper → Section → Topic), classify uploaded answer sheets with Gemini,
            then compile a full book — exactly like PSIR Book 2, for any subject.
          </p>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black text-gray-300 uppercase tracking-widest">Active Subjects</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSubjects}
              disabled={isLoading}
              className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setView("uploads")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 hover:border-indigo-500/60 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Display All Uploads
            </button>
            <button
              onClick={() => setView("setup")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              New Subject
            </button>
          </div>
        </div>

        {isLoading && subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-gray-900/40 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-4" />
            <h3 className="text-base font-bold text-gray-400 mb-2">No subjects yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Set up your first subject by defining its syllabus and classifying the uploaded questions.
            </p>
            <button
              onClick={() => setView("setup")}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer mx-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Set Up First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.slug}
                onClick={() => openSubject(subject)}
                className="bg-gray-900/60 border border-gray-800 hover:border-indigo-500/60 rounded-2xl p-5 text-left transition-all group cursor-pointer hover:bg-gray-900/80 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-600/30 transition-colors">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors mt-1 shrink-0" />
                </div>
                <h3 className="font-bold text-white text-sm leading-snug mb-1 group-hover:text-indigo-200 transition-colors">
                  {subject.name}
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold">
                  {subject.questionCount || 0} question{(subject.questionCount || 0) !== 1 ? "s" : ""} classified
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">Active</span>
                </div>
              </button>
            ))}

            {/* Add new card */}
            <button
              onClick={() => setView("setup")}
              className="bg-gray-900/30 border border-gray-800 border-dashed hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group hover:bg-gray-900/50 min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-800 group-hover:bg-indigo-600/20 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <span className="text-xs font-bold text-gray-500 group-hover:text-gray-300 transition-colors">Add Subject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
