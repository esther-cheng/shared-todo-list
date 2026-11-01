"use client";

import React, { useState } from "react";
import { 
  X, 
  FolderPlus, 
  Check, 
  Heart, 
  Home, 
  Compass, 
  CreditCard, 
  Gift, 
  Calendar, 
  ShoppingBag, 
  Briefcase, 
  Star, 
  BookOpen 
} from "lucide-react";
import { getSpaceColor } from "@/lib/colors";

interface CreateSpaceModalProps {
  onClose: () => void;
  onCreateSpace: (name: string, color: string, icon: string) => Promise<void>;
}

const AVAILABLE_COLORS = [
  { id: "purple", label: "Lavender", bg: "bg-[#B78AF2]" },
  { id: "orange", label: "Coral", bg: "bg-[#FF705B]" },
  { id: "sky", label: "Sky", bg: "bg-[#BFEAF7]" },
  { id: "emerald", label: "Mint", bg: "bg-[#A8DCCB]" },
  { id: "rose", label: "Rose", bg: "bg-[#F472B6]" },
  { id: "amber", label: "Honey", bg: "bg-[#FBBF24]" },
  { id: "indigo", label: "Indigo", bg: "bg-[#818CF8]" },
  { id: "teal", label: "Teal", bg: "bg-[#2DD4BF]" },
  { id: "pink", label: "Blush", bg: "bg-[#F43F5E]" },
  { id: "slate", label: "Slate", bg: "bg-[#94A3B8]" },
];

const AVAILABLE_ICONS = [
  { id: "heart", label: "Heart", icon: Heart },
  { id: "home", label: "Home", icon: Home },
  { id: "plane", label: "Travel", icon: Compass },
  { id: "sparkles", label: "Finances", icon: CreditCard },
  { id: "gift", label: "Gift", icon: Gift },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "briefcase", label: "Work", icon: Briefcase },
  { id: "star", label: "Star", icon: Star },
  { id: "book", label: "Book", icon: BookOpen },
];

export function CreateSpaceModal({ onClose, onCreateSpace }: CreateSpaceModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("purple");
  const [icon, setIcon] = useState("heart");
  const [showAllColors, setShowAllColors] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleColors = showAllColors ? AVAILABLE_COLORS : AVAILABLE_COLORS.slice(0, 5);
  const visibleIcons = showAllIcons ? AVAILABLE_ICONS : AVAILABLE_ICONS.slice(0, 5);

  const previewColor = getSpaceColor(color);
  const SelectedIconComponent = AVAILABLE_ICONS.find((i) => i.id === icon)?.icon || Heart;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateSpace(name, color, icon);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171923]/50 backdrop-blur-xs transition-all overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm bg-[#FFFFFF] rounded-[18px] max-h-[85vh] flex flex-col shadow-2xl border border-[#D8D7DE] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with high-visibility Close Button */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] flex items-center justify-between px-5 py-3 border-b border-[#D8D7DE] shrink-0">
          <h3 className="font-semibold text-[15px] text-[#171923] flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#171923]" />
            New space
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Space Name Input */}
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Space Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wedding, Travel, Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[40px]"
            />
          </div>

          {/* Visual Color Palette Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
                Color Accent
              </label>
              <button
                type="button"
                onClick={() => setShowAllColors((prev) => !prev)}
                className="text-[11px] font-semibold text-[#6B21A8] hover:text-[#171923] transition-colors cursor-pointer"
              >
                {showAllColors ? "See less" : `See more (${AVAILABLE_COLORS.length - 5} more)`}
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-0.5">
              {visibleColors.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    title={c.label}
                    aria-label={c.label}
                    className={`h-9 rounded-[10px] ${c.bg} transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-[#171923] shadow-xs scale-105"
                        : "opacity-80 hover:opacity-100 hover:scale-102"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-[#171923] stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Icon Grid Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
                Icon Symbol
              </label>
              <button
                type="button"
                onClick={() => setShowAllIcons((prev) => !prev)}
                className="text-[11px] font-semibold text-[#6B21A8] hover:text-[#171923] transition-colors cursor-pointer"
              >
                {showAllIcons ? "See less" : `See more (${AVAILABLE_ICONS.length - 5} more)`}
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-0.5">
              {visibleIcons.map((i) => {
                const IconComponent = i.icon;
                const isSelected = icon === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setIcon(i.id)}
                    title={i.label}
                    aria-label={i.label}
                    className={`h-10 rounded-[10px] border transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? "border-[#171923] bg-[#171923] text-white ring-2 ring-offset-2 ring-[#171923] shadow-xs scale-105"
                        : "border-[#D8D7DE] bg-[#F4F3F5] text-[#171923] hover:bg-[#FFFFFF] hover:border-[#B78AF2]"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 flex items-center justify-between">
            <span className="text-[11px] text-[#777783] font-medium">Preview</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${previewColor.badgeBg} ${previewColor.badgeText} ${previewColor.badgeBorder}`}
            >
              <SelectedIconComponent className="w-3.5 h-3.5" />
              <span>{name.trim() || "Space Name"}</span>
            </span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#D8D7DE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-[10px] text-xs font-semibold text-white bg-[#171923] hover:bg-[#2D313E] disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              {isSubmitting ? "Creating..." : "Create space"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
