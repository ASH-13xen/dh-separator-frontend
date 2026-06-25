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
} from "lucide-react";

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

// A question counts as "reviewed" once the user has made an affirmative decision about
// it: either picked at least one topper, or explicitly excluded it. A question that is
// merely included-by-default with zero toppers picked has not actually been reviewed yet.
function isQuestionReviewed(q, selections, includedQuestions) {
  if (!includedQuestions.has(q._id)) return true;
  return (selections[q._id]?.length || 0) > 0;
}

function computeTopicStats(topicNode, selections, includedQuestions) {
  const total = topicNode.questions.length;
  const reviewed = topicNode.questions.filter((q) =>
    isQuestionReviewed(q, selections, includedQuestions),
  ).length;
  return { total, reviewed, isComplete: total > 0 && reviewed === total };
}

function computePaperStats(paperNode, selections, includedQuestions) {
  const allQuestions = paperNode.topics.flatMap((t) => t.questions);
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
      <button
        onClick={onDismiss}
        className="ml-auto text-gray-500 hover:text-white relative z-10 cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function TopicGroupHeader({
  topicNode,
  tIndex,
  totalTopics,
  stats,
  variant, // 'list' | 'review'
  isExpanded,
  onToggleExpand,
  isSelected,
  onSelect,
  isEditing,
  editingValue,
  onEditChange,
  onEditStart,
  onEditCommit,
  onEditCancel,
  onMoveUp,
  onMoveDown,
  dragHandlers,
  isDragOver,
  isDragging,
}) {
  const isList = variant === "list";
  return (
    <div
      {...(isList ? dragHandlers : {})}
      onClick={isList ? onSelect : undefined}
      className={`px-4 py-3 flex items-center justify-between gap-2 rounded-xl transition-all ${
        isList
          ? `border cursor-pointer ${isDragOver ? "border-indigo-400 ring-2 ring-indigo-400/40" : isSelected ? "border-indigo-500/70 ring-1 ring-indigo-500/40" : "border-gray-800"} ${isDragging ? "opacity-40" : ""} bg-gray-900/70`
          : "bg-gray-900/60 border-b border-gray-800"
      } ${stats.isComplete ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isList && <GripVertical className="w-4 h-4 text-gray-600 shrink-0 cursor-grab active:cursor-grabbing" />}
        {isList && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="shrink-0 cursor-pointer"
            title="Expand/collapse topic"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
        {isList && (
          <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onMoveUp}
              disabled={tIndex === 0}
              className="p-0.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-white cursor-pointer"
              title="Move topic up"
            >
              <ArrowUp className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={tIndex === totalTopics - 1}
              className="p-0.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-white cursor-pointer"
              title="Move topic down"
            >
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
              onKeyDown={(e) => {
                if (e.key === "Enter") onEditCommit();
                if (e.key === "Escape") onEditCancel();
              }}
              className="flex-1 bg-gray-800 border border-indigo-500 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={onEditCommit} className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={onEditCancel} className="p-1 rounded bg-gray-700 hover:bg-gray-600 text-white cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className={`font-extrabold text-indigo-300 truncate ${isList ? "text-xs" : "text-sm"}`}>
              {topicNode.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditStart();
              }}
              className="p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer"
              title="Edit topic name"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <span
        className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-full ${
          stats.isComplete ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-800 text-gray-400"
        }`}
      >
        {stats.reviewed}/{stats.total}
      </span>
    </div>
  );
}

function MasterListRow({
  q,
  isIncluded,
  selectedCount,
  isPulsing,
  onRowClick,
  onToggleInclude,
  dragHandlers,
  isDragOver,
  isDragging,
}) {
  return (
    <div
      {...dragHandlers}
      onClick={onRowClick}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all border ${
        isDragOver ? "border-indigo-400 ring-1 ring-indigo-400/50" : "border-transparent"
      } ${isDragging ? "opacity-40" : ""} ${
        isIncluded ? "hover:bg-gray-800/60" : "opacity-50 hover:bg-gray-800/30"
      } ${isPulsing ? "bg-indigo-500/20" : ""}`}
    >
      <GripVertical className="w-3.5 h-3.5 text-gray-600 shrink-0" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleInclude();
        }}
        className="shrink-0 cursor-pointer"
      >
        {isIncluded ? (
          <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
        ) : (
          <Square className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>
      <span className="text-xs text-gray-300 truncate flex-1">{q.question_text}</span>
      <span
        className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
          selectedCount > 0 ? "bg-indigo-500/20 text-indigo-300" : "bg-gray-800 text-gray-500"
        }`}
      >
        {selectedCount}/3
      </span>
    </div>
  );
}

function ReviewQuestionRow({
  q,
  qIndex,
  isIncluded,
  isPulsing,
  selections,
  onToggleInclude,
  onSelectionChange,
  editingTopperKey,
  editingTopperValues,
  onTopperEditStart,
  onTopperEditChange,
  onTopperEditSave,
  onTopperEditCancel,
  isEditingQuestion,
  editingQuestionValue,
  onQuestionEditStart,
  onQuestionEditChange,
  onQuestionEditSave,
  onQuestionEditCancel,
  getPreviewUrl,
}) {
  const currentSelections = selections[q._id] || [];
  return (
    <div
      id={`q-${q._id}`}
      className={`rounded-xl p-4 border transition-all ${
        isIncluded
          ? "bg-[#131d31]/40 border-indigo-500/35 shadow-sm"
          : "bg-gray-850/20 border-gray-800/60 opacity-60"
      } ${isPulsing ? "ring-2 ring-indigo-400/60" : ""} hover:border-indigo-400/60`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-[10px] text-gray-500 font-black mt-1 shrink-0 w-5 text-center">
          {qIndex + 1}
        </span>
        <button onClick={onToggleInclude} className="mt-0.5 shrink-0 cursor-pointer">
          {isIncluded ? (
            <CheckSquare className="w-4 h-4 text-indigo-500" />
          ) : (
            <Square className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {isEditingQuestion ? (
          <div className="flex-1 flex flex-col gap-1.5">
            <textarea
              autoFocus
              rows={3}
              value={editingQuestionValue}
              onChange={(e) => onQuestionEditChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onQuestionEditCancel();
              }}
              className="w-full bg-gray-800 border border-indigo-500 rounded-lg px-3 py-2 text-sm text-white font-semibold leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
            <div className="flex gap-1.5">
              <button
                onClick={onQuestionEditSave}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-[10px] font-bold cursor-pointer"
              >
                <Check className="w-3 h-3" /> Save
              </button>
              <button
                onClick={onQuestionEditCancel}
                className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-[10px] font-bold cursor-pointer"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-relaxed flex-1">
              {q.question_text}
            </p>
            <button
              onClick={onQuestionEditStart}
              className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer"
              title="Edit question text"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isIncluded && q.file_urls && q.file_urls.length > 0 && (
        <div className="pl-10 space-y-2 mt-2">
          <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">
            Available Topper Answers
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {q.file_urls.map((fileObj) => {
              const isSelected = currentSelections.includes(fileObj.url);
              const isDisabled = !isSelected && currentSelections.length >= 3;
              const isEditingThisTopper = editingTopperKey === fileObj.url;

              return (
                <div
                  key={fileObj.url}
                  className={`flex flex-col p-3.5 rounded-xl border transition-colors ${
                    isSelected
                      ? "bg-[#1e293b]/40 border-indigo-500/60 text-indigo-200"
                      : isDisabled
                        ? "bg-gray-900/10 border-gray-800 text-gray-600 opacity-40"
                        : "bg-gray-900/40 border-gray-800 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <label
                      className={`flex items-start gap-2.5 flex-1 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
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
                            <input
                              autoFocus
                              placeholder="Topper name"
                              value={editingTopperValues.topper_name || ""}
                              onChange={(e) => onTopperEditChange("topper_name", e.target.value)}
                              className="bg-gray-800 border border-indigo-500/60 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="grid grid-cols-3 gap-1">
                              <input
                                placeholder="Year"
                                value={editingTopperValues.topper_year || ""}
                                onChange={(e) => onTopperEditChange("topper_year", e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <input
                                placeholder="Rank"
                                value={editingTopperValues.topper_rank || ""}
                                onChange={(e) => onTopperEditChange("topper_rank", e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <input
                                placeholder="Marks"
                                value={editingTopperValues.topper_marks || ""}
                                onChange={(e) => onTopperEditChange("topper_marks", e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => onTopperEditSave(q._id, fileObj.url)}
                                className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-[10px] font-bold cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Save
                              </button>
                              <button
                                onClick={onTopperEditCancel}
                                className="flex-1 flex items-center justify-center gap-1 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-[10px] font-bold cursor-pointer"
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="font-bold text-sm text-white truncate">
                                {fileObj.topper_name || "Ref Answer"}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-0.5 font-semibold">
                              Year: {fileObj.topper_year || "N/A"} | Rank:{" "}
                              {fileObj.topper_rank || "N/A"} | Marks: {fileObj.topper_marks || "N/A"}
                            </span>
                          </>
                        )}
                      </div>
                    </label>

                    {!isEditingThisTopper && (
                      <button
                        onClick={() => onTopperEditStart(fileObj)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-indigo-300 transition-colors shrink-0 cursor-pointer"
                        title="Edit topper details"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="w-full h-44 rounded-lg overflow-hidden border border-gray-800 bg-gray-950 shadow-inner">
                    <iframe
                      src={getPreviewUrl(fileObj.url)}
                      className="w-full h-full border-0"
                      title={`Preview-${fileObj.topper_name || fileObj.url}`}
                      loading="lazy"
                    />
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

export default function PSIRBookV2Page() {
  const [activePaper, setActivePaper] = useState("Paper 1A");
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

  const [expandedTopicKeys, setExpandedTopicKeys] = useState(new Set());
  const [selectedTopicKey, setSelectedTopicKey] = useState(null);
  const [scrollToQuestionId, setScrollToQuestionId] = useState(null);
  const [editingTopicKey, setEditingTopicKey] = useState(null);
  const [editingTopicValue, setEditingTopicValue] = useState("");
  const [editingTopperKey, setEditingTopperKey] = useState(null);
  const [editingTopperValues, setEditingTopperValues] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingQuestionValue, setEditingQuestionValue] = useState("");

  const [draggedQuestion, setDraggedQuestion] = useState(null); // { topicKey, qId }
  const [dragOverQuestion, setDragOverQuestion] = useState(null);
  const [draggedTopicKey, setDraggedTopicKey] = useState(null);
  const [dragOverTopicKey, setDragOverTopicKey] = useState(null);

  const [saveStatus, setSaveStatus] = useState("saved");
  const [celebratedMilestones, setCelebratedMilestones] = useState(new Set());
  const [activeToast, setActiveToast] = useState(null);
  const [pulsingQuestionIds, setPulsingQuestionIds] = useState(new Set());

  const skipNextAutoSave = useRef(true);

  useEffect(() => {
    fetchPsirPreview();
  }, []);

  const fetchPsirPreview = async () => {
    setIsLoading(true);
    skipNextAutoSave.current = true;
    try {
      const response = await fetch(`${API_BASE_URL}/api/psir/preview`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch PSIR layout.");
      }
      const data = await response.json();
      const hierarchy = data.hierarchy || [];
      setPsirData(hierarchy);
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

  // Snapshots the current topic order/renames, question order, inclusion, selections and
  // topper detail overrides for one paper and persists them. Retries up to 3 times with
  // backoff on failure; if it still fails, a separate effect below keeps retrying every 5s
  // until it succeeds — "progress should be saved no matter what."
  const saveLayoutForPaper = async (paper, attempt = 1) => {
    const paperNode = psirData.find((p) => p.paper === paper);
    if (!paperNode) return;

    const topicOrder = paperNode.topics.map((t) => t._key);
    const topicRenames = {};
    const questionOrder = {};
    const topperOverrides = {};
    const questionTextOverrides = {};
    const paperSelections = {};
    const paperExcluded = [];
    const expandedTopics = [];

    paperNode.topics.forEach((t) => {
      if (t.title !== t._key) topicRenames[t._key] = t.title;
      if (expandedTopicKeys.has(t._key)) expandedTopics.push(t._key);
      questionOrder[t._key] = t.questions.map((q) => q._id);
      t.questions.forEach((q) => {
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

    setSaveStatus(attempt > 1 ? "retrying" : "saving");
    try {
      const res = await fetch(`${API_BASE_URL}/api/psir/layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper,
          topicOrder,
          topicRenames,
          questionOrder,
          excludedQuestionIds: paperExcluded,
          selections: paperSelections,
          topperOverrides,
          expandedTopics,
          questionTextOverrides,
        }),
      });
      if (!res.ok) throw new Error(`Save failed with status ${res.status}`);
      setSaveStatus("saved");
    } catch (err) {
      console.error("[PSIRBookV2Page] Save attempt failed:", err);
      if (attempt < 3) {
        setTimeout(() => saveLayoutForPaper(paper, attempt + 1), 1500 * attempt);
      } else {
        setSaveStatus("error");
      }
    }
  };

  useEffect(() => {
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    if (!activePaper) return;
    const timer = setTimeout(() => {
      saveLayoutForPaper(activePaper);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [psirData, selections, includedQuestions, expandedTopicKeys]);

  // Keeps retrying indefinitely (every 5s) while a save is stuck in 'error', even with no
  // further edits, so a transient backend outage never silently loses progress.
  useEffect(() => {
    if (saveStatus !== "error") return;
    const t = setTimeout(() => {
      if (activePaper) saveLayoutForPaper(activePaper, 1);
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveStatus]);

  // Scrolls the right review panel to whichever question was just clicked in the left list.
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

  // Selects a topic for the right review panel and ensures it's expanded in the left list.
  const selectTopic = (topicKey) => {
    setSelectedTopicKey(topicKey);
    setExpandedTopicKeys((prev) => new Set(prev).add(topicKey));
  };

  // Keeps a topic selected at all times: defaults to the active paper's first topic on
  // load, and re-defaults whenever the current selection no longer belongs to this paper
  // (e.g. right after switching paper tabs).
  useEffect(() => {
    if (!activePaperNode || activePaperNode.topics.length === 0) return;
    const stillValid = activePaperNode.topics.some((t) => t._key === selectedTopicKey);
    if (!stillValid) selectTopic(activePaperNode.topics[0]._key);
  }, [activePaperNode, selectedTopicKey]);

  // Gamification: celebrate 25/50/75/100% milestones once each, per paper.
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    const crossed = milestones.find(
      (m) => paperStats.percent >= m && !celebratedMilestones.has(m),
    );
    if (crossed) {
      setCelebratedMilestones((prev) => new Set(prev).add(crossed));
      setActiveToast({
        id: Date.now(),
        message:
          crossed === 100
            ? `${activePaper} fully reviewed! Great work.`
            : `${crossed}% of ${activePaper} reviewed — keep going!`,
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

  const handleSelectionChangeV2 = (qId, urlStr) => {
    setSelections((prev) => {
      const current = prev[qId] || [];
      if (current.includes(urlStr)) return { ...prev, [qId]: current.filter((u) => u !== urlStr) };
      if (current.length >= 3) {
        alert("You can select up to 3 toppers per question.");
        return prev;
      }
      return { ...prev, [qId]: [...current, urlStr] };
    });
    triggerPulse(qId);
  };

  // Move a question to an arbitrary 0-based position within its topic.
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

  // Auto-sinks a question to the bottom of its topic the moment it's excluded, so
  // already-decided questions stop interfering with toggling the rest.
  const toggleIncludeQuestionV2 = (tIndex, qId) => {
    const wasIncluded = includedQuestions.has(qId);
    setIncludedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
    triggerPulse(qId);
    if (wasIncluded) {
      const topic = activePaperNode?.topics[tIndex];
      if (!topic) return;
      const fromIndex = topic.questions.findIndex((q) => q._id === qId);
      const lastIndex = topic.questions.length - 1;
      if (fromIndex !== -1 && fromIndex !== lastIndex) {
        moveQuestionToPosition(tIndex, fromIndex, lastIndex);
      }
    }
  };

  const handleSelectAllToggle = () => {
    if (!activePaperNode) return;
    const activeIds = activePaperNode.topics.flatMap((t) => t.questions.map((q) => q._id));
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
    const activeIds = activePaperNode.topics.flatMap((t) => t.questions.map((q) => q._id));
    return activeIds.length > 0 && activeIds.every((id) => includedQuestions.has(id));
  };

  const toggleTopicExpanded = (topicKey) => {
    setExpandedTopicKeys((prev) => {
      const next = new Set(prev);
      if (next.has(topicKey)) next.delete(topicKey);
      else next.add(topicKey);
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

  const saveTopicNameV2 = (topicKey) => {
    const newTitle = editingTopicValue.trim();
    if (newTitle) {
      setPsirData((prev) => {
        const newData = [...prev];
        const paperIdx = newData.findIndex((p) => p.paper === activePaper);
        if (paperIdx === -1) return prev;
        const newTopics = newData[paperIdx].topics.map((t) =>
          t._key === topicKey ? { ...t, title: newTitle } : t,
        );
        newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
        return newData;
      });
    }
    setEditingTopicKey(null);
  };

  const saveTopperDetailsV2 = (questionId, fileUrl) => {
    setPsirData((prev) => {
      const newData = [...prev];
      const paperIdx = newData.findIndex((p) => p.paper === activePaper);
      if (paperIdx === -1) return prev;
      const newTopics = newData[paperIdx].topics.map((t) => ({
        ...t,
        questions: t.questions.map((q) => {
          if (q._id !== questionId) return q;
          return {
            ...q,
            file_urls: q.file_urls.map((f) =>
              f.url === fileUrl ? { ...f, ...editingTopperValues } : f,
            ),
          };
        }),
      }));
      newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
      return newData;
    });
    setEditingTopperKey(null);
  };

  const saveQuestionTextV2 = () => {
    const newText = editingQuestionValue.trim();
    if (newText) {
      setPsirData((prev) => {
        const newData = [...prev];
        const paperIdx = newData.findIndex((p) => p.paper === activePaper);
        if (paperIdx === -1) return prev;
        const newTopics = newData[paperIdx].topics.map((t) => ({
          ...t,
          questions: t.questions.map((q) =>
            q._id === editingQuestionId ? { ...q, question_text: newText } : q,
          ),
        }));
        newData[paperIdx] = { ...newData[paperIdx], topics: newTopics };
        return newData;
      });
    }
    setEditingQuestionId(null);
  };

  // --- Drag-and-drop: questions within a topic (left list only) ---
  const questionDragHandlers = (tIndex, topicKey, qId) => ({
    draggable: true,
    onDragStart: (e) => {
      setDraggedQuestion({ topicKey, qId });
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e) => {
      e.preventDefault();
      if (draggedQuestion?.topicKey === topicKey) setDragOverQuestion({ topicKey, qId });
    },
    onDrop: (e) => {
      e.preventDefault();
      if (!draggedQuestion || draggedQuestion.topicKey !== topicKey) return;
      const topic = activePaperNode.topics[tIndex];
      const fromIndex = topic.questions.findIndex((x) => x._id === draggedQuestion.qId);
      const toIndex = topic.questions.findIndex((x) => x._id === qId);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        moveQuestionToPosition(tIndex, fromIndex, toIndex);
      }
      setDraggedQuestion(null);
      setDragOverQuestion(null);
    },
    onDragEnd: () => {
      setDraggedQuestion(null);
      setDragOverQuestion(null);
    },
  });

  // --- Drag-and-drop: topics (left list only) ---
  const topicDragHandlers = (topicKey) => ({
    draggable: true,
    onDragStart: (e) => {
      setDraggedTopicKey(topicKey);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragOver: (e) => {
      e.preventDefault();
      setDragOverTopicKey(topicKey);
    },
    onDrop: (e) => {
      e.preventDefault();
      if (draggedTopicKey && draggedTopicKey !== topicKey) {
        const fromIndex = activePaperNode.topics.findIndex((t) => t._key === draggedTopicKey);
        const toIndex = activePaperNode.topics.findIndex((t) => t._key === topicKey);
        if (fromIndex !== -1 && toIndex !== -1) moveTopicToPosition(fromIndex, toIndex);
      }
      setDraggedTopicKey(null);
      setDragOverTopicKey(null);
    },
    onDragEnd: () => {
      setDraggedTopicKey(null);
      setDragOverTopicKey(null);
    },
  });

  const generateAndPreviewPdf = async () => {
    if (!activePaperNode) return;
    setIsGenerating(true);
    setGenerationStatus("pending");
    setPdfBlobUrl(null);
    try {
      const orderedIncludedIds = activePaperNode.topics.flatMap((t) =>
        t.questions.filter((q) => includedQuestions.has(q._id)).map((q) => q._id),
      );
      if (orderedIncludedIds.length === 0)
        throw new Error("Please select at least one question to include in the book.");
      if (orderedIncludedIds.length > 35) {
        if (
          !window.confirm(
            `You have selected ${orderedIncludedIds.length} questions. This may take a long time. Proceed?`,
          )
        ) {
          setIsGenerating(false);
          return;
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/psir/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper: activePaper,
          selections,
          includedQuestionIds: orderedIncludedIds,
        }),
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
        const statusResponse = await fetch(`${API_BASE_URL}/api/psir/status/${jobId}`);
        if (!statusResponse.ok) throw new Error("Failed to retrieve compilation progress.");
        const jobData = await statusResponse.json();
        setGenerationStatus(jobData.status);
        if (jobData.status === "completed") {
          clearInterval(intervalId);
          setPdfBlobUrl(`${API_BASE_URL}/api/psir/download/${jobId}`);
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
      link.download = `Formal_PSIR_${activePaper.replace(/[^a-z0-9]/gi, "_")}.pdf`;
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
    `${API_BASE_URL}/api/psir/preview-file?url=${encodeURIComponent(getCleanUrl(url))}`;

  const cleanupStorage = async () => {
    const confirmed = window.confirm(
      "This will permanently delete every compiled PSIR book file stored on the server (including any not yet downloaded) to free up database space. Job history and selections are kept. Continue?",
    );
    if (!confirmed) return;

    setIsCleaningStorage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/psir/cleanup-storage`, { method: "POST" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to clean up storage.");
      }
      const data = await response.json();
      alert(
        `Storage cleaned: removed ${data.deletedFiles} file(s) and ${data.deletedChunks} chunk(s). Cleared references on ${data.jobsUpdated} job record(s).`,
      );
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
        totalActiveQuestions++;
        if (includedQuestions.has(q._id)) selectedActiveQuestions++;
      });
    });
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-10 font-sans relative flex flex-col items-center">
      <div className="max-w-[1600px] w-full text-center mb-8 relative">
        <button
          onClick={cleanupStorage}
          disabled={isCleaningStorage}
          title="Delete all compiled PSIR book files from server storage to free up space"
          className="absolute top-0 right-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isCleaningStorage ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          Clean File Storage
        </button>
        <div className="inline-flex w-16 h-16 bg-linear-to-br from-indigo-500 to-purple-500 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/10 mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">PSIR Book 2</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          Select a topic on the left to review it on the right — fully expanded with topper
          answers always visible. Drag questions/topics on the left to reorder.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-gray-400 text-sm font-semibold tracking-wide">Loading PSIR data...</p>
        </div>
      ) : (
        <div className="max-w-[1600px] w-full flex flex-col gap-5">
          {/* Paper Tabs */}
          <div className="w-full flex bg-gray-900 border border-gray-800 p-1.5 rounded-2xl gap-2 shadow-inner">
            {["Paper 1A", "Paper 1B", "Paper 2A", "Paper 2B"].map((paperName) => {
              const isActive = activePaper === paperName;
              const paperNode = psirData.find((p) => p.paper === paperName);
              const totalQ = paperNode
                ? paperNode.topics.reduce((acc, t) => acc + t.questions.length, 0)
                : 0;
              return (
                <button
                  key={paperName}
                  onClick={() => setActivePaper(paperName)}
                  className={`flex-1 flex flex-col items-center py-3 px-4 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/10"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
                  }`}
                >
                  <span className="font-extrabold text-sm tracking-wide">{paperName}</span>
                  <span className={`text-[10px] mt-0.5 font-bold ${isActive ? "text-indigo-200" : "text-gray-500"}`}>
                    {paperNode ? paperNode.section : "Loading..."} ({totalQ} Qs)
                  </span>
                </button>
              );
            })}
          </div>

          {activePaperNode && (
            <div className="flex flex-col gap-5">
              {/* Paper Banner */}
              <div className="bg-gray-800/40 border border-gray-700/60 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">
                    Selected Paper Section
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{activePaperNode.section}</h2>
                  <div className="mt-2">
                    <SaveStatusBadge status={saveStatus} />
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end">
                  <button
                    onClick={handleSelectAllToggle}
                    className={`px-4 py-2 flex items-center gap-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      isAllActiveSelected()
                        ? "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700"
                        : "bg-gray-900 text-gray-300 border-gray-700 hover:bg-gray-800"
                    }`}
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

              {/* Two-column layout — the whole row sticks just below the navbar and is capped
                  to roughly the remaining viewport height; each column scrolls independently
                  within that height so the left list and right review panel stay visible at
                  the same time, no matter how long either one's content is. */}
              <div className="flex flex-col lg:flex-row gap-5 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
                {/* LEFT: master list */}
                <div className="w-full lg:w-[36%] shrink-0 lg:h-full lg:min-h-0 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900/40 p-3 flex flex-col gap-3">
                  {activePaperNode.topics.map((topNode, tIndex) => {
                    const isExpanded = expandedTopicKeys.has(topNode._key);
                    const stats = computeTopicStats(topNode, selections, includedQuestions);
                    return (
                      <div key={topNode._key} className="flex flex-col gap-2">
                        <TopicGroupHeader
                          topicNode={topNode}
                          tIndex={tIndex}
                          totalTopics={activePaperNode.topics.length}
                          stats={stats}
                          variant="list"
                          isExpanded={isExpanded}
                          onToggleExpand={() => toggleTopicExpanded(topNode._key)}
                          isSelected={selectedTopicKey === topNode._key}
                          onSelect={() => selectTopic(topNode._key)}
                          isEditing={editingTopicKey === topNode._key}
                          editingValue={editingTopicValue}
                          onEditChange={setEditingTopicValue}
                          onEditStart={() => {
                            setEditingTopicKey(topNode._key);
                            setEditingTopicValue(topNode.title);
                          }}
                          onEditCommit={() => saveTopicNameV2(topNode._key)}
                          onEditCancel={() => setEditingTopicKey(null)}
                          onMoveUp={() => moveTopic(tIndex, -1)}
                          onMoveDown={() => moveTopic(tIndex, 1)}
                          dragHandlers={topicDragHandlers(topNode._key)}
                          isDragOver={dragOverTopicKey === topNode._key}
                          isDragging={draggedTopicKey === topNode._key}
                        />
                        {isExpanded && (
                          <div className="flex flex-col gap-1 pl-2">
                            {topNode.questions.map((q) => (
                              <MasterListRow
                                key={q._id}
                                q={q}
                                isIncluded={includedQuestions.has(q._id)}
                                selectedCount={(selections[q._id] || []).length}
                                isPulsing={pulsingQuestionIds.has(q._id)}
                                onRowClick={() => {
                                  selectTopic(topNode._key);
                                  setScrollToQuestionId(q._id);
                                  triggerPulse(q._id);
                                }}
                                onToggleInclude={() => toggleIncludeQuestionV2(tIndex, q._id)}
                                dragHandlers={questionDragHandlers(tIndex, topNode._key, q._id)}
                                isDragOver={dragOverQuestion?.qId === q._id}
                                isDragging={draggedQuestion?.qId === q._id}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* RIGHT: review panel — only the topic selected on the left */}
                <div className="flex-1 min-w-0 lg:h-full lg:min-h-0 overflow-y-auto flex flex-col gap-4">
                  {selectedTopic ? (
                    (() => {
                      const tIndex = activePaperNode.topics.findIndex((t) => t._key === selectedTopic._key);
                      const stats = computeTopicStats(selectedTopic, selections, includedQuestions);
                      return (
                        <div className="bg-gray-800/20 border border-gray-800/80 rounded-2xl overflow-hidden shadow-inner shrink-0">
                          <TopicGroupHeader
                            topicNode={selectedTopic}
                            tIndex={tIndex}
                            totalTopics={activePaperNode.topics.length}
                            stats={stats}
                            variant="review"
                            isEditing={editingTopicKey === selectedTopic._key}
                            editingValue={editingTopicValue}
                            onEditChange={setEditingTopicValue}
                            onEditStart={() => {
                              setEditingTopicKey(selectedTopic._key);
                              setEditingTopicValue(selectedTopic.title);
                            }}
                            onEditCommit={() => saveTopicNameV2(selectedTopic._key)}
                            onEditCancel={() => setEditingTopicKey(null)}
                          />
                          <div className="p-6 space-y-4 bg-gray-900/10">
                            {selectedTopic.questions.map((q, qIndex) => (
                              <ReviewQuestionRow
                                key={q._id}
                                q={q}
                                qIndex={qIndex}
                                isIncluded={includedQuestions.has(q._id)}
                                isPulsing={pulsingQuestionIds.has(q._id)}
                                selections={selections}
                                onToggleInclude={() => toggleIncludeQuestionV2(tIndex, q._id)}
                                onSelectionChange={handleSelectionChangeV2}
                                editingTopperKey={editingTopperKey}
                                editingTopperValues={editingTopperValues}
                                onTopperEditStart={(fileObj) => {
                                  setEditingTopperKey(fileObj.url);
                                  setEditingTopperValues({
                                    topper_name: fileObj.topper_name || "",
                                    topper_year: fileObj.topper_year || "",
                                    topper_rank: fileObj.topper_rank || "",
                                    topper_marks: fileObj.topper_marks || "",
                                  });
                                }}
                                onTopperEditChange={(field, value) =>
                                  setEditingTopperValues((p) => ({ ...p, [field]: value }))
                                }
                                onTopperEditSave={saveTopperDetailsV2}
                                onTopperEditCancel={() => setEditingTopperKey(null)}
                                isEditingQuestion={editingQuestionId === q._id}
                                editingQuestionValue={editingQuestionValue}
                                onQuestionEditStart={() => {
                                  setEditingQuestionId(q._id);
                                  setEditingQuestionValue(q.question_text);
                                }}
                                onQuestionEditChange={setEditingQuestionValue}
                                onQuestionEditSave={saveQuestionTextV2}
                                onQuestionEditCancel={() => setEditingQuestionId(null)}
                                getPreviewUrl={getPreviewUrl}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-gray-900/30 border border-gray-800 rounded-2xl">
                      <BookOpen className="w-10 h-10 text-gray-600" />
                      <p className="text-gray-500 text-sm font-semibold">
                        Select a topic on the left to start reviewing its questions.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status bar */}
              <div className="bg-gray-850 p-4 border border-gray-800 rounded-xl text-center text-xs text-gray-400">
                You have selected <strong className="text-white">{selectedActiveQuestions}</strong> out
                of <strong className="text-white">{totalActiveQuestions}</strong> questions in{" "}
                <strong className="text-indigo-400">{activePaper}</strong>.
              </div>
            </div>
          )}
        </div>
      )}

      <MilestoneToast toast={activeToast} onDismiss={() => setActiveToast(null)} />

      {/* Compiled PDF Preview Modal */}
      {showPreviewModal && pdfBlobUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-gray-900 shadow-2xl w-full h-full max-w-full max-h-screen flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-0.5">{activePaper} PDF Preview</h2>
                <p className="text-xs text-gray-400">Review layout & page organization before exporting</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer"
              >
                Back to Editing
              </button>
            </div>
            <div className="flex-1 bg-gray-950 p-2 overflow-hidden flex items-center justify-center">
              <iframe src={pdfBlobUrl} className="w-full h-full rounded-lg border border-gray-800" title="PSIR PDF Preview" />
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-900/90 flex justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 rounded-lg text-xs font-black text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={downloadFinalPdf}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer animate-pulse"
              >
                <Download className="w-4 h-4" /> Download PDF Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Progress Modal */}
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
              We have offloaded PDF compilation to GitHub Actions. This prevents server timeouts and
              ensures high performance.
            </p>
            <div className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 flex flex-col gap-3.5 mb-6 text-left">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${generationStatus === "pending" ? "bg-amber-500 animate-pulse" : "bg-green-500"}`}
                />
                <span className={`text-xs font-bold ${generationStatus === "pending" ? "text-white" : "text-gray-400"}`}>
                  1. Queueing job in GitHub Actions
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${generationStatus === "processing" ? "bg-indigo-500 animate-pulse" : generationStatus === "completed" ? "bg-green-500" : "bg-gray-800"}`}
                />
                <span
                  className={`text-xs font-bold ${generationStatus === "processing" ? "text-white" : generationStatus === "completed" ? "text-gray-400" : "text-gray-600"}`}
                >
                  2. Downloading & merging topper sheets
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${generationStatus === "completed" ? "bg-green-500 animate-pulse" : "bg-gray-800"}`}
                />
                <span className={`text-xs font-bold ${generationStatus === "completed" ? "text-white" : "text-gray-600"}`}>
                  3. Uploading completed book
                </span>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
              Status:{" "}
              <span
                className={
                  generationStatus === "failed"
                    ? "text-red-500"
                    : generationStatus === "completed"
                      ? "text-green-500"
                      : "text-indigo-400"
                }
              >
                {generationStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
