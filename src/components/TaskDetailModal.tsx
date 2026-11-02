"use client";

import React, { useState, useEffect } from "react";
import { Task, Space } from "@/types";
import { getSpaceColor, formatDate, getUserAvatarStyle, getUserHighlightStyle } from "@/lib/colors";
import { TASK_CATEGORIES, getCategory } from "@/lib/categories";
import {
  TimeUnit,
  TIME_UNIT_OPTIONS,
  parseLeadTimeToUnit,
  calculateTotalDays,
  formatLeadDurationLong,
} from "@/lib/time";
import { X, Clock, Send, Trash2, Check, Tag, Sparkles } from "lucide-react";

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
  return <TaskDetailModalContent key={props.task.id} {...props} task={props.task} />;
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
  const initialLead = parseLeadTimeToUnit(task.lead_time_days ?? 0);
  const [leadTimeValue, setLeadTimeValue] = useState<string | number>(initialLead.value);
  const [leadTimeUnit, setLeadTimeUnit] = useState<TimeUnit>(initialLead.unit);

  useEffect(() => {
    const p = parseLeadTimeToUnit(task.lead_time_days ?? 0);
    setLeadTimeValue(p.value);
    setLeadTimeUnit(p.unit);
  }, [task.lead_time_days]);

  const [status, setStatus] = useState<"todo" | "in_progress" | "completed">(task.status);
  const [category, setCategory] = useState<string | null>(task.category || null);
  const categoryObj = getCategory(category);
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

  const totalLeadDays = calculateTotalDays(leadTimeValue, leadTimeUnit);

  // Calculate estimated start date
  let calculatedStartDate: Date | null = null;
  if (deadline && totalLeadDays > 0) {
    const d = new Date(deadline);
    calculatedStartDate = new Date(d.getTime() - totalLeadDays * 24 * 60 * 60 * 1000);
  }

  const handleSaveFields = async (overrideLeadTime?: number | unknown, overrideCategory?: string | null) => {
    const finalLeadTime = typeof overrideLeadTime === "number"
      ? overrideLeadTime
      : calculateTotalDays(leadTimeValue, leadTimeUnit);
    const finalCategory = overrideCategory !== undefined ? overrideCategory : category;

    setIsSaving(true);
    try {
      await onUpdateTask({
        title,
        description,
        category: finalCategory,
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
    const trimmed = typeof leadTimeValue === "string" ? leadTimeValue.trim() : "";
    let finalNum = 0;
    if (typeof leadTimeValue === "number") {
      finalNum = Math.max(0, leadTimeValue);
    } else if (trimmed !== "" && !isNaN(Number(trimmed))) {
      finalNum = Math.max(0, parseInt(trimmed, 10));
    } else {
      finalNum = 0;
    }
    setLeadTimeValue(finalNum);
    const calculatedDays = calculateTotalDays(finalNum, leadTimeUnit);
    handleSaveFields(calculatedDays);
  };

  const handleUnitChange = (newUnit: TimeUnit) => {
    setLeadTimeUnit(newUnit);
    const calculatedDays = calculateTotalDays(leadTimeValue, newUnit);
    handleSaveFields(calculatedDays);
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
            {categoryObj && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryObj.badgeBg} ${categoryObj.badgeText} ${categoryObj.badgeBorder} truncate`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${categoryObj.dotBg}`} />
                <span>{categoryObj.label}</span>
              </span>
            )}
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

          {/* Category Selector with Prompt Reminders */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#171923]" />
                <span>Category</span>
              </label>
              {category && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory(null);
                    handleSaveFields(undefined, null);
                  }}
                  className="text-[11px] font-semibold text-[#777783] hover:text-[#FF705B] transition-colors cursor-pointer"
                >
                  Clear category
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {TASK_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const next = isSelected ? null : cat.id;
                      setCategory(next);
                      handleSaveFields(undefined, next);
                    }}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#171923] text-white border-[#171923] shadow-xs"
                        : "bg-[#FFFFFF] text-[#171923] border-[#D8D7DE] hover:bg-[#F4F3F5] hover:border-[#B78AF2]"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : cat.dotBg}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Grayed-out prompt reminders for active category */}
            {categoryObj && (
              <div className="p-2.5 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/80 text-[#777783] space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#171923]">
                  <Sparkles className="w-3.5 h-3.5 text-[#B78AF2] shrink-0" />
                  <span>Checklist & estimated time reminders:</span>
                </div>
                <p className="text-[11px] text-[#777783] leading-relaxed italic">
                  {categoryObj.reminderPrompt}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {categoryObj.hints.map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => {
                        const newDesc = description ? `${description}\n• ${hint}` : `• ${hint}`;
                        setDescription(newDesc);
                        onUpdateTask({ description: newDesc });
                      }}
                      title="Click to add to notes"
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D8D7DE] text-[#777783] hover:text-[#171923] hover:border-[#171923] transition-colors cursor-pointer"
                    >
                      + {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

          {/* Timeline & Estimated Time Needed */}
          <div className="p-3.5 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#171923]" />
              <h4 className="text-[12px] font-semibold text-[#171923]">
                Timeline & Estimated Time
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
                  Estimated Time Needed
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={leadTimeValue}
                    onChange={(e) => setLeadTimeValue(e.target.value)}
                    onBlur={handleLeadTimeBlur}
                    placeholder="0"
                    className="w-24 text-xs px-2.5 py-1.5 rounded-[8px] bg-white border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
                  />
                  <select
                    value={leadTimeUnit}
                    onChange={(e) => handleUnitChange(e.target.value as TimeUnit)}
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-[8px] bg-white border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px] font-medium cursor-pointer"
                  >
                    {TIME_UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-[#777783] mt-1 block">
                  How much lead time needed to start before deadline
                </span>
              </div>
            </div>

            {calculatedStartDate && (
              <div className={`p-2.5 rounded-[8px] bg-white border ${userHighlight.border} text-[11px] text-[#171923] leading-relaxed`}>
                <span className={`font-semibold ${userHighlight.textDark}`}>Calculated start date: </span>
                Begin work by <strong className={`font-semibold ${userHighlight.textDark}`}>{formatDate(calculatedStartDate.toISOString())}</strong> ({formatLeadDurationLong(totalLeadDays)} ahead of <span className="underline">{formatDate(deadline)}</span>).
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
