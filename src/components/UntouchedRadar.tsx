"use client";

import React from "react";
import { Task } from "@/types";
import { formatRelativeDeadline, getSpaceColor, isTaskUntouched } from "@/lib/colors";
import { formatLeadDuration } from "@/lib/time";
import { AlertCircle, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

interface UntouchedRadarProps {
  tasks: Task[];
  onExpandTask: (task: Task) => void;
}

export function UntouchedRadar({ tasks, onExpandTask }: UntouchedRadarProps) {
  const untouchedTasks = tasks.filter((t) => isTaskUntouched(t));

  return (
    <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-4 shadow-[0_2px_10px_rgba(23,25,35,0.02)] space-y-3.5">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D8D7DE]/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#FF705B] text-white flex items-center justify-center shadow-2xs">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#171923] tracking-tight">
              Action Needed Radar
            </h3>
            <p className="text-[11px] text-[#777783]">
              Work window open or deadline nearing
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF705B] text-white shadow-2xs">
          {untouchedTasks.length} {untouchedTasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* List or Empty State */}
      {untouchedTasks.length === 0 ? (
        <div className="py-8 text-center text-[12px] text-[#777783] space-y-1.5">
          <CheckCircle2 className="w-5 h-5 text-[#A8DCCB] mx-auto mb-1 stroke-[2]" />
          <p className="font-semibold text-[#171923]">All caught up</p>
          <p className="text-[11px]">No urgent tasks in danger zone.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {untouchedTasks.slice(0, 5).map((task) => {
            const spaceStyle = getSpaceColor(task.space_color);
            return (
              <div
                key={task.id}
                onClick={() => onExpandTask(task)}
                className="p-3.5 rounded-[14px] bg-[#FFF9F7] border-2 border-[#FF705B] shadow-[0_2px_12px_rgba(255,112,91,0.12)] hover:shadow-[0_4px_16px_rgba(255,112,91,0.18)] hover:border-[#E0533E] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.2 rounded-full border ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                    >
                      {task.space_name}
                    </span>
                    <span className="text-[9px] font-bold text-white bg-[#FF705B] px-1.5 py-0.2 rounded-full">
                      Action
                    </span>
                  </div>
                  <span className="text-[11px] text-[#C2410C] font-bold tabular-numbers">
                    {formatRelativeDeadline(task.deadline)}
                  </span>
                </div>

                <h4 className="text-[14px] font-semibold text-[#171923] group-hover:text-[#C2410C] transition-colors line-clamp-1">
                  {task.title}
                </h4>

                <div className="mt-2 flex items-center justify-between text-[11px] text-[#777783]">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#FF705B]" />
                    Start {formatLeadDuration(task.lead_time_days)} ahead
                  </span>

                  <span className="flex items-center gap-1 text-[#C2410C] font-semibold group-hover:underline">
                    <span>View task</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
