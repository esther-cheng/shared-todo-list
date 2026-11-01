"use client";

import React from "react";
import { 
  LayoutGrid, 
  List, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  Plus 
} from "lucide-react";

interface MobileBottomNavProps {
  currentView: "wall" | "list" | "calendar";
  onViewChange: (view: "wall" | "list" | "calendar") => void;
  activeFilter: "all" | "tagged" | "radar";
  onSelectFilter: (filter: "all" | "tagged" | "radar") => void;
  radarCount: number;
  onOpenCreateTask: () => void;
}

export function MobileBottomNav({
  currentView,
  onViewChange,
  activeFilter,
  onSelectFilter,
  radarCount,
  onOpenCreateTask,
}: MobileBottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#D8D7DE] safe-pb shadow-[0_-4px_16px_rgba(23,25,35,0.04)]">
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-md mx-auto">
        {/* Wall Feed */}
        <button
          onClick={() => {
            onViewChange("wall");
            if (activeFilter === "radar") onSelectFilter("all");
          }}
          className={`flex flex-col items-center justify-center flex-1 h-12 rounded-[12px] transition-all ${
            currentView === "wall" && activeFilter !== "radar"
              ? "text-[#171923] font-bold"
              : "text-[#777783] font-medium"
          }`}
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Feed</span>
        </button>

        {/* List View */}
        <button
          onClick={() => {
            onViewChange("list");
            if (activeFilter === "radar") onSelectFilter("all");
          }}
          className={`flex flex-col items-center justify-center flex-1 h-12 rounded-[12px] transition-all ${
            currentView === "list" && activeFilter !== "radar"
              ? "text-[#171923] font-bold"
              : "text-[#777783] font-medium"
          }`}
        >
          <List className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">List</span>
        </button>

        {/* Center Primary Action Button (FAB) */}
        <div className="flex-1 flex justify-center items-center">
          <button
            onClick={onOpenCreateTask}
            className="w-12 h-12 rounded-full bg-[#171923] text-white flex items-center justify-center shadow-md active:scale-95 transition-all -translate-y-2 ring-4 ring-[#FFFFFF]"
            aria-label="Add New Task"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Radar View */}
        <button
          onClick={() => {
            onSelectFilter(activeFilter === "radar" ? "all" : "radar");
          }}
          className={`relative flex flex-col items-center justify-center flex-1 h-12 rounded-[12px] transition-all ${
            activeFilter === "radar"
              ? "text-[#C2410C] font-bold"
              : "text-[#777783] font-medium"
          }`}
        >
          <div className="relative">
            <AlertCircle className="w-5 h-5 mb-0.5" />
            {radarCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 text-[9px] font-bold rounded-full bg-[#FF705B] text-white flex items-center justify-center px-0.5">
                {radarCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Radar</span>
        </button>

        {/* Calendar View */}
        <button
          onClick={() => {
            onViewChange("calendar");
            if (activeFilter === "radar") onSelectFilter("all");
          }}
          className={`flex flex-col items-center justify-center flex-1 h-12 rounded-[12px] transition-all ${
            currentView === "calendar" && activeFilter !== "radar"
              ? "text-[#171923] font-bold"
              : "text-[#777783] font-medium"
          }`}
        >
          <CalendarIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Calendar</span>
        </button>
      </div>
    </nav>
  );
}
