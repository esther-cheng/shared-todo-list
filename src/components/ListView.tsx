"use client";

import React from "react";
import { Task } from "@/types";
import { getSpaceColor, formatDate, formatRelativeDeadline, isTaskUntouched } from "@/lib/colors";
import { CheckCircle2, Circle, Clock, MessageSquare, AlertTriangle, ChevronRight } from "lucide-react";

interface ListViewProps {
  tasks: Task[];
  onExpandTask: (task: Task) => void;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
}

export function ListView({ tasks, onExpandTask, onToggleStatus }: ListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-[#777783]">
        No tasks found matching your filter.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl shadow-xs overflow-hidden">
      {/* Mobile Streamlined Row List */}
      <div className="sm:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {tasks.map((task) => {
          const isDone = task.status === "completed";
          const spaceStyle = getSpaceColor(task.space_color);
          const untouched = isTaskUntouched(task);

          return (
            <div
              key={task.id}
              onClick={() => onExpandTask(task)}
              className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer active:bg-zinc-100 transition-colors min-h-[56px]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(task.id, task.status);
                  }}
                  className="min-w-[40px] min-h-[40px] -m-2 flex items-center justify-center text-zinc-400 hover:text-[#6B21A8]"
                  aria-label="Toggle status"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-400" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border truncate ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                    >
                      {task.space_name}
                    </span>
                    {untouched && (
                      <span className="text-[10px] font-bold text-[#C2410C] bg-[#FFF2EE] px-1.5 py-0.2 rounded-full border border-[#FEDACE]">
                        Untouched
                      </span>
                    )}
                  </div>
                  <h4
                    className={`text-xs font-semibold text-[#171923] dark:text-zinc-100 truncate ${
                      isDone ? "line-through text-zinc-400" : ""
                    }`}
                  >
                    {task.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-right">
                {task.deadline && (
                  <span className="text-[10px] text-[#777783] dark:text-zinc-400 font-medium">
                    {formatRelativeDeadline(task.deadline)}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop / Tablet Multi-Column Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200/80 dark:border-zinc-800 text-[#777783] dark:text-zinc-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Task</th>
              <th className="py-3 px-4">Space</th>
              <th className="py-3 px-4">Target Deadline</th>
              <th className="py-3 px-4">Lead Time Effort</th>
              <th className="py-3 px-4">Notes</th>
              <th className="py-3 px-4">Author</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {tasks.map((task) => {
              const isDone = task.status === "completed";
              const spaceStyle = getSpaceColor(task.space_color);
              const untouched = isTaskUntouched(task);

              return (
                <tr
                  key={task.id}
                  onClick={() => onExpandTask(task)}
                  className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors ${
                    untouched ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                  }`}
                >
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleStatus(task.id, task.status)}
                      className="text-zinc-400 hover:text-purple-600 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold text-zinc-900 dark:text-zinc-100 ${
                          isDone ? "line-through text-zinc-400" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                      {untouched && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#C2410C] bg-[#FFF2EE] px-1.5 py-0.5 rounded-full border border-[#FEDACE]">
                          <AlertTriangle className="w-3 h-3 text-[#FF705B]" />
                          Untouched
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                    >
                      {task.space_name}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                    {task.deadline ? (
                      <div>
                        <span>{formatDate(task.deadline)}</span>
                        <span className="block text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
                          {formatRelativeDeadline(task.deadline)}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                    {task.lead_time_days > 0 ? (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-500" />
                        {task.lead_time_days} days
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {task.notes_count || 0}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-medium">
                    {task.created_by}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
