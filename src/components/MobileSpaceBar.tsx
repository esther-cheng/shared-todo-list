"use client";

import React from "react";
import { Space } from "@/types";
import { getSpaceColor } from "@/lib/colors";
import { Heart, Home, Compass, CreditCard, Plus, AtSign } from "lucide-react";

interface MobileSpaceBarProps {
  spaces: Space[];
  selectedSpaceId: string;
  onSelectSpace: (id: string) => void;
  activeFilter: "all" | "tagged" | "radar";
  onSelectFilter: (filter: "all" | "tagged" | "radar") => void;
  currentUser: string;
  taggedCount: number;
  onOpenCreateSpace: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Heart className="w-3.5 h-3.5 text-[#6B21A8]" />,
  home: <Home className="w-3.5 h-3.5 text-[#C2410C]" />,
  plane: <Compass className="w-3.5 h-3.5 text-[#0369A1]" />,
  sparkles: <CreditCard className="w-3.5 h-3.5 text-[#065F46]" />,
};

export function MobileSpaceBar({
  spaces,
  selectedSpaceId,
  onSelectSpace,
  activeFilter,
  onSelectFilter,
  currentUser,
  taggedCount,
  onOpenCreateSpace,
}: MobileSpaceBarProps) {
  return (
    <div className="lg:hidden w-full overflow-x-auto no-scrollbar py-2.5 px-4 flex items-center gap-2 border-b border-[#D8D7DE] bg-[#FFFFFF]">
      {/* All Spaces */}
      <button
        onClick={() => {
          onSelectSpace("all");
          onSelectFilter("all");
        }}
        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[38px] ${
          selectedSpaceId === "all" && activeFilter === "all"
            ? "bg-[#171923] text-white shadow-xs"
            : "bg-[#F4F3F5] text-[#171923] hover:bg-[#E5D4F9]"
        }`}
      >
        <span>All spaces</span>
      </button>

      {/* Tagged for current user */}
      <button
        onClick={() => {
          onSelectFilter(activeFilter === "tagged" ? "all" : "tagged");
          onSelectSpace("all");
        }}
        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[38px] ${
          activeFilter === "tagged"
            ? "bg-[#FDF2F8] border border-[#FBCFE8] text-[#9D174D]"
            : "bg-[#F4F3F5] text-[#171923] hover:bg-[#E5D4F9]"
        }`}
      >
        <AtSign className="w-3.5 h-3.5 text-[#9D174D]" />
        <span>For @{currentUser.toLowerCase()}</span>
        {taggedCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#FF705B] text-white text-[10px] flex items-center justify-center font-bold">
            {taggedCount}
          </span>
        )}
      </button>

      {/* Each individual space */}
      {spaces.map((s) => {
        const isSelected = selectedSpaceId === s.id && activeFilter === "all";
        const color = getSpaceColor(s.color);

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
                : "bg-[#F4F3F5] text-[#171923] hover:bg-[#E5D4F9]"
            }`}
          >
            {ICON_MAP[s.icon] || <span className="w-2 h-2 rounded-full bg-[#B78AF2]" />}
            <span>{s.name}</span>
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
