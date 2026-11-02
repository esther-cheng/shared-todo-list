"use client";

import React from "react";
import { Space, FilterCounts } from "@/types";
import { getSpaceColor, getSpaceIcon, getUserHighlightStyle } from "@/lib/colors";
import { Plus, AtSign, AlertTriangle } from "lucide-react";

interface MobileSpaceBarProps {
  spaces: Space[];
  selectedSpaceId: string;
  onSelectSpace: (id: string) => void;
  activeFilter: "all" | "tagged" | "radar";
  onSelectFilter: (filter: "all" | "tagged" | "radar") => void;
  currentUser: string;
  userColor?: string;
  filterCounts: FilterCounts;
  onOpenCreateSpace: () => void;
}

export function MobileSpaceBar({
  spaces,
  selectedSpaceId,
  onSelectSpace,
  activeFilter,
  onSelectFilter,
  userColor,
  filterCounts,
  onOpenCreateSpace,
}: MobileSpaceBarProps) {
  const userHighlight = getUserHighlightStyle(userColor);
  return (
    <div className="lg:hidden w-full overflow-x-auto no-scrollbar py-2.5 px-4 flex items-center gap-2 border-b border-[#D8D7DE] bg-[#FFFFFF]">
      {/* All Spaces / Groups */}
      <button
        onClick={() => {
          onSelectSpace("all");
          onSelectFilter("all");
        }}
        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[38px] ${
          selectedSpaceId === "all" && activeFilter === "all"
            ? "bg-[#171923] text-white shadow-xs"
            : "bg-[#F4F3F5] text-[#171923] hover:bg-[#EAE8ED]"
        }`}
      >
        <span>All groups</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            selectedSpaceId === "all" && activeFilter === "all"
              ? "bg-white/20 text-white"
              : "bg-[#D8D7DE] text-[#171923]"
          }`}
        >
          {filterCounts.all}
        </span>
      </button>

      {/* Tagged for current user */}
      <button
        onClick={() => {
          onSelectFilter(activeFilter === "tagged" ? "all" : "tagged");
          onSelectSpace("all");
        }}
        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[38px] ${
          activeFilter === "tagged"
            ? `${userHighlight.bgLight} border ${userHighlight.border} ${userHighlight.textDark}`
            : "bg-[#F4F3F5] text-[#171923] hover:bg-[#EAE8ED]"
        }`}
      >
        <AtSign className={`w-3.5 h-3.5 ${activeFilter === "tagged" ? userHighlight.textDark : "text-[#777783]"}`} />
        <span>Tagged for you</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeFilter === "tagged"
              ? `${userHighlight.bgLight} ${userHighlight.textDark} border ${userHighlight.border}`
              : "bg-[#D8D7DE] text-[#171923]"
          }`}
        >
          {filterCounts.tagged}
        </span>
      </button>

      {/* Action needed (Radar) */}
      <button
        onClick={() => {
          onSelectFilter(activeFilter === "radar" ? "all" : "radar");
          onSelectSpace("all");
        }}
        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[38px] ${
          activeFilter === "radar"
            ? "bg-[#FFF0ED] border border-[#FF705B] text-[#C2410C]"
            : "bg-[#F4F3F5] text-[#171923] hover:bg-[#EAE8ED]"
        }`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-[#FF705B]" />
        <span>Action needed</span>
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            activeFilter === "radar"
              ? "bg-[#FF705B] text-white"
              : "bg-[#FED7CE] text-[#C2410C]"
          }`}
        >
          {filterCounts.radar}
        </span>
      </button>

      {/* Each individual space */}
      {spaces.map((s) => {
        const isSelected = selectedSpaceId === s.id && activeFilter === "all";
        const color = getSpaceColor(s.color);
        const count = filterCounts.spaces[s.id] ?? s.task_count ?? 0;

        return (
          <button
            key={s.id}
            onClick={() => {
              onSelectSpace(s.id);
              onSelectFilter("all");
            }}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[38px] ${
              isSelected
                ? `${color.badgeBg} ${color.badgeText} border ${color.badgeBorder} shadow-2xs`
                : "bg-[#F4F3F5] text-[#171923] hover:bg-[#EAE8ED]"
            }`}
          >
            {getSpaceIcon(s.icon, "w-3.5 h-3.5")}
            <span>{s.name}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isSelected
                  ? "bg-[#171923]/10 text-[#171923]"
                  : "bg-[#D8D7DE] text-[#171923]"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* Add New Space */}
      <button
        onClick={onOpenCreateSpace}
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[#171923] bg-white border border-[#D8D7DE] hover:bg-[#F4F3F5] min-h-[38px]"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>New</span>
      </button>
    </div>
  );
}
