"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Space, SpaceMember, SearchedUser, User } from "@/types";
import { getUserAvatarStyle, getSpaceIcon, getSpaceColor } from "@/lib/colors";
import { 
  X, 
  Search, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Loader2, 
  Check, 
  AlertCircle,
  Trash2
} from "lucide-react";

interface SpaceMembersModalProps {
  space: Space;
  currentUser: User;
  onClose: () => void;
  onMembersUpdated: () => void;
  onOpenFriendsModal?: () => void;
  onDeleteSpace?: (space: Space) => void;
}

export function SpaceMembersModal({
  space,
  currentUser,
  onClose,
  onMembersUpdated,
  onOpenFriendsModal,
  onDeleteSpace,
}: SpaceMembersModalProps) {
  const [members, setMembers] = useState<SpaceMember[]>(space.members || []);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const spaceColor = getSpaceColor(space.color);
  const isOwner = space.created_by === currentUser.id || members.some((m) => m.user_id === currentUser.id && m.role === "owner");

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  // Fetch current members
  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/spaces/${space.id}/members`);
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error("Failed to load space members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [space.id]);

  // Search users to add
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
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Add member to space
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
        showFeedback("success", `${targetUser.name} added to ${space.name}!`);
        if (data.members) setMembers(data.members);
        else await fetchMembers();
        onMembersUpdated();
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

  // Remove member from group
  const handleRemoveMember = async (targetUserId: string, name: string) => {
    setActionUserId(targetUserId);
    try {
      const res = await fetch(`/api/spaces/${space.id}/members/${targetUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback("success", `Removed ${name} from group`);
        if (data.members) setMembers(data.members);
        else await fetchMembers();
        onMembersUpdated();
      } else {
        showFeedback("error", data.error || "Failed to remove member");
      }
    } catch (err) {
      console.error("Remove member error:", err);
      showFeedback("error", "Failed to remove member from group");
    } finally {
      setActionUserId(null);
    }
  };

  // Friend user inline if private
  const handleFriendUser = async (targetUser: SearchedUser) => {
    setActionUserId(targetUser.id);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: targetUser.id }),
      });
      if (res.ok) {
        showFeedback("success", `Friended ${targetUser.name}! You can now add them to this group.`);
        await searchUsers(searchQuery);
      } else {
        showFeedback("error", "Failed to connect with user");
      }
    } catch (err) {
      console.error("Friend error:", err);
      showFeedback("error", "Failed to add friend");
    } finally {
      setActionUserId(null);
    }
  };

  const memberIds = new Set(members.map((m) => m.user_id));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171923]/50 backdrop-blur-xs transition-all overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#FFFFFF] rounded-[22px] border border-[#D8D7DE] shadow-[0_10px_32px_rgba(23,25,35,0.12)] overflow-hidden my-auto flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D8D7DE]/70 bg-[#FFFFFF] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center border shrink-0 ${spaceColor.badgeBg} ${spaceColor.badgeText} ${spaceColor.badgeBorder}`}>
              {getSpaceIcon(space.icon, "w-4 h-4")}
            </div>
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold text-[#171923] tracking-tight truncate flex items-center gap-2">
                <span>{space.name}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D8D7DE]/70 text-[#171923]">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </span>
              </h2>
              <p className="text-[12px] text-[#777783]">
                Manage who can view, assign, and comment on tasks in this group.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className={`mx-5 mt-3 p-2.5 rounded-[12px] text-xs flex items-center gap-2 animate-in fade-in ${
            feedback.type === "success"
              ? "bg-[#EFF8F5] border border-[#CCEBE1] text-[#065F46]"
              : "bg-[#FFF2EE] border border-[#FEDACE] text-[#C2410C]"
          }`}>
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* SECTION 1: Current Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
                Current Members ({members.length})
              </span>
            </div>

            {isLoadingMembers ? (
              <div className="py-6 flex justify-center text-[#777783]">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const avatarStyle = getUserAvatarStyle(member.avatar_color);
                  const isUserSelf = member.user_id === currentUser.id;
                  const isUserOwner = member.role === "owner";
                  const canRemove = (isOwner && !isUserOwner) || (isUserSelf && !isUserOwner);
                  const isActionLoading = actionUserId === member.user_id;

                  return (
                    <div
                      key={member.user_id}
                      className="p-3 rounded-[14px] bg-[#FFFFFF] border border-[#D8D7DE] flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-bold text-xs flex items-center justify-center shrink-0 shadow-xs select-none`}>
                          {member.name[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[14px] text-[#171923] truncate">
                              {member.name} {isUserSelf && "(You)"}
                            </span>
                            {isUserOwner ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#171923] text-white">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Owner
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F3F5] text-[#777783] border border-[#D8D7DE]">
                                Member
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#777783] block truncate">
                            @{member.username}
                          </span>
                        </div>
                      </div>

                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id, member.name)}
                          disabled={isActionLoading}
                          className="px-2.5 py-1 rounded-[8px] text-xs font-semibold text-[#777783] hover:text-[#FF705B] hover:bg-[#FFF0ED] border border-[#D8D7DE] transition-colors cursor-pointer"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isUserSelf ? (
                            "Leave"
                          ) : (
                            "Remove"
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: Add People to Group */}
          <div className="space-y-3 pt-2 border-t border-[#D8D7DE]/70">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
                Add People to Group
              </span>
              <span className="text-[11px] text-[#777783]">
                Friends & Public users only
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#777783] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find users by name or @username..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-[12px] text-[13px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[42px]"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-[#777783] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Search results list */}
            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#777783] bg-[#F4F3F5]/50 rounded-[14px] border border-dashed border-[#D8D7DE]">
                  {isSearching ? "Searching..." : "No users found."}
                </div>
              ) : (
                searchResults.map((user) => {
                  const avatarStyle = getUserAvatarStyle(user.avatar_color);
                  const isAlreadyMember = memberIds.has(user.id);
                  const isActionLoading = actionUserId === user.id;
                  const isFriend = user.friendship_status === "friends";
                  const canAdd = user.can_add_to_space || !user.is_private || isFriend;

                  return (
                    <div
                      key={user.id}
                      className="p-3 rounded-[14px] bg-[#FFFFFF] border border-[#D8D7DE] flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-bold text-xs flex items-center justify-center shrink-0 select-none shadow-xs`}>
                          {user.name[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[13px] text-[#171923] truncate">
                              {user.name}
                            </span>
                            {user.is_private ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#B78AF2]/15 text-[#6B21A8]">
                                <Lock className="w-2.5 h-2.5" />
                                Private
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#A8DCCB]/25 text-[#065F46]">
                                <Globe className="w-2.5 h-2.5" />
                                Public
                              </span>
                            )}
                            {isFriend && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF8F5] text-[#065F46] border border-[#CCEBE1]">
                                Friend
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#777783] block truncate">
                            @{user.username}
                          </span>
                        </div>
                      </div>

                      {/* Add Button or Status */}
                      <div className="shrink-0">
                        {isAlreadyMember ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-[8px] bg-[#F4F3F5] text-[#777783] border border-[#D8D7DE]">
                            Joined
                          </span>
                        ) : canAdd ? (
                          <button
                            onClick={() => handleAddMember(user)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-[9px] bg-[#171923] text-white hover:bg-[#2D313E] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                          >
                            {isActionLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            Add to group
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleFriendUser(user)}
                              disabled={isActionLoading}
                              title="Private users must be your friend before adding to groups"
                              className="px-2.5 py-1.5 rounded-[9px] bg-[#B78AF2]/20 hover:bg-[#B78AF2]/30 text-[#6B21A8] text-xs font-semibold flex items-center gap-1 border border-[#B78AF2]/40 cursor-pointer transition-all"
                            >
                              {isActionLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              Friend first
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8D7DE]/70 bg-[#F4F3F5]/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#777783]">
              {isOwner ? "You are the owner of this group." : "You are a member of this group."}
            </span>
            {onDeleteSpace && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteSpace(space);
                }}
                className="text-[#FF705B] hover:text-[#C2410C] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete group...</span>
              </button>
            )}
            {onOpenFriendsModal && (
              <button
                type="button"
                onClick={onOpenFriendsModal}
                className="text-[#6B21A8] hover:underline font-semibold cursor-pointer"
              >
                • Find friends
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] bg-[#171923] text-white font-semibold hover:bg-[#2D313E] transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
