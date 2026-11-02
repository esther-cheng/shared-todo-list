"use client";

import React, { useEffect, useRef, useState } from "react";
import { Space } from "@/types";
import { getSpaceIcon } from "@/lib/colors";
import { Users, Trash2, FolderOpen } from "lucide-react";

interface GroupContextMenuProps {
  space: Space;
  x: number;
  y: number;
  onClose: () => void;
  onSelectGroup: (spaceId: string) => void;
  onManageMembers: (space: Space) => void;
  onDeleteGroup: (space: Space) => void;
}

export function GroupContextMenu({
  space,
  x,
  y,
  onClose,
  onSelectGroup,
  onManageMembers,
  onDeleteGroup,
}: GroupContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x, y });

  // Reposition if menu overflows screen boundary
  useEffect(() => {
    setCoords({ x, y });
    const timer = setTimeout(() => {
      if (!menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + rect.width > screenW - 12) {
        newX = Math.max(12, screenW - rect.width - 12);
      }
      if (y + rect.height > screenH - 12) {
        newY = Math.max(12, screenH - rect.height - 12);
      }

      setCoords({ x: newX, y: newY });
    }, 0);

    return () => clearTimeout(timer);
  }, [x, y]);

  // Click outside and escape listeners
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleScroll = () => {
      onClose();
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: `${coords.y}px`, left: `${coords.x}px` }}
      className="fixed z-50 min-w-[210px] bg-[#FFFFFF] border border-[#D8D7DE] rounded-[16px] p-1.5 shadow-[0_10px_32px_rgba(23,25,35,0.14)] animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Group header preview */}
      <div className="px-2.5 py-1.5 border-b border-[#D8D7DE]/70 mb-1">
        <div className="flex items-center gap-2">
          {getSpaceIcon(space.icon, "w-3.5 h-3.5 text-[#171923]")}
          <span className="text-[12px] font-bold text-[#171923] truncate max-w-[150px]">
            {space.name}
          </span>
        </div>
        <span className="text-[10px] text-[#777783] font-medium block mt-0.5">
          Group options
        </span>
      </div>

      {/* Menu Actions */}
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onSelectGroup(space.id);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-[#171923] hover:bg-[#F4F3F5] transition-colors cursor-pointer text-left"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#777783]" />
          <span>View group tasks</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onManageMembers(space);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-[#171923] hover:bg-[#F4F3F5] transition-colors cursor-pointer text-left"
        >
          <Users className="w-3.5 h-3.5 text-[#777783]" />
          <span>Manage members</span>
        </button>

        <div className="border-t border-[#D8D7DE]/70 my-1" />

        <button
          type="button"
          onClick={() => {
            onDeleteGroup(space);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-[#FF705B] hover:bg-[#FFF0ED] hover:text-[#C2410C] transition-colors cursor-pointer text-left"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete group...</span>
        </button>
      </div>
    </div>
  );
}
