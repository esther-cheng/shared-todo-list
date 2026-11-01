"use client";

import React from "react";
import { Task } from "@/types";
import { getSpaceColor, formatDate, formatRelativeDeadline, isTaskUntouched } from "@/lib/colors";
import { Check, Circle, Clock, MessageSquare, AlertTriangle, ChevronRight } from "lucide-react";

interface ListViewProps {
  tasks: Task[];
  onExpandTask: (task: Task) => void;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
}

export function ListView({ tasks, onExpandTask, onToggleStatus }: ListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-10 text-center text-[#777783]">
        No tasks found matching your filter.
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] shadow-[0_2px_10px_rgba(23,25,35,0.02)] overflow-hidden">
      {/* Mobile Streamlined Row List */}
      <div className="sm:hidden divide-y divide-[#D8D7DE]/60 p-1">
        {tasks.map((task) => {
          const isDone = task.status === "completed";
          const spaceStyle = getSpaceColor(task.space_color);
          const untouched = isTaskUntouched(task);

          return (
            <div
              key={task.id}
              onClick={() => onExpandTask(task)}
              className={`p-3 flex items-center justify-between gap-3 cursor-pointer active:bg-[#F4F3F5] transition-all min-h-[56px] ${
                untouched
                  ? "bg-[#FFF9F7] border-2 border-[#FF705B] rounded-[14px] my-1 shadow-[0_2px_12px_rgba(255,112,91,0.12)]"
                  : "hover:bg-[#F4F3F5]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(task.id, task.status);
                  }}
                  className="min-w-[40px] min-h-[40px] -m-2 flex items-center justify-center shrink-0"
                  aria-label="Toggle status"
                >
                  <div
                    className={`w-5 h-5 rounded-[7px] border flex items-center justify-center transition-all ${
                      isDone
                        ? "bg-[#171923] border-[#171923] text-white"
                        : untouched
                        ? "border-[#FF705B] bg-white"
                        : "border-[#D8D7DE] bg-white hover:border-[#171923]"
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border truncate ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                    >
                      {task.space_name}
                    </span>
                    {untouched && (
                      <span 
                        title="Action needed: upcoming deadline / work window active"
                        className="text-[9px] font-bold text-white bg-[#FF705B] px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 shrink-0 shadow-2xs select-none"
                      >
                        <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" />
                        <span>Action</span>
                      </span>
                    )}
                  </div>
                  <h4
                    className={`text-xs font-semibold text-[#171923] truncate ${
                      isDone ? "line-through text-[#777783]" : ""
                    }`}
                  >
                    {task.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-right">
                {task.deadline && (
                  <span className={`text-[10px] font-medium ${untouched ? "text-[#C2410C] font-semibold" : "text-[#777783]"}`}>
                    {formatRelativeDeadline(task.deadline)}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-[#777783]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop / Tablet Multi-Column Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F4F3F5] border-b border-[#D8D7DE] text-[#777783] text-[11px] font-bold uppercase tracking-wider select-none">
              <th className="py-2.5 px-3 w-10 text-center"></th>
              <th className="py-2.5 px-3 min-w-[220px]">Task</th>
              <th className="py-2.5 px-3">Space</th>
              <th className="py-2.5 px-3">Target Deadline</th>
              <th className="py-2.5 px-3">Prep Time</th>
              <th className="py-2.5 px-3">Notes</th>
              <th className="py-2.5 px-3">Author</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8D7DE]/60">
            {tasks.map((task) => {
              const isDone = task.status === "completed";
              const spaceStyle = getSpaceColor(task.space_color);
              const untouched = isTaskUntouched(task);

              return (
                <tr
                  key={task.id}
                  onClick={() => onExpandTask(task)}
                  className={`group cursor-pointer transition-colors relative ${
                    untouched
                      ? "bg-[#FFF9F7] hover:bg-[#FFF2EE]"
                      : "hover:bg-[#F4F3F5] text-[#171923]"
                  }`}
                >
                  {/* Column 1: Checkbox + Left Border Accent */}
                  <td 
                    className={`py-3 px-3 text-center ${
                      untouched ? "border-y-2 border-l-4 border-y-[#FF705B] border-l-[#FF705B]" : ""
                    }`} 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onToggleStatus(task.id, task.status)}
                      className="inline-flex items-center justify-center min-w-[28px] min-h-[28px] transition-colors"
                      aria-label="Toggle status"
                    >
                      <div
                        className={`w-4 h-4 rounded-[6px] border flex items-center justify-center transition-all ${
                          isDone
                            ? "bg-[#171923] border-[#171923] text-white"
                            : untouched
                            ? "border-[#FF705B] bg-white hover:border-[#171923]"
                            : "border-[#D8D7DE] bg-white hover:border-[#171923]"
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  </td>

                  {/* Column 2: Task Title + Space-Saving Action Badge */}
                  <td className={`py-3 px-3 ${untouched ? "border-y-2 border-y-[#FF705B]" : ""}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {untouched && (
                        <span
                          title="Action needed: reminder window open or deadline nearing"
                          aria-label="Action needed"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FF705B] text-white text-[10px] font-bold shrink-0 shadow-2xs select-none"
                        >
                          <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span className="hidden xl:inline text-[9px] uppercase tracking-wider">Action</span>
                        </span>
                      )}
                      <span
                        className={`font-semibold text-[#171923] truncate ${
                          isDone ? "line-through text-[#777783]" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  </td>

                  {/* Column 3: Space Badge */}
                  <td className={`py-3 px-3 ${untouched ? "border-y-2 border-y-[#FF705B]" : ""}`}>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border truncate max-w-[140px] ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                    >
                      {task.space_name}
                    </span>
                  </td>

                  {/* Column 4: Target Deadline */}
                  <td className={`py-3 px-3 text-[#171923] font-medium ${untouched ? "border-y-2 border-y-[#FF705B]" : ""}`}>
                    {task.deadline ? (
                      <div className="leading-tight">
                        <span className="block font-semibold">{formatDate(task.deadline)}</span>
                        <span className={`block text-[10px] ${untouched ? "text-[#C2410C] font-bold" : "text-[#777783]"}`}>
                          {formatRelativeDeadline(task.deadline)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#777783]">—</span>
                    )}
                  </td>

                  {/* Column 5: Prep Time */}
                  <td className={`py-3 px-3 text-[#777783] ${untouched ? "border-y-2 border-y-[#FF705B]" : ""}`}>
                    {task.lead_time_days > 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[#171923]">
                        <Clock className="w-3.5 h-3.5 text-[#B78AF2]" />
                        <span>{task.lead_time_days}d</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Column 6: Notes Count */}
                  <td className={`py-3 px-3 text-[#777783] ${untouched ? "border-y-2 border-y-[#FF705B]" : ""}`}>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#777783]" />
                      <span>{task.notes_count || 0}</span>
                    </span>
                  </td>

                  {/* Column 7: Author + Right Border Accent */}
                  <td className={`py-3 px-3 text-[#777783] font-medium ${untouched ? "border-y-2 border-r-2 border-y-[#FF705B] border-r-[#FF705B]" : ""}`}>
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
