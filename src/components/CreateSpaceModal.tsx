"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  BookOpen,
  Search,
  UserPlus,
  Users,
  Lock,
  Globe,
  Loader2
} from "lucide-react";
import { getSpaceColor, getUserAvatarStyle } from "@/lib/colors";
import { SearchedUser, Space } from "@/types";

interface CreateSpaceModalProps {
  onClose: () => void;
  onCreateSpace: (name: string, color: string, icon: string, memberIds?: string[]) => Promise<void | Space>;
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

  // Members selection
  const [selectedUsers, setSelectedUsers] = useState<SearchedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const visibleColors = showAllColors ? AVAILABLE_COLORS : AVAILABLE_COLORS.slice(0, 5);
  const visibleIcons = showAllIcons ? AVAILABLE_ICONS : AVAILABLE_ICONS.slice(0, 5);

  const previewColor = getSpaceColor(color);
  const SelectedIconComponent = AVAILABLE_ICONS.find((i) => i.id === icon)?.icon || Heart;

  // Search users for invite
  const searchUsers = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.users) {
        setSearchResults(data.users);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const toggleSelectUser = (user: SearchedUser) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const memberIds = selectedUsers.map((u) => u.id);
      await onCreateSpace(name.trim(), color, icon, memberIds);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to create group");
      }
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
        className="relative w-full max-w-md bg-[#FFFFFF] rounded-[20px] max-h-[90vh] flex flex-col shadow-2xl border border-[#D8D7DE] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] flex items-center justify-between px-5 py-3.5 border-b border-[#D8D7DE] shrink-0">
          <h3 className="font-semibold text-[16px] text-[#171923] flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-[#171923]" />
            New group
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
          {errorMessage && (
            <div className="p-2.5 rounded-[10px] bg-[#FFF2EE] border border-[#FEDACE] text-[#C2410C] text-xs">
              {errorMessage}
            </div>
          )}

          {/* Group Name Input */}
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Group Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Smith Family, CB Soccer Team, Book Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-[12px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[42px]"
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

          {/* Add People Section (Option to add people when you make a space) */}
          <div className="pt-2 border-t border-[#D8D7DE]/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#171923]" />
                <span>Add People (Optional)</span>
              </label>
              <span className="text-[11px] text-[#777783]">
                {selectedUsers.length} selected
              </span>
            </div>

            {/* Selected user chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70">
                {selectedUsers.map((u) => {
                  const style = getUserAvatarStyle(u.avatar_color);
                  return (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFFFFF] border border-[#D8D7DE] text-[#171923] shadow-xs"
                    >
                      <span className={`w-4 h-4 rounded-full ${style.bg} ${style.text} text-[9px] flex items-center justify-center font-bold`}>
                        {u.name[0]?.toUpperCase() || "U"}
                      </span>
                      <span>{u.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(u)}
                        className="text-[#777783] hover:text-[#171923] cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* User Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#777783] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends or public users..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923]"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 text-[#777783] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* User Search Dropdown / List */}
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-[10px] border border-[#D8D7DE]/60 p-1 bg-[#FFFFFF]">
              {searchResults.length === 0 ? (
                <p className="text-[11px] text-[#777783] p-2 text-center">
                  {isSearching ? "Searching..." : "No users found."}
                </p>
              ) : (
                searchResults.map((user) => {
                  const style = getUserAvatarStyle(user.avatar_color);
                  const isSelected = selectedUsers.some((u) => u.id === user.id);
                  const isFriend = user.friendship_status === "friends";
                  const canAdd = user.can_add_to_space || !user.is_private || isFriend;

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-2 rounded-[8px] transition-colors ${
                        isSelected
                          ? "bg-[#EFF8F5] border border-[#CCEBE1]"
                          : "hover:bg-[#F4F3F5]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-full ${style.bg} ${style.text} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                          {user.name[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-[#171923] truncate">
                              {user.name}
                            </span>
                            {user.is_private ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[#B78AF2]/15 text-[#6B21A8]">
                                <Lock className="w-2 h-2" />
                                Private
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[#A8DCCB]/25 text-[#065F46]">
                                <Globe className="w-2 h-2" />
                                Public
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#777783] block truncate">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      {canAdd ? (
                        <button
                          type="button"
                          onClick={() => toggleSelectUser(user)}
                          className={`px-2.5 py-1 rounded-[7px] text-[11px] font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#065F46] text-white"
                              : "bg-[#171923] text-white hover:bg-[#2D313E]"
                          }`}
                        >
                          {isSelected ? "Added" : "+ Add"}
                        </button>
                      ) : (
                        <span
                          title="This user has a private profile. You can only add them if you are friends."
                          className="text-[10px] text-[#777783] bg-[#F4F3F5] px-2 py-0.5 rounded-[6px] border border-[#D8D7DE]"
                        >
                          Friends only
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 flex items-center justify-between">
            <span className="text-[11px] text-[#777783] font-medium">Preview</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${previewColor.badgeBg} ${previewColor.badgeText} ${previewColor.badgeBorder}`}
            >
              <SelectedIconComponent className="w-3.5 h-3.5" />
              <span>{name.trim() || "Group Name"}</span>
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
              {isSubmitting ? "Creating..." : "Create group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
