"use client";

import React, { useState, useEffect } from "react";
import { Space } from "@/types";
import { formatDate, getUserHighlightStyle } from "@/lib/colors";
import { X, Clock, Calendar, Plus } from "lucide-react";

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
    deadline: string | null;
    lead_time_days: number;
    created_by: string;
  }) => Promise<void>;
}

export function CreateTaskModal({
  spaces,
  currentUser,
  userColor,
  defaultSpaceId,
  onClose,
  onCreateTask,
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

  const [title, setTitle] = useState(() => draftLoaded?.title || "");
  const [description, setDescription] = useState(() => draftLoaded?.description || "");
  const [spaceId, setSpaceId] = useState(() => {
    if (draftLoaded?.spaceId && spaces.some((s) => s.id === draftLoaded.spaceId)) {
      return draftLoaded.spaceId;
    }
    return defaultSpaceId || spaces[0]?.id || "";
  });
  const [deadline, setDeadline] = useState(() => draftLoaded?.deadline || "");
  const [leadTimeDays, setLeadTimeDays] = useState<string | number>(() => draftLoaded?.leadTimeDays ?? 0);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(() => Boolean(
    draftLoaded?.title || draftLoaded?.description || draftLoaded?.deadline || draftLoaded?.leadTimeDays
  ));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync draft to localStorage on any field change
  useEffect(() => {
    const key = `tandem_task_draft_${currentUser || "default"}`;
    const hasContent = Boolean(
      title.trim() || description.trim() || deadline || Number(leadTimeDays) > 0
    );

    try {
      if (hasContent) {
        localStorage.setItem(
          key,
          JSON.stringify({
            title,
            description,
            spaceId,
            deadline,
            leadTimeDays,
          })
        );
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error("Failed to sync task draft:", e);
    }
  }, [title, description, spaceId, deadline, leadTimeDays, currentUser]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(`tandem_task_draft_${currentUser || "default"}`);
    } catch (e) {
      console.error("Failed to clear draft:", e);
    }
    setTitle("");
    setDescription("");
    setDeadline("");
    setLeadTimeDays(0);
    setSpaceId(defaultSpaceId || spaces[0]?.id || "");
    setHasRestoredDraft(false);
  };

  const leadTimeNum = leadTimeDays === "" ? 0 : Number(leadTimeDays) || 0;

  let calculatedReminderDate: Date | null = null;
  if (deadline && leadTimeNum > 0) {
    const d = new Date(deadline);
    calculatedReminderDate = new Date(d.getTime() - leadTimeNum * 24 * 60 * 60 * 1000);
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
        deadline: deadline ? new Date(deadline).toISOString() : null,
        lead_time_days: leadTimeNum,
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
              Shared with space members
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
          {/* Space Selector */}
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Space
            </label>
            <select
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[40px]"
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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

          {/* Target Deadline & Prep Time */}
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
                Prep Time (Days)
              </label>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  onBlur={() => {
                    const trimmed = typeof leadTimeDays === "string" ? leadTimeDays.trim() : "";
                    let finalNum = 0;
                    if (typeof leadTimeDays === "number") {
                      finalNum = Math.max(0, leadTimeDays);
                    } else if (trimmed !== "" && !isNaN(Number(trimmed))) {
                      finalNum = Math.max(0, parseInt(trimmed, 10));
                    } else {
                      finalNum = 0;
                    }
                    setLeadTimeDays(finalNum);
                  }}
                  className="flex-1 min-w-[70px] text-xs px-2.5 py-1.5 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
                />
                <span className="text-[11px] text-[#777783] shrink-0 font-medium px-2 py-1 rounded-[6px] bg-[#F4F3F5] border border-[#D8D7DE]">
                  {leadTimeNum >= 7 ? `≈ ${(leadTimeNum / 7).toFixed(1)}w` : `${leadTimeNum}d`}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Reminder Alert */}
          {calculatedReminderDate && (
            <div className={`p-2.5 rounded-[10px] ${userHighlight.bgLight} text-[11px] ${userHighlight.textDark} border ${userHighlight.border} leading-relaxed`}>
              <span className="font-semibold">Start reminder: </span>
              Surfaces on <strong className="font-semibold">{formatDate(calculatedReminderDate.toISOString())}</strong>.
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
