"use client";

import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";

interface CreateSpaceModalProps {
  onClose: () => void;
  onCreateSpace: (name: string, color: string, icon: string) => Promise<void>;
}

export function CreateSpaceModal({ onClose, onCreateSpace }: CreateSpaceModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("purple");
  const [icon, setIcon] = useState("heart");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = [
    { id: "purple", label: "Lavender (Primary)" },
    { id: "orange", label: "Coral (Warm emphasis)" },
    { id: "sky", label: "Sky (Travel & plans)" },
    { id: "emerald", label: "Mint (Finance & health)" },
    { id: "rose", label: "Rose (Personal & gifts)" },
  ];

  const icons = [
    { id: "heart", label: "Heart (Shared couples)" },
    { id: "home", label: "Home (Household admin)" },
    { id: "plane", label: "Compass (Travel & outings)" },
    { id: "sparkles", label: "Credit card (Finance & future)" },
  ];

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
        className="relative w-full max-w-sm bg-[#FFFFFF] rounded-[18px] max-h-[82vh] flex flex-col shadow-2xl border border-[#D8D7DE] overflow-hidden my-auto"
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
            className="w-8 h-8 rounded-full bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Space Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wedding, Roommates, Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[40px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Color Accent
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:outline-none text-[#171923] min-h-[40px]"
            >
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Icon Symbol
            </label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:outline-none text-[#171923] min-h-[40px]"
            >
              {icons.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#D8D7DE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] text-xs font-semibold text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-[10px] text-xs font-semibold text-white bg-[#171923] hover:bg-[#2D313E] disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create space"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
