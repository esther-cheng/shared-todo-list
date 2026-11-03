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
import { X, Clock, Send, Trash2, Check, Tag, Sparkles, Plus, Zap, ListChecks, FileText } from "lucide-react";
import { parseTaskDescription, serializeTaskDescription, ChecklistItem } from "@/lib/checklist";

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
  const initialParsed = parseTaskDescription(task.description);
  const [context, setContext] = useState(initialParsed.context);
  const [hasChecklist, setHasChecklist] = useState(initialParsed.hasChecklist);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialParsed.checklist);
  const [customChecklistInput, setCustomChecklistInput] = useState("");

  useEffect(() => {
    const p = parseTaskDescription(task.description);
    setContext(p.context);
    setChecklist(p.checklist);
    if (p.hasChecklist) {
      setHasChecklist(true);
    }
  }, [task.description]);
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
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

  useEffect(() => {
    setSelectedPresets([]);
  }, [category]);

  const handleTogglePreset = (preset: { label: string; value: number; unit: TimeUnit }) => {
    const isSelected = selectedPresets.includes(preset.label);
    const newPresets = isSelected
      ? selectedPresets.filter((lbl) => lbl !== preset.label)
      : [...selectedPresets, preset.label];

    setSelectedPresets(newPresets);

    if (newPresets.length === 0) {
      setLeadTimeValue(0);
      setLeadTimeUnit("days");
      handleSaveFields(0);
      return;
    }

    const presetsMap = new Map(categoryObj?.leadTimePresets.map((p) => [p.label, p]));
    const sumDays = newPresets.reduce((total, label) => {
      const p = presetsMap.get(label);
      return total + (p ? calculateTotalDays(p.value, p.unit) : 0);
    }, 0);

    const parsed = parseLeadTimeToUnit(sumDays);
    setLeadTimeValue(parsed.value);
    setLeadTimeUnit(parsed.unit);
    handleSaveFields(sumDays);
  };
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

  const handleSaveFields = async (
    overrideLeadTime?: number | unknown,
    overrideCategory?: string | null,
    overrideDescription?: string
  ) => {
    const finalLeadTime = typeof overrideLeadTime === "number"
      ? overrideLeadTime
      : calculateTotalDays(leadTimeValue, leadTimeUnit);
    const finalCategory = overrideCategory !== undefined ? overrideCategory : category;
    const finalDescription = overrideDescription !== undefined
      ? overrideDescription
      : serializeTaskDescription(context, checklist, hasChecklist);

    setIsSaving(true);
    try {
      await onUpdateTask({
        title,
        description: finalDescription,
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

  const handleToggleSuggestedHint = (hint: string) => {
    const isSelected = checklist.some(
      (item) => item.text.trim().toLowerCase() === hint.trim().toLowerCase()
    );
    let nextChecklist: ChecklistItem[];
    let nextHasChecklist = hasChecklist;

    if (isSelected) {
      // Unselect it! Remove from checklist
      nextChecklist = checklist.filter(
        (item) => item.text.trim().toLowerCase() !== hint.trim().toLowerCase()
      );
    } else {
      nextHasChecklist = true;
      setHasChecklist(true);
      nextChecklist = [
        ...checklist,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: hint.trim(),
          completed: false,
        },
      ];
    }
    setChecklist(nextChecklist);
    const serialized = serializeTaskDescription(context, nextChecklist, nextHasChecklist);
    handleSaveFields(undefined, undefined, serialized);
  };

  const handleToggleItemComplete = (id: string) => {
    const nextChecklist = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(nextChecklist);
    const serialized = serializeTaskDescription(context, nextChecklist, hasChecklist);
    handleSaveFields(undefined, undefined, serialized);
  };

  const handleAddCustomChecklistItem = () => {
    if (!customChecklistInput.trim()) return;
    const nextHasChecklist = true;
    setHasChecklist(true);
    const nextChecklist = [
      ...checklist,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: customChecklistInput.trim(),
        completed: false,
      },
    ];
    setChecklist(nextChecklist);
    setCustomChecklistInput("");
    const serialized = serializeTaskDescription(context, nextChecklist, nextHasChecklist);
    handleSaveFields(undefined, undefined, serialized);
  };

  const handleRemoveChecklistItem = (id: string) => {
    const nextChecklist = checklist.filter((item) => item.id !== id);
    setChecklist(nextChecklist);
    const serialized = serializeTaskDescription(context, nextChecklist, hasChecklist);
    handleSaveFields(undefined, undefined, serialized);
  };

  const handleRemoveChecklist = () => {
    setHasChecklist(false);
    setChecklist([]);
    const serialized = serializeTaskDescription(context, [], false);
    handleSaveFields(undefined, undefined, serialized);
  };

  const handleContextBlur = () => {
    const serialized = serializeTaskDescription(context, checklist, hasChecklist);
    handleSaveFields(undefined, undefined, serialized);
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

            {/* Contextual guidance banner for the active category */}
            {categoryObj && (
              <div className="px-3 py-2 rounded-[10px] bg-[#F4F3F5] border border-[#D8D7DE]/80 flex items-start gap-2 text-[11px] animate-in fade-in duration-150">
                <Sparkles className="w-3.5 h-3.5 text-[#B78AF2] shrink-0 mt-0.5" />
                <p className="text-[#171923] leading-relaxed">
                  <strong className="font-semibold text-[#171923]">Don&apos;t forget: </strong>
                  <span className="text-[#777783]">{categoryObj.reminderPrompt.replace(/^Remember:\s*/i, "")}</span>
                </p>
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

            {/* Context / Notes */}
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3 h-3 text-[#777783]" />
                <span>Context & Notes</span>
              </label>
              <textarea
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                onBlur={handleContextBlur}
                placeholder="Add extra details, instructions, or links..."
                className="w-full min-h-[76px] text-xs px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] placeholder:text-[#777783]/70 resize-y"
              />
            </div>

            {/* Checklist (Separate Section) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-[#171923]" />
                  <span>Checklist</span>
                  {hasChecklist && checklist.length > 0 && (
                    <span className="text-[10px] font-normal text-[#777783] lowercase">
                      ({checklist.filter((i) => i.completed).length}/{checklist.length} completed)
                    </span>
                  )}
                </label>

                {hasChecklist && (
                  <button
                    type="button"
                    onClick={handleRemoveChecklist}
                    className="text-[11px] font-semibold text-[#777783] hover:text-[#FF705B] transition-colors cursor-pointer"
                  >
                    Remove checklist
                  </button>
                )}
              </div>

              {!hasChecklist ? (
                <button
                  type="button"
                  onClick={() => {
                    setHasChecklist(true);
                    handleSaveFields(undefined, undefined, serializeTaskDescription(context, checklist, true));
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-[10px] border border-dashed border-[#D8D7DE] hover:border-[#B78AF2] bg-[#FFFFFF] hover:bg-[#F4F3F5] text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#F4F3F5] group-hover:bg-[#B78AF2]/20 text-[#777783] group-hover:text-[#6B21A8] flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#171923] block leading-tight">
                        Add a checklist
                      </span>
                      <span className="text-[10px] text-[#777783]">
                        Track sub-items and mark them off as you complete them
                      </span>
                    </div>
                  </div>
                  {categoryObj && categoryObj.hints.length > 0 && (
                    <span className="text-[10px] font-medium text-[#6B21A8] bg-[#F4ECFC] px-2 py-0.5 rounded-full shrink-0 border border-[#B78AF2]/30">
                      {categoryObj.hints.length} subtasks suggested
                    </span>
                  )}
                </button>
              ) : (
                <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE] space-y-2.5 animate-in fade-in duration-150">
                  {/* Category suggestions */}
                  {categoryObj && categoryObj.hints.length > 0 && (
                    <div className="space-y-1.5 pb-2 border-b border-[#D8D7DE]/70">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#171923]">
                          <Sparkles className="w-3 h-3 text-[#B78AF2]" />
                          <span>Suggested subtasks for {categoryObj.label}:</span>
                        </span>
                        <span className="text-[9px] text-[#777783]">Tap to toggle</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {categoryObj.hints.map((hint) => {
                          const isSelected = checklist.some(
                            (item) => item.text.trim().toLowerCase() === hint.trim().toLowerCase()
                          );
                          return (
                            <button
                              key={hint}
                              type="button"
                              onClick={() => handleToggleSuggestedHint(hint)}
                              title={isSelected ? "Click to unselect item" : "Click to select item"}
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#171923] text-white border-[#171923] shadow-2xs font-semibold"
                                  : "bg-[#FFFFFF] text-[#171923] border-[#D8D7DE] hover:border-[#B78AF2] hover:bg-[#FFFFFF]"
                              }`}
                            >
                              {isSelected ? (
                                <Check className="w-2.5 h-2.5 text-[#B78AF2] stroke-[2.5]" />
                              ) : (
                                <Plus className="w-2.5 h-2.5 text-[#777783]" />
                              )}
                              <span>{hint}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Checklist items list */}
                  {checklist.length > 0 ? (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE]/70 text-xs transition-colors"
                        >
                          <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => handleToggleItemComplete(item.id)}
                              className="rounded-[4px] border-[#D8D7DE] text-[#171923] focus:ring-[#B78AF2] w-3.5 h-3.5 cursor-pointer shrink-0"
                            />
                            <span
                              className={`truncate leading-tight ${
                                item.completed
                                  ? "line-through text-[#777783] decoration-[#777783]/60"
                                  : "text-[#171923]"
                              }`}
                            >
                              {item.text}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="text-[#777783] hover:text-[#FF705B] p-0.5 rounded-[4px] transition-colors cursor-pointer shrink-0"
                            title="Remove item"
                            aria-label={`Remove ${item.text}`}
                          >
                            <X className="w-3 h-3 stroke-[2.5]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-[11px] text-[#777783]">
                      No items in checklist yet. Pick from suggestions above or type one below.
                    </div>
                  )}

                  {/* Add custom item input */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={customChecklistInput}
                      onChange={(e) => setCustomChecklistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomChecklistItem();
                        }
                      }}
                      placeholder="Add custom checklist item..."
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[34px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomChecklistItem}
                      disabled={!customChecklistInput.trim()}
                      className="px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-[#171923] text-white hover:bg-[#2D313E] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer flex items-center gap-1 min-h-[34px]"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}
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
                    onChange={(e) => {
                      setLeadTimeValue(e.target.value);
                      setSelectedPresets([]);
                    }}
                    onBlur={handleLeadTimeBlur}
                    placeholder="0"
                    className="w-24 text-xs px-2.5 py-1.5 rounded-[8px] bg-white border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
                  />
                  <select
                    value={leadTimeUnit}
                    onChange={(e) => {
                      setSelectedPresets([]);
                      handleUnitChange(e.target.value as TimeUnit);
                    }}
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-[8px] bg-white border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px] font-medium cursor-pointer"
                  >
                    {TIME_UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additive Lead Time Presets */}
                {categoryObj?.leadTimePresets && categoryObj.leadTimePresets.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#777783]">
                        <Zap className="w-3 h-3 text-[#FF705B]" />
                        <span>Select buffers to add together:</span>
                      </span>
                      {selectedPresets.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPresets([]);
                            setLeadTimeValue(0);
                            setLeadTimeUnit("days");
                            handleSaveFields(0);
                          }}
                          className="text-[10px] text-[#777783] hover:text-[#171923] underline cursor-pointer"
                        >
                          Reset ({selectedPresets.length} selected)
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {categoryObj.leadTimePresets.map((preset) => {
                        const isSelected = selectedPresets.includes(preset.label);
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleTogglePreset(preset)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#171923] text-white border-[#171923] shadow-xs"
                                : "bg-[#FFFFFF] text-[#171923] border-[#D8D7DE] hover:border-[#B78AF2] hover:bg-[#F4F3F5]"
                            }`}
                            title={
                              isSelected
                                ? `Click to remove ${preset.value} ${preset.unit}`
                                : `Click to add +${preset.value} ${preset.unit} (${preset.label})`
                            }
                          >
                            {isSelected ? (
                              <Check className="w-2.5 h-2.5 text-[#B78AF2]" />
                            ) : (
                              <Plus className="w-2.5 h-2.5 text-[#777783]" />
                            )}
                            <span className="font-semibold">
                              {preset.value} {preset.unit === "days" ? "d" : preset.unit === "weeks" ? "w" : preset.unit === "months" ? "mo" : "y"}
                            </span>
                            <span className={isSelected ? "text-white/80" : "text-[#777783]"}>
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-[#777783] mt-1.5 block">
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
