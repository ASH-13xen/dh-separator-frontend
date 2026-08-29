import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Download,
  Loader2,
  Eye,
  UserCheck,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  X,
  Trash2,
  GripVertical,
  Trophy,
  Sparkles,
  Target,
  RefreshCw,
  CloudOff,
  FileText,
  RotateCcw,
  ArrowRightLeft,
  Users,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

function isQuestionReviewed(q, selections, includedQuestions) {
  if (!includedQuestions.has(q._id)) return true;
  return (selections[q._id]?.length || 0) > 0;
}

function computeTopicStats(topicNode, selections, includedQuestions) {
  const realQuestions = topicNode.questions.filter((q) => !q.isTitlePage);
  const total = realQuestions.length;
  const reviewed = realQuestions.filter((q) =>
    isQuestionReviewed(q, selections, includedQuestions),
  ).length;
  return { total, reviewed, isComplete: total > 0 && reviewed === total };
}

function computePaperStats(paperNode, selections, includedQuestions) {
  const allQuestions = paperNode.topics.flatMap((t) => t.questions.filter((q) => !q.isTitlePage));
  const total = allQuestions.length;
  const reviewed = allQuestions.filter((q) =>
    isQuestionReviewed(q, selections, includedQuestions),
  ).length;
  const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  return { total, reviewed, percent };
}

function ProgressBar({ percent, reviewed, total }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
      <Target className="w-5 h-5 text-indigo-400 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-black text-gray-300 uppercase tracking-wider">
            Review Progress
          </span>
          <span className="text-xs font-bold text-indigo-300">
            {reviewed}/{total} ({percent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SaveStatusBadge({ status }) {
  const config = {
    saving: { Icon: Loader2, text: "Saving…", className: "text-gray-400", spin: true },
    saved: { Icon: Check, text: "All changes saved", className: "text-emerald-400", spin: false },
    retrying: { Icon: RefreshCw, text: "Retrying save…", className: "text-amber-400", spin: true },
    error: { Icon: CloudOff, text: "Save failed — will retry", className: "text-red-400", spin: false },
  }[status];
  if (!config) return null;
  const { Icon } = config;
  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-bold ${config.className}`}>
      <Icon className={`w-3.5 h-3.5 ${config.spin ? "animate-spin" : ""}`} />
      {config.text}
    </span>
  );
}

function MilestoneToast({ toast, onDismiss }) {
  if (!toast) return null;
  const Icon = toast.icon === "trophy" ? Trophy : Sparkles;
  return (
    <div className="fixed bottom-6 right-6 z-60 bg-gray-900 border border-indigo-500/50 rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 max-w-sm overflow-hidden">
      {toast.icon === "trophy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 w-1.5 h-1.5 rounded-sm"
              style={{
                left: `${(i * 8 + 5) % 100}%`,
                backgroundColor: ["#6366f1", "#a855f7", "#f59e0b", "#10b981"][i % 4],
                animation: `v2-confetti-fall 1.2s ease-out ${i * 0.05}s forwards`,
              }}
            />
          ))}
        </div>
      )}
      <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center relative z-10">
        <Icon className="w-5 h-5 text-indigo-300" />
      </div>
      <p className="text-sm font-bold text-white relative z-10">{toast.message}</p>
      <button onClick={onDismiss} className="ml-auto text-gray-500 hover:text-white relative z-10 cursor-pointer shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Read-only roster of every topper whose answer sheets have been uploaded for this subject,
// so the user can recall who they've already covered before uploading more.
function TopperRosterModal({ subjectName, data, isLoading, error, onClose }) {
  const formatDetail = (entry) => {
    const parts = [];
    if (entry.year) parts.push(`Year ${entry.year}`);
    if (entry.rank) parts.push(`Rank ${entry.rank}`);
    if (entry.marks) parts.push(`Marks ${entry.marks}`);
    return parts.length > 0 ? parts.join("  ·  ") : "No year/rank/marks recorded";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-800 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Toppers Uploaded</h3>
            <p className="text-xs text-gray-400 truncate">
              {isLoading || !data
                ? subjectName
                : `${subjectName} — ${data.toppers.length} topper${data.toppers.length !== 1 ? "s" : ""}, ${data.totalSheets} answer sheet${data.totalSheets !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-400">Loading toppers…</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : !data || data.toppers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-9 h-9 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-semibold">No topper answer sheets uploaded yet</p>
              <p className="text-xs text-gray-500 mt-1">Upload answer sheets for {subjectName} to see them listed here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.toppers.map((topper) => (
                <div
                  key={topper.name}
                  className="bg-gray-800/50 border border-gray-700/60 rounded-xl px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-bold text-white text-sm truncate">{topper.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/15 px-2 py-1 rounded-full whitespace-nowrap">
                        {topper.sheetCount} sheet{topper.sheetCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] font-black text-purple-300 bg-purple-500/15 px-2 py-1 rounded-full whitespace-nowrap">
                        {topper.questionCount} question{topper.questionCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {topper.entries.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 text-xs text-gray-400 pl-6.5"
                    >
                      <span>{formatDetail(entry)}</span>
                      {topper.entries.length > 1 && (
                        <span className="text-[10px] text-gray-500 font-bold shrink-0">
                          ×{entry.sheetCount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {data.questionsWithoutSheets > 0 && (
                <p className="text-[11px] text-amber-400/80 mt-1">
                  {data.questionsWithoutSheets} question{data.questionsWithoutSheets !== 1 ? "s have" : " has"} no
                  topper answer sheet uploaded.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddTitlePageModal({ value, onChange, onAdd, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Add a Title Page</h3>
            <p className="text-xs text-gray-400">It'll appear in this topic — drag it to the right spot.</p>
          </div>
        </div>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) onAdd();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Subtitle text for this page..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 mb-5"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={!value.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-lg shadow-md transition-all text-xs cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function TopicGroupHeader({
  topicNode, tIndex, totalTopics, stats, variant,
  isExpanded, onToggleExpand, isSelected, onSelect,
  isEditing, editingValue, onEditChange, onEditStart, onEditCommit, onEditCancel,
  onMoveUp, onMoveDown, onAddTitlePage, dragHandlers, isDragOver, isDragging,
  isQuestionDragTarget,
}) {
  const isList = variant === "list";
  return (
    <div
      {...(isList ? dragHandlers : {})}
      onClick={isList ? onSelect : undefined}
      className={`px-4 py-3 flex items-center justify-between gap-2 rounded-xl transition-all ${
        isList
          ? `border cursor-pointer ${
              isQuestionDragTarget ? "border-amber-400 ring-2 ring-amber-400/40 bg-amber-500/5" :
              isDragOver ? "border-indigo-400 ring-2 ring-indigo-400/40" :
              isSelected ? "border-indigo-500/70 ring-1 ring-indigo-500/40" : "border-gray-800"
            } ${isDragging ? "opacity-40" : ""} bg-gray-900/70`
          : "bg-gray-900/60 border-b border-gray-800"
      } ${!isQuestionDragTarget && stats.isComplete ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isList && <GripVertical className="w-4 h-4 text-gray-600 shrink-0 cursor-grab active:cursor-grabbing" />}
        {isList && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="shrink-0 cursor-pointer"
            title="Expand/collapse topic"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          </button>
        )}
        {isList && (
          <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={onMoveUp} disabled={tIndex === 0} className="p-0.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-white cursor-pointer" title="Move topic up">
              <ArrowUp className="w-2.5 h-2.5" />
            </button>
            <button onClick={onMoveDown} disabled={tIndex === totalTopics - 1} className="p-0.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-white cursor-pointer" title="Move topic down">
              <ArrowDown className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={editingValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onEditCommit(); if (e.key === "Escape") onEditCancel(); }}
              className="flex-1 bg-gray-800 border border-indigo-500 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={onEditCommit} className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"><Check className="w-3 h-3" /></button>
            <button onClick={onEditCancel} className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white cursor-pointer"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className={`font-extrabold text-indigo-300 truncate ${isList ? "text-xs" : "text-sm"}`}>{topicNode.title}</h3>
            <button onClick={(e) => { e.stopPropagation(); onEditStart(); }} className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer" title="Edit topic name">
              <Pencil className="w-3 h-3" />
            </button>
            {isList && (
              <button onClick={(e) => { e.stopPropagation(); onAddTitlePage(); }} className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-amber-300 transition-colors shrink-0 cursor-pointer" title="Add a title/subsection page here">
                <FileText className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
      <span className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-full ${stats.isComplete ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-800 text-gray-400"}`}>
        {stats.reviewed}/{stats.total}
      </span>
    </div>
  );
}

function MasterListRow({ q, isIncluded, selectedCount, isPulsing, onRowClick, onToggleInclude, dragHandlers, isDragOver, isDragging }) {
  return (
    <div
      {...dragHandlers}
      onClick={onRowClick}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all border ${isDragOver ? "border-indigo-400 ring-1 ring-indigo-400/50" : "border-transparent"} ${isDragging ? "opacity-40" : ""} ${isIncluded ? "hover:bg-gray-800/60" : "opacity-50 hover:bg-gray-800/30"} ${isPulsing ? "bg-indigo-500/20" : ""}`}
    >
      <GripVertical className="w-3.5 h-3.5 text-gray-600 shrink-0" />
      <button onClick={(e) => { e.stopPropagation(); onToggleInclude(); }} className="shrink-0 cursor-pointer">
        {isIncluded ? <CheckSquare className="w-3.5 h-3.5 text-indigo-500" /> : <Square className="w-3.5 h-3.5 text-gray-500" />}
      </button>
      <span className="text-xs text-gray-300 truncate flex-1">{q.question_text}</span>
      <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${selectedCount > 0 ? "bg-indigo-500/20 text-indigo-300" : "bg-gray-800 text-gray-500"}`}>
        {selectedCount}/3
      </span>
    </div>
  );
}

function TitlePageRow({ subtitle, variant, dragHandlers, isDragOver, isDragging, onDelete }) {
  const isList = variant === "list";
  return (
    <div
      {...(isList ? dragHandlers : {})}
      className={`flex items-center gap-2 rounded-lg border transition-all ${isList ? "px-2.5 py-2 cursor-grab active:cursor-grabbing" : "px-4 py-3"} ${isDragOver ? "border-indigo-400 ring-1 ring-indigo-400/50" : "border-amber-500/40"} ${isDragging ? "opacity-40" : ""} bg-amber-500/10 hover:bg-amber-500/15`}
    >
      {isList && <GripVertical className="w-3.5 h-3.5 text-amber-600/70 shrink-0" />}
      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className={`text-amber-200 font-semibold flex-1 truncate ${isList ? "text-xs" : "text-sm"}`}>{subtitle}</span>
      <span className="shrink-0 text-[9px] font-black uppercase tracking-wide text-amber-500/70">Title Page</span>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="shrink-0 p-1 rounded hover:bg-amber-500/20 text-amber-500/70 hover:text-red-400 cursor-pointer" title="Delete this title page">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ReviewQuestionRow({
  q, qIndex, isIncluded, isPulsing, selections, onToggleInclude, onSelectionChange,
  editingTopperKey, editingTopperValues, onTopperEditStart, onTopperEditChange, onTopperEditSave, onTopperEditCancel,
  isEditingQuestion, editingQuestionValue, onQuestionEditStart, onQuestionEditChange, onQuestionEditSave, onQuestionEditCancel,
  getPreviewUrl, onMoveToOtherPaper,
}) {
  const currentSelections = selections[q._id] || [];
  return (
    <div
      id={`q-${q._id}`}
      className={`rounded-xl p-4 border transition-all ${isIncluded ? "bg-[#131d31]/40 border-indigo-500/35 shadow-sm" : "bg-gray-850/20 border-gray-800/60 opacity-60"} ${isPulsing ? "ring-2 ring-indigo-400/60" : ""} hover:border-indigo-400/60`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-[10px] text-gray-500 font-black mt-1 shrink-0 w-5 text-center">{qIndex + 1}</span>
        <button onClick={onToggleInclude} className="mt-0.5 shrink-0 cursor-pointer">
          {isIncluded ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4 text-gray-500" />}
        </button>
        {isEditingQuestion ? (
          <div className="flex-1 flex flex-col gap-1.5">
            <textarea
              autoFocus rows={3}
              value={editingQuestionValue}
              onChange={(e) => onQuestionEditChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") onQuestionEditCancel(); }}
              className="w-full bg-gray-800 border border-indigo-500 rounded-lg px-3 py-2 text-sm text-white font-semibold leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
            <div className="flex gap-1.5">
              <button onClick={onQuestionEditSave} className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-[10px] font-bold cursor-pointer">
                <Check className="w-3 h-3" /> Save
              </button>
              <button onClick={onQuestionEditCancel} className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-[10px] font-bold cursor-pointer">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-relaxed flex-1">{q.question_text}</p>
            <button onClick={onQuestionEditStart} className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer" title="Edit question text">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onMoveToOtherPaper(q._id)} className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-teal-300 transition-colors shrink-0 cursor-pointer" title="Move to another paper / section">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isIncluded && q.file_urls && q.file_urls.length > 0 && (
        <div className="pl-10 space-y-2 mt-2">
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Available Topper Answers</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {q.file_urls.map((fileObj) => {
              const isSelected = currentSelections.includes(fileObj.url);
              const isDisabled = !isSelected && currentSelections.length >= 3;
              const isEditingThisTopper = editingTopperKey === fileObj.url;
              return (
                <div key={fileObj.url} className={`flex flex-col p-3.5 rounded-xl border transition-colors ${isSelected ? "bg-[#1e293b]/40 border-indigo-500/60 text-indigo-200" : isDisabled ? "bg-gray-900/10 border-gray-800 text-gray-600 opacity-40" : "bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700"}`}>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <label className={`flex items-start gap-2.5 flex-1 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => onSelectionChange(q._id, fileObj.url)}
                        className="w-3.5 h-3.5 text-indigo-600 bg-gray-800 border-gray-600 focus:ring-indigo-500 rounded mt-1 cursor-pointer shrink-0"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        {isEditingThisTopper ? (
                          <div className="flex flex-col gap-1.5" onClick={(e) => e.preventDefault()}>
                            <input autoFocus placeholder="Topper name" value={editingTopperValues.topper_name || ""} onChange={(e) => onTopperEditChange("topper_name", e.target.value)} className="bg-gray-800 border border-indigo-500/60 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <div className="grid grid-cols-3 gap-1">
                              <input placeholder="Year" value={editingTopperValues.topper_year || ""} onChange={(e) => onTopperEditChange("topper_year", e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                              <input placeholder="Rank" value={editingTopperValues.topper_rank || ""} onChange={(e) => onTopperEditChange("topper_rank", e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                              <input placeholder="Marks" value={editingTopperValues.topper_marks || ""} onChange={(e) => onTopperEditChange("topper_marks", e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => onTopperEditSave(q._id, fileObj.url)} className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-[10px] font-bold cursor-pointer"><Check className="w-3 h-3" /> Save</button>
                              <button onClick={onTopperEditCancel} className="flex-1 flex items-center justify-center gap-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-[10px] font-bold cursor-pointer"><X className="w-3 h-3" /> Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="font-bold text-sm text-white truncate">{fileObj.topper_name || "Ref Answer"}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-0.5 font-semibold">
                              Year: {fileObj.topper_year || "N/A"} | Rank: {fileObj.topper_rank || "N/A"} | Marks: {fileObj.topper_marks || "N/A"}
                            </span>
                          </>
                        )}
                      </div>
                    </label>
                    {!isEditingThisTopper && (
                      <button onClick={() => onTopperEditStart(fileObj)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer" title="Edit topper details">
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="w-full h-44 rounded-lg overflow-hidden border border-gray-800 bg-gray-950 shadow-inner">
                    <iframe src={getPreviewUrl(fileObj.url)} className="w-full h-full border-0" title={`Preview-${fileObj.topper_name || fileObj.url}`} loading="lazy" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubjectwiseBookPage({ subject, subjectName }) {
  const [activePaper, setActivePaper] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [psirData, setPsirData] = useState([]);
  const [selections, setSelections] = useState({});
  const [includedQuestions, setIncludedQuestions] = useState(new Set());
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [generationStatus, setGenerationStatus] = useState("pending");
  const [isCleaningStorage, setIsCleaningStorage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReclassifying, setIsReclassifying] = useState(false);

  const [expandedTopicKeys, setExpandedTopicKeys] = useState(new Set());
  const [selectedTopicKey, setSelectedTopicKey] = useState(null);
  const [scrollToQuestionId, setScrollToQuestionId] = useState(null);
  const [editingTopicKey, setEditingTopicKey] = useState(null);
  const [editingTopicValue, setEditingTopicValue] = useState("");
  const [editingTopperKey, setEditingTopperKey] = useState(null);
  const [editingTopperValues, setEditingTopperValues] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingQuestionValue, setEditingQuestionValue] = useState("");
  const [titlePageModalTopicKey, setTitlePageModalTopicKey] = useState(null);
  const [titlePageModalValue, setTitlePageModalValue] = useState("");

  // Topper roster modal
  const [isTopperModalOpen, setIsTopperModalOpen] = useState(false);
  const [topperRoster, setTopperRoster] = useState(null);
  const [isLoadingToppers, setIsLoadingToppers] = useState(false);
  const [topperRosterError, setTopperRosterError] = useState("");

  const [draggedQuestion, setDraggedQuestion] = useState(null); // { topicKey, qId }
  const [dragOverQuestion, setDragOverQuestion] = useState(null);
  const [draggedTopicKey, setDraggedTopicKey] = useState(null);
  const [dragOverTopicKey, setDragOverTopicKey] = useState(null);
  const [dragOverTopicForQuestion, setDragOverTopicForQuestion] = useState(null);

  // Cross-paper move modal
  const [moveToPaperModal, setMoveToPaperModal] = useState(null); // { qId, fromTopicKey }
  const [moveToPaperPaper, setMoveToPaperPaper] = useState('');
  const [moveToPaperTopicKey, setMoveToPaperTopicKey] = useState('');

  const [saveStatus, setSaveStatus] = useState("saved");
  const [celebratedMilestones, setCelebratedMilestones] = useState(new Set());
  const [activeToast, setActiveToast] = useState(null);
  const [pulsingQuestionIds, setPulsingQuestionIds] = useState(new Set());

  const skipNextAutoSave = useRef(true);

  // Papers with unsaved edits (a Set of paper names), the id of the currently-armed debounce
  // timer, and a ref that always points at the latest saveLayoutForPaper closure — see
  // flushDirtyPapers below for why this trio exists.
  const dirtyPapersRef = useRef(new Set());
  const pendingSaveTimerRef = useRef(null);
  const saveLayoutForPaperRef = useRef(null);
  const sendLayoutBeaconRef = useRef(null);

  useEffect(() => {
    fetchPreview();
  }, [subject]);

  const fetchPreview = async () => {
    flushDirtyPapers();
    setIsLoading(true);
    skipNextAutoSave.current = true;
    setPsirData([]);
    setActivePaper(null);
    setSelectedTopicKey(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/subjects/${subject}/preview`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch book layout.");
      }
      const data = await response.json();
      const hierarchy = data.hierarchy || [];
      setPsirData(hierarchy);
      if (hierarchy.length > 0) setActivePaper(hierarchy[0].paper);
      const excludedSet = new Set(data.excludedQuestionIds || []);
      const initIncluded = new Set();
      hierarchy.forEach((paperNode) => {
        paperNode.topics.forEach((topNode) => {
          topNode.questions.forEach((q) => {
            if (!excludedSet.has(q._id)) initIncluded.add(q._id);
          });
        });
      });
      setSelections(data.selections || {});
      setIncludedQuestions(initIncluded);
      const expandedTitleSet = new Set(data.expandedTopicTitles || []);
      const expandedKeys = new Set();
      hierarchy.forEach((p) =>
        p.topics.forEach((t) => {
          if (expandedTitleSet.has(t.title)) expandedKeys.add(t._key);
        }),
      );
      setExpandedTopicKeys(expandedKeys);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Builds the exact save payload for one paper from current state. Shared by the normal
  // fetch-based save and the sendBeacon-based one used right before the page unloads.
  const buildLayoutPayload = (paper) => {
    const paperNode = psirData.find((p) => p.paper === paper);
    if (!paperNode) return null;

    const topicOrder = paperNode.topics.map((t) => t._key);
    const topicRenames = {};
    const questionOrder = {};
    const topperOverrides = {};
    const questionTextOverrides = {};
    const titlePages = {};
    const paperSelections = {};
    const paperExcluded = [];
    const expandedTopics = [];

    paperNode.topics.forEach((t) => {
      if (t.title !== t._key) topicRenames[t._key] = t.title;
      if (expandedTopicKeys.has(t._key)) expandedTopics.push(t._key);
      questionOrder[t._key] = t.questions.map((q) => q._id);
      t.questions.forEach((q) => {
        if (q.isTitlePage) {
          titlePages[q._id] = { subtitle: q.subtitle, topicKey: t._key };
          return;
        }
        if (!includedQuestions.has(q._id)) paperExcluded.push(q._id);
        paperSelections[q._id] = selections[q._id] || [];
        questionTextOverrides[q._id] = q.question_text;
        (q.file_urls || []).forEach((f) => {
          topperOverrides[f.url] = {
            topper_name: f.topper_name,
            topper_year: f.topper_year,
            topper_rank: f.topper_rank,
            topper_marks: f.topper_marks,
          };
        });
      });
    });

    return {
      paper,
      topicOrder,
      topicRenames,
      questionOrder,
      excludedQuestionIds: paperExcluded,
      selections: paperSelections,
      topperOverrides,
      expandedTopics,
      questionTextOverrides,
      titlePages,
    };
  };

  const saveLayoutForPaper = async (paper, attempt = 1) => {
    const payload = buildLayoutPayload(paper);
    if (!payload) return;

    setSaveStatus(attempt > 1 ? "retrying" : "saving");
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${subject}/layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed with status ${res.status}`);
      setSaveStatus("saved");
    } catch (err) {
      console.error("[SubjectwiseBookPage] Save attempt failed:", err);
      if (attempt < 3) {
        setTimeout(() => saveLayoutForPaper(paper, attempt + 1), 1500 * attempt);
      } else {
        setSaveStatus("error");
      }
    }
  };

  // A plain fetch() started as the page is unloading (refresh, close, navigate away) can be
  // cancelled by the browser before it ever reaches the server — that's the actual cause of
  // "I toggled something, refreshed, and it's gone": the debounced save simply never got to
  // finish. sendBeacon is the browser API built specifically to survive this — it's queued and
  // guaranteed to be attempted even after the page is gone, unlike fetch. No response/retry is
  // possible (the page is leaving either way), so this is deliberately best-effort.
  const sendLayoutBeacon = (paper) => {
    const payload = buildLayoutPayload(paper);
    if (!payload || !navigator.sendBeacon) return false;
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      return navigator.sendBeacon(`${API_BASE_URL}/api/subjects/${subject}/layout`, blob);
    } catch (err) {
      console.error("[SubjectwiseBookPage] sendBeacon failed:", err);
      return false;
    }
  };

  // Refs always pointing at this render's freshest save functions — flushDirtyPapers and the
  // beforeunload handler are called from places (unmount cleanup, effects with empty deps
  // arrays) whose own closure can be stale, but going through these refs always reaches the
  // latest psirData/selections/etc regardless.
  saveLayoutForPaperRef.current = saveLayoutForPaper;
  sendLayoutBeaconRef.current = sendLayoutBeacon;

  // Saves every paper with unsaved edits right now, instead of only whichever paper happens to
  // be active. Cancels any still-pending debounce timer first (its job is now done here) and
  // empties the dirty set so nothing gets saved twice. Safe to call from a stale closure (e.g.
  // an unmount cleanup captured at mount time) since it only ever reads through refs.
  const flushDirtyPapers = () => {
    if (pendingSaveTimerRef.current) {
      clearTimeout(pendingSaveTimerRef.current);
      pendingSaveTimerRef.current = null;
    }
    const papers = [...dirtyPapersRef.current];
    dirtyPapersRef.current.clear();
    papers.forEach((paper) => saveLayoutForPaperRef.current(paper));
  };

  // Marks the active paper dirty and (re)arms a single shared debounce timer that flushes every
  // dirty paper 800ms after the last edit. Previously this saved only whatever `activePaper` was
  // at the moment the timer fired, and switching papers (or subjects) before that moment cleared
  // the timer outright — silently discarding an edit that had already shown "Saved" for a
  // *different* paper. Tracking dirtiness in a ref (independent of the timer) means a paper's
  // edit survives being interrupted by navigation; flushDirtyPapers is also called directly
  // wherever that navigation happens (paper tabs, fetchPreview, unmount) so it doesn't have to
  // wait the full 800ms first.
  useEffect(() => {
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    if (!activePaper) return;
    dirtyPapersRef.current.add(activePaper);
    if (pendingSaveTimerRef.current) clearTimeout(pendingSaveTimerRef.current);
    pendingSaveTimerRef.current = setTimeout(() => {
      pendingSaveTimerRef.current = null;
      flushDirtyPapers();
    }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [psirData, selections, includedQuestions, expandedTopicKeys]);

  // Flush on unmount (e.g. navigating back to "All Subjects", which unmounts this component)
  // and warn before an actual tab close/refresh, which no cleanup can reliably outrun.
  useEffect(() => {
    return () => flushDirtyPapers();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (dirtyPapersRef.current.size === 0 && !pendingSaveTimerRef.current) return;
      // Actually attempt to persist every dirty paper via sendBeacon — see sendLayoutBeacon
      // above for why this, and not fetch, is what can survive the page unloading. Still show
      // the confirmation prompt too, as a second line of defense in case the beacon doesn't
      // land (e.g. no navigator.sendBeacon support).
      [...dirtyPapersRef.current].forEach((paper) => sendLayoutBeaconRef.current(paper));
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (saveStatus !== "error") return;
    const t = setTimeout(() => {
      if (activePaper) saveLayoutForPaper(activePaper, 1);
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveStatus]);

  useEffect(() => {
    if (!scrollToQuestionId) return;
    const el = document.getElementById(`q-${scrollToQuestionId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setScrollToQuestionId(null), 1000);
    return () => clearTimeout(t);
  }, [scrollToQuestionId]);

  const activePaperNode = psirData.find((p) => p.paper === activePaper);
  const paperStats = activePaperNode
    ? computePaperStats(activePaperNode, selections, includedQuestions)
    : { total: 0, reviewed: 0, percent: 0 };
  const selectedTopic = activePaperNode?.topics.find((t) => t._key === selectedTopicKey) || null;

  const selectTopic = (topicKey) => {
    setSelectedTopicKey(topicKey);
    setExpandedTopicKeys((prev) => new Set(prev).add(topicKey));
  };

  useEffect(() => {
    if (!activePaperNode || activePaperNode.topics.length === 0) return;
    const stillValid = activePaperNode.topics.some((t) => t._key === selectedTopicKey);
    if (!stillValid) selectTopic(activePaperNode.topics[0]._key);
  }, [activePaperNode, selectedTopicKey]);

  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    const crossed = milestones.find(
      (m) => paperStats.percent >= m && !celebratedMilestones.has(m),
    );
    if (crossed) {
      setCelebratedMilestones((prev) => new Set(prev).add(crossed));
      setActiveToast({
        id: Date.now(),
        message: crossed === 100 ? `${activePaper} fully reviewed! Great work.` : `${crossed}% of ${activePaper} reviewed — keep going!`,
        icon: crossed === 100 ? "trophy" : "sparkles",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperStats.percent]);

  useEffect(() => {
    setCelebratedMilestones(new Set());
    setActiveToast(null);
  }, [activePaper]);

  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => setActiveToast(null), 3500);
    return () => clearTimeout(t);
  }, [activeToast]);

  const triggerPulse = (qId) => {
    setPulsingQuestionIds((prev) => new Set(prev).add(qId));
    setTimeout(() => {
      setPulsingQuestionIds((prev) => {
        const next = new Set(prev);
        next.delete(qId);
        return next;
      });
    }, 500);
  };

  const handleSelectionChange = (qId, urlStr) => {
    setSelections((prev) => {
      const current = prev[qId] || [];
      if (current.includes(urlStr)) return { ...prev, [qId]: current.filter((u) => u !== urlStr) };
      if (current.length >= 3) { alert("You can select up to 3 toppers per question."); return prev; }
      return { ...prev, [qId]: [...current, urlStr] };
    });
    triggerPulse(qId);
  };

  const moveQuestionToPosition = (tIndex, fromIndex, toIndex) => {
    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const newTopics = [...newData[paperIdx].topics];
      const questions = [...newTopics[tIndex].questions];
      if (toIndex < 0 || toIndex >= questions.length || toIndex === fromIndex) return prev;
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, moved);
      newTopics[tIndex] = { ...newTopics[tIndex], questions };
      newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      return newData;
    });
  };

  const moveQuestionAcrossTopics = (fromTopicKey, toTopicKey, qId, insertBeforeQId) => {
    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const topics = [...newData[paperIdx].topics];
      const fromTIdx = topics.findIndex((t) => t._key === fromTopicKey);
      const toTIdx = topics.findIndex((t) => t._key === toTopicKey);
      if (fromTIdx === -1 || toTIdx === -1 || fromTIdx === toTIdx) return prev;
      const fromQs = [...topics[fromTIdx].questions];
      const qIdx = fromQs.findIndex((q) => q._id === qId);
      if (qIdx === -1) return prev;
      const [movedQ] = fromQs.splice(qIdx, 1);
      topics[fromTIdx] = { ...topics[fromTIdx], questions: fromQs };
      const toQs = [...topics[toTIdx].questions];
      const insertIdx = insertBeforeQId ? toQs.findIndex((q) => q._id === insertBeforeQId) : -1;
      toQs.splice(insertIdx >= 0 ? insertIdx : toQs.length, 0, movedQ);
      topics[toTIdx] = { ...topics[toTIdx], questions: toQs };
      newData[paperIdx] = { ...newData[paperIdx], topics };
      return newData;
    });
  };

  const openMoveToPaperModal = (qId) => {
    const fromTopic = activePaperNode?.topics.find((t) => t.questions.some((q) => q._id === qId));
    if (!fromTopic) return;
    const defaultPaper = psirData.find((p) => p.paper !== activePaper)?.paper || activePaper;
    const defaultTopicKey = psirData.find((p) => p.paper === defaultPaper)?.topics[0]?._key || '';
    setMoveToPaperModal({ qId, fromTopicKey: fromTopic._key });
    setMoveToPaperPaper(defaultPaper);
    setMoveToPaperTopicKey(defaultTopicKey);
  };

  const confirmMoveQuestionToPaper = () => {
    if (!moveToPaperModal || !moveToPaperPaper || !moveToPaperTopicKey) return;
    const { qId, fromTopicKey } = moveToPaperModal;
    if (moveToPaperPaper === activePaper) {
      if (fromTopicKey !== moveToPaperTopicKey) {
        moveQuestionAcrossTopics(fromTopicKey, moveToPaperTopicKey, qId, null);
      }
      setMoveToPaperModal(null);
      return;
    }
    setPsirData((prev) => {
      const newData = prev.map((p) => ({
        ...p,
        topics: p.topics.map((t) => ({ ...t, questions: [...t.questions] })),
      }));
      const fromPaperIdx = newData.findIndex((p) => p.paper === activePaper);
      const toPaperIdx = newData.findIndex((p) => p.paper === moveToPaperPaper);
      if (fromPaperIdx === -1 || toPaperIdx === -1) return prev;
      const fromTopics = newData[fromPaperIdx].topics;
      const fromTIdx = fromTopics.findIndex((t) => t._key === fromTopicKey);
      if (fromTIdx === -1) return prev;
      const fromQs = [...fromTopics[fromTIdx].questions];
      const qIdx = fromQs.findIndex((q) => q._id === qId);
      if (qIdx === -1) return prev;
      const [movedQ] = fromQs.splice(qIdx, 1);
      newData[fromPaperIdx].topics[fromTIdx].questions = fromQs;
      const toTopics = newData[toPaperIdx].topics;
      const toTIdx = toTopics.findIndex((t) => t._key === moveToPaperTopicKey);
      if (toTIdx === -1) return prev;
      newData[toPaperIdx].topics[toTIdx].questions = [...toTopics[toTIdx].questions, movedQ];
      return newData;
    });
    // The generic autosave effect only ever marks `activePaper` (the source) dirty — this move
    // also touches the destination paper's topics, so it needs marking explicitly too.
    dirtyPapersRef.current.add(moveToPaperPaper);
    setMoveToPaperModal(null);
  };

  const toggleIncludeQuestion = (tIndex, qId) => {
    const wasIncluded = includedQuestions.has(qId);
    setIncludedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      return next;
    });
    triggerPulse(qId);
    if (wasIncluded) {
      const topic = activePaperNode?.topics[tIndex];
      if (!topic) return;
      const fromIndex = topic.questions.findIndex((q) => q._id === qId);
      const lastIndex = topic.questions.length - 1;
      if (fromIndex !== -1 && fromIndex !== lastIndex) moveQuestionToPosition(tIndex, fromIndex, lastIndex);
    }
  };

  const handleSelectAllToggle = () => {
    if (!activePaperNode) return;
    const activeIds = activePaperNode.topics.flatMap((t) => t.questions.filter((q) => !q.isTitlePage).map((q) => q._id));
    const allSelected = activeIds.every((id) => includedQuestions.has(id));
    setIncludedQuestions((prev) => {
      const next = new Set(prev);
      if (allSelected) activeIds.forEach((id) => next.delete(id));
      else activeIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const isAllActiveSelected = () => {
    if (!activePaperNode) return false;
    const activeIds = activePaperNode.topics.flatMap((t) => t.questions.filter((q) => !q.isTitlePage).map((q) => q._id));
    return activeIds.length > 0 && activeIds.every((id) => includedQuestions.has(id));
  };

  const toggleTopicExpanded = (topicKey) => {
    setExpandedTopicKeys((prev) => {
      const next = new Set(prev);
      if (next.has(topicKey)) next.delete(topicKey); else next.add(topicKey);
      return next;
    });
  };

  const moveTopic = (tIndex, direction) => {
    const targetIndex = tIndex + direction;
    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const topics = [...newData[paperIdx].topics];
      if (targetIndex < 0 || targetIndex >= topics.length) return prev;
      [topics[tIndex], topics[targetIndex]] = [topics[targetIndex], topics[tIndex]];
      newData[paperIdx] = { ...newData[paperIdx], topics };
      return newData;
    });
  };

  const moveTopicToPosition = (fromIndex, toIndex) => {
    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const topics = [...newData[paperIdx].topics];
      if (toIndex < 0 || toIndex >= topics.length || toIndex === fromIndex) return prev;
      const [moved] = topics.splice(fromIndex, 1);
      topics.splice(toIndex, 0, moved);
      newData[paperIdx] = { ...newData[paperIdx], topics };
      return newData;
    });
  };

  const saveTopicName = (topicKey) => {
    const newTitle = editingTopicValue.trim();
    if (newTitle) {
      setPsirData((prev) => {
        const newData = [...prev];
        const paperIdx = newData.findIndex((p) => p.paper === activePaper);
        if (paperIdx === -1) return prev;
        const newTopics = newData[paperIdx].topics.map((t) => t._key === topicKey ? { ...t, title: newTitle } : t);
        newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
        return newData;
      });
    }
    setEditingTopicKey(null);
  };

  const addTitlePage = (topicKey, subtitle) => {
    const id = `titlepage-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const newTopics = newData[paperIdx].topics.map((t) =>
        t._key === topicKey ? { ...t, questions: [...t.questions, { _id: id, isTitlePage: true, subtitle }] } : t,
      );
      newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      return newData;
    });
    setExpandedTopicKeys((prev) => new Set(prev).add(topicKey));
  };

  const deleteTitlePage = (topicKey, id) => {
    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const newTopics = newData[paperIdx].topics.map((t) =>
        t._key === topicKey ? { ...t, questions: t.questions.filter((q) => q._id !== id) } : t,
      );
      newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      return newData;
    });
  };

  const saveTopperDetails = (questionId, fileUrl) => {
    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const newTopics = newData[paperIdx].topics.map((t) => ({
        ...t,
        questions: t.questions.map((q) => {
          if (q._id !== questionId) return q;
          return { ...q, file_urls: q.file_urls.map((f) => f.url === fileUrl ? { ...f, ...editingTopperValues } : f) };
        }),
      }));
      newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      return newData;
    });
    setEditingTopperKey(null);
  };

  const saveQuestionText = () => {
    const newText = editingQuestionValue.trim();
    if (!newText) { setEditingQuestionId(null); return; }

    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;

      // Find edited question and any other question in this paper with the same text.
      let editedTopicKey = null;
      let mergeTargetId = null;
      let mergeTargetTopicKey = null;

      newData[paperIdx].topics.forEach((t) => {
        t.questions.forEach((q) => {
          if (q._id === editingQuestionId) editedTopicKey = t._key;
          else if (!q.isTitlePage && q.question_text.trim() === newText && !mergeTargetId) {
            mergeTargetId = q._id;
            mergeTargetTopicKey = t._key;
          }
        });
      });

      if (mergeTargetId) {
        // Merge: combine file_urls into the existing question, remove the edited duplicate.
        let editedFileUrls = [];
        newData[paperIdx].topics.forEach((t) => {
          t.questions.forEach((q) => { if (q._id === editingQuestionId) editedFileUrls = q.file_urls || []; });
        });

        const mergeIntoTarget = (q) => {
          const existingUrls = new Set((q.file_urls || []).map((f) => f.url));
          const merged = [...(q.file_urls || []), ...editedFileUrls.filter((f) => !existingUrls.has(f.url))];
          return { ...q, file_urls: merged };
        };

        const sameTopicMerge = mergeTargetTopicKey === editedTopicKey;

        const newTopics = newData[paperIdx].topics.map((t) => {
          if (sameTopicMerge && t._key === mergeTargetTopicKey) {
            // Both in the same topic: filter out the edited question AND merge into target in one pass.
            return {
              ...t,
              questions: t.questions
                .filter((q) => q._id !== editingQuestionId)
                .map((q) => q._id === mergeTargetId ? mergeIntoTarget(q) : q),
            };
          }
          if (t._key === mergeTargetTopicKey) {
            return {
              ...t,
              questions: t.questions.map((q) => q._id === mergeTargetId ? mergeIntoTarget(q) : q),
            };
          }
          if (t._key === editedTopicKey) {
            return { ...t, questions: t.questions.filter((q) => q._id !== editingQuestionId) };
          }
          return t;
        });
        newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
        // Keep selections from the merge target; drop the edited question's selections.
        setSelections((prev) => { const s = { ...prev }; delete s[editingQuestionId]; return s; });
      } else {
        // No duplicate — just update the text.
        const newTopics = newData[paperIdx].topics.map((t) => ({
          ...t,
          questions: t.questions.map((q) => q._id === editingQuestionId ? { ...q, question_text: newText } : q),
        }));
        newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      }

      return newData;
    });

    setEditingQuestionId(null);
  };

  const questionDragHandlers = (tIndex, topicKey, qId) => ({
    draggable: true,
    onDragStart: (e) => { setDraggedQuestion({ topicKey, qId }); e.dataTransfer.effectAllowed = "move"; },
    onDragOver: (e) => {
      e.preventDefault();
      setDragOverQuestion({ topicKey, qId });
      setDragOverTopicForQuestion(null); // hovering a question, not the header
    },
    onDrop: (e) => {
      e.preventDefault();
      if (!draggedQuestion) return;
      if (draggedQuestion.topicKey === topicKey) {
        // Same topic — reorder within topic
        const topic = activePaperNode.topics[tIndex];
        const fromIndex = topic.questions.findIndex((x) => x._id === draggedQuestion.qId);
        const toIndex = topic.questions.findIndex((x) => x._id === qId);
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex)
          moveQuestionToPosition(tIndex, fromIndex, toIndex);
      } else {
        // Different topic — move across, insert before this question
        moveQuestionAcrossTopics(draggedQuestion.topicKey, topicKey, draggedQuestion.qId, qId);
        setExpandedTopicKeys((prev) => new Set(prev).add(topicKey));
      }
      setDraggedQuestion(null); setDragOverQuestion(null); setDragOverTopicForQuestion(null);
    },
    onDragEnd: () => { setDraggedQuestion(null); setDragOverQuestion(null); setDragOverTopicForQuestion(null); },
  });

  // Handles the topic header as a drop target for BOTH drag kinds: reordering topics
  // (header dragged onto header) and dropping a question onto a topic (appends to that
  // topic). These used to be two separate handler objects both spread onto the same
  // header div — since they both defined onDragOver/onDrop, the second spread silently
  // clobbered the first's, so topic-drag's onDragOver never ran and never called
  // preventDefault(), which made the browser reject the drop every time. Merged into one
  // handler set so both cases are handled from a single onDragOver/onDrop.
  const topicHeaderDragHandlers = (topicKey) => ({
    draggable: true,
    onDragStart: (e) => { setDraggedTopicKey(topicKey); e.dataTransfer.effectAllowed = "move"; },
    onDragOver: (e) => {
      e.preventDefault();
      if (draggedQuestion) {
        e.stopPropagation();
        setDragOverTopicForQuestion(topicKey);
        setDragOverQuestion(null);
      } else {
        setDragOverTopicKey(topicKey);
      }
    },
    onDrop: (e) => {
      e.preventDefault();
      if (draggedQuestion) {
        e.stopPropagation();
        if (draggedQuestion.topicKey !== topicKey) {
          moveQuestionAcrossTopics(draggedQuestion.topicKey, topicKey, draggedQuestion.qId, null);
          setExpandedTopicKeys((prev) => new Set(prev).add(topicKey));
        }
        setDraggedQuestion(null); setDragOverQuestion(null); setDragOverTopicForQuestion(null);
      } else if (draggedTopicKey && draggedTopicKey !== topicKey) {
        const fromIndex = activePaperNode.topics.findIndex((t) => t._key === draggedTopicKey);
        const toIndex = activePaperNode.topics.findIndex((t) => t._key === topicKey);
        if (fromIndex !== -1 && toIndex !== -1) moveTopicToPosition(fromIndex, toIndex);
        setDraggedTopicKey(null); setDragOverTopicKey(null);
      }
    },
    onDragEnd: () => { setDraggedTopicKey(null); setDragOverTopicKey(null); },
    onDragLeave: () => { if (dragOverTopicForQuestion === topicKey) setDragOverTopicForQuestion(null); },
  });

  const generateAndPreviewPdf = async () => {
    if (!activePaperNode) return;
    setIsGenerating(true);
    setGenerationStatus("pending");
    setPdfBlobUrl(null);
    try {
      const orderedIncludedIds = activePaperNode.topics.flatMap((t) =>
        t.questions.filter((q) => q.isTitlePage || includedQuestions.has(q._id)).map((q) => q._id),
      );
      if (orderedIncludedIds.length === 0) throw new Error("Please select at least one question to include in the book.");
      if (orderedIncludedIds.length > 35) {
        if (!window.confirm(`You have selected ${orderedIncludedIds.length} questions. This may take a long time. Proceed?`)) {
          setIsGenerating(false); return;
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/subjects/${subject}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper: activePaper, selections, includedQuestionIds: orderedIncludedIds }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to start PDF book generation.");
      }
      const data = await response.json();
      pollJobStatus(data.jobId);
    } catch (err) {
      alert(err.message);
      setIsGenerating(false);
    }
  };

  const pollJobStatus = (jobId) => {
    const intervalId = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${API_BASE_URL}/api/subjects/${subject}/status/${jobId}`);
        if (!statusResponse.ok) throw new Error("Failed to retrieve compilation progress.");
        const jobData = await statusResponse.json();
        setGenerationStatus(jobData.status);
        if (jobData.status === "completed") {
          clearInterval(intervalId);
          setPdfBlobUrl(`${API_BASE_URL}/api/subjects/${subject}/download/${jobId}`);
          setIsGenerating(false);
          setShowPreviewModal(true);
        } else if (jobData.status === "failed") {
          clearInterval(intervalId);
          setIsGenerating(false);
          alert(`PDF Generation failed: ${jobData.error || "Unknown error"}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
        clearInterval(intervalId);
        setIsGenerating(false);
        alert(err.message);
      }
    }, 4000);
  };

  const downloadFinalPdf = async () => {
    if (!pdfBlobUrl || isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`${pdfBlobUrl}?download=true`);
      const blob = await response.blob();
      const localUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = localUrl;
      link.download = `${subjectName}_${activePaper.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(localUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(`${pdfBlobUrl}?download=true`, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const getCleanUrl = (url) => {
    if (!url) return "#";
    const cleanUrl = url.replace("https//", "https://").replace("http//", "http://");
    return cleanUrl.startsWith("http") ? cleanUrl : `${API_BASE_URL}${cleanUrl}`;
  };

  const getPreviewUrl = (url) =>
    `${API_BASE_URL}/api/subjects/${subject}/preview-file?url=${encodeURIComponent(getCleanUrl(url))}`;

  const reclassifyNewQuestions = async () => {
    if (!window.confirm(
      `This will re-classify ALL uploaded questions for "${subjectName}" using the saved syllabus and refresh the book builder. New questions will appear in their correct topics.\n\nContinue?`
    )) return;
    setIsReclassifying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${subject}/reclassify`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Re-classification failed.");
      const msg = data.newCount === 0
        ? `No new questions found. ${data.questionCount} questions already classified.`
        : `Done! ${data.newCount} new question(s) classified (${data.questionCount} total). Reloading...`;
      alert(msg);
      await fetchPreview();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsReclassifying(false);
    }
  };

  // Fetched fresh on every open so it reflects any uploads made since the page loaded.
  const openTopperRoster = async () => {
    setIsTopperModalOpen(true);
    setIsLoadingToppers(true);
    setTopperRosterError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${subject}/toppers`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load toppers.");
      setTopperRoster(data);
    } catch (err) {
      setTopperRosterError(err.message);
    } finally {
      setIsLoadingToppers(false);
    }
  };

  const cleanupStorage = async () => {
    const confirmed = window.confirm(
      `This will permanently delete all compiled ${subjectName} book files from server storage to free up space. Job history and selections are kept. Continue?`,
    );
    if (!confirmed) return;
    setIsCleaningStorage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/subjects/${subject}/cleanup-storage`, { method: "POST" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to clean up storage.");
      }
      const data = await response.json();
      alert(`Storage cleaned: removed ${data.deletedFiles} file(s) and ${data.deletedChunks} chunk(s). Cleared references on ${data.jobsUpdated} job record(s).`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCleaningStorage(false);
    }
  };

  let totalActiveQuestions = 0;
  let selectedActiveQuestions = 0;
  if (activePaperNode) {
    activePaperNode.topics.forEach((t) => {
      t.questions.forEach((q) => {
        if (q.isTitlePage) return;
        totalActiveQuestions++;
        if (includedQuestions.has(q._id)) selectedActiveQuestions++;
      });
    });
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-10 font-sans relative flex flex-col items-center">
      <div className="max-w-[1600px] w-full text-center mb-8 relative">
        <div className="absolute top-0 right-0 flex items-center gap-2">
          <button
            onClick={openTopperRoster}
            title="See which toppers' answer sheets have been uploaded for this subject"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gray-900 border border-gray-800 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            View Toppers
          </button>
          <button
            onClick={reclassifyNewQuestions}
            disabled={isReclassifying}
            title="New questions were uploaded? Re-classify using saved syllabus and refresh book"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gray-900 border border-gray-800 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isReclassifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            {isReclassifying ? "Classifying…" : "Sync New Questions"}
          </button>
          <button
            onClick={cleanupStorage}
            disabled={isCleaningStorage}
            title="Delete all compiled book files from server storage to free up space"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isCleaningStorage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Clean File Storage
          </button>
        </div>
        <div className="inline-flex w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-500 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/10 mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{subjectName}</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          Select a topic on the left to review it on the right — fully expanded with topper answers always visible. Drag questions/topics on the left to reorder.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-gray-400 text-sm font-semibold tracking-wide">Loading {subjectName} data...</p>
        </div>
      ) : (
        <div className="max-w-[1600px] w-full flex flex-col gap-5">
          {/* Dynamic paper tabs from data */}
          {psirData.length > 0 && (
            <div className="w-full flex bg-gray-900 border border-gray-800 p-1.5 rounded-2xl gap-2 shadow-inner flex-wrap">
              {psirData.map((paperObj) => {
                const isActive = activePaper === paperObj.paper;
                const totalQ = paperObj.topics.reduce((acc, t) => acc + t.questions.length, 0);
                return (
                  <button
                    key={paperObj.paper}
                    onClick={() => {
                      if (!isActive) flushDirtyPapers();
                      setActivePaper(paperObj.paper);
                    }}
                    className={`flex-1 min-w-[120px] flex flex-col items-center py-3 px-4 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/10"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
                    }`}
                  >
                    <span className="font-extrabold text-sm tracking-wide">{paperObj.paper}</span>
                    <span className={`text-[10px] mt-0.5 font-bold ${isActive ? "text-indigo-200" : "text-gray-500"}`}>
                      {paperObj.section || "—"} ({totalQ} Qs)
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activePaperNode && (
            <div className="flex flex-col gap-5">
              <div className="bg-gray-800/40 border border-gray-700/60 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">Selected Paper Section</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{activePaperNode.section || activePaperNode.paper}</h2>
                  <div className="mt-2"><SaveStatusBadge status={saveStatus} /></div>
                </div>
                <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <button
                    onClick={handleSelectAllToggle}
                    className={`px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${isAllActiveSelected() ? "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700" : "bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800"}`}
                  >
                    {isAllActiveSelected() ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {isAllActiveSelected() ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={generateAndPreviewPdf}
                    disabled={isGenerating || selectedActiveQuestions === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    Generate {activePaper} Book
                  </button>
                </div>
              </div>

              <ProgressBar percent={paperStats.percent} reviewed={paperStats.reviewed} total={paperStats.total} />

              <div className="flex flex-col lg:flex-row gap-5 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
                {/* LEFT: master list */}
                <div className="w-full lg:w-[36%] shrink-0 lg:h-full lg:min-h-0 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900/40 p-3 flex flex-col gap-3">
                  {activePaperNode.topics.map((topNode, tIndex) => {
                    const isExpanded = expandedTopicKeys.has(topNode._key);
                    const stats = computeTopicStats(topNode, selections, includedQuestions);
                    return (
                      <div key={topNode._key} className="flex flex-col gap-2">
                        <TopicGroupHeader
                          topicNode={topNode} tIndex={tIndex} totalTopics={activePaperNode.topics.length}
                          stats={stats} variant="list" isExpanded={isExpanded}
                          onToggleExpand={() => toggleTopicExpanded(topNode._key)}
                          isSelected={selectedTopicKey === topNode._key}
                          onSelect={() => selectTopic(topNode._key)}
                          isEditing={editingTopicKey === topNode._key}
                          editingValue={editingTopicValue}
                          onEditChange={setEditingTopicValue}
                          onEditStart={() => { setEditingTopicKey(topNode._key); setEditingTopicValue(topNode.title); }}
                          onEditCommit={() => saveTopicName(topNode._key)}
                          onEditCancel={() => setEditingTopicKey(null)}
                          onMoveUp={() => moveTopic(tIndex, -1)}
                          onMoveDown={() => moveTopic(tIndex, 1)}
                          onAddTitlePage={() => { setTitlePageModalTopicKey(topNode._key); setTitlePageModalValue(""); }}
                          dragHandlers={topicHeaderDragHandlers(topNode._key)}
                          isDragOver={dragOverTopicKey === topNode._key}
                          isDragging={draggedTopicKey === topNode._key}
                          isQuestionDragTarget={dragOverTopicForQuestion === topNode._key}
                        />
                        {isExpanded && (
                          <div className="flex flex-col gap-1 pl-2">
                            {topNode.questions.map((q) =>
                              q.isTitlePage ? (
                                <TitlePageRow key={q._id} subtitle={q.subtitle} variant="list"
                                  dragHandlers={questionDragHandlers(tIndex, topNode._key, q._id)}
                                  isDragOver={dragOverQuestion?.qId === q._id}
                                  isDragging={draggedQuestion?.qId === q._id}
                                  onDelete={() => deleteTitlePage(topNode._key, q._id)}
                                />
                              ) : (
                                <MasterListRow key={q._id} q={q}
                                  isIncluded={includedQuestions.has(q._id)}
                                  selectedCount={(selections[q._id] || []).length}
                                  isPulsing={pulsingQuestionIds.has(q._id)}
                                  onRowClick={() => { selectTopic(topNode._key); setScrollToQuestionId(q._id); triggerPulse(q._id); }}
                                  onToggleInclude={() => toggleIncludeQuestion(tIndex, q._id)}
                                  dragHandlers={questionDragHandlers(tIndex, topNode._key, q._id)}
                                  isDragOver={dragOverQuestion?.qId === q._id}
                                  isDragging={draggedQuestion?.qId === q._id}
                                />
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT: review panel */}
                <div className="flex-1 min-w-0 lg:h-full lg:min-h-0 overflow-y-auto flex flex-col gap-4">
                  {selectedTopic ? (
                    (() => {
                      const tIndex = activePaperNode.topics.findIndex((t) => t._key === selectedTopic._key);
                      const stats = computeTopicStats(selectedTopic, selections, includedQuestions);
                      return (
                        <div className="bg-gray-800/20 border border-gray-800/80 rounded-2xl overflow-hidden shadow-inner shrink-0">
                          <TopicGroupHeader
                            topicNode={selectedTopic} tIndex={tIndex} totalTopics={activePaperNode.topics.length}
                            stats={stats} variant="review"
                            isEditing={editingTopicKey === selectedTopic._key}
                            editingValue={editingTopicValue}
                            onEditChange={setEditingTopicValue}
                            onEditStart={() => { setEditingTopicKey(selectedTopic._key); setEditingTopicValue(selectedTopic.title); }}
                            onEditCommit={() => saveTopicName(selectedTopic._key)}
                            onEditCancel={() => setEditingTopicKey(null)}
                          />
                          <div className="p-6 space-y-4 bg-gray-900/10">
                            {selectedTopic.questions.map((q, qIndex) =>
                              q.isTitlePage ? (
                                <TitlePageRow key={q._id} subtitle={q.subtitle} variant="review"
                                  onDelete={() => deleteTitlePage(selectedTopic._key, q._id)}
                                />
                              ) : (
                                <ReviewQuestionRow key={q._id} q={q} qIndex={qIndex}
                                  isIncluded={includedQuestions.has(q._id)}
                                  isPulsing={pulsingQuestionIds.has(q._id)}
                                  selections={selections}
                                  onToggleInclude={() => toggleIncludeQuestion(tIndex, q._id)}
                                  onSelectionChange={handleSelectionChange}
                                  editingTopperKey={editingTopperKey}
                                  editingTopperValues={editingTopperValues}
                                  onTopperEditStart={(fileObj) => {
                                    setEditingTopperKey(fileObj.url);
                                    setEditingTopperValues({ topper_name: fileObj.topper_name || "", topper_year: fileObj.topper_year || "", topper_rank: fileObj.topper_rank || "", topper_marks: fileObj.topper_marks || "" });
                                  }}
                                  onTopperEditChange={(field, value) => setEditingTopperValues((p) => ({ ...p, [field]: value }))}
                                  onTopperEditSave={saveTopperDetails}
                                  onTopperEditCancel={() => setEditingTopperKey(null)}
                                  isEditingQuestion={editingQuestionId === q._id}
                                  editingQuestionValue={editingQuestionValue}
                                  onQuestionEditStart={() => { setEditingQuestionId(q._id); setEditingQuestionValue(q.question_text); }}
                                  onQuestionEditChange={setEditingQuestionValue}
                                  onQuestionEditSave={saveQuestionText}
                                  onQuestionEditCancel={() => setEditingQuestionId(null)}
                                  getPreviewUrl={getPreviewUrl}
                                  onMoveToOtherPaper={openMoveToPaperModal}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-gray-900/30 border border-gray-800 rounded-2xl">
                      <BookOpen className="w-10 h-10 text-gray-600" />
                      <p className="text-gray-500 text-sm font-semibold">Select a topic on the left to start reviewing its questions.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-850 p-4 border border-gray-800 rounded-xl text-center text-xs text-gray-400">
                You have selected <strong className="text-white">{selectedActiveQuestions}</strong> out of{" "}
                <strong className="text-white">{totalActiveQuestions}</strong> questions in{" "}
                <strong className="text-indigo-400">{activePaper}</strong>.
              </div>
            </div>
          )}

          {psirData.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-gray-900/30 border border-gray-800 rounded-2xl">
              <BookOpen className="w-10 h-10 text-gray-600" />
              <p className="text-gray-500 text-sm font-semibold">No data found for this subject. Make sure it has been classified and activated.</p>
            </div>
          )}
        </div>
      )}

      <MilestoneToast toast={activeToast} onDismiss={() => setActiveToast(null)} />

      {isTopperModalOpen && (
        <TopperRosterModal
          subjectName={subjectName}
          data={topperRoster}
          isLoading={isLoadingToppers}
          error={topperRosterError}
          onClose={() => setIsTopperModalOpen(false)}
        />
      )}

      {titlePageModalTopicKey && (
        <AddTitlePageModal
          value={titlePageModalValue}
          onChange={setTitlePageModalValue}
          onAdd={() => { addTitlePage(titlePageModalTopicKey, titlePageModalValue.trim()); setTitlePageModalTopicKey(null); }}
          onCancel={() => setTitlePageModalTopicKey(null)}
        />
      )}

      {showPreviewModal && pdfBlobUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-gray-900 shadow-2xl w-full h-full max-w-full max-h-screen flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">{activePaper} PDF Preview</h2>
                <p className="text-xs text-gray-400">Review layout & page organization before exporting</p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer">Back to Editing</button>
            </div>
            <div className="flex-1 bg-gray-950 p-2 overflow-hidden flex items-center justify-center">
              <iframe src={pdfBlobUrl} className="w-full h-full rounded-lg border border-gray-800" title="PDF Preview" />
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-900/90 flex justify-end gap-3">
              <button onClick={() => setShowPreviewModal(false)} className="px-5 py-2.5 rounded-lg text-xs font-black text-gray-400 hover:text-white transition-colors cursor-pointer">Close Preview</button>
              <button onClick={downloadFinalPdf} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer animate-pulse">
                <Download className="w-4 h-4" /> Download PDF Book
              </button>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Generating PDF Book</h3>
            <p className="text-gray-400 text-xs mb-6 max-w-xs leading-relaxed">
              We have offloaded PDF compilation to GitHub Actions. This prevents server timeouts and ensures high performance.
            </p>
            <div className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3.5 mb-6 text-left">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${generationStatus === "pending" ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
                <span className={`text-xs font-bold ${generationStatus === "pending" ? "text-white" : "text-gray-400"}`}>1. Queueing job in GitHub Actions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${generationStatus === "processing" ? "bg-indigo-500 animate-pulse" : generationStatus === "completed" ? "bg-green-500" : "bg-gray-800"}`} />
                <span className={`text-xs font-bold ${generationStatus === "processing" ? "text-white" : generationStatus === "completed" ? "text-gray-400" : "text-gray-600"}`}>2. Downloading & merging topper sheets</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${generationStatus === "completed" ? "bg-green-500 animate-pulse" : "bg-gray-800"}`} />
                <span className={`text-xs font-bold ${generationStatus === "completed" ? "text-white" : "text-gray-600"}`}>3. Uploading completed book</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
              Status:{" "}
              <span className={generationStatus === "failed" ? "text-red-500" : generationStatus === "completed" ? "text-green-500" : "text-indigo-400"}>
                {generationStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Move to Paper / Section modal */}
      {moveToPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-teal-400" />
                </div>
                <h3 className="text-white font-bold text-base">Move to Another Paper / Section</h3>
              </div>
              <button onClick={() => setMoveToPaperModal(null)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Paper</label>
                <select
                  value={moveToPaperPaper}
                  onChange={(e) => {
                    const paper = e.target.value;
                    const firstTopic = psirData.find((p) => p.paper === paper)?.topics[0]?._key || '';
                    setMoveToPaperPaper(paper);
                    setMoveToPaperTopicKey(firstTopic);
                  }}
                  className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {psirData.map((p) => (
                    <option key={p.paper} value={p.paper}>{p.paper}{p.paper === activePaper ? ' (current)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Section / Topic</label>
                <select
                  value={moveToPaperTopicKey}
                  onChange={(e) => setMoveToPaperTopicKey(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {(psirData.find((p) => p.paper === moveToPaperPaper)?.topics || []).map((t) => (
                    <option key={t._key} value={t._key}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmMoveQuestionToPaper}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-white text-sm font-bold transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" /> Move Question
              </button>
              <button
                onClick={() => setMoveToPaperModal(null)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-sm font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
