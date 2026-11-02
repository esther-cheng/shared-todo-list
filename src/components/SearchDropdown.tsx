"use client";

import React, { useState, useEffect } from "react";
import { Task, User, SearchedUser } from "@/types";
import { getUserAvatarStyle, getSpaceIcon, getSpaceColor } from "@/lib/colors";
import { 
  CheckSquare, 
  AtSign, 
  Users, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Globe, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Loader2
} from "lucide-react";

interface SearchDropdownProps {
  query: string;
  tasks: Task[];
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
  onSelectUser?: (user: SearchedUser) => void;
  onFilterByMention?: (mention: string) => void;
}

export function SearchDropdown({
  query,
  tasks,
  currentUser,
  isOpen,
  onClose,
  onSelectTask,
  onSelectUser,
  onFilterByMention,
}: SearchDropdownProps) {
  const [users, setUsers] = useState<SearchedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const cleanQuery = query.trim().toLowerCase();
  const searchTag = cleanQuery.replace(/^@/, "");

  // Debounced search for users
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUsers = async () => {
      setIsSearchingUsers(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchTag)}`);
        const data = await res.json();
        if (isMounted && data.users) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to fetch users for search:", err);
      } finally {
        if (isMounted) setIsSearchingUsers(false);
      }
    };

    const timer = setTimeout(fetchUsers, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, searchTag]);

  if (!isOpen) return null;

  // 1. FILTER TASKS
  const matchingTasks = tasks.filter((t) => {
    if (!cleanQuery) return true;
    const matchTitle = t.title.toLowerCase().includes(cleanQuery);
    const matchDesc = t.description?.toLowerCase().includes(cleanQuery) ?? false;
    const matchSpace = t.space_name?.toLowerCase().includes(cleanQuery) ?? false;
    const matchCategory = t.category?.toLowerCase().includes(cleanQuery) ?? false;
    return matchTitle || matchDesc || matchSpace || matchCategory;
  }).slice(0, 5);

  // 2. FILTER MENTIONS
  // Find tasks where tagged_users contains the query, or notes contain @query
  const matchingMentions = tasks.flatMap((t) => {
    const hits: { task: Task; mention: string; noteSnippet?: string }[] = [];
    
    // Check tagged_users
    if (t.tagged_users && t.tagged_users.length > 0) {
      for (const tu of t.tagged_users) {
        const tag = tu.toLowerCase().replace(/^@/, "");
        if (!cleanQuery || tag.includes(searchTag) || cleanQuery.includes(tag)) {
          hits.push({
            task: t,
            mention: tu.startsWith("@") ? tu : `@${tu}`,
            noteSnippet: t.latest_note?.content,
          });
        }
      }
    }

    // Check latest note mention if not already captured
    if (t.latest_note?.content && hits.length === 0) {
      const content = t.latest_note.content.toLowerCase();
      if (cleanQuery && (content.includes(`@${searchTag}`) || content.includes(searchTag))) {
        hits.push({
          task: t,
          mention: `@${searchTag}`,
          noteSnippet: t.latest_note.content,
        });
      }
    }

    return hits;
  }).slice(0, 4);

  // 3. USERS
  const matchingUsers = users.slice(0, 4);

  const totalHits = matchingTasks.length + matchingMentions.length + matchingUsers.length;

  return (
    <div 
      className="fixed inset-x-3 top-[56px] sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-full sm:mt-2 bg-[#FFFFFF] rounded-[20px] border border-[#D8D7DE] shadow-[0_10px_32px_rgba(23,25,35,0.12)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[75vh] flex flex-col text-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="overflow-y-auto divide-y divide-[#D8D7DE]/50">
        {totalHits === 0 && !isSearchingUsers ? (
          <div className="p-8 text-center text-[#777783] space-y-1.5">
            <p className="font-semibold text-[13px] text-[#171923]">
              No matches found
            </p>
            <p className="text-[11px]">
              No tasks, mentions, or users found for &ldquo;{query}&rdquo;.
            </p>
          </div>
        ) : (
          <>
            {/* SECTION 1: TASKS */}
            {matchingTasks.length > 0 && (
              <div className="p-2 sm:p-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#777783]">
                  <CheckSquare className="w-3.5 h-3.5 text-[#B78AF2]" />
                  <span>Tasks ({matchingTasks.length})</span>
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {matchingTasks.map((task) => {
                    const spaceColor = getSpaceColor(task.space_color);
                    const isDone = task.status === "completed";

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => {
                          onSelectTask(task);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-[12px] hover:bg-[#F4F3F5] transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-[#A8DCCB] shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#777783] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className={`block font-semibold text-[13px] text-[#171923] truncate ${
                              isDone ? "line-through text-[#777783]" : ""
                            }`}>
                              {task.title}
                            </span>
                            {task.description && (
                              <p className="text-[11px] text-[#777783] truncate mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {task.space_name && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${spaceColor.badgeBg} ${spaceColor.badgeText} ${spaceColor.badgeBorder}`}>
                              {task.space_name}
                            </span>
                          )}
                          {task.deadline && (
                            <span className="text-[10px] text-[#777783] hidden sm:flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(task.deadline).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: MENTIONS */}
            {matchingMentions.length > 0 && (
              <div className="p-2 sm:p-2.5 bg-[#FCFBFC]">
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#777783]">
                  <AtSign className="w-3.5 h-3.5 text-[#FF705B]" />
                  <span>Mentions ({matchingMentions.length})</span>
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {matchingMentions.map(({ task, mention, noteSnippet }, idx) => (
                    <button
                      key={`${task.id}-mention-${idx}`}
                      type="button"
                      onClick={() => {
                        onSelectTask(task);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-[12px] hover:bg-[#F4F3F5] transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FFF0ED] text-[#C2410C] border border-[#FF705B]/30 font-bold text-[11px] shrink-0">
                          <AtSign className="w-3 h-3 text-[#FF705B]" />
                          <span>{mention.replace(/^@/, "")}</span>
                        </span>
                        <div className="min-w-0">
                          <span className="block font-semibold text-[13px] text-[#171923] truncate">
                            {task.title}
                          </span>
                          {noteSnippet && (
                            <p className="text-[11px] text-[#777783] truncate italic mt-0.5">
                              &ldquo;{noteSnippet}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-[#777783] group-hover:text-[#171923]">
                        <span className="text-[11px] hidden sm:inline">View note</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: USERS */}
            {matchingUsers.length > 0 && (
              <div className="p-2 sm:p-2.5">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#777783]">
                    <Users className="w-3.5 h-3.5 text-[#065F46]" />
                    <span>Users ({matchingUsers.length})</span>
                  </div>
                  {isSearchingUsers && (
                    <Loader2 className="w-3 h-3 text-[#777783] animate-spin" />
                  )}
                </div>
                <div className="space-y-0.5 mt-0.5">
                  {matchingUsers.map((user) => {
                    const avatarStyle = getUserAvatarStyle(user.avatar_color);
                    const isFriend = user.friendship_status === "friends";

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          onSelectUser?.(user);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-[12px] hover:bg-[#F4F3F5] transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-bold text-xs flex items-center justify-center shrink-0 shadow-xs select-none`}>
                            {user.name[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[13px] text-[#171923] truncate">
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
                            <span className="text-[11px] text-[#777783] block truncate">
                              @{user.username}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isFriend ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF8F5] text-[#065F46] border border-[#CCEBE1]">
                              Friend
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-[#777783] group-hover:text-[#171923]">
                              View profile
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Helper */}
      <div className="px-4 py-2 border-t border-[#D8D7DE]/60 bg-[#F4F3F5]/80 flex items-center justify-between text-[11px] text-[#777783]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#B78AF2]" />
          <span>Quick tip: type <strong>@name</strong> to find specific mentions</span>
        </div>
        <span className="hidden sm:inline">Press Esc to close</span>
      </div>
    </div>
  );
}

