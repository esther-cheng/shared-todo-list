"use client";

import React, { useState } from "react";
import { Task } from "@/types";
import { getSpaceColor, formatDate, formatRelativeDeadline } from "@/lib/colors";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, CheckCircle2, Circle } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  onExpandTask: (task: Task) => void;
}

export function CalendarView({ tasks, onExpandTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpTo = (targetYear: number, targetMonth: number) => {
    setCurrentDate(new Date(targetYear, targetMonth, 1));
    setSelectedDay(1);
  };

  // Map tasks to days of this month
  const tasksByDay: Record<number, Task[]> = {};
  for (const t of tasks) {
    if (t.deadline) {
      const d = new Date(t.deadline);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dayNum = d.getDate();
        if (!tasksByDay[dayNum]) tasksByDay[dayNum] = [];
        tasksByDay[dayNum].push(t);
      }
    }
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
  const selectedDayTasks = tasksByDay[selectedDay] || [];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F5EEFD] text-[#6B21A8] dark:bg-purple-950 dark:text-[#D8B4FE]">
            <CalIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#171923] dark:text-zinc-50 tracking-tight">
              {monthName} {year}
            </h2>
            <p className="text-[11px] text-[#777783] dark:text-zinc-400 font-medium">
              Task deadlines & work windows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick jump to sample user deadlines */}
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <button
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDay(new Date().getDate());
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => jumpTo(2027, 6)}
              className="text-xs px-2.5 py-1 rounded-lg bg-[#F5EEFD] hover:bg-purple-100 dark:bg-purple-950/60 text-[#6B21A8] dark:text-purple-300 font-medium transition-colors"
            >
              Jul 2027 (Mom Gift)
            </button>
            <button
              onClick={() => jumpTo(2028, 7)}
              className="text-xs px-2.5 py-1 rounded-lg bg-[#F5EEFD] hover:bg-purple-100 dark:bg-purple-950/60 text-[#6B21A8] dark:text-purple-300 font-medium transition-colors"
            >
              Aug 2028 (Passport)
            </button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-[#777783] dark:text-zinc-400 uppercase tracking-wider py-1">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {blanks.map((b) => (
          <div key={`blank-${b}`} className="min-h-[48px] sm:min-h-[85px] rounded-xl sm:rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20" />
        ))}

        {days.map((day) => {
          const dayTasks = tasksByDay[day] || [];
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;
          const isSelected = selectedDay === day;

          return (
            <div
              key={`day-${day}`}
              onClick={() => setSelectedDay(day)}
              className={`min-h-[48px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? "border-[#B78AF2] bg-[#F5EEFD]/50 dark:bg-purple-950/30 ring-2 ring-[#B78AF2]/50"
                  : isToday
                  ? "border-purple-300 bg-purple-50/20 dark:bg-purple-950/20"
                  : "border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? "bg-[#171923] text-white"
                      : isSelected
                      ? "bg-[#B78AF2] text-[#171923]"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {day}
                </span>

                {dayTasks.length > 0 && (
                  <span className="hidden sm:inline-block text-[10px] font-bold text-[#6B21A8]">
                    {dayTasks.length} due
                  </span>
                )}
              </div>

              {/* Tasks on desktop: full pill / on mobile: dot indicator */}
              <div className="mt-1">
                {/* Mobile dots */}
                <div className="flex sm:hidden items-center justify-center gap-1 pt-1">
                  {dayTasks.map((t) => (
                    <span
                      key={t.id}
                      className="w-1.5 h-1.5 rounded-full bg-[#B78AF2]"
                    />
                  ))}
                </div>

                {/* Desktop pills */}
                <div className="hidden sm:block space-y-1">
                  {dayTasks.map((t) => {
                    const spaceStyle = getSpaceColor(t.space_color);
                    return (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onExpandTask(t);
                        }}
                        className={`text-[10px] p-1 rounded-md border font-medium truncate cursor-pointer hover:opacity-90 ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                        title={`${t.title} (${t.space_name})`}
                      >
                        {t.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Agenda Box (Extremely friendly on mobile!) */}
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#171923] dark:text-zinc-300 mb-2.5">
          Tasks for {monthName} {selectedDay}, {year}
        </h3>

        {selectedDayTasks.length === 0 ? (
          <p className="text-xs text-[#777783] dark:text-zinc-500 italic py-2">
            No deadlines scheduled for this day.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedDayTasks.map((task) => {
              const spaceStyle = getSpaceColor(task.space_color);
              const isDone = task.status === "completed";

              return (
                <div
                  key={task.id}
                  onClick={() => onExpandTask(task)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-[#B78AF2] cursor-pointer transition-all active:scale-[0.99] min-h-[48px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                    >
                      {task.space_name}
                    </span>
                    <span
                      className={`text-xs font-semibold text-[#171923] dark:text-zinc-100 truncate ${
                        isDone ? "line-through text-zinc-400" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#6B21A8] font-bold shrink-0 ml-2">
                    Open →
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
