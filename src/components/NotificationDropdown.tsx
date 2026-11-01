"use client";

import React from "react";
import { Task } from "@/types";
import { getSpaceColor, formatRelativeDeadline } from "@/lib/colors";
import { 
  Bell, 
  X, 
  Calendar, 
  Check, 
  MessageSquare, 
  RotateCcw, 
  ExternalLink,
  AtSign
} from "lucide-react";

interface NotificationDropdownProps {
  tasks: Task[];
  dismissedTaskIds: string[];
  onDismissTask: (taskId: string) => void;
  onDismissAll: () => void;
  onResetDismissed: () => void;
  onSelectTask: (task: Task) => void;
  onClose: () => void;
  onViewAllTagged?: () => void;
  currentUsername: string;
}

export function NotificationDropdown({
  tasks,
  dismissedTaskIds,
  onDismissTask,
  onDismissAll,
  onResetDismissed,
  onSelectTask,
  onClose,
  onViewAllTagged,
  currentUsername,
}: NotificationDropdownProps) {
  // Filter tasks into active and dismissed
  const activeTasks = tasks.filter((t) => !dismissedTaskIds.includes(t.id));
  const dismissedCount = tasks.filter((t) => dismissedTaskIds.includes(t.id)).length;

  return (
    <div
      className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 w-auto sm:w-[390px] bg-[#FFFFFF] rounded-[18px] border border-[#D8D7DE] shadow-[0_10px_32px_rgba(23,25,35,0.12)] z-50 overflow-hidden flex flex-col"
      role="dialog"
      aria-label="Notifications Dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#D8D7DE]/70 bg-[#FFFFFF] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[var(--color-primary-light)] text-[var(--color-primary-text)] flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-[#171923]" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-[14px] font-semibold text-[#171923] leading-none">
              Notifications
            </h3>
            {activeTasks.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF705B] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {activeTasks.length}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTasks.length > 0 && (
            <button
              onClick={onDismissAll}
              className="text-[11px] font-medium text-[#777783] hover:text-[#171923] px-2 py-1 rounded-[6px] hover:bg-[#F4F3F5] transition-colors"
              title="Dismiss all active notifications"
            >
              Dismiss all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-[8px] text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5] transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task List Section */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-[#D8D7DE]/40 overscroll-contain">
        {activeTasks.length === 0 ? (
          <div className="py-9 px-6 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-[#EFF8F5] text-[#065F46] flex items-center justify-center mb-2.5">
              <Check className="w-5 h-5 text-[#065F46] stroke-[2.5]" />
            </div>
            <p className="text-[14px] font-semibold text-[#171923]">
              All caught up!
            </p>
            <p className="text-[12px] text-[#777783] mt-1 max-w-[220px] leading-relaxed">
              No pending tagged tasks for @{currentUsername.toLowerCase()} or @partner.
            </p>
            {dismissedCount > 0 && (
              <button
                onClick={onResetDismissed}
                className="mt-3.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-primary-text)] hover:text-[#171923] px-3 py-1.5 rounded-[8px] bg-[var(--color-primary-light)] border border-[var(--color-primary-border)] hover:opacity-90 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore {dismissedCount} dismissed task{dismissedCount > 1 ? "s" : ""}</span>
              </button>
            )}
          </div>
        ) : (
          activeTasks.map((task) => {
            const spaceStyle = getSpaceColor(task.space_color);
            return (
              <div
                key={task.id}
                onClick={() => {
                  onSelectTask(task);
                  onClose();
                }}
                className="group relative p-3.5 hover:bg-[#F4F3F5] transition-colors cursor-pointer text-left select-none flex flex-col gap-1.5"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTask(task);
                    onClose();
                  }
                }}
              >
                {/* Top Row: Space pill + Deadline + Dismiss Button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                    >
                      {task.space_name}
                    </span>

                    {task.deadline && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#777783] font-medium">
                        <Calendar className="w-3 h-3 text-[#777783]" />
                        {formatRelativeDeadline(task.deadline)}
                      </span>
                    )}

                    {task.status === "completed" && (
                      <span className="text-[10px] font-semibold bg-[#A8DCCB]/30 text-[#065F46] px-1.5 py-0.2 rounded-full border border-[#CCEBE1]">
                        Done
                      </span>
                    )}
                  </div>

                  {/* Individual Dismiss Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissTask(task.id);
                    }}
                    className="p-1 rounded-[6px] text-[#777783] hover:text-[#FF705B] hover:bg-[#FEDACE]/50 active:scale-95 transition-all shrink-0 -mr-1"
                    title="Dismiss this notification"
                    aria-label={`Dismiss notification for ${task.title}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task Title */}
                <h4 className="text-[13px] font-semibold text-[#171923] group-hover:text-[#6B21A8] transition-colors leading-snug line-clamp-2">
                  {task.title}
                </h4>

                {/* Context Snippet (Latest Note or Task Description) */}
                {task.latest_note ? (
                  <div className="flex items-start gap-1.5 text-[11px] text-[#777783] bg-[#FFFFFF] border border-[#D8D7DE]/60 rounded-[8px] px-2 py-1 mt-0.5">
                    <MessageSquare className="w-3 h-3 text-[#B78AF2] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">
                      <strong className="text-[#171923] font-medium">
                        {task.latest_note.author}:
                      </strong>{" "}
                      {task.latest_note.content}
                    </span>
                  </div>
                ) : task.description ? (
                  <p className="text-[11px] text-[#777783] line-clamp-1 mt-0.5 leading-normal">
                    {task.description}
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2.5 bg-[#F4F3F5] border-t border-[#D8D7DE]/70 flex items-center justify-between text-[11px] text-[#777783] shrink-0">
        {dismissedCount > 0 ? (
          <div className="flex items-center justify-between w-full">
            <span>
              {dismissedCount} dismissed
            </span>
            <button
              onClick={onResetDismissed}
              className="text-[#6B21A8] hover:text-[#171923] font-semibold underline flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore all</span>
            </button>
          </div>
        ) : onViewAllTagged ? (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1 text-[#777783]">
              <AtSign className="w-3 h-3 text-[var(--color-primary)]" />
              Mentions for @{currentUsername}
            </span>
            <button
              onClick={() => {
                onViewAllTagged();
                onClose();
              }}
              className="text-[#171923] hover:text-[var(--color-primary-text)] font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View all on wall</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span className="flex items-center gap-1 text-[#777783]">
            <AtSign className="w-3 h-3 text-[var(--color-primary)]" />
            Mentions for @{currentUsername} & @partner
          </span>
        )}
      </div>
    </div>
  );
}

