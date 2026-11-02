"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Space, SpaceMember, SearchedUser, User } from "@/types";
import { getSpaceColor, getSpaceIcon, getUserAvatarStyle } from "@/lib/colors";
import {
  X,
  Settings,
  Users,
  Trash2,
  Check,
  Search,
  UserPlus,
  Loader2,
  AlertTriangle,
  Folder,
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
} from "lucide-react";

interface GroupSettingsModalProps {
  space: Space;
  currentUser: User;
  initialTab?: "general" | "members" | "danger";
  onClose: () => void;
  onUpdateSpace: (
    spaceId: string,
    updates: { name?: string; color?: string; icon?: string }
  ) => Promise<void>;
  onDeleteSpace: (space: Space) => void;
  onMembersChanged: () => void;
  onOpenFriendsModal?: () => void;
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
  { id: "folder", label: "Folder", icon: Folder },
  { id: "users", label: "Group", icon: Users },
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

export function GroupSettingsModal({
  space,
  currentUser,
  initialTab = "general",
  onClose,
  onUpdateSpace,
  onDeleteSpace,
  onMembersChanged,
  onOpenFriendsModal,
}: GroupSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "members" | "danger">(initialTab);

  // General tab state
  const [name, setName] = useState(space.name);
  const [color, setColor] = useState(space.color || "purple");
  const [icon, setIcon] = useState(space.icon || "folder");
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // Members tab state
  const [members, setMembers] = useState<SpaceMember[]>(space.members || []);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  // Danger / Delete state
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  const previewColor = getSpaceColor(color);
  const isOwner =
    space.created_by === currentUser.id ||
    members.some((m) => m.user_id === currentUser.id && m.role === "owner");

  // Fetch members on mount
  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/spaces/${space.id}/members`);
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error("Failed to load group members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [space.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Search users for member invite
  const searchUsers = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.users) {
        setSearchResults(data.users);
      }
    } catch (err) {
      console.error("Failed to search users:", err);
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

  // Save General details (Name, Color, Icon)
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showFeedback("error", "Group name cannot be empty");
      return;
    }

    setIsSavingGeneral(true);
    try {
      await onUpdateSpace(space.id, {
        name: name.trim(),
        color,
        icon,
      });
      showFeedback("success", "Group details updated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update group";
      showFeedback("error", msg);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  // Add Member
  const handleAddMember = async (targetUser: SearchedUser) => {
    setActionUserId(targetUser.id);
    try {
      const res = await fetch(`/api/spaces/${space.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: targetUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback("success", `${targetUser.name} added to ${name}!`);
        if (data.members) setMembers(data.members);
        else await fetchMembers();
        onMembersChanged();
      } else {
        showFeedback("error", data.error || "Failed to add member");
      }
    } catch (err) {
      console.error("Add member error:", err);
      showFeedback("error", "Failed to add member to group");
    } finally {
      setActionUserId(null);
    }
  };

  // Remove Member
  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    setActionUserId(targetUserId);
    try {
      const res = await fetch(`/api/spaces/${space.id}/members/${targetUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback("success", `${targetName} removed from group.`);
        if (data.members) setMembers(data.members);
        else await fetchMembers();
        onMembersChanged();
      } else {
        showFeedback("error", data.error || "Failed to remove member");
      }
    } catch (err) {
      console.error("Remove member error:", err);
      showFeedback("error", "Failed to remove member");
    } finally {
      setActionUserId(null);
    }
  };

  // Delete Group directly from Danger Zone with confirmation check
  const handleDeleteGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmDeleteText.trim() !== space.name.trim()) return;

    setIsDeletingGroup(true);
    try {
      onClose();
      onDeleteSpace(space);
    } catch (err) {
      console.error("Delete group error:", err);
      setIsDeletingGroup(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171923]/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FFFFFF] border border-[#D8D7DE] rounded-[24px] shadow-[0_10px_32px_rgba(23,25,35,0.12)] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-settings-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#D8D7DE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-[10px] ${previewColor.badgeBg} ${previewColor.badgeText} border ${previewColor.badgeBorder} flex items-center justify-center shadow-2xs`}>
              {getSpaceIcon(icon, `w-4 h-4 ${previewColor.badgeText}`)}
            </div>
            <div>
              <h2
                id="group-settings-title"
                className="text-[17px] font-bold text-[#171923] tracking-tight leading-tight"
              >
                {space.name} Settings
              </h2>
              <p className="text-[11px] text-[#777783]">
                Manage name, appearance, members, and group status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between animate-in fade-in ${
              feedback.type === "success"
                ? "bg-[#EFF8F5] text-[#065F46] border-b border-[#CCEBE1]"
                : "bg-[#FFF0ED] text-[#C2410C] border-b border-[#FF705B]/30"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#D8D7DE] bg-[#F4F3F5]/60 px-4 pt-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-[10px] text-xs font-semibold transition-colors cursor-pointer border-t border-x ${
              activeTab === "general"
                ? "bg-[#FFFFFF] text-[#171923] border-[#D8D7DE] border-b-transparent -mb-[1px]"
                : "border-transparent text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5]"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-[10px] text-xs font-semibold transition-colors cursor-pointer border-t border-x ${
              activeTab === "members"
                ? "bg-[#FFFFFF] text-[#171923] border-[#D8D7DE] border-b-transparent -mb-[1px]"
                : "border-transparent text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("danger")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-[10px] text-xs font-semibold transition-colors cursor-pointer border-t border-x ml-auto ${
              activeTab === "danger"
                ? "bg-[#FFFFFF] text-[#FF705B] border-[#D8D7DE] border-b-transparent -mb-[1px]"
                : "border-transparent text-[#777783] hover:text-[#FF705B] hover:bg-[#F4F3F5]"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-[#FF705B]" />
            <span>Delete Group</span>
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-5">
          {/* TAB 1: GENERAL (Edit Name, Color, Icon) */}
          {activeTab === "general" && (
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              {/* Group Name */}
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1.5 block">
                  Group Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smith Family, CB Soccer Team"
                  className="w-full text-sm px-3.5 py-2 rounded-[12px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923]"
                  required
                />
              </div>

              {/* Color Palette */}
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-2 block">
                  Accent Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_COLORS.map((c) => {
                    const isSelected = color === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        className={`flex items-center gap-2 p-2 rounded-[10px] border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#171923] bg-[#F4F3F5] shadow-xs"
                            : "border-[#D8D7DE] bg-white hover:bg-[#F4F3F5]/60"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0`} />
                        <span className="text-[11px] font-medium text-[#171923] truncate">
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-2 block">
                  Group Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-[10px] border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#171923] bg-[#171923] text-white shadow-xs"
                            : "border-[#D8D7DE] bg-white text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5]"
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[9px] font-medium mt-1 truncate max-w-full">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3.5 rounded-[14px] bg-[#F4F3F5] border border-[#D8D7DE] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#777783] font-semibold block">
                    Group Preview
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`p-1 rounded-[6px] ${previewColor.badgeBg} ${previewColor.badgeText}`}>
                      {getSpaceIcon(icon, `w-3.5 h-3.5 ${previewColor.badgeText}`)}
                    </span>
                    <span className="text-sm font-bold text-[#171923]">
                      {name || "Group Name"}
                    </span>
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${previewColor.badgeBg} ${previewColor.badgeText} ${previewColor.badgeBorder}`}>
                  Active preview
                </span>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingGeneral}
                  className="px-5 py-2.5 rounded-[12px] bg-[#171923] text-white text-xs font-semibold hover:bg-[#2D313E] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {isSavingGeneral ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MEMBERS & PEOPLE (Add People & Member Roster) */}
          {activeTab === "members" && (
            <div className="space-y-4">
              {/* Search to Add People */}
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1.5 block">
                  Add People to Group
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#777783] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or name to add..."
                    className="w-full text-xs pl-9 pr-3.5 py-2 rounded-[12px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923]"
                  />
                  {isSearching && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#777783] absolute right-3 top-2.5" />
                  )}
                </div>

                {/* Search Results List */}
                {searchQuery.trim().length > 0 && (
                  <div className="mt-2 border border-[#D8D7DE] rounded-[14px] bg-white divide-y divide-[#D8D7DE]/70 overflow-hidden max-h-48 overflow-y-auto shadow-xs">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[#777783]">
                        No users found matching "{searchQuery}"
                      </div>
                    ) : (
                      searchResults.map((usr) => {
                        const isAlreadyMember = members.some((m) => m.user_id === usr.id);
                        const isSelf = usr.id === currentUser.id;
                        const isPending = actionUserId === usr.id;
                        const avatarStyle = getUserAvatarStyle(usr.avatar_color);

                        return (
                          <div
                            key={usr.id}
                            className="p-2.5 flex items-center justify-between hover:bg-[#F4F3F5]/60 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${avatarStyle.bg} ${avatarStyle.text}`}
                              >
                                {usr.name[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-[#171923] block truncate">
                                  {usr.name} {isSelf && "(You)"}
                                </span>
                                <span className="text-[10px] text-[#777783] block truncate">
                                  @{usr.username}
                                </span>
                              </div>
                            </div>

                            {isAlreadyMember ? (
                              <span className="text-[10px] font-semibold text-[#777783] px-2 py-0.5 rounded-full bg-[#F4F3F5] border border-[#D8D7DE]">
                                Joined
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleAddMember(usr)}
                                className="px-2.5 py-1 rounded-[8px] bg-[#171923] text-white text-[11px] font-semibold hover:bg-[#2D313E] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                {isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserPlus className="w-3 h-3" />
                                )}
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Current Members List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
                    Current Members ({members.length})
                  </span>
                  {onOpenFriendsModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFriendsModal();
                      }}
                      className="text-[11px] text-[#6B21A8] hover:underline font-semibold cursor-pointer"
                    >
                      Find friends
                    </button>
                  )}
                </div>

                <div className="border border-[#D8D7DE] rounded-[14px] bg-white divide-y divide-[#D8D7DE]/70 overflow-hidden">
                  {isLoadingMembers ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-xs text-[#777783]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading members...</span>
                    </div>
                  ) : (
                    members.map((m) => {
                      const avatarStyle = getUserAvatarStyle(m.avatar_color);
                      const isSelf = m.user_id === currentUser.id;
                      const isOwnerRole = m.role === "owner";
                      const canRemove = (isOwner && !isOwnerRole) || isSelf;

                      return (
                        <div
                          key={m.user_id}
                          className="p-2.5 flex items-center justify-between hover:bg-[#F4F3F5]/40 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${avatarStyle.bg} ${avatarStyle.text}`}
                            >
                              {m.name[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[#171923] truncate">
                                  {m.name}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] text-[#777783]">(You)</span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#777783] block truncate">
                                @{m.username}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isOwnerRole
                                  ? "bg-[#EFF8F5] text-[#065F46] border border-[#CCEBE1]"
                                  : "bg-[#F4F3F5] text-[#777783] border border-[#D8D7DE]"
                              }`}
                            >
                              {isOwnerRole ? "Owner" : "Member"}
                            </span>

                            {canRemove && (
                              <button
                                type="button"
                                disabled={actionUserId === m.user_id}
                                onClick={() => handleRemoveMember(m.user_id, m.name)}
                                className="text-[11px] font-semibold text-[#777783] hover:text-[#FF705B] px-1.5 py-0.5 rounded-[6px] hover:bg-[#FFF0ED] transition-colors cursor-pointer"
                                title={isSelf ? "Leave group" : "Remove member"}
                              >
                                {isSelf ? "Leave" : "Remove"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DANGER ZONE (Delete Group) */}
          {activeTab === "danger" && (
            <div className="space-y-4">
              <div className="p-4 rounded-[14px] bg-[#FFF0ED] border border-[#FF705B]/30 space-y-2">
                <div className="flex items-center gap-2 text-[#C2410C]">
                  <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Danger Zone
                  </span>
                </div>
                <p className="text-xs text-[#C2410C] leading-relaxed">
                  Deleting <strong className="font-semibold text-[#171923]">"{space.name}"</strong> will permanently delete this group, its tasks, comments, notes, and checklist items for all members. This cannot be undone.
                </p>
              </div>

              <form onSubmit={handleDeleteGroup} className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-[#171923] block mb-1.5">
                    To permanently delete this group, type <span className="font-bold underline decoration-[#FF705B] decoration-2">{space.name}</span>:
                  </label>
                  <input
                    type="text"
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder={space.name}
                    className="w-full text-xs px-3.5 py-2.5 rounded-[12px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#FF705B] focus:outline-none text-[#171923]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      confirmDeleteText.trim() !== space.name.trim() || isDeletingGroup
                    }
                    className={`px-4 py-2.5 rounded-[12px] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                      confirmDeleteText.trim() === space.name.trim() && !isDeletingGroup
                        ? "bg-[#FF705B] text-white hover:bg-[#E0533F] cursor-pointer"
                        : "bg-[#D8D7DE]/70 text-[#777783] cursor-not-allowed opacity-60"
                    }`}
                  >
                    {isDeletingGroup ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete group permanently</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8D7DE]/70 bg-[#F4F3F5]/50 flex items-center justify-between text-xs">
          <span className="text-[#777783]">
            {isOwner ? "You are an owner of this group." : "You are a member of this group."}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] text-[#171923] font-semibold hover:bg-[#F4F3F5] transition-all cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
