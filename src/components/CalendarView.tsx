"use client";

import React, { useState } from "react";
import { Task } from "@/types";
import { 
  getSpaceColor, 
  getSpaceIcon, 
  formatRelativeDeadline,
  getUserHighlightStyle,
  isTaskUntouched
} from "@/lib/colors";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalIcon, 
  Clock, 
  CheckCircle2, 
  Circle,
  CalendarRange,
  SunMedium,
  ArrowRight
} from "lucide-react";

export type CalendarMode = "day" | "week" | "month";

interface CalendarViewProps {
  tasks: Task[];
  userColor?: string;
  onExpandTask: (task: Task) => void;
  onToggleStatus?: (taskId: string, currentStatus: string) => void;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(centerDate: Date): Date[] {
  const start = getStartOfWeek(centerDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function CalendarView({ tasks, userColor, onExpandTask, onToggleStatus }: CalendarViewProps) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [mobileWeekTab, setMobileWeekTab] = useState<"agenda" | "day">("agenda");

  const userHighlight = getUserHighlightStyle(userColor);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    if (calendarMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
      setSelectedDay(1);
    } else if (calendarMode === "week") {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
      setSelectedDay(prevWeek.getDate());
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDay);
      setSelectedDay(prevDay.getDate());
    }
  };

  const handleNext = () => {
    if (calendarMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
      setSelectedDay(1);
    } else if (calendarMode === "week") {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
      setSelectedDay(nextWeek.getDate());
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      setCurrentDate(nextDay);
      setSelectedDay(nextDay.getDate());
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  // Title generation based on current mode
  const getHeaderTitle = () => {
    if (calendarMode === "month") {
      return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
    }
    if (calendarMode === "week") {
      const weekDates = getWeekDates(currentDate);
      const start = weekDates[0];
      const end = weekDates[6];

      if (start.getFullYear() !== end.getFullYear()) {
        return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
      if (start.getMonth() !== end.getMonth()) {
        return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
      return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    }
    // Daily view
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Subtitle generation
  const getHeaderSubtitle = () => {
    if (calendarMode === "month") return "Monthly deadline grid & task overview";
    if (calendarMode === "week") return "7-day schedule & upcoming milestones";
    return "Daily focus, deadlines & active work windows";
  };

  // Tasks due on a specific date
  const getTasksDueOnDate = (date: Date): Task[] => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return isSameDay(d, date);
    });
  };

  // Month calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Month map of tasks
  const tasksByDayOfMonth: Record<number, Task[]> = {};
  for (const t of tasks) {
    if (t.deadline) {
      const d = new Date(t.deadline);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dayNum = d.getDate();
        if (!tasksByDayOfMonth[dayNum]) tasksByDayOfMonth[dayNum] = [];
        tasksByDayOfMonth[dayNum].push(t);
      }
    }
  }

  // Selected Day tasks in month view
  const selectedDayTasks = tasksByDayOfMonth[selectedDay] || [];

  // Week calculation
  const weekDates = getWeekDates(currentDate);
  const weekTotalTasks = weekDates.reduce((acc, d) => acc + getTasksDueOnDate(d).length, 0);
  const weekCompletedTasks = weekDates.reduce(
    (acc, d) => acc + getTasksDueOnDate(d).filter((t) => t.status === "completed").length,
    0
  );
  const selectedDayTasksInWeek = getTasksDueOnDate(currentDate);

  // Daily view calculations
  const dayEnd = endOfDay(currentDate);
  const dayDueTasks = getTasksDueOnDate(currentDate);

  // Tasks with active work windows covering currentDate (and not already in dayDueTasks)
  const dayActiveWindowTasks = tasks.filter((t) => {
    if (t.status === "completed") return false;
    if (!t.reminder_date || !t.deadline) return false;
    const rem = new Date(t.reminder_date);
    const ddl = new Date(t.deadline);
    if (rem <= dayEnd && ddl > dayEnd) {
      // Not due today, but work window is active
      return !dayDueTasks.some((due) => due.id === t.id);
    }
    return false;
  });

  const dayCompletedCount = dayDueTasks.filter((t) => t.status === "completed").length;

  return (
    <div className="bg-[#FFFFFF] dark:bg-zinc-900 border border-[#D8D7DE] dark:border-zinc-800 rounded-[24px] p-4 sm:p-6 shadow-xs space-y-5">
      {/* Calendar Header with Navigation and View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D8D7DE]/70 dark:border-zinc-800">
        {/* Title and Icon */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-[14px] ${userHighlight.bgLight} ${userHighlight.textDark} dark:bg-purple-950 dark:text-[#D8B4FE] shrink-0`}>
            {calendarMode === "day" ? (
              <SunMedium className="w-5 h-5" />
            ) : calendarMode === "week" ? (
              <CalendarRange className="w-5 h-5" />
            ) : (
              <CalIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#171923] dark:text-zinc-50 tracking-tight">
              {getHeaderTitle()}
            </h2>
            <p className="text-[11px] text-[#777783] dark:text-zinc-400 font-medium">
              {getHeaderSubtitle()}
            </p>
          </div>
        </div>

        {/* Action Controls: View Switcher & Date Navigation */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
          {/* Segmented Control View Toggle (Day / Week / Month) */}
          <div className="flex items-center bg-[#F4F3F5] dark:bg-zinc-800 p-1 rounded-full border border-[#D8D7DE] dark:border-zinc-700/80">
            <button
              type="button"
              onClick={() => setCalendarMode("day")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                calendarMode === "day"
                  ? "bg-[#FFFFFF] dark:bg-zinc-700 text-[#171923] dark:text-zinc-100 shadow-xs"
                  : "text-[#777783] dark:text-zinc-400 hover:text-[#171923]"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode("week")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                calendarMode === "week"
                  ? "bg-[#FFFFFF] dark:bg-zinc-700 text-[#171923] dark:text-zinc-100 shadow-xs"
                  : "text-[#777783] dark:text-zinc-400 hover:text-[#171923]"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode("month")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                calendarMode === "month"
                  ? "bg-[#FFFFFF] dark:bg-zinc-700 text-[#171923] dark:text-zinc-100 shadow-xs"
                  : "text-[#777783] dark:text-zinc-400 hover:text-[#171923]"
              }`}
            >
              Month
            </button>
          </div>

          {/* Today Button & Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToday}
              className="text-xs px-3 py-1.5 rounded-[12px] bg-[#F4F3F5] hover:bg-[#D8D7DE] dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#171923] dark:text-zinc-200 font-semibold transition-colors cursor-pointer"
            >
              Today
            </button>
            <div className="flex items-center bg-[#F4F3F5] dark:bg-zinc-800 p-0.5 rounded-[12px] border border-[#D8D7DE] dark:border-zinc-700">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-[10px] hover:bg-white dark:hover:bg-zinc-700 text-[#171923] dark:text-zinc-200 transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer"
                aria-label={`Previous ${calendarMode}`}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-[10px] hover:bg-white dark:hover:bg-zinc-700 text-[#171923] dark:text-zinc-200 transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer"
                aria-label={`Next ${calendarMode}`}
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY VIEW */}
      {/* ========================================================================= */}
      {calendarMode === "day" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`flex items-center justify-between p-3.5 rounded-[16px] ${userHighlight.bgLight}/60 dark:bg-purple-950/30 border ${userHighlight.border} dark:border-purple-800/60`}>
              <div className="space-y-0.5">
                <p className={`text-[11px] font-semibold ${userHighlight.textDark} dark:text-[#D8B4FE]`}>Deadlines Today</p>
                <p className="text-xl font-bold text-[#171923] dark:text-white">{dayDueTasks.length}</p>
              </div>
              <CalIcon className={`w-5 h-5 ${userHighlight.textDark}`} />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#F0F9FE]/60 dark:bg-sky-950/30 border border-[#CEEEF9] dark:border-sky-800/60">
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-[#0369A1] dark:text-[#7DD3FC]">Active Work Windows</p>
                <p className="text-xl font-bold text-[#171923] dark:text-white">{dayActiveWindowTasks.length}</p>
              </div>
              <Clock className="w-5 h-5 text-[#0369A1]" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#EFF8F5]/60 dark:bg-emerald-950/30 border border-[#CCEBE1] dark:border-emerald-800/60">
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-[#065F46] dark:text-[#6EE7B7]">Completed</p>
                <p className="text-xl font-bold text-[#171923] dark:text-white">{dayCompletedCount}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#065F46]" />
            </div>
          </div>

          {/* Section: Deadlines Due Today */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171923] dark:text-zinc-200">
                Deadlines Due On This Day ({dayDueTasks.length})
              </h3>
            </div>

            {dayDueTasks.length === 0 ? (
              <div className="p-8 rounded-[18px] border border-dashed border-[#D8D7DE] dark:border-zinc-800 bg-[#F4F3F5]/40 dark:bg-zinc-950/20 text-center space-y-2">
                <p className="text-sm font-semibold text-[#171923] dark:text-zinc-300">
                  No deadlines due on this day
                </p>
                <p className="text-xs text-[#777783] dark:text-zinc-500">
                  Enjoy the open space or focus on upcoming work windows below.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dayDueTasks.map((task) => {
                  const spaceStyle = getSpaceColor(task.space_color);
                  const isDone = task.status === "completed";

                  return (
                    <div
                      key={task.id}
                      onClick={() => onExpandTask(task)}
                      className="p-4 rounded-[16px] bg-white dark:bg-zinc-800/70 border border-[#D8D7DE] dark:border-zinc-700/80 hover:border-[#B78AF2] hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {onToggleStatus && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStatus(task.id, task.status);
                            }}
                            className="mt-0.5 sm:mt-0 p-1 rounded-full text-[#777783] hover:text-[#171923] dark:hover:text-white shrink-0 cursor-pointer"
                            aria-label={isDone ? "Mark as to-do" : "Mark as completed"}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="w-5 h-5 text-[#777783]" />
                            )}
                          </button>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                            >
                              {getSpaceIcon(task.space_icon, "w-3 h-3")}
                              <span>{task.space_name || "General"}</span>
                            </span>

                            {task.lead_time_days > 0 && (
                              <span className="text-[10px] font-medium text-[#777783] dark:text-zinc-400 bg-[#F4F3F5] dark:bg-zinc-700/60 px-2 py-0.5 rounded-full">
                                {task.lead_time_days}d lead time
                              </span>
                            )}
                          </div>

                          <h4
                            className={`text-sm font-semibold text-[#171923] dark:text-zinc-100 truncate ${
                              isDone ? "line-through text-[#777783] dark:text-zinc-500" : ""
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-[#777783] dark:text-zinc-400 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D8D7DE]/40">
                        <span className="text-xs font-semibold text-[#FF705B]">
                          Due Today
                        </span>
                        <span className="text-xs font-bold text-[#6B21A8] dark:text-[#D8B4FE] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          Details <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Active Work Windows Covering Today */}
          {dayActiveWindowTasks.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#D8D7DE]/60 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#171923] dark:text-zinc-200">
                    Active Work Windows Today ({dayActiveWindowTasks.length})
                  </h3>
                  <p className="text-[11px] text-[#777783] dark:text-zinc-400">
                    Tasks started or inside lead time, due at a later date
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {dayActiveWindowTasks.map((task) => {
                  const spaceStyle = getSpaceColor(task.space_color);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onExpandTask(task)}
                      className="p-3.5 rounded-[16px] bg-[#F4F3F5]/50 dark:bg-zinc-800/40 border border-[#D8D7DE] dark:border-zinc-700/60 hover:border-[#0369A1] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                        >
                          {getSpaceIcon(task.space_icon, "w-3 h-3")}
                          <span>{task.space_name}</span>
                        </span>

                        <span className="text-xs font-semibold text-[#171923] dark:text-zinc-100 truncate">
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-[11px] font-medium text-[#0369A1] dark:text-sky-300 bg-[#F0F9FE] dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-[#CEEEF9] dark:border-sky-800">
                          {formatRelativeDeadline(task.deadline)}
                        </span>
                        <span className="text-xs font-bold text-[#777783] group-hover:text-[#171923] dark:group-hover:text-white transition-colors">
                          Open →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEEKLY VIEW */}
      {/* ========================================================================= */}
      {calendarMode === "week" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* ------------------------------------------------------------- */}
          {/* MOBILE VIEW (< md): 7-Day Fit Strip + Week Agenda / Day Focus */}
          {/* ------------------------------------------------------------- */}
          <div className="md:hidden space-y-3.5">
            {/* 7-Day Fit Strip: All 7 days fit 100% on mobile screen */}
            <div className="grid grid-cols-7 gap-1 p-1.5 rounded-[18px] bg-[#F4F3F5] dark:bg-zinc-800/80 border border-[#D8D7DE] dark:border-zinc-700/80">
              {weekDates.map((dateItem, idx) => {
                const isToday = isSameDay(dateItem, new Date());
                const isSelected = isSameDay(dateItem, currentDate);
                const dayTasks = getTasksDueOnDate(dateItem);
                const dayNum = dateItem.getDate();
                const dayNameShort = dateItem.toLocaleDateString("en-US", { weekday: "short" });

                return (
                  <button
                    key={`mobile-week-strip-${idx}`}
                    type="button"
                    onClick={() => {
                      setCurrentDate(dateItem);
                      setSelectedDay(dayNum);
                      if (mobileWeekTab === "agenda") {
                        const el = document.getElementById(`week-agenda-day-${idx}`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }
                      }
                    }}
                    className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-[12px] transition-all cursor-pointer min-h-[58px] ${
                      isSelected
                        ? "bg-[#171923] text-white shadow-xs"
                        : isToday
                        ? `${userHighlight.bgLight} ${userHighlight.textDark} border ${userHighlight.border} font-bold`
                        : "hover:bg-white dark:hover:bg-zinc-700 text-[#171923] dark:text-zinc-200"
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-white/80" : "text-[#777783] dark:text-zinc-400"}`}>
                      {dayNameShort}
                    </span>
                    <span className={`text-xs font-bold mt-0.5 ${isSelected ? "text-white" : ""}`}>
                      {dayNum}
                    </span>
                    {/* Task count dot / badge */}
                    <div className="h-2 flex items-center justify-center mt-1">
                      {dayTasks.length > 0 ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#B78AF2]" : "bg-[#FF705B]"}`} />
                      ) : (
                        <span className="w-1.5 h-1.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sub-header Controls: Week Task Count & Segmented Toggle (Agenda vs Day Focus) */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#171923] dark:text-zinc-200">
                  {weekTotalTasks} {weekTotalTasks === 1 ? "task" : "tasks"} this week
                </span>
                {weekCompletedTasks > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {weekCompletedTasks} done
                  </span>
                )}
              </div>

              <div className="flex items-center bg-[#F4F3F5] dark:bg-zinc-800 p-0.5 rounded-full border border-[#D8D7DE] dark:border-zinc-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileWeekTab("agenda")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                    mobileWeekTab === "agenda"
                      ? "bg-white dark:bg-zinc-700 text-[#171923] dark:text-zinc-100 shadow-xs"
                      : "text-[#777783] dark:text-zinc-400"
                  }`}
                >
                  Week Agenda
                </button>
                <button
                  type="button"
                  onClick={() => setMobileWeekTab("day")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                    mobileWeekTab === "day"
                      ? "bg-white dark:bg-zinc-700 text-[#171923] dark:text-zinc-100 shadow-xs"
                      : "text-[#777783] dark:text-zinc-400"
                  }`}
                >
                  Day Focus
                </button>
              </div>
            </div>

            {/* Mobile Tab 1: Week Agenda (All 7 Days vertical stream) */}
            {mobileWeekTab === "agenda" && (
              <div className="space-y-2.5">
                {weekDates.map((dateItem, idx) => {
                  const isToday = isSameDay(dateItem, new Date());
                  const isSelected = isSameDay(dateItem, currentDate);
                  const dayTasks = getTasksDueOnDate(dateItem);
                  const dayNum = dateItem.getDate();

                  if (dayTasks.length === 0) {
                    return (
                      <div
                        key={`mobile-agenda-${idx}`}
                        id={`week-agenda-day-${idx}`}
                        onClick={() => {
                          setCurrentDate(dateItem);
                          setSelectedDay(dayNum);
                        }}
                        className={`flex items-center justify-between py-2 px-3 rounded-[12px] transition-all cursor-pointer ${
                          isSelected
                            ? `border ${userHighlight.border} ${userHighlight.bgLight}/40`
                            : isToday
                            ? "border border-[#171923]/25 bg-[#171923]/5"
                            : "border border-dashed border-[#D8D7DE] dark:border-zinc-800 bg-[#F4F3F5]/40 dark:bg-zinc-900/40 hover:bg-[#F4F3F5]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#171923] dark:text-zinc-200">
                            {dateItem.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#171923] text-white">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#777783] dark:text-zinc-500 font-medium">
                          No deadlines
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`mobile-agenda-${idx}`}
                      id={`week-agenda-day-${idx}`}
                      className={`rounded-[16px] border transition-all p-3 space-y-2.5 ${
                        isSelected
                          ? `border-current ${userHighlight.bgLight}/30 dark:bg-purple-950/20 ring-1.5 ${userHighlight.ring}/40`
                          : isToday
                          ? "border-[#171923]/30 bg-[#171923]/5 dark:bg-zinc-800/40"
                          : "border-[#D8D7DE] dark:border-zinc-800 bg-white dark:bg-zinc-900/60"
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#D8D7DE]/60 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#171923] dark:text-zinc-100">
                            {dateItem.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#171923] text-white">
                              Today
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${userHighlight.bgLight} ${userHighlight.textDark} border ${userHighlight.border}`}>
                          {dayTasks.length} {dayTasks.length === 1 ? "due" : "due"}
                        </span>
                      </div>

                      {/* Day Tasks */}
                      <div className="space-y-1.5">
                        {dayTasks.map((task) => {
                          const spaceStyle = getSpaceColor(task.space_color);
                          const isDone = task.status === "completed";

                          return (
                            <div
                              key={task.id}
                              onClick={() => onExpandTask(task)}
                              className="p-2.5 rounded-[12px] bg-[#FFFFFF] dark:bg-zinc-800/70 border border-[#D8D7DE] dark:border-zinc-700/80 hover:border-[#B78AF2] transition-all cursor-pointer flex items-center justify-between gap-2.5 shadow-2xs group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {onToggleStatus && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleStatus(task.id, task.status);
                                    }}
                                    className="p-1 -ml-1 text-[#777783] hover:text-[#171923] dark:hover:text-white shrink-0 cursor-pointer"
                                    aria-label={isDone ? "Mark as to-do" : "Mark as completed"}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-[#777783]" />
                                    )}
                                  </button>
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded-full border shrink-0 ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                                    >
                                      {getSpaceIcon(task.space_icon, "w-2.5 h-2.5")}
                                      <span>{task.space_name || "General"}</span>
                                    </span>
                                    {task.lead_time_days > 0 && (
                                      <span className="text-[9px] font-medium text-[#777783] dark:text-zinc-400">
                                        {task.lead_time_days}d lead
                                      </span>
                                    )}
                                  </div>

                                  <p
                                    className={`text-xs font-semibold text-[#171923] dark:text-zinc-100 truncate ${
                                      isDone ? "line-through text-[#777783] dark:text-zinc-500" : ""
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                </div>
                              </div>

                              <span className="text-[11px] font-bold text-[#6B21A8] dark:text-[#D8B4FE] shrink-0 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                                Details <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile Tab 2: Day Focus */}
            {mobileWeekTab === "day" && (
              <div className="space-y-3">
                {/* Selected Day Navigation Banner */}
                <div className="flex items-center justify-between p-3 rounded-[16px] bg-[#F4F3F5] dark:bg-zinc-800/80 border border-[#D8D7DE] dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => {
                      const prev = new Date(currentDate);
                      prev.setDate(currentDate.getDate() - 1);
                      setCurrentDate(prev);
                      setSelectedDay(prev.getDate());
                    }}
                    className="p-1.5 rounded-[10px] hover:bg-white dark:hover:bg-zinc-700 text-[#171923] dark:text-zinc-200 transition-colors cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center"
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm font-bold text-[#171923] dark:text-zinc-100">
                        {currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      {isSameDay(currentDate, new Date()) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#171923] text-white">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#777783] dark:text-zinc-400">
                      {selectedDayTasksInWeek.length} {selectedDayTasksInWeek.length === 1 ? "deadline" : "deadlines"} scheduled
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(currentDate);
                      next.setDate(currentDate.getDate() + 1);
                      setCurrentDate(next);
                      setSelectedDay(next.getDate());
                    }}
                    className="p-1.5 rounded-[10px] hover:bg-white dark:hover:bg-zinc-700 text-[#171923] dark:text-zinc-200 transition-colors cursor-pointer min-w-[34px] min-h-[34px] flex items-center justify-center"
                    aria-label="Next day"
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Tasks List */}
                {selectedDayTasksInWeek.length === 0 ? (
                  <div className="p-8 rounded-[16px] border border-dashed border-[#D8D7DE] dark:border-zinc-800 bg-[#F4F3F5]/30 dark:bg-zinc-950/20 text-center space-y-1.5">
                    <p className="text-xs font-semibold text-[#171923] dark:text-zinc-300">
                      No deadlines on this day
                    </p>
                    <p className="text-[11px] text-[#777783] dark:text-zinc-500">
                      Tap another day in the strip above or switch to Week Agenda.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayTasksInWeek.map((task) => {
                      const spaceStyle = getSpaceColor(task.space_color);
                      const isDone = task.status === "completed";

                      return (
                        <div
                          key={task.id}
                          onClick={() => onExpandTask(task)}
                          className="p-3.5 rounded-[16px] bg-white dark:bg-zinc-800/70 border border-[#D8D7DE] dark:border-zinc-700/80 hover:border-[#B78AF2] transition-all cursor-pointer flex flex-col gap-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                              >
                                {getSpaceIcon(task.space_icon, "w-3 h-3")}
                                <span>{task.space_name || "General"}</span>
                              </span>
                              {task.lead_time_days > 0 && (
                                <span className="text-[10px] font-medium text-[#777783] dark:text-zinc-400 bg-[#F4F3F5] dark:bg-zinc-700/60 px-2 py-0.5 rounded-full">
                                  {task.lead_time_days}d lead time
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-bold text-[#FF705B]">
                              Due Today
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {onToggleStatus && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleStatus(task.id, task.status);
                                }}
                                className="p-0.5 text-[#777783] hover:text-[#171923] dark:hover:text-white shrink-0 cursor-pointer"
                                aria-label={isDone ? "Mark as to-do" : "Mark as completed"}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                                ) : (
                                  <Circle className="w-5 h-5 text-[#777783]" />
                                )}
                              </button>
                            )}

                            <h4
                              className={`text-sm font-semibold text-[#171923] dark:text-zinc-100 truncate ${
                                isDone ? "line-through text-[#777783] dark:text-zinc-500" : ""
                              }`}
                            >
                              {task.title}
                            </h4>
                          </div>

                          {task.description && (
                            <p className="text-xs text-[#777783] dark:text-zinc-400 line-clamp-1 pl-7">
                              {task.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* DESKTOP VIEW (md:): 7-Column Board Grid                        */}
          {/* ------------------------------------------------------------- */}
          <div className="hidden md:grid md:grid-cols-7 gap-2.5">
            {weekDates.map((dateItem, idx) => {
              const isToday = isSameDay(dateItem, new Date());
              const isSelected = isSameDay(dateItem, currentDate);
              const dayTasks = getTasksDueOnDate(dateItem);
              const dayName = dateItem.toLocaleDateString("en-US", { weekday: "short" });
              const dayNum = dateItem.getDate();

              return (
                <div
                  key={`week-col-${idx}`}
                  onClick={() => {
                    setCurrentDate(dateItem);
                    setSelectedDay(dayNum);
                  }}
                  className={`flex flex-col rounded-[16px] border transition-all cursor-pointer p-3 min-h-[260px] ${
                    isSelected
                      ? `border-current ${userHighlight.bgLight}/50 dark:bg-purple-950/20 ring-2 ${userHighlight.ring}/40`
                      : isToday
                      ? "border-current bg-[#171923]/5 dark:bg-purple-950/10"
                      : "border-[#D8D7DE] dark:border-zinc-800 bg-[#FFFFFF] dark:bg-zinc-900/60 hover:border-[#171923]/40"
                  }`}
                >
                  {/* Column Header: Day of week + Date Number */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#D8D7DE]/60 dark:border-zinc-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#777783] dark:text-zinc-400 block">
                        {dayName}
                      </span>
                      <span
                        className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                          isToday
                            ? "bg-[#171923] text-white"
                            : isSelected
                            ? `${userHighlight.accentBg} ${userHighlight.accentText}`
                            : "text-[#171923] dark:text-zinc-200"
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {dayTasks.length > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${userHighlight.bgLight} ${userHighlight.textDark} border ${userHighlight.border}`}>
                        {dayTasks.length} {dayTasks.length === 1 ? "due" : "due"}
                      </span>
                    )}
                  </div>

                  {/* Tasks List inside Day Column */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto">
                    {dayTasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-6 text-[11px] text-[#777783] dark:text-zinc-600 italic text-center">
                        No deadlines
                      </div>
                    ) : (
                      dayTasks.map((task) => {
                        const spaceStyle = getSpaceColor(task.space_color);
                        const isDone = task.status === "completed";
                        const untouched = isTaskUntouched(task);

                        return (
                          <div
                            key={task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onExpandTask(task);
                            }}
                            className={`p-2 rounded-[10px] transition-all hover:opacity-90 cursor-pointer ${
                              untouched
                                ? "border-2 border-[#FF705B] bg-[#FFF9F7] shadow-[0_2px_8px_rgba(255,112,91,0.18)]"
                                : `border ${spaceStyle.badgeBg} ${spaceStyle.badgeBorder}`
                            }`}
                            title={`${task.title} (${task.space_name || "General"})${untouched ? " — Action needed" : ""}`}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              {getSpaceIcon(task.space_icon, "w-3 h-3 opacity-70")}
                              <span className={`text-[10px] font-semibold truncate ${spaceStyle.badgeText}`}>
                                {task.space_name}
                              </span>
                            </div>

                            <p
                              className={`text-[11px] font-semibold text-[#171923] dark:text-zinc-100 line-clamp-2 ${
                                isDone ? "line-through text-[#777783]" : ""
                              }`}
                            >
                              {task.title}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MONTHLY VIEW */}
      {/* ========================================================================= */}
      {calendarMode === "month" && (
        <div className="space-y-4 animate-in fade-in duration-200">
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

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {blanks.map((b) => (
              <div
                key={`blank-${b}`}
                className="min-h-[48px] sm:min-h-[85px] rounded-[12px] sm:rounded-[16px] bg-[#F4F3F5]/40 dark:bg-zinc-950/20 border border-transparent"
              />
            ))}

            {days.map((day) => {
              const dayTasks = tasksByDayOfMonth[day] || [];
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;
              const isSelected = selectedDay === day;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => {
                    setSelectedDay(day);
                    setCurrentDate(new Date(year, month, day));
                  }}
                  className={`min-h-[48px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-[12px] sm:rounded-[16px] border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? `border-current ${userHighlight.bgLight}/60 dark:bg-purple-950/30 ring-2 ${userHighlight.ring}/50`
                      : isToday
                      ? "border-current bg-[#171923]/5 dark:bg-purple-950/20"
                      : "border-[#D8D7DE] dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-[#171923]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? "bg-[#171923] text-white"
                          : isSelected
                          ? `${userHighlight.accentBg} ${userHighlight.accentText}`
                          : "text-[#171923] dark:text-zinc-300"
                      }`}
                    >
                      {day}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className={`hidden sm:inline-block text-[10px] font-bold ${userHighlight.textDark}`}>
                        {dayTasks.length} due
                      </span>
                    )}
                  </div>

                  {/* Tasks in Day: full pills on desktop / dots on mobile */}
                  <div className="mt-1">
                    {/* Mobile dots */}
                    <div className="flex sm:hidden items-center justify-center gap-1 pt-1">
                      {dayTasks.map((t) => (
                        <span
                          key={t.id}
                          className={`w-1.5 h-1.5 rounded-full ${userHighlight.accentBg}`}
                        />
                      ))}
                    </div>

                    {/* Desktop pills */}
                    <div className="hidden sm:block space-y-1">
                      {dayTasks.map((t) => {
                        const spaceStyle = getSpaceColor(t.space_color);
                          const isUntouched = isTaskUntouched(t);
                          return (
                            <div
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onExpandTask(t);
                              }}
                              className={`text-[10px] p-1 rounded-md font-medium truncate cursor-pointer hover:opacity-90 ${
                                isUntouched
                                  ? "border-2 border-[#FF705B] bg-[#FFF9F7] text-[#C2410C] font-bold shadow-2xs"
                                  : `border ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`
                              }`}
                              title={`${t.title} (${t.space_name || "General"})${isUntouched ? " — Action needed" : ""}`}
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

          {/* Selected Day Agenda Box */}
          <div className="mt-4 pt-4 border-t border-[#D8D7DE]/70 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#171923] dark:text-zinc-300 mb-2.5">
              Tasks for {currentDate.toLocaleString("default", { month: "long" })} {selectedDay}, {year}
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
                      className="flex items-center justify-between p-3 rounded-[16px] bg-[#F4F3F5]/60 dark:bg-zinc-800/60 border border-[#D8D7DE] dark:border-zinc-700/80 hover:border-[#B78AF2] cursor-pointer transition-all active:scale-[0.99] min-h-[48px]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${spaceStyle.badgeBg} ${spaceStyle.badgeText} ${spaceStyle.badgeBorder}`}
                        >
                          {getSpaceIcon(task.space_icon, "w-3 h-3")}
                          <span>{task.space_name}</span>
                        </span>
                        <span
                          className={`text-xs font-semibold text-[#171923] dark:text-zinc-100 truncate ${
                            isDone ? "line-through text-[#777783]" : ""
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#6B21A8] dark:text-purple-300 font-bold shrink-0 ml-2">
                        Open →
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
