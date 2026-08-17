import React, { useState, useEffect, useMemo } from "react";
import { fetchUploadBatches, fetchUsedSubjects, updateUploadBatch, deleteUploadBatch } from "../services/api";
import {
  Calendar,
  UserCheck,
  Pencil,
  Trash2,
  Search,
  Loader2,
  X,
  Check,
  AlertTriangle,
  BookOpen,
  FileQuestion,
} from "lucide-react";

function EditBatchModal({ batch, subjects, onClose, onSaved }) {
  const [subject, setSubject] = useState(batch.subject || "");
  const [topperNames, setTopperNames] = useState(batch.toppers.map((name) => ({ from: name, to: name })));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const payload = {};
      if (subject) payload.subject = subject;
      const renames = topperNames.filter((t) => t.to.trim() && t.to.trim() !== t.from);
      if (renames.length > 0) payload.topperRenames = renames;
      const result = await updateUploadBatch(batch.batchKey, payload);
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
          <div>
            <h2 className="text-lg font-bold text-white">Edit Upload</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {batch.questionCount} question{batch.questionCount !== 1 ? "s" : ""} from this upload
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject</label>
            {batch.subject === null && (
              <p className="text-[11px] text-amber-400/90 mb-1.5">
                This upload's questions are currently spread across multiple subjects: {batch.subjects.join(", ")}.
                Picking one here moves all of them into it.
              </p>
            )}
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {batch.subject === null && <option value="">-- Select a subject --</option>}
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1.5">
              Changing this moves every question from this upload out of its current subject's book (if made) and into the new subject's book (if made).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Topper Name{topperNames.length > 1 ? "s" : ""}
            </label>
            <div className="space-y-2">
              {topperNames.map((t, idx) => (
                <input
                  key={t.from}
                  type="text"
                  value={t.to}
                  onChange={(e) => {
                    const next = [...topperNames];
                    next[idx] = { ...next[idx], to: e.target.value };
                    setTopperNames(next);
                  }}
                  placeholder="Topper name"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              ))}
            </div>
          </div>

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

function DeleteBatchModal({ batch, onClose, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      const result = await deleteUploadBatch(batch.batchKey);
      onDeleted(result);
    } catch (err) {
      setError(err.error || "Failed to delete upload.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-gray-900 border border-red-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3 bg-red-500/5">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Delete this upload?</h2>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-300">
            This removes <strong className="text-white">{batch.questionCount}</strong> question{batch.questionCount !== 1 ? "s" : ""} uploaded by{" "}
            <strong className="text-white">{batch.toppers.join(", ")}</strong> on {new Date(batch.uploadedAt).toLocaleDateString()}.
          </p>
          <p className="text-xs text-gray-500">
            A question answered by another topper from a different upload is kept (just this answer sheet is removed from it). Any subject book already built is updated to match. This cannot be undone.
          </p>
          {error && (
            <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-white px-4 py-2 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Upload
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllUploadsPage() {
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [editingBatch, setEditingBatch] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(null);
  const [toast, setToast] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [batchData, subjectData] = await Promise.all([fetchUploadBatches(), fetchUsedSubjects()]);
      setBatches(Array.isArray(batchData) ? batchData : []);
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
    return batches.filter((b) => {
      if (subjectFilter !== "All" && !b.subjects.includes(subjectFilter)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return b.toppers.some((t) => t.toLowerCase().includes(q)) || b.subjects.some((s) => s.toLowerCase().includes(q));
    });
  }, [batches, search, subjectFilter]);

  const handleSaved = (result) => {
    setEditingBatch(null);
    loadData();
    const { removedFrom, addedTo, toppersSynced } = result.bookChanges || {};
    if (removedFrom?.length && addedTo?.length) {
      setToast(`Moved from "${removedFrom.join(", ")}" book to "${addedTo.join(", ")}" book.`);
    } else if (removedFrom?.length) {
      setToast(`Removed from "${removedFrom.join(", ")}" book — the new subject has no book yet.`);
    } else if (addedTo?.length) {
      setToast(`Added to "${addedTo.join(", ")}" book.`);
    } else if (toppersSynced) {
      setToast("Topper name(s) updated and synced into the book.");
    } else {
      setToast("Upload updated.");
    }
  };

  const handleDeleted = (result) => {
    setDeletingBatch(null);
    loadData();
    const { deletedQuestions, trimmedQuestions } = result;
    const parts = [];
    if (deletedQuestions > 0) parts.push(`${deletedQuestions} question${deletedQuestions !== 1 ? "s" : ""} deleted`);
    if (trimmedQuestions > 0) parts.push(`${trimmedQuestions} question${trimmedQuestions !== 1 ? "s" : ""} kept (another topper still answers)`);
    setToast(parts.length > 0 ? `Upload removed — ${parts.join(", ")}.` : "Upload removed.");
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
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">All Uploads</h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Every PDF you've uploaded through the Upload section, one row per upload. Reassign an
            upload's subject, fix a topper's name, or remove it entirely — any subject books
            already built stay in sync automatically.
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topper or subject..."
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
          <div className="hidden md:grid grid-cols-[130px_1fr_160px_110px_88px] gap-4 px-5 py-3 bg-gray-800/40 text-[11px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-800">
            <span>Uploaded</span>
            <span>Topper(s)</span>
            <span>Subject</span>
            <span>Questions</span>
            <span></span>
          </div>
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              {batches.length === 0 ? "No uploads yet." : "No uploads match your filters."}
            </div>
          ) : (
            filtered.map((b) => (
              <div
                key={b.batchKey}
                className="grid grid-cols-1 md:grid-cols-[130px_1fr_160px_110px_88px] gap-2 md:gap-4 px-5 py-4 border-b border-gray-800/60 last:border-b-0 hover:bg-gray-800/20 transition-colors md:items-center"
              >
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" /> {formatDate(b.uploadedAt)}
                </span>
                <span className="text-sm text-gray-200 flex items-center gap-1.5 truncate" title={b.toppers.join(", ")}>
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  {b.toppers.join(", ")}
                </span>
                <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full inline-block w-fit max-w-full truncate">
                  {b.subject ?? `Mixed (${b.subjects.length})`}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <FileQuestion className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  {b.questionCount}
                </span>
                <div className="flex items-center gap-1.5 md:ml-auto">
                  <button
                    onClick={() => setEditingBatch(b)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit topper name(s) or subject"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingBatch(b)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Delete this upload"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingBatch && (
        <EditBatchModal
          batch={editingBatch}
          subjects={subjects}
          onClose={() => setEditingBatch(null)}
          onSaved={handleSaved}
        />
      )}

      {deletingBatch && (
        <DeleteBatchModal
          batch={deletingBatch}
          onClose={() => setDeletingBatch(null)}
          onDeleted={handleDeleted}
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
