"use client";

import React from "react";
import { Space, FilterCounts } from "@/types";
import { getSpaceIcon, getUserHighlightStyle } from "@/lib/colors";
import { 
  LayoutGrid, 
  List, 
  Calendar as CalendarIcon, 
  AtSign, 
  AlertCircle,
  Plus
} from "lucide-react";

interface SidebarProps {
  currentView: "wall" | "list" | "calendar";
  onViewChange: (view: "wall" | "list" | "calendar") => void;
  spaces: Space[];
  selectedSpaceId: string;
  onSelectSpace: (id: string) => void;
  activeFilter: "all" | "tagged" | "radar";
  onSelectFilter: (filter: "all" | "tagged" | "radar") => void;
  currentUser: string;
  userColor?: string;
  filterCounts: FilterCounts;
  onOpenCreateSpaceModal: () => void;
}

export function Sidebar({
  currentView,
  onViewChange,
  spaces,
  selectedSpaceId,
  onSelectSpace,
  activeFilter,
  onSelectFilter,
  userColor,
  filterCounts,
  onOpenCreateSpaceModal,
}: SidebarProps) {
  const userHighlight = getUserHighlightStyle(userColor);
  return (
    <aside className="w-64 shrink-0 space-y-5">
      {/* View Switcher Panel */}
      <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-2.5 shadow-[0_2px_10px_rgba(23,25,35,0.02)]">
        <div className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase px-3 py-1.5">
          Views
        </div>
        <div className="space-y-1">
          <button
            onClick={() => onViewChange("wall")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-[14px] font-medium transition-all ${
              currentView === "wall"
                ? "bg-[#171923] text-white font-semibold"
                : "text-[#171923] hover:bg-[#F4F3F5]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Social feed</span>
          </button>

          <button
            onClick={() => onViewChange("list")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-[14px] font-medium transition-all ${
              currentView === "list"
                ? "bg-[#171923] text-white font-semibold"
                : "text-[#171923] hover:bg-[#F4F3F5]"
            }`}
          >
            <List className="w-4 h-4" />
            <span>Compact list</span>
          </button>

          <button
            onClick={() => onViewChange("calendar")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-[14px] font-medium transition-all ${
              currentView === "calendar"
                ? "bg-[#171923] text-white font-semibold"
                : "text-[#171923] hover:bg-[#F4F3F5]"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Calendar view</span>
          </button>
        </div>
      </div>

      {/* Focus Filters (Mentions & Radar) */}
      <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-2.5 shadow-[0_2px_10px_rgba(23,25,35,0.02)] space-y-1">
        <div className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase px-3 py-1.5">
          Focus
        </div>

        <button
          onClick={() => onSelectFilter("all")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[14px] font-medium transition-all ${
            activeFilter === "all"
              ? "bg-[#F4F3F5] text-[#171923] font-semibold"
              : "text-[#777783] hover:bg-[#F4F3F5] hover:text-[#171923]"
          }`}
        >
          <span>All shared tasks</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#D8D7DE]/70 text-[#171923] font-bold">
            {filterCounts.all}
          </span>
        </button>

        <button
          onClick={() => onSelectFilter("tagged")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[14px] font-medium transition-all ${
            activeFilter === "tagged"
              ? `${userHighlight.bgLight} ${userHighlight.textDark} font-semibold border ${userHighlight.border}`
              : "text-[#171923] hover:bg-[#F4F3F5]"
          }`}
        >
          <div className="flex items-center gap-2">
            <AtSign className={`w-4 h-4 ${activeFilter === "tagged" ? userHighlight.textDark : "text-[#777783]"}`} />
            <span>Tagged for you</span>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
            activeFilter === "tagged"
              ? `${userHighlight.bgLight} ${userHighlight.textDark} border ${userHighlight.border}`
              : "bg-[#D8D7DE]/70 text-[#171923]"
          }`}>
            {filterCounts.tagged}
          </span>
        </button>

        <button
          onClick={() => onSelectFilter("radar")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[14px] font-medium transition-all ${
            activeFilter === "radar"
              ? "bg-[#FFF0ED] text-[#C2410C] font-semibold border border-[#FF705B]"
              : "text-[#171923] hover:bg-[#F4F3F5]"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FF705B]" />
            <span>Action needed</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FED7CE] text-[#C2410C] font-bold">
            {filterCounts.radar}
          </span>
        </button>
      </div>

      {/* Shared Spaces Section */}
      <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-2.5 shadow-[0_2px_10px_rgba(23,25,35,0.02)]">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
            Spaces
          </span>
          <button
            onClick={onOpenCreateSpaceModal}
            className="text-xs text-[#171923] font-semibold flex items-center gap-1 hover:text-[#6B21A8]"
            title="Create space"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="space-y-1 mt-1">
          <button
            onClick={() => onSelectSpace("all")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[14px] font-medium transition-all ${
              selectedSpaceId === "all"
                ? "bg-[#F4F3F5] text-[#171923] font-semibold"
                : "text-[#777783] hover:bg-[#F4F3F5] hover:text-[#171923]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#171923]" />
              <span>All Spaces</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#D8D7DE]/70 text-[#171923] font-bold">
              {filterCounts.all}
            </span>
          </button>

          {spaces.map((space) => {
            const isSelected = selectedSpaceId === space.id;
            const count = filterCounts.spaces[space.id] ?? space.task_count ?? 0;
            return (
              <button
                key={space.id}
                onClick={() => onSelectSpace(space.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[14px] font-medium transition-all ${
                  isSelected
                    ? `${userHighlight.bgLight} ${userHighlight.textDark} font-semibold border ${userHighlight.border}`
                    : "text-[#171923] hover:bg-[#F4F3F5]"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getSpaceIcon(space.icon, isSelected ? `w-4 h-4 ${userHighlight.textDark}` : "w-4 h-4 text-[#777783]")}
                  <span className="truncate">{space.name}</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? `${userHighlight.bgLight} ${userHighlight.textDark} border ${userHighlight.border}`
                    : "bg-[#D8D7DE]/70 text-[#777783]"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
