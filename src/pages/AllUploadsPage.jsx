import React, { useState, useEffect, useMemo } from "react";
import { fetchQuestions, fetchUsedSubjects, updateUploadRecord } from "../services/api";
import {
  Calendar,
  UserCheck,
  Pencil,
  Search,
  Loader2,
  X,
  Check,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

function EditUploadModal({ upload, subjects, onClose, onSaved }) {
  const [subject, setSubject] = useState(upload.subject || "");
  const [toppers, setToppers] = useState(
    (upload.file_urls || []).map((f) => ({ file_url: f.url, topper_name: f.topper_name || "" }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const result = await updateUploadRecord(upload._id, { subject, toppers });
      onSaved(result);
    } catch (err) {
      setError(err.error || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/30">
          <h2 className="text-lg font-bold text-white">Edit Upload</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/40 border border-gray-700 rounded-xl p-4">
            {upload.question_text}
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1.5">
              Changing this moves the question out of its current subject's book (if one has been made) and into the new subject's book (if one has been made). If the new subject has no book yet, the subject is simply updated.
            </p>
          </div>

          {toppers.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Topper Name{toppers.length > 1 ? "s" : ""}
              </label>
              <div className="space-y-2">
                {toppers.map((t, idx) => (
                  <input
                    key={t.file_url || idx}
                    type="text"
                    value={t.topper_name}
                    onChange={(e) => {
                      const next = [...toppers];
                      next[idx] = { ...next[idx], topper_name: e.target.value };
                      setToppers(next);
                    }}
                    placeholder={toppers.length > 1 ? `Sheet ${idx + 1} topper name` : "Topper name"}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-white px-4 py-2 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !subject}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllUploadsPage() {
  const [uploads, setUploads] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [editingUpload, setEditingUpload] = useState(null);
  const [toast, setToast] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [uploadData, subjectData] = await Promise.all([fetchQuestions(), fetchUsedSubjects()]);
      setUploads(Array.isArray(uploadData) ? uploadData : []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (err) {
      setError(err.error || "Failed to load uploads.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    return uploads.filter((u) => {
      if (subjectFilter !== "All" && u.subject !== subjectFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const topperMatch = (u.file_urls || []).some((f) => (f.topper_name || "").toLowerCase().includes(q));
      return (
        (u.question_text || "").toLowerCase().includes(q) ||
        topperMatch ||
        (u.subject || "").toLowerCase().includes(q)
      );
    });
  }, [uploads, search, subjectFilter]);

  const handleSaved = (result) => {
    const updated = result.question;
    setUploads((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    setEditingUpload(null);

    const { removedFrom, addedTo, toppersSynced } = result.bookChanges || {};
    if (removedFrom && addedTo) {
      setToast(`Moved from "${removedFrom}" book to "${addedTo}" book.`);
    } else if (removedFrom) {
      setToast(`Removed from "${removedFrom}" book — the new subject has no book yet, so nothing to add it to.`);
    } else if (addedTo) {
      setToast(`Added to "${addedTo}" book.`);
    } else if (toppersSynced) {
      setToast("Topper name(s) updated and synced into the book.");
    } else {
      setToast("Upload updated.");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-gray-100 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p>Loading all uploads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">All Uploads</h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Every answer sheet uploaded through the Upload section. Reassign a question's subject
            or fix a topper's name here — any subject books already built stay in sync automatically.
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question, topper, or subject..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm mb-6">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[110px_1fr_220px_160px_52px] gap-4 px-5 py-3 bg-gray-800/40 text-[11px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-800">
            <span>Uploaded</span>
            <span>Question</span>
            <span>Topper(s)</span>
            <span>Subject</span>
            <span></span>
          </div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              {uploads.length === 0 ? "No uploads yet." : "No uploads match your filters."}
            </div>
          ) : (
            filtered.map((u) => (
              <div
                key={u._id}
                className="grid grid-cols-1 md:grid-cols-[110px_1fr_220px_160px_52px] gap-2 md:gap-4 px-5 py-4 border-b border-gray-800/60 last:border-b-0 hover:bg-gray-800/20 transition-colors md:items-center"
              >
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" /> {formatDate(u.createdAt)}
                </span>
                <span className="text-sm text-gray-200 truncate" title={u.question_text}>
                  {u.question_text}
                </span>
                <span
                  className="text-xs text-gray-300 flex items-center gap-1.5 truncate"
                  title={(u.file_urls || []).map((f) => f.topper_name || "Unknown Topper").join(", ")}
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  {(u.file_urls || []).length > 0
                    ? u.file_urls.map((f) => f.topper_name || "Unknown Topper").join(", ")
                    : "No topper"}
                </span>
                <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full inline-block w-fit max-w-full truncate">
                  {u.subject || "Uncategorized"}
                </span>
                <button
                  onClick={() => setEditingUpload(u)}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white transition-colors md:ml-auto cursor-pointer w-fit"
                  title="Edit topper name or subject"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {editingUpload && (
        <EditUploadModal
          upload={editingUpload}
          subjects={subjects}
          onClose={() => setEditingUpload(null)}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[110] bg-gray-900 border border-indigo-500/50 rounded-xl shadow-2xl px-5 py-3.5 flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-2">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <p className="text-sm font-semibold text-white">{toast}</p>
        </div>
      )}
    </div>
  );
}
