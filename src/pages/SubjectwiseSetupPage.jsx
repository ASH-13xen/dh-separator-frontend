import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  BookOpen,
  X,
  ArrowLeft,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

// A single editable text field that switches between display and edit mode inline.
function InlineEdit({ value, placeholder, onChange, className = "" }) {
  const [editing, setEditing] = useState(!value);
  const [draft, setDraft] = useState(value || "");

  const commit = () => {
    const v = draft.trim();
    if (v) { onChange(v); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className={`bg-gray-800 border border-indigo-500/60 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
      />
    );
  }
  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`cursor-pointer hover:text-indigo-300 transition-colors ${className}`}
    >
      {value}
    </span>
  );
}

export default function SubjectwiseSetupPage({ onBack, onActivated }) {
  const [subjectName, setSubjectName] = useState("");
  const [subjectNameDraft, setSubjectNameDraft] = useState("");
  const [usedSubjects, setUsedSubjects] = useState([]);
  const [papers, setPapers] = useState([]);
  const [collapsedPapers, setCollapsedPapers] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});

  const [classifyStatus, setClassifyStatus] = useState("idle"); // idle | classifying | done | error
  const [classifyError, setClassifyError] = useState("");
  const [classifiedSlug, setClassifiedSlug] = useState(null);
  const [classifiedCount, setClassifiedCount] = useState(0);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/subjects/used`)
      .then((r) => r.json())
      .then((data) => setUsedSubjects(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // --- Paper helpers ---
  const addPaper = () => {
    const id = `paper-${Date.now()}`;
    setPapers((prev) => [...prev, { id, name: "", sections: [] }]);
  };

  const updatePaperName = (paperId, name) => {
    setPapers((prev) => prev.map((p) => (p.id === paperId ? { ...p, name } : p)));
  };

  const removePaper = (paperId) => {
    setPapers((prev) => prev.filter((p) => p.id !== paperId));
  };

  // --- Section helpers ---
  const addSection = (paperId) => {
    const id = `section-${Date.now()}`;
    setPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, sections: [...p.sections, { id, name: "", topics: [] }] } : p)),
    );
  };

  const updateSectionName = (paperId, sectionId, name) => {
    setPapers((prev) =>
      prev.map((p) =>
        p.id === paperId
          ? { ...p, sections: p.sections.map((s) => (s.id === sectionId ? { ...s, name } : s)) }
          : p,
      ),
    );
  };

  const removeSection = (paperId, sectionId) => {
    setPapers((prev) =>
      prev.map((p) =>
        p.id === paperId ? { ...p, sections: p.sections.filter((s) => s.id !== sectionId) } : p,
      ),
    );
  };

  // --- Topic helpers ---
  const addTopic = (paperId, sectionId) => {
    setPapers((prev) =>
      prev.map((p) =>
        p.id === paperId
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId ? { ...s, topics: [...s.topics, ""] } : s,
              ),
            }
          : p,
      ),
    );
  };

  const updateTopic = (paperId, sectionId, topicIndex, value) => {
    setPapers((prev) =>
      prev.map((p) =>
        p.id === paperId
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId
                  ? { ...s, topics: s.topics.map((t, i) => (i === topicIndex ? value : t)) }
                  : s,
              ),
            }
          : p,
      ),
    );
  };

  const removeTopic = (paperId, sectionId, topicIndex) => {
    setPapers((prev) =>
      prev.map((p) =>
        p.id === paperId
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId ? { ...s, topics: s.topics.filter((_, i) => i !== topicIndex) } : s,
              ),
            }
          : p,
      ),
    );
  };

  // Validate and build the syllabusJson payload (strips internal IDs).
  const buildSyllabusJson = () => {
    return papers
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        sections: p.sections
          .filter((s) => s.name.trim())
          .map((s) => ({
            name: s.name.trim(),
            topics: s.topics.map((t) => t.trim()).filter(Boolean),
          })),
      }));
  };

  const totalTopicCount = papers.reduce(
    (acc, p) => acc + p.sections.reduce((sacc, s) => sacc + s.topics.filter(Boolean).length, 0),
    0,
  );

  const isReadyToClassify =
    subjectName.trim() &&
    papers.some(
      (p) =>
        p.name.trim() &&
        p.sections.some((s) => s.name.trim() && s.topics.some((t) => t.trim())),
    );

  const handleClassify = async () => {
    const name = subjectName.trim();
    const syllabusJson = buildSyllabusJson();
    if (!name || syllabusJson.length === 0) return;

    setClassifyStatus("classifying");
    setClassifyError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, syllabusJson }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Classification failed.");
      setClassifiedSlug(data.subject?.slug || data.slug);
      setClassifiedCount(data.questionCount || 0);
      setClassifyStatus("done");
    } catch (err) {
      setClassifyError(err.message);
      setClassifyStatus("error");
    }
  };

  const handleActivate = async () => {
    if (!classifiedSlug) return;
    setIsActivating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${classifiedSlug}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Activation failed.");
      onActivated({ slug: classifiedSlug, name: subjectName.trim() });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">New Subject Setup</h1>
            <p className="text-xs text-gray-400 mt-0.5">Define your syllabus structure, then classify questions with Gemini.</p>
          </div>
        </div>

        {/* Subject Name */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-5">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Subject Name</label>
          <div className="flex gap-3">
            <input
              list="used-subjects-list"
              value={subjectNameDraft}
              onChange={(e) => setSubjectNameDraft(e.target.value)}
              placeholder="e.g. General Studies Paper 1"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60"
            />
            <datalist id="used-subjects-list">
              {usedSubjects.map((s) => <option key={s} value={s} />)}
            </datalist>
            <button
              onClick={() => { if (subjectNameDraft.trim()) { setSubjectName(subjectNameDraft.trim()); setClassifyStatus("idle"); setClassifiedSlug(null); } }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Set
            </button>
          </div>
          {subjectName && (
            <p className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-3 h-3" /> Active subject: <span className="text-white">{subjectName}</span>
            </p>
          )}
          {!subjectName && (
            <p className="mt-2 text-xs text-gray-500">Must match the subject name used when uploading answer sheets.</p>
          )}
        </div>

        {/* Syllabus Builder */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-white">Syllabus Structure</h2>
              <p className="text-xs text-gray-400 mt-0.5">Build the hierarchy: Paper → Section → Topic</p>
            </div>
            <div className="flex items-center gap-3">
              {totalTopicCount > 0 && (
                <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/15 px-2 py-1 rounded-full">
                  {totalTopicCount} topic{totalTopicCount !== 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={addPaper}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Paper
              </button>
            </div>
          </div>

          {papers.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              Click "Add Paper" to start building the syllabus.
            </div>
          )}

          <div className="flex flex-col gap-4">
            {papers.map((paper) => (
              <div key={paper.id} className="bg-gray-800/50 border border-gray-700/60 rounded-xl overflow-hidden">
                {/* Paper header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-indigo-600/10 border-b border-gray-700/60">
                  <button
                    onClick={() => setCollapsedPapers((prev) => ({ ...prev, [paper.id]: !prev[paper.id] }))}
                    className="shrink-0 cursor-pointer text-gray-400"
                  >
                    {collapsedPapers[paper.id] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <InlineEdit
                      value={paper.name}
                      placeholder="Paper name (e.g. Paper 1)"
                      onChange={(v) => updatePaperName(paper.id, v)}
                      className="font-bold text-indigo-200 w-full"
                    />
                  </div>
                  <button onClick={() => addSection(paper.id)} className="flex items-center gap-1 px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-bold rounded-lg cursor-pointer">
                    <Plus className="w-3 h-3" /> Section
                  </button>
                  <button onClick={() => removePaper(paper.id)} className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!collapsedPapers[paper.id] && (
                  <div className="p-3 flex flex-col gap-3">
                    {paper.sections.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-3">No sections yet — click "Section" above to add one.</p>
                    )}
                    {paper.sections.map((section) => (
                      <div key={section.id} className="bg-gray-900/60 border border-gray-700/40 rounded-lg overflow-hidden">
                        {/* Section header */}
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-600/8 border-b border-gray-700/40">
                          <button
                            onClick={() => setCollapsedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                            className="shrink-0 cursor-pointer text-gray-500"
                          >
                            {collapsedSections[section.id] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <InlineEdit
                              value={section.name}
                              placeholder="Section name (e.g. Indian Economy)"
                              onChange={(v) => updateSectionName(paper.id, section.id, v)}
                              className="text-purple-200 text-xs font-semibold w-full"
                            />
                          </div>
                          <span className="text-[9px] text-gray-500 font-bold">{section.topics.filter(Boolean).length} topics</span>
                          <button onClick={() => addTopic(paper.id, section.id)} className="flex items-center gap-0.5 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-bold rounded cursor-pointer">
                            <Plus className="w-2.5 h-2.5" /> Topic
                          </button>
                          <button onClick={() => removeSection(paper.id, section.id)} className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {!collapsedSections[section.id] && (
                          <div className="p-2 flex flex-col gap-1.5">
                            {section.topics.length === 0 && (
                              <p className="text-[10px] text-gray-600 text-center py-2">No topics yet.</p>
                            )}
                            {section.topics.map((topic, tIdx) => (
                              <div key={tIdx} className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 font-bold w-4 shrink-0 text-right">{tIdx + 1}.</span>
                                <input
                                  value={topic}
                                  onChange={(e) => updateTopic(paper.id, section.id, tIdx, e.target.value)}
                                  placeholder="Topic name..."
                                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                                />
                                <button onClick={() => removeTopic(paper.id, section.id, tIdx)} className="p-1 rounded hover:bg-red-500/20 text-gray-600 hover:text-red-400 cursor-pointer shrink-0">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Classify */}
        {classifyStatus !== "done" && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-5">
            <h2 className="text-sm font-black text-white mb-1">Classify Questions</h2>
            <p className="text-xs text-gray-400 mb-4">
              Gemini will map every uploaded answer sheet for "<strong className="text-white">{subjectName || "—"}</strong>" into the syllabus structure above.
            </p>
            {classifyStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 mb-4 text-sm text-red-300">
                {classifyError}
              </div>
            )}
            <button
              onClick={handleClassify}
              disabled={!isReadyToClassify || classifyStatus === "classifying"}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {classifyStatus === "classifying" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Classifying with Gemini… (may take a minute)
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  Classify Questions
                </>
              )}
            </button>
            {!isReadyToClassify && (
              <p className="text-[10px] text-gray-500 text-center mt-2">
                Set a subject name and add at least one Paper → Section → Topic first.
              </p>
            )}
          </div>
        )}

        {/* Classification done — activate */}
        {classifyStatus === "done" && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Classification Complete</h2>
                <p className="text-xs text-emerald-300 mt-0.5">
                  {classifiedCount} question{classifiedCount !== 1 ? "s" : ""} classified and ready to build into a book.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setClassifyStatus("idle"); setClassifiedSlug(null); }}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Re-classify
              </button>
              <button
                onClick={handleActivate}
                disabled={isActivating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Activate & Open Book Builder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
