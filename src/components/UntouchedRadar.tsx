"use client";

import React from "react";
import { Task } from "@/types";
import { formatRelativeDeadline, getSpaceColor } from "@/lib/colors";
import { AlertCircle, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

interface UntouchedRadarProps {
  tasks: Task[];
  onExpandTask: (task: Task) => void;
}

export function UntouchedRadar({ tasks, onExpandTask }: UntouchedRadarProps) {
  const untouchedTasks = tasks.filter((t) => {
    if (t.status === "completed") return false;
    const now = Date.now();
    const reminderTime = t.reminder_date ? new Date(t.reminder_date).getTime() : null;
    const deadlineTime = t.deadline ? new Date(t.deadline).getTime() : null;

    const isWindowOpen = reminderTime ? reminderTime <= now : false;
    const isDeadlineNearing = deadlineTime ? deadlineTime - now <= 30 * 24 * 60 * 60 * 1000 : false;

    return isWindowOpen || isDeadlineNearing;
  });

  return (
    <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-4 shadow-[0_2px_10px_rgba(23,25,35,0.02)] space-y-3.5">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D8D7DE]/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[#FFF0ED] text-[#FF705B] flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#171923] tracking-tight">
              Untouched Radar
            </h3>
            <p className="text-[11px] text-[#777783]">
              Work window open & unstarted
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0ED] text-[#C2410C] border border-[#FED7CE]">
          {untouchedTasks.length}
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
                className="p-3 rounded-[14px] bg-[#F4F3F5] hover:bg-[#FFF0ED]/40 border border-transparent hover:border-[#FED7CE] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.2 rounded-full border ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                  >
                    {task.space_name}
                  </span>
                  <span className="text-[11px] text-[#C2410C] font-semibold tabular-numbers">
                    {formatRelativeDeadline(task.deadline)}
                  </span>
                </div>

                <h4 className="text-[13px] font-semibold text-[#171923] group-hover:text-[#6B21A8] transition-colors line-clamp-1">
                  {task.title}
                </h4>

                <div className="mt-2 flex items-center justify-between text-[11px] text-[#777783]">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-[#777783]" />
                    {task.lead_time_days || 0}d prep time
                  </span>

                  <span className="flex items-center gap-0.5 text-[#171923] font-semibold group-hover:text-[#6B21A8]">
                    View
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
