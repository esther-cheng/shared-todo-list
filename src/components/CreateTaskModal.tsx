"use client";

import React, { useState } from "react";
import { Space } from "@/types";
import { formatDate } from "@/lib/colors";
import { X, Clock, Calendar, Plus } from "lucide-react";

interface CreateTaskModalProps {
  spaces: Space[];
  currentUser: string;
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
  defaultSpaceId,
  onClose,
  onCreateTask,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [spaceId, setSpaceId] = useState(defaultSpaceId || spaces[0]?.id || "");
  const [deadline, setDeadline] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  let calculatedReminderDate: Date | null = null;
  if (deadline && Number(leadTimeDays) > 0) {
    const d = new Date(deadline);
    calculatedReminderDate = new Date(d.getTime() - Number(leadTimeDays) * 24 * 60 * 60 * 1000);
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
        lead_time_days: Number(leadTimeDays),
        created_by: currentUser,
      });
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
              rows={2}
              placeholder="Instructions, links, or checklist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923]"
            />
          </div>

          {/* Target Deadline & Lead-Time */}
          <div className="grid grid-cols-2 gap-3 pt-0.5">
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
                Lead Time (Days)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 42"
                value={leadTimeDays || ""}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
              />
            </div>
          </div>

          {/* Dynamic Reminder Alert */}
          {calculatedReminderDate && (
            <div className="p-2.5 rounded-[10px] bg-[#F5EEFD] text-[11px] text-[#6B21A8] border border-[#E5D4F9] leading-relaxed">
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
