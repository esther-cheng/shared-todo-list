"use client";

import React from "react";
import { Task } from "@/types";
import { 
  getSpaceColor, 
  formatDate, 
  formatRelativeDeadline, 
  isTaskUntouched,
  getUserHighlightStyle
} from "@/lib/colors";
import { getCategory } from "@/lib/categories";
import { formatLeadDuration } from "@/lib/time";
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  Check, 
  ArrowUpRight,
  ListChecks
} from "lucide-react";
import { parseTaskDescription } from "@/lib/checklist";

interface TaskCardProps {
  task: Task;
  userColor?: string;
  onExpand: (task: Task) => void;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
}

export function TaskCard({ task, userColor, onExpand, onToggleStatus }: TaskCardProps) {
  const spaceStyle = getSpaceColor(task.space_color);
  const categoryObj = getCategory(task.category);
  const userHighlight = getUserHighlightStyle(userColor);
  const isDone = task.status === "completed";
  const untouched = isTaskUntouched(task);

  return (
    <div
      onClick={() => onExpand(task)}
      className={`group relative ${
        untouched
          ? "bg-[#FFF9F7] border-2 border-[#FF705B] shadow-[0_4px_20px_rgba(255,112,91,0.12)] hover:border-[#E0533E] hover:shadow-[0_6px_24px_rgba(255,112,91,0.18)]"
          : "bg-[#FFFFFF] border border-[#D8D7DE] hover:border-[var(--color-primary)] shadow-[0_2px_10px_rgba(23,25,35,0.03)] hover:shadow-[0_4px_18px_rgba(23,25,35,0.06)]"
      } rounded-[18px] p-4 sm:p-5 transition-all duration-150 cursor-pointer active:scale-[0.995]`}
    >
      {/* Top Meta: Group Pill + Category Badge + Author + Untouched Alert */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder} truncate`}
          >
            {task.space_name || "General"}
          </span>

          {categoryObj && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryObj.badgeBg} ${categoryObj.badgeText} ${categoryObj.badgeBorder} truncate`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${categoryObj.dotBg}`} />
              <span>{categoryObj.label}</span>
            </span>
          )}

          <span className="text-[12px] text-[#777783] font-normal truncate">
            posted by <span className="text-[#171923] font-medium">{task.created_by}</span>
          </span>
        </div>

        {untouched && (
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF705B] text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Action needed</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex items-start gap-3">
        {/* Crisp check button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task.id, task.status);
          }}
          className={`min-w-[44px] min-h-[44px] -m-2.5 flex items-center justify-center transition-colors shrink-0`}
          aria-label={isDone ? "Mark as todo" : "Mark as completed"}
        >
          <div
            className={`w-5 h-5 rounded-[7px] border flex items-center justify-center transition-all ${
              isDone
                ? "bg-[#171923] border-[#171923] text-white"
                : "border-[#D8D7DE] bg-white hover:border-[#171923]"
            }`}
          >
            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </button>

        <div className="flex-1 min-w-0 pt-0.5">
          <h3
            className={`text-[16px] sm:text-[17px] font-semibold text-[#171923] leading-snug tracking-tight ${
              isDone ? "line-through text-[#777783]" : ""
            }`}
          >
            {task.title}
          </h3>

          {(() => {
            const parsedDesc = parseTaskDescription(task.description);
            const hasChecklistItems = parsedDesc.hasChecklist && parsedDesc.checklist.length > 0;
            const completedCount = parsedDesc.checklist.filter((i) => i.completed).length;

            return (
              <>
                {parsedDesc.context && (
                  <p className="mt-1.5 text-[13px] text-[#777783] line-clamp-2 leading-relaxed">
                    {parsedDesc.context}
                  </p>
                )}

                {hasChecklistItems && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#777783]">
                    <ListChecks className="w-3.5 h-3.5 text-[#B78AF2]" />
                    <span>
                      {completedCount}/{parsedDesc.checklist.length} checklist {parsedDesc.checklist.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                )}
              </>
            );
          })()}

          {categoryObj && !isDone && (
            <p className="mt-1.5 text-[11px] text-[#777783] italic flex items-center gap-1">
              <span>{categoryObj.reminderPrompt}</span>
            </p>
          )}
        </div>
      </div>

      {/* Bottom Timeline & Details Bar */}
      <div className="mt-4 pt-3 border-t border-[#D8D7DE]/50 flex items-center justify-between gap-2 text-[12px]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Target Deadline */}
          {task.deadline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#F4F3F5] text-[#171923] font-medium tabular-numbers">
              <Calendar className="w-3.5 h-3.5 text-[#777783]" />
              <span>Target: {formatDate(task.deadline)}</span>
              <span className="text-[#777783] font-normal">
                ({formatRelativeDeadline(task.deadline)})
              </span>
            </div>
          )}

          {/* Estimated Time Needed & Calculated Start Date */}
          {task.lead_time_days > 0 && task.reminder_date && (
            <div className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] ${userHighlight.bgLight} ${userHighlight.textDark} font-medium border ${userHighlight.border} tabular-numbers`}>
              <Clock className={`w-3.5 h-3.5 ${userHighlight.textDark}`} />
              <span>
                Start {formatLeadDuration(task.lead_time_days)} ahead
              </span>
              <span className="text-[#777783] font-normal">
                • By {formatDate(task.reminder_date)}
              </span>
            </div>
          )}
        </div>

        {/* Notes Count & Open Indicator */}
        <div className="flex items-center gap-3 text-[#777783] shrink-0">
          <div className="flex items-center gap-1 font-medium">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="tabular-numbers">{task.notes_count || 0}</span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-0.5 text-[#171923] font-medium group-hover:text-[#6B21A8] transition-colors">
            Details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
