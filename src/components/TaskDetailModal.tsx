"use client";

import React, { useState } from "react";
import { Task, Space } from "@/types";
import { getSpaceColor, formatDate, getUserAvatarStyle, getUserHighlightStyle } from "@/lib/colors";
import { X, Clock, Send, Trash2, Check } from "lucide-react";

interface TaskDetailModalProps {
  task: Task | null;
  spaces?: Space[];
  currentUser?: string;
  currentUsername?: string;
  userColor?: string;
  onClose: () => void;
  onUpdateTask: (updatedFields: Partial<Task>) => Promise<void>;
  onAddNote: (content: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskDetailModal(props: TaskDetailModalProps) {
  if (!props.task) return null;
  return <TaskDetailModalContent {...props} task={props.task} />;
}

interface TaskDetailModalContentProps extends Omit<TaskDetailModalProps, "task"> {
  task: Task;
}

function TaskDetailModalContent({
  task,
  currentUsername,
  userColor,
  onClose,
  onUpdateTask,
  onAddNote,
  onDeleteTask,
}: TaskDetailModalContentProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [deadline, setDeadline] = useState(task.deadline ? task.deadline.slice(0, 10) : "");
  const [leadTimeDays, setLeadTimeDays] = useState<string | number>(task.lead_time_days ?? 0);
  const [status, setStatus] = useState<"todo" | "in_progress" | "completed">(task.status);
  const [spaceId] = useState(task.space_id);
  const [noteInput, setNoteInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const spaceStyle = getSpaceColor(task.space_color);
  const activeAvatarStyle = getUserAvatarStyle(userColor || "purple");
  const userHighlight = getUserHighlightStyle(userColor);

  // Collect tags strictly from people tagged in the comments / notes
  const noteTagsMap = new Map<string, string>();
  if (task.notes) {
    for (const n of task.notes) {
      if (n.tagged_users && Array.isArray(n.tagged_users)) {
        for (const t of n.tagged_users) {
          if (typeof t === "string" && t.trim()) {
            const normalized = t.startsWith("@") ? t : `@${t}`;
            noteTagsMap.set(normalized.toLowerCase(), normalized);
          }
        }
      }
      const matches = n.content?.match(/@[a-zA-Z0-9_-]+/g);
      if (matches) {
        for (const m of matches) {
          noteTagsMap.set(m.toLowerCase(), m);
        }
      }
    }
  }

  const availableTags = Array.from(noteTagsMap.values());

  // Filter notes based on active tag filter
  const filteredNotes = task.notes ? task.notes.filter((note) => {
    if (!selectedTag) return true;
    const targetTag = selectedTag.toLowerCase();
    const cleanTarget = targetTag.replace(/^@/, "");

    if (note.tagged_users && Array.isArray(note.tagged_users)) {
      if (note.tagged_users.some((t) => {
        if (typeof t !== "string") return false;
        const cleanT = t.toLowerCase().replace(/^@/, "");
        return cleanT === cleanTarget;
      })) {
        return true;
      }
    }

    if (note.content) {
      const lower = note.content.toLowerCase();
      if (lower.includes(`@${cleanTarget}`) || lower.includes(targetTag)) {
        return true;
      }
    }

    return false;
  }) : [];

  const leadTimeNum = leadTimeDays === "" ? 0 : Number(leadTimeDays) || 0;

  // Calculate estimated start date
  let calculatedStartDate: Date | null = null;
  if (deadline && leadTimeNum > 0) {
    const d = new Date(deadline);
    calculatedStartDate = new Date(d.getTime() - leadTimeNum * 24 * 60 * 60 * 1000);
  }

  const handleSaveFields = async (overrideLeadTime?: number | unknown) => {
    const finalLeadTime = typeof overrideLeadTime === "number"
      ? overrideLeadTime
      : (leadTimeDays === "" ? 0 : Number(leadTimeDays) || 0);

    setIsSaving(true);
    try {
      await onUpdateTask({
        title,
        description,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        lead_time_days: finalLeadTime,
        status,
        space_id: spaceId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeadTimeBlur = () => {
    const trimmed = typeof leadTimeDays === "string" ? leadTimeDays.trim() : "";
    let finalNum = 0;
    if (typeof leadTimeDays === "number") {
      finalNum = Math.max(0, leadTimeDays);
    } else if (trimmed !== "" && !isNaN(Number(trimmed))) {
      finalNum = Math.max(0, parseInt(trimmed, 10));
    } else {
      finalNum = 0; // if no number is put in, set it at 0
    }
    setLeadTimeDays(finalNum);
    handleSaveFields(finalNum);
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setIsSubmittingNote(true);
    try {
      await onAddNote(noteInput);
      setNoteInput("");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171923]/50 backdrop-blur-xs transition-all overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#FFFFFF] rounded-[18px] max-h-[82vh] flex flex-col shadow-2xl border border-[#D8D7DE] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with high-visibility Close Button */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] flex items-center justify-between px-5 py-3 border-b border-[#D8D7DE] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
            >
              {task.space_name}
            </span>
            <span className="text-[12px] text-[#777783] truncate">
              by <strong className="text-[#171923] font-medium">{task.created_by}</strong>
            </span>
            {isSaving && (
              <span className="text-[11px] text-[#777783] italic ml-1">
                Saving...
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status Segmented Control */}
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1.5 block">
              Status
            </label>
            <div className="grid grid-cols-3 p-1 bg-[#F4F3F5] rounded-[10px] gap-1">
              {(["todo", "in_progress", "completed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    onUpdateTask({ status: s });
                  }}
                  className={`min-h-[34px] px-2 py-1 rounded-[8px] text-[12px] font-medium capitalize transition-all flex items-center justify-center gap-1 ${
                    status === s
                      ? "bg-white text-[#171923] font-semibold shadow-xs"
                      : "text-[#777783] hover:text-[#171923]"
                  }`}
                >
                  {status === s && <Check className="w-3 h-3" />}
                  <span>{s === "in_progress" ? "In progress" : s === "todo" ? "To do" : "Done"}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveFields}
                className="w-full text-[15px] font-semibold px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
                Context & Notes
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveFields}
                placeholder="Add instructions, links, or details..."
                className="w-full min-h-[100px] text-xs px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] placeholder:text-[#777783] resize-y"
              />
            </div>
          </div>

          {/* Timeline & Prep Time */}
          <div className="p-3.5 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#171923]" />
              <h4 className="text-[12px] font-semibold text-[#171923]">
                Timeline & Prep Time
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#777783] font-medium block mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  onBlur={() => handleSaveFields()}
                  className="w-full text-xs px-2.5 py-1.5 rounded-[8px] bg-white border border-[#D8D7DE] focus:outline-none text-[#171923] min-h-[38px]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#777783] font-medium block mb-1">
                  Prep Time (Days)
                </label>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value)}
                    onBlur={handleLeadTimeBlur}
                    placeholder="0"
                    className="flex-1 min-w-[70px] text-xs px-2.5 py-1.5 rounded-[8px] bg-white border border-[#D8D7DE] focus:outline-none text-[#171923] min-h-[38px]"
                  />
                  <span className="text-[11px] text-[#777783] shrink-0 font-medium px-2 py-1 rounded-[6px] bg-white border border-[#D8D7DE]">
                    {leadTimeNum >= 7 ? `≈ ${(leadTimeNum / 7).toFixed(1)}w` : `${leadTimeNum}d`}
                  </span>
                </div>
              </div>
            </div>

            {calculatedStartDate && (
              <div className={`p-2.5 rounded-[8px] bg-white border ${userHighlight.border} text-[11px] text-[#171923] leading-relaxed`}>
                <span className={`font-semibold ${userHighlight.textDark}`}>Start window: </span>
                Begin work by <strong className={`font-semibold ${userHighlight.textDark}`}>{formatDate(calculatedStartDate.toISOString())}</strong> to finish before <span className="underline">{formatDate(deadline)}</span>.
              </div>
            )}
          </div>

          {/* Social Notes Stream */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
                Notes & Mentions ({filteredNotes.length}{selectedTag ? ` of ${task.notes?.length || 0}` : ""})
              </label>
              {availableTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#777783] font-medium mr-0.5">Filter:</span>
                  {selectedTag && (
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBE9ED] hover:bg-[#D8D7DE] text-[#171923] transition-colors cursor-pointer"
                    >
                      All
                    </button>
                  )}
                  {availableTags.map((tag) => {
                    const isSelected = selectedTag?.toLowerCase() === tag.toLowerCase();
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          // Toggles filter by tag; strictly does NOT insert mention into note input
                          setSelectedTag(isSelected ? null : tag);
                        }}
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? `${activeAvatarStyle.bg} ${activeAvatarStyle.text} shadow-xs ring-2 ring-offset-1 ring-[#171923]/20 font-bold`
                            : "bg-[#F4F3F5] hover:bg-[#D8D7DE] text-[#171923] border border-transparent"
                        }`}
                        title={isSelected ? `Filtering by ${tag}. Click to clear.` : `Filter notes mentioning ${tag}`}
                      >
                        <span>{tag}</span>
                        {isSelected && <span className="text-[9px] opacity-80">✕</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes List */}
            <div className="space-y-1.5 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-[8px] bg-[#F4F3F5] text-[11px] space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[#777783]">
                      <span className="font-semibold text-[#171923]">
                        {note.author}
                      </span>
                      <span className="text-[10px]">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[#171923] leading-relaxed">
                      {note.content.split(" ").map((word, idx) => {
                        if (word.startsWith("@")) {
                          const isMatched = selectedTag && word.toLowerCase().includes(selectedTag.toLowerCase());
                          return (
                            <span
                              key={idx}
                              className={`font-semibold px-1 py-0.2 rounded ${
                                isMatched
                                  ? `${activeAvatarStyle.bg} ${activeAvatarStyle.text} font-bold`
                                  : "text-[#6B21A8] bg-[#E5D4F9]/60"
                              }`}
                            >
                              {word}{" "}
                            </span>
                          );
                        }
                        return word + " ";
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-[11px] text-[#777783] italic space-y-1">
                  {selectedTag ? (
                    <div>
                      <p>No notes mentioning <strong>{selectedTag}</strong>.</p>
                      <button
                        type="button"
                        onClick={() => setSelectedTag(null)}
                        className="text-xs font-semibold text-[#171923] underline cursor-pointer mt-1 block mx-auto"
                      >
                        Clear filter & show all notes
                      </button>
                    </div>
                  ) : (
                    <p>No notes yet. Add context or tag someone below.</p>
                  )}
                </div>
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleSendNote} className="flex gap-2 pt-1">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Write a note... @name"
                className="flex-1 text-xs px-3 py-2 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923]"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !noteInput.trim()}
                className="px-3 py-2 rounded-[8px] bg-[#171923] text-white font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#2D313E] disabled:opacity-50 transition-all shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#FFFFFF] border-t border-[#D8D7DE] shrink-0">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this task?")) {
                onDeleteTask(task.id);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-[#FF705B] hover:text-[#C2410C] font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-[10px] text-xs font-semibold bg-[#171923] text-white hover:bg-[#2D313E] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
