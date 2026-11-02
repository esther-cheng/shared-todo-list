"use client";

import React, { useState, useEffect, useRef } from "react";
import { Space } from "@/types";
import { formatDate, getUserHighlightStyle, getSpaceColor } from "@/lib/colors";
import { TASK_CATEGORIES, getCategory } from "@/lib/categories";
import {
  TimeUnit,
  TIME_UNIT_OPTIONS,
  parseLeadTimeToUnit,
  calculateTotalDays,
  formatLeadDurationLong,
} from "@/lib/time";
import { X, Clock, Calendar, Plus, ChevronDown, Check, Loader2, Tag, Sparkles } from "lucide-react";

interface CreateTaskModalProps {
  spaces: Space[];
  currentUser: string;
  userColor?: string;
  defaultSpaceId?: string;
  onClose: () => void;
  onCreateTask: (data: {
    title: string;
    description: string;
    space_id: string;
    category?: string | null;
    deadline: string | null;
    lead_time_days: number;
    created_by: string;
  }) => Promise<void>;
  onCreateSpace?: (name: string) => Promise<Space>;
}

export function CreateTaskModal({
  spaces,
  currentUser,
  userColor,
  defaultSpaceId,
  onClose,
  onCreateTask,
  onCreateSpace,
}: CreateTaskModalProps) {
  const userHighlight = getUserHighlightStyle(userColor);
  const [draftLoaded] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(`tandem_task_draft_${currentUser || "default"}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [availableSpaces, setAvailableSpaces] = useState<Space[]>(spaces);

  useEffect(() => {
    setAvailableSpaces(spaces);
  }, [spaces]);

  const [title, setTitle] = useState<string>(() => draftLoaded?.title || "");
  const [description, setDescription] = useState<string>(() => draftLoaded?.description || "");
  const [category, setCategory] = useState<string>(() => draftLoaded?.category || "shopping");
  const selectedCategoryObj = getCategory(category);
  const [spaceId, setSpaceId] = useState(() => {
    if (draftLoaded?.spaceId && spaces.some((s) => s.id === draftLoaded.spaceId)) {
      return draftLoaded.spaceId;
    }
    return defaultSpaceId || spaces[0]?.id || "";
  });

  const selectedSpace = availableSpaces.find((s) => s.id === spaceId);
  const selectedSpaceColor = selectedSpace ? getSpaceColor(selectedSpace.color) : getSpaceColor("purple");

  const [spaceSearchQuery, setSpaceSearchQuery] = useState(() => selectedSpace?.name || "");
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const spaceContainerRef = useRef<HTMLDivElement>(null);

  // Sync spaceSearchQuery when selectedSpace changes
  useEffect(() => {
    if (selectedSpace) {
      setSpaceSearchQuery(selectedSpace.name);
    }
  }, [selectedSpace]);

  // Handle outside click to close dropdown and restore search query if incomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (spaceContainerRef.current && !spaceContainerRef.current.contains(e.target as Node)) {
        setIsSpaceDropdownOpen(false);
        if (selectedSpace) {
          setSpaceSearchQuery(selectedSpace.name);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedSpace]);

  const cleanQuery = spaceSearchQuery.trim();
  const filteredSpaces = availableSpaces.filter((s) =>
    s.name.toLowerCase().includes(cleanQuery.toLowerCase())
  );
  const exactMatchExists = availableSpaces.some(
    (s) => s.name.toLowerCase() === cleanQuery.toLowerCase()
  );
  const canCreateOption = cleanQuery.length > 0 && !exactMatchExists;

  const handleCreateInlineSpace = async (newSpaceName: string) => {
    if (!newSpaceName.trim() || isCreatingSpace) return;
    setIsCreatingSpace(true);
    try {
      let createdSpace: Space;
      if (onCreateSpace) {
        createdSpace = await onCreateSpace(newSpaceName.trim());
      } else {
        const res = await fetch("/api/spaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newSpaceName.trim(), color: "purple", icon: "folder" }),
        });
        const data = await res.json();
        if (!res.ok || !data.space) {
          throw new Error(data.error || "Failed to create space");
        }
        createdSpace = data.space;
      }

      setAvailableSpaces((prev) => {
        if (prev.some((s) => s.id === createdSpace.id)) return prev;
        return [...prev, createdSpace];
      });
      setSpaceId(createdSpace.id);
      setSpaceSearchQuery(createdSpace.name);
      setIsSpaceDropdownOpen(false);
    } catch (err) {
      console.error("Failed to create inline space:", err);
    } finally {
      setIsCreatingSpace(false);
    }
  };
  const [deadline, setDeadline] = useState(() => draftLoaded?.deadline || "");

  const initialLead = draftLoaded?.leadTimeUnit
    ? { value: draftLoaded.leadTimeValue ?? 0, unit: (draftLoaded.leadTimeUnit as TimeUnit) || "days" }
    : parseLeadTimeToUnit(draftLoaded?.leadTimeDays ?? 0);

  const [leadTimeValue, setLeadTimeValue] = useState<string | number>(() => initialLead.value);
  const [leadTimeUnit, setLeadTimeUnit] = useState<TimeUnit>(() => initialLead.unit);

  const totalLeadDays = calculateTotalDays(leadTimeValue, leadTimeUnit);

  const [hasRestoredDraft, setHasRestoredDraft] = useState(() => Boolean(
    draftLoaded?.title ||
    draftLoaded?.description ||
    draftLoaded?.deadline ||
    (draftLoaded?.leadTimeDays && draftLoaded.leadTimeDays > 0) ||
    (draftLoaded?.leadTimeValue && Number(draftLoaded.leadTimeValue) > 0)
  ));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync draft to localStorage on any field change
  useEffect(() => {
    const key = `tandem_task_draft_${currentUser || "default"}`;
    const hasContent = Boolean(
      title.trim() || description.trim() || deadline || totalLeadDays > 0 || category
    );

    try {
      if (hasContent) {
        localStorage.setItem(
          key,
          JSON.stringify({
            title,
            description,
            spaceId,
            category,
            deadline,
            leadTimeValue,
            leadTimeUnit,
            leadTimeDays: totalLeadDays,
          })
        );
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error("Failed to sync task draft:", e);
    }
  }, [title, description, spaceId, category, deadline, leadTimeValue, leadTimeUnit, totalLeadDays, currentUser]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(`tandem_task_draft_${currentUser || "default"}`);
    } catch (e) {
      console.error("Failed to clear draft:", e);
    }
    setTitle("");
    setDescription("");
    setCategory("shopping");
    setDeadline("");
    setLeadTimeValue(0);
    setLeadTimeUnit("days");
    setSpaceId(defaultSpaceId || spaces[0]?.id || "");
    setHasRestoredDraft(false);
  };

  let calculatedReminderDate: Date | null = null;
  if (deadline && totalLeadDays > 0) {
    const d = new Date(deadline);
    calculatedReminderDate = new Date(d.getTime() - totalLeadDays * 24 * 60 * 60 * 1000);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !spaceId) return;

    setIsSubmitting(true);
    try {
      await onCreateTask({
        title,
        description,
        space_id: spaceId,
        category: category || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        lead_time_days: totalLeadDays,
        created_by: currentUser,
      });
      try {
        localStorage.removeItem(`tandem_task_draft_${currentUser || "default"}`);
      } catch (e) {
        console.error("Failed to remove draft after submission:", e);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171923]/50 backdrop-blur-xs transition-all overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#FFFFFF] rounded-[18px] max-h-[82vh] flex flex-col shadow-2xl border border-[#D8D7DE] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with high-visibility Close Button */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] flex items-center justify-between px-5 py-3 border-b border-[#D8D7DE] shrink-0">
          <div>
            <h3 className="font-semibold text-[15px] text-[#171923]">
              New task
            </h3>
            <p className="text-[11px] text-[#777783]">
              Shared with group members
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Unsaved draft restored banner */}
        {hasRestoredDraft && (
          <div className={`mx-4 sm:mx-5 mt-3.5 px-3.5 py-2 rounded-[10px] ${userHighlight.bgLight} ${userHighlight.textDark} text-[11px] font-medium border ${userHighlight.border} flex items-center justify-between shrink-0`}>
            <span>Restored your unsaved draft</span>
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-[#171923] underline font-semibold hover:opacity-80 ml-2 cursor-pointer"
            >
              Discard draft
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* Space / Group Selector with Inline Create */}
          <div className="relative" ref={spaceContainerRef}>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Group
            </label>
            <div className="relative flex items-center">
              {selectedSpace && (
                <span
                  className={`absolute left-3 w-2.5 h-2.5 rounded-full pointer-events-none ${
                    selectedSpaceColor.badgeBg || "bg-[#B78AF2]"
                  } border ${selectedSpaceColor.badgeBorder || "border-[#B78AF2]"}`}
                />
              )}
              <input
                type="text"
                value={spaceSearchQuery}
                onChange={(e) => {
                  setSpaceSearchQuery(e.target.value);
                  setIsSpaceDropdownOpen(true);
                }}
                onFocus={() => setIsSpaceDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (isSpaceDropdownOpen && canCreateOption) {
                      e.preventDefault();
                      handleCreateInlineSpace(cleanQuery);
                    } else if (isSpaceDropdownOpen && filteredSpaces.length > 0) {
                      e.preventDefault();
                      setSpaceId(filteredSpaces[0].id);
                      setSpaceSearchQuery(filteredSpaces[0].name);
                      setIsSpaceDropdownOpen(false);
                    }
                  } else if (e.key === "Escape") {
                    setIsSpaceDropdownOpen(false);
                    if (selectedSpace) setSpaceSearchQuery(selectedSpace.name);
                  }
                }}
                placeholder="Search or enter group name..."
                className={`w-full text-xs font-semibold ${
                  selectedSpace ? "pl-8" : "pl-3"
                } pr-8 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[40px]`}
              />
              <button
                type="button"
                onClick={() => setIsSpaceDropdownOpen((prev) => !prev)}
                className="absolute right-2 p-1 text-[#777783] hover:text-[#171923] cursor-pointer"
                tabIndex={-1}
                aria-label="Toggle group dropdown"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isSpaceDropdownOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Group Dropdown Popover */}
            {isSpaceDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] rounded-[14px] border border-[#D8D7DE] shadow-[0_10px_32px_rgba(23,25,35,0.12)] p-1.5 z-50 max-h-56 overflow-y-auto space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {filteredSpaces.map((s) => {
                  const sColor = getSpaceColor(s.color);
                  const isSelected = s.id === spaceId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSpaceId(s.id);
                        setSpaceSearchQuery(s.name);
                        setIsSpaceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-[8px] transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-[#F4F3F5] text-[#171923] font-bold"
                          : "text-[#171923] hover:bg-[#F4F3F5]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${sColor.badgeBg || "bg-[#B78AF2]"}`} />
                        <span className="truncate">{s.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#171923] shrink-0" />}
                    </button>
                  );
                })}

                {/* Inline creation option when typed name does not exist */}
                {canCreateOption && (
                  <button
                    type="button"
                    disabled={isCreatingSpace}
                    onClick={() => handleCreateInlineSpace(cleanQuery)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-[8px] bg-[#F4ECFC]/70 hover:bg-[#F4ECFC] text-[#171923] font-semibold transition-colors cursor-pointer group text-left border border-dashed border-[#B78AF2]/50"
                  >
                    {isCreatingSpace ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6B21A8] shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-[6px] bg-[#B78AF2]/20 text-[#6B21A8] flex items-center justify-center shrink-0">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    )}
                    <span className="truncate">
                      {cleanQuery}
                    </span>
                    <span className="ml-auto text-[10px] text-[#777783] group-hover:text-[#6B21A8] font-normal shrink-0">
                      Create group
                    </span>
                  </button>
                )}

                {filteredSpaces.length === 0 && !canCreateOption && (
                  <div className="p-3 text-center text-[#777783] text-[11px]">
                    No groups available. Type a name to create one.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Selector & Reminder Prompts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#171923]" />
                <span>Category</span>
              </label>
              {category && (
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  className="text-[11px] font-semibold text-[#777783] hover:text-[#FF705B] transition-colors cursor-pointer"
                >
                  Clear category
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {TASK_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(isSelected ? "" : cat.id)}
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

            {/* Grayed-out prompt reminders for the active category */}
            {selectedCategoryObj && (
              <div className="p-2.5 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/80 text-[#777783] space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#171923]">
                  <Sparkles className="w-3.5 h-3.5 text-[#B78AF2] shrink-0" />
                  <span>Checklist & estimated time reminders:</span>
                </div>
                <p className="text-[11px] text-[#777783] leading-relaxed italic">
                  {selectedCategoryObj.reminderPrompt}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedCategoryObj.hints.map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => {
                        setDescription((prev: string) => (prev ? `${prev}\n• ${hint}` : `• ${hint}`));
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

          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Renew passport or Mom birthday gift"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-[14px] px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[40px]"
            />
          </div>

          {/* Context / Notes */}
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Context & Notes
            </label>
            <textarea
              rows={4}
              placeholder="Instructions, links, or checklist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] text-xs px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] resize-y"
            />
          </div>

          {/* Target Deadline & Estimated Time Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#777783]" />
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#777783]" />
                Estimated Time Needed
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={leadTimeValue}
                  onChange={(e) => setLeadTimeValue(e.target.value)}
                  onBlur={() => {
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
                  }}
                  className="w-24 text-xs px-2.5 py-1.5 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
                />
                <select
                  value={leadTimeUnit}
                  onChange={(e) => setLeadTimeUnit(e.target.value as TimeUnit)}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px] font-medium cursor-pointer"
                >
                  {TIME_UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-[#777783] mt-1 block">
                How much lead time needed to start before the deadline
              </span>
            </div>
          </div>

          {/* Dynamic Calculated Start Date */}
          {calculatedReminderDate && (
            <div className={`p-2.5 rounded-[10px] ${userHighlight.bgLight} text-[11px] ${userHighlight.textDark} border ${userHighlight.border} leading-relaxed`}>
              <span className="font-semibold">Calculated start date: </span>
              Begin working by <strong className="font-semibold">{formatDate(calculatedReminderDate.toISOString())}</strong> ({formatLeadDurationLong(totalLeadDays)} ahead of deadline).
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#D8D7DE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-[10px] text-xs font-semibold text-white bg-[#171923] hover:bg-[#2D313E] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? "Posting..." : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
