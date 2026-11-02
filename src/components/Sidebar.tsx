"use client";

import React from "react";
import { Space, FilterCounts, SearchedUser } from "@/types";
import { getSpaceIcon, getUserHighlightStyle, getUserAvatarStyle } from "@/lib/colors";
import { 
  LayoutGrid, 
  List, 
  Calendar as CalendarIcon, 
  AtSign, 
  AlertCircle,
  Plus,
  Users,
  UserPlus,
  Check,
  X
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
  onOpenFriendsModal?: () => void;
  onManageSpaceMembers?: (space: Space) => void;
  friends?: SearchedUser[];
  pendingRequestsCount?: number;
  selectedFriend?: SearchedUser | null;
  onSelectFriend?: (friend: SearchedUser | null) => void;
  onQuickAddToSpace?: (user: SearchedUser, spaceId: string) => void;
  commentTags?: string[];
  selectedCommentTag?: string | null;
  onSelectCommentTag?: (tag: string | null) => void;
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
  onOpenFriendsModal = () => {},
  onManageSpaceMembers,
  friends = [],
  pendingRequestsCount = 0,
  selectedFriend = null,
  onSelectFriend = () => {},
  onQuickAddToSpace,
  commentTags = [],
  selectedCommentTag = null,
  onSelectCommentTag = () => {},
}: SidebarProps) {
  const userHighlight = getUserHighlightStyle(userColor);
  const activeSpace = selectedSpaceId !== "all" ? spaces.find((s) => s.id === selectedSpaceId) : null;
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

      {/* Friends & People Interactive Hub */}
      <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-2.5 shadow-[0_2px_10px_rgba(23,25,35,0.02)] space-y-1.5">
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
              People & Friends
            </span>
            {pendingRequestsCount > 0 && (
              <button
                onClick={onOpenFriendsModal}
                className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#FF705B] text-white animate-pulse cursor-pointer shadow-2xs"
                title={`${pendingRequestsCount} incoming friend request${pendingRequestsCount === 1 ? "" : "s"}`}
              >
                {pendingRequestsCount} new
              </button>
            )}
          </div>
          <button
            onClick={onOpenFriendsModal}
            className="text-xs text-[#171923] font-semibold flex items-center gap-1 hover:text-[#6B21A8] transition-colors cursor-pointer"
            title="Find new users and manage friends"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Find</span>
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="p-3 text-center rounded-[12px] bg-[#F4F3F5]/60 border border-dashed border-[#D8D7DE] space-y-2">
            <p className="text-[11px] text-[#777783] leading-relaxed">
              Connect with your partner, family, or friends to share groups and assign tasks.
            </p>
            <button
              onClick={onOpenFriendsModal}
              className="w-full py-1.5 px-2.5 rounded-[9px] bg-[#171923] text-white text-[11px] font-semibold hover:bg-[#2D313E] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3 h-3" />
              <span>Find people</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1 mt-0.5">
            {friends.slice(0, 4).map((friend) => {
              const isSelected = selectedFriend?.id === friend.id;
              const avatarStyle = getUserAvatarStyle(friend.avatar_color);
              const isInActiveSpace = activeSpace?.members?.some((m) => m.user_id === friend.id) ?? false;
              const canQuickInvite = Boolean(activeSpace && !isInActiveSpace && onQuickAddToSpace);

              return (
                <div
                  key={friend.id}
                  className={`group w-full flex items-center justify-between px-2.5 py-2 rounded-[12px] text-[13px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? `${userHighlight.bgLight} ${userHighlight.textDark} font-semibold border ${userHighlight.border}`
                      : "text-[#171923] hover:bg-[#F4F3F5]"
                  }`}
                  onClick={() => onSelectFriend(isSelected ? null : friend)}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <div className={`w-6 h-6 rounded-full ${avatarStyle.bg} ${avatarStyle.text} text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs select-none`}>
                      {friend.name[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="block truncate leading-tight font-semibold text-[13px]">
                        {friend.name}
                      </span>
                      <span className="block text-[10px] text-[#777783] truncate leading-tight">
                        @{friend.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Quick Add to Active Space Action */}
                    {canQuickInvite && (
                      <button
                        type="button"
                        onClick={() => onQuickAddToSpace?.(friend, activeSpace!.id)}
                        title={`Add ${friend.name} to ${activeSpace!.name}`}
                        className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-[7px] text-[10px] font-bold bg-[#171923] text-white hover:bg-[#2D313E] transition-all cursor-pointer shadow-2xs"
                      >
                        + Group
                      </button>
                    )}

                    {/* Filter Status Indicator */}
                    {isSelected ? (
                      <button
                        onClick={() => onSelectFriend(null)}
                        title="Clear filter"
                        className="p-1 rounded-full text-[#777783] hover:text-[#FF705B] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <span 
                        title={`Click to filter tasks with @${friend.username}`}
                        className="text-[10px] text-[#777783] opacity-60 group-hover:opacity-100 group-hover:text-[#6B21A8] font-medium px-1.5"
                      >
                        Filter
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* View all friends link if more than 4 */}
            {friends.length > 4 && (
              <button
                onClick={onOpenFriendsModal}
                className="w-full text-center py-1 text-[11px] font-semibold text-[#777783] hover:text-[#171923] transition-colors cursor-pointer"
              >
                + {friends.length - 4} more friends
              </button>
            )}
          </div>
        )}
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

      {/* Tagged in Comments Filter Section */}
      {commentTags.length > 0 && (
        <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-2.5 shadow-[0_2px_10px_rgba(23,25,35,0.02)] space-y-1.5">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
              Tagged in comments
            </span>
            {selectedCommentTag && (
              <button
                type="button"
                onClick={() => onSelectCommentTag(null)}
                className="text-[11px] text-[#777783] hover:text-[#FF705B] font-semibold cursor-pointer"
                title="Clear tag filter"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1 px-1">
            {commentTags.map((tag) => {
              const isSelected = selectedCommentTag?.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectCommentTag(isSelected ? null : tag)}
                  className={`text-[12px] font-medium px-2.5 py-1 rounded-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-[#171923] text-white font-semibold shadow-xs"
                      : "bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE]"
                  }`}
                  title={isSelected ? `Filtering by ${tag}. Click to clear.` : `Filter by ${tag}`}
                >
                  <AtSign className="w-3 h-3 opacity-70" />
                  <span>{tag.replace(/^@/, "")}</span>
                  {isSelected && <X className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shared Groups Section */}
      <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-2.5 shadow-[0_2px_10px_rgba(23,25,35,0.02)]">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase">
            Groups
          </span>
          <button
            onClick={onOpenCreateSpaceModal}
            className="text-xs text-[#171923] font-semibold flex items-center gap-1 hover:text-[#6B21A8]"
            title="Create group"
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
              <span>All Groups</span>
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
                <div className="flex items-center gap-1.5 shrink-0">
                  {onManageSpaceMembers && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onManageSpaceMembers(space);
                      }}
                      title="Manage group members"
                      className="p-1 rounded-[6px] text-[#777783] hover:text-[#171923] hover:bg-[#D8D7DE]/60 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? `${userHighlight.bgLight} ${userHighlight.textDark} border ${userHighlight.border}`
                      : "bg-[#D8D7DE]/70 text-[#777783]"
                  }`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
