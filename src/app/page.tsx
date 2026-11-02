"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Task, Space, User, FilterCounts, SearchedUser, FriendsData } from "@/types";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MobileSpaceBar } from "@/components/MobileSpaceBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { TaskCard } from "@/components/TaskCard";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { CreateSpaceModal } from "@/components/CreateSpaceModal";
import { AuthModal } from "@/components/AuthModal";
import { UserSettingsModal } from "@/components/UserSettingsModal";
import { UntouchedRadar } from "@/components/UntouchedRadar";
import { CalendarView } from "@/components/CalendarView";
import { ListView } from "@/components/ListView";
import { WelcomeView } from "@/components/WelcomeView";
import { FriendsModal } from "@/components/FriendsModal";
import { SpaceMembersModal } from "@/components/SpaceMembersModal";
import { GroupSettingsModal } from "@/components/GroupSettingsModal";
import { GroupContextMenu } from "@/components/GroupContextMenu";
import { DeleteSpaceModal } from "@/components/DeleteSpaceModal";
import { isTaskUntouched, isTaskTaggedForUser, getUserHighlightStyle } from "@/lib/colors";
import { TASK_CATEGORIES, getCategory } from "@/lib/categories";
import { Loader2, CheckSquare, Users, X, AtSign, Tag, Settings } from "lucide-react";

export default function HomePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const userColor = currentUser?.avatar_color || "purple";
  const userHighlight = getUserHighlightStyle(userColor);

  // Sync dynamic CSS variables to root based on user's color profile
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--color-primary", userHighlight.primaryHex);
      document.documentElement.style.setProperty("--color-primary-light", userHighlight.lightHex);
      document.documentElement.style.setProperty("--color-primary-text", userHighlight.textHex);
      document.documentElement.style.setProperty("--color-primary-border", userHighlight.borderHex);
    }
  }, [userHighlight]);

  // Filters & State
  const [currentView, setCurrentView] = useState<"wall" | "list" | "calendar">("wall");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "tagged" | "radar">("all");
  const [selectedFriend, setSelectedFriend] = useState<SearchedUser | null>(null);
  const [selectedCommentTag, setSelectedCommentTag] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [friendsData, setFriendsData] = useState<FriendsData>({
    friends: [],
    pending_incoming: [],
    pending_outgoing: [],
  });

  // Modals
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<"profile" | "color" | "notifications" | "security">("profile");
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [selectedSpaceForMembers, setSelectedSpaceForMembers] = useState<Space | null>(null);
  const [selectedSpaceForSettings, setSelectedSpaceForSettings] = useState<Space | null>(null);
  const [groupSettingsInitialTab, setGroupSettingsInitialTab] = useState<"general" | "members" | "danger">("general");
  const [contextMenuSpace, setContextMenuSpace] = useState<{ space: Space; x: number; y: number } | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>([]);

  // Persistent stored filter counts
  const [filterCounts, setFilterCounts] = useState<FilterCounts>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("tandem_filter_counts");
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    return { all: 0, tagged: 0, radar: 0, spaces: {} };
  });

  // Fetch current user session
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Failed to check auth:", err);
      setCurrentUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [spacesRes, tasksRes, friendsRes] = await Promise.all([
        fetch("/api/spaces"),
        fetch("/api/tasks"),
        fetch("/api/friends"),
      ]);
      const spacesData = await spacesRes.json();
      const tasksData = await tasksRes.json();
      const friendsDataRes = await friendsRes.json();

      if (spacesData.spaces) {
        setSpaces(spacesData.spaces);
      }
      if (tasksData.tasks) {
        setTasks(tasksData.tasks);
      }
      if (friendsDataRes.friends) {
        setFriendsData({
          friends: friendsDataRes.friends || [],
          pending_incoming: friendsDataRes.pending_incoming || [],
          pending_outgoing: friendsDataRes.pending_outgoing || [],
        });
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Load dismissed notifications from localStorage per user
  useEffect(() => {
    if (currentUser) {
      try {
        const stored = localStorage.getItem(`tandem_dismissed_notifs_${currentUser.id}`);
        if (stored) {
          setDismissedTaskIds(JSON.parse(stored));
        } else {
          setDismissedTaskIds([]);
        }
      } catch (err) {
        console.error("Failed to load dismissed notifications:", err);
      }
    } else {
      setDismissedTaskIds([]);
    }
  }, [currentUser]);

  const handleDismissNotification = (taskId: string) => {
    setDismissedTaskIds((prev) => {
      const next = Array.from(new Set([...prev, taskId]));
      if (currentUser) {
        try {
          localStorage.setItem(`tandem_dismissed_notifs_${currentUser.id}`, JSON.stringify(next));
        } catch (e) {
          console.error("Failed to persist dismissed notifications:", e);
        }
      }
      return next;
    });
  };

  const handleDismissAllNotifications = () => {
    const allTaggedIds = tasks.filter((t) => isTaskTaggedForUser(t, currentUser)).map((t) => t.id);
    setDismissedTaskIds((prev) => {
      const next = Array.from(new Set([...prev, ...allTaggedIds]));
      if (currentUser) {
        try {
          localStorage.setItem(`tandem_dismissed_notifs_${currentUser.id}`, JSON.stringify(next));
        } catch (e) {
          console.error("Failed to persist dismissed notifications:", e);
        }
      }
      return next;
    });
  };

  const handleResetDismissedNotifications = () => {
    setDismissedTaskIds([]);
    if (currentUser) {
      try {
        localStorage.removeItem(`tandem_dismissed_notifs_${currentUser.id}`);
      } catch (e) {
        console.error("Failed to clear dismissed notifications:", e);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setTasks([]);
      setSpaces([]);
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  // Handle task expand & reload single task with notes
  const handleExpandTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      const data = await res.json();
      if (data.task) {
        setExpandedTask(data.task);
      } else {
        setExpandedTask(task);
      }
    } catch {
      setExpandedTask(task);
    }
  };

  // Toggle quick status
  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "todo" : "completed";
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Update task details
  const handleUpdateTask = async (updatedFields: Partial<Task>) => {
    if (!expandedTask) return;
    try {
      const res = await fetch(`/api/tasks/${expandedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      const data = await res.json();
      if (data.task) {
        setExpandedTask((prev) => (prev ? { ...prev, ...data.task } : null));
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // Add note / @mention
  const handleAddNote = async (content: string) => {
    if (!expandedTask) return;
    try {
      const authorName = currentUser ? currentUser.name : "Guest";
      const res = await fetch(`/api/tasks/${expandedTask.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: authorName,
          content,
        }),
      });
      const data = await res.json();
      if (data.note) {
        setExpandedTask((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            notes: [...(prev.notes || []), data.note],
            notes_count: (prev.notes_count || 0) + 1,
          };
        });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      setExpandedTask(null);
      fetchData();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Create new task
  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    space_id: string;
    category?: string | null;
    deadline: string | null;
    lead_time_days: number;
    created_by: string;
  }) => {
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          created_by: currentUser ? currentUser.name : taskData.created_by,
        }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  // Create space
  const handleCreateSpace = async (
    name: string,
    color: string = "purple",
    icon: string = "folder",
    memberIds?: string[]
  ): Promise<Space> => {
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, icon, member_ids: memberIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create space");
      }
      if (data.space) {
        setSpaces((prev) => {
          if (prev.some((s) => s.id === data.space.id)) return prev;
          return [...prev, data.space];
        });
        setSelectedSpaceId(data.space.id);
        return data.space;
      }
      throw new Error("No space returned");
    } catch (err) {
      console.error("Failed to create space:", err);
      throw err;
    }
  };

  // Delete space
  const handleDeleteSpace = async (spaceId: string) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete group");
      }
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      setTasks((prev) => prev.filter((t) => t.space_id !== spaceId));
      if (selectedSpaceId === spaceId) {
        setSelectedSpaceId("all");
      }
      fetchData();
    } catch (err) {
      console.error("Failed to delete group:", err);
      throw err;
    }
  };

  // Update space (name, color, icon)
  const handleUpdateSpace = async (
    spaceId: string,
    updates: { name?: string; color?: string; icon?: string }
  ) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update group");
      }
      if (data.space) {
        setSpaces((prev) =>
          prev.map((s) => (s.id === spaceId ? { ...s, ...data.space } : s))
        );
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update group:", err);
      throw err;
    }
  };

  // Quick add friend to active space from sidebar
  const handleQuickAddToSpace = async (user: SearchedUser, spaceId: string) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to quick add friend to space:", err);
    }
  };

  // All unique users tagged in comments across tasks
  const commentTags = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) {
      if (t.tagged_users && Array.isArray(t.tagged_users)) {
        for (const u of t.tagged_users) {
          if (u && typeof u === "string" && u.trim()) {
            const formatted = u.startsWith("@") ? u : `@${u}`;
            map.set(formatted.toLowerCase(), formatted);
          }
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  // Filter tasks based on search, space, focus filter, friend, and tagged comments
  const filteredTasks = tasks.filter((t) => {
    // Space filter
    if (selectedSpaceId !== "all" && t.space_id !== selectedSpaceId) {
      return false;
    }

    // Category filter
    if (selectedCategoryFilter) {
      if (t.category !== selectedCategoryFilter) return false;
    }

    // Friend filter
    if (selectedFriend) {
      const isTagged = isTaskTaggedForUser(t, selectedFriend.username);
      const authorMatch =
        (t.created_by || "").toLowerCase() === selectedFriend.name.toLowerCase() ||
        (t.created_by || "").toLowerCase() === selectedFriend.username.toLowerCase();
      if (!isTagged && !authorMatch) return false;
    }

    // Filter by person tagged in comments
    if (selectedCommentTag) {
      const cleanTarget = selectedCommentTag.toLowerCase().replace(/^@/, "");
      const isTaggedInComments = t.tagged_users?.some((u) => {
        if (!u || typeof u !== "string") return false;
        const cleanU = u.toLowerCase().replace(/^@/, "");
        return cleanU === cleanTarget;
      }) ?? false;
      if (!isTaggedInComments) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const qClean = q.replace(/^@/, "");
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) ?? false;
      const matchSpace = t.space_name?.toLowerCase().includes(q) ?? false;
      const matchCategory = t.category?.toLowerCase().includes(q) ?? false;
      const matchTaggedUser = t.tagged_users?.some((u) => {
        if (!u || typeof u !== "string") return false;
        const uLower = u.toLowerCase();
        const uClean = uLower.replace(/^@/, "");
        return uLower.includes(q) || uClean.includes(qClean);
      }) ?? false;
      if (!matchTitle && !matchDesc && !matchSpace && !matchCategory && !matchTaggedUser) return false;
    }

    // Special focus filter
    if (activeFilter === "radar") {
      return isTaskUntouched(t);
    }

    if (activeFilter === "tagged") {
      return isTaskTaggedForUser(t, currentUser);
    }

    return true;
  });

  const radarCount = filterCounts.radar;
  const taggedTasks = tasks.filter((t) => isTaskTaggedForUser(t, currentUser));
  const activeTaggedTasks = taggedTasks.filter((t) => !dismissedTaskIds.includes(t.id));
  const activeTaggedCount = activeTaggedTasks.length;

  // Store and synchronize filter task counts
  useEffect(() => {
    const counts: FilterCounts = {
      all: tasks.length,
      tagged: tasks.filter((t) => isTaskTaggedForUser(t, currentUser)).length,
      radar: tasks.filter((t) => isTaskUntouched(t)).length,
      spaces: {},
    };

    for (const s of spaces) {
      counts.spaces[s.id] = 0;
    }

    for (const t of tasks) {
      if (t.space_id) {
        counts.spaces[t.space_id] = (counts.spaces[t.space_id] || 0) + 1;
      }
    }

    setFilterCounts(counts);
    try {
      localStorage.setItem("tandem_filter_counts", JSON.stringify(counts));
    } catch (e) {
      console.error("Failed to store filter counts:", e);
    }
  }, [tasks, spaces, currentUser]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F4F3F5] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B78AF2]" />
        <span className="text-xs font-semibold text-[#777783] tracking-wide uppercase">
          Loading Tandem...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <WelcomeView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F3F5] text-[#171923] flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenSettings={() => {
          setSettingsInitialTab("profile");
          setIsSettingsModalOpen(true);
        }}
        onOpenNotificationSettings={() => {
          setSettingsInitialTab("notifications");
          setIsSettingsModalOpen(true);
        }}
        onOpenFriends={() => setIsFriendsModalOpen(true)}
        tasks={tasks}
        onSelectUser={() => setIsFriendsModalOpen(true)}
        taggedTasks={taggedTasks}
        dismissedTaskIds={dismissedTaskIds}
        onDismissTask={handleDismissNotification}
        onDismissAll={handleDismissAllNotifications}
        onResetDismissed={handleResetDismissedNotifications}
        onSelectTask={handleExpandTask}
        taggedCount={activeTaggedCount}
        userColor={userColor}
        onOpenTaggedFilter={() => {
          setActiveFilter("tagged");
          setSelectedSpaceId("all");
        }}
        onFilterByMention={(mention) => {
          setSelectedCommentTag(mention);
          setSelectedSpaceId("all");
        }}
      />

      {/* Mobile Horizontal Space Carousel (< lg) */}
      <MobileSpaceBar
        spaces={spaces}
        selectedSpaceId={selectedSpaceId}
        onSelectSpace={setSelectedSpaceId}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        currentUser={currentUser ? currentUser.username : "alex"}
        userColor={userColor}
        filterCounts={filterCounts}
        onOpenCreateSpace={() => setIsSpaceModalOpen(true)}
        onContextMenuSpace={(space, x, y) => setContextMenuSpace({ space, x, y })}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-5 sm:py-7 pb-28 lg:pb-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Desktop Left Navigation Sidebar (Hidden on mobile) */}
          <div className="hidden lg:block w-64 shrink-0">
            <Sidebar
              currentView={currentView}
              onViewChange={setCurrentView}
              spaces={spaces}
              selectedSpaceId={selectedSpaceId}
              onSelectSpace={setSelectedSpaceId}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              currentUser={currentUser ? currentUser.name : "Alex"}
              userColor={userColor}
              filterCounts={filterCounts}
              onOpenCreateSpaceModal={() => setIsSpaceModalOpen(true)}
              onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
              onManageSpaceMembers={(sp) => setSelectedSpaceForMembers(sp)}
              onContextMenuSpace={(space, x, y) => setContextMenuSpace({ space, x, y })}
              friends={friendsData.friends}
              pendingRequestsCount={friendsData.pending_incoming.length}
              selectedFriend={selectedFriend}
              onSelectFriend={setSelectedFriend}
              onQuickAddToSpace={handleQuickAddToSpace}
              commentTags={commentTags}
              selectedCommentTag={selectedCommentTag}
              onSelectCommentTag={setSelectedCommentTag}
            />
          </div>

          {/* Center Main Stage */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* Filter Status Bar */}
            <div className="flex items-center justify-between gap-2 px-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#171923] text-[14px]">
                  {selectedSpaceId === "all"
                    ? "All groups"
                    : spaces.find((s) => s.id === selectedSpaceId)?.name}
                </span>

                {/* Specific space/group members manage button */}
                {selectedSpaceId !== "all" && (() => {
                  const currentSpace = spaces.find((s) => s.id === selectedSpaceId);
                  if (!currentSpace) return null;
                  const memberCount = currentSpace.members?.length ?? currentSpace.member_count ?? 1;
                  return (
                    <button
                      onClick={() => {
                        setSelectedSpaceForSettings(currentSpace);
                        setGroupSettingsInitialTab("members");
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] hover:border-[#171923] hover:bg-[#F4F3F5] text-xs font-semibold text-[#777783] hover:text-[#171923] transition-all cursor-pointer shadow-xs"
                      title="Add people and manage members"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {memberCount} {memberCount === 1 ? "member" : "members"}
                      </span>
                      <span className="text-[#6B21A8] font-bold ml-0.5">+ Add people</span>
                    </button>
                  );
                })()}

                {activeFilter !== "all" && (
                  <span className={`font-semibold px-2.5 py-0.5 rounded-full ${userHighlight.bgLight} ${userHighlight.textDark} border ${userHighlight.border}`}>
                    Filter: {activeFilter === "tagged" ? "Tagged for you" : activeFilter === "radar" ? "Action needed" : activeFilter}
                  </span>
                )}

                {/* Friend Filter Badge */}
                {selectedFriend && (
                  <span className="font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF8F5] text-[#065F46] border border-[#CCEBE1] inline-flex items-center gap-1.5 shadow-2xs">
                    <span>With @{selectedFriend.username}</span>
                    <button
                      onClick={() => setSelectedFriend(null)}
                      className="hover:text-[#FF705B] cursor-pointer"
                      title="Clear friend filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Tagged in Comments Active Badge */}
                {selectedCommentTag && (
                  <span className="font-semibold px-2.5 py-0.5 rounded-full bg-[#F4ECFC] text-[#6B21A8] border border-[#E5D4F9] inline-flex items-center gap-1.5 shadow-2xs">
                    <AtSign className="w-3 h-3 text-[#6B21A8]" />
                    <span>Tagged: {selectedCommentTag}</span>
                    <button
                      onClick={() => setSelectedCommentTag(null)}
                      className="hover:text-[#FF705B] cursor-pointer"
                      title="Clear tagged in comments filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Category Active Filter Badge */}
                {selectedCategoryFilter && (() => {
                  const cat = getCategory(selectedCategoryFilter);
                  return (
                    <span className={`font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs border ${cat?.badgeBg || "bg-[#F4F3F5]"} ${cat?.badgeText || "text-[#171923]"} ${cat?.badgeBorder || "border-[#D8D7DE]"}`}>
                      <Tag className="w-3 h-3" />
                      <span>{cat?.label || selectedCategoryFilter}</span>
                      <button
                        onClick={() => setSelectedCategoryFilter(null)}
                        className="hover:text-[#FF705B] cursor-pointer"
                        title="Clear category filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })()}

                <span className="text-[#777783] font-normal">
                  ({filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"})
                </span>
              </div>

              {/* Group Settings button (all the way to the right) */}
              {selectedSpaceId !== "all" && (() => {
                const currentSpace = spaces.find((s) => s.id === selectedSpaceId);
                if (!currentSpace) return null;
                return (
                  <div className="shrink-0 ml-auto">
                    <button
                      onClick={() => {
                        setSelectedSpaceForSettings(currentSpace);
                        setGroupSettingsInitialTab("general");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] hover:border-[#171923] hover:bg-[#F4F3F5] text-xs font-semibold text-[#171923] transition-all cursor-pointer shadow-xs"
                      title="Group settings (edit name/color, add people, delete group)"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#777783]" />
                      <span>Settings</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Quick Category Filter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter(null)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                  !selectedCategoryFilter
                    ? "bg-[#171923] text-white border-[#171923] shadow-xs"
                    : "bg-[#FFFFFF] text-[#777783] border-[#D8D7DE] hover:bg-[#F4F3F5] hover:text-[#171923]"
                }`}
              >
                All categories
              </button>
              {TASK_CATEGORIES.map((cat) => {
                const isSelected = selectedCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(isSelected ? null : cat.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#171923] text-white border-[#171923] shadow-xs"
                        : "bg-[#FFFFFF] text-[#171923] border-[#D8D7DE] hover:bg-[#F4F3F5] hover:border-[#B78AF2]"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : cat.dotBg}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tagged in Comments Filter Pills */}
            {commentTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap px-1 text-xs">
                <span className="text-[11px] font-semibold text-[#777783] flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-[#B78AF2]" />
                  <span>Tagged in comments:</span>
                </span>
                {commentTags.map((tag) => {
                  const isSelected = selectedCommentTag?.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedCommentTag(isSelected ? null : tag)}
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-[#171923] text-white shadow-xs font-bold"
                          : "bg-[#FFFFFF] text-[#171923] border border-[#D8D7DE] hover:border-[#171923]"
                      }`}
                      title={isSelected ? `Filtering by ${tag}. Click to clear.` : `Filter tasks where ${tag} is tagged in comments`}
                    >
                      <span>{tag}</span>
                      {isSelected && <X className="w-2.5 h-2.5" />}
                    </button>
                  );
                })}
                {selectedCommentTag && (
                  <button
                    type="button"
                    onClick={() => setSelectedCommentTag(null)}
                    className="text-[11px] text-[#777783] hover:text-[#FF705B] font-medium underline ml-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* View Render */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-[#777783] gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#B78AF2]" />
                <span className="text-xs font-medium">Loading tasks...</span>
              </div>
            ) : activeFilter === "radar" ? (
              <div className="space-y-4">
                <UntouchedRadar
                  tasks={tasks}
                  onExpandTask={handleExpandTask}
                />
              </div>
            ) : currentView === "wall" ? (
              <div className="space-y-3.5">
                {filteredTasks.length === 0 ? (
                  <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-12 text-center text-[#777783] space-y-2">
                    <CheckSquare className="w-8 h-8 text-[#D8D7DE] mx-auto stroke-[1.5]" />
                    <p className="text-[15px] font-semibold text-[#171923]">No tasks found</p>
                    <p className="text-xs text-[#777783]">
                      Create your first task using the + New Task button.
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      userColor={userColor}
                      onExpand={handleExpandTask}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))
                )}
              </div>
            ) : currentView === "list" ? (
              <ListView
                tasks={filteredTasks}
                onExpandTask={handleExpandTask}
                onToggleStatus={handleToggleStatus}
              />
            ) : (
              <CalendarView
                tasks={filteredTasks}
                userColor={userColor}
                onExpandTask={handleExpandTask}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <MobileBottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        radarCount={radarCount}
        onOpenCreateTask={() => setIsCreateModalOpen(true)}
      />

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            fetchData();
          }}
        />
      )}

      {/* Task Expand Modal */}
      {expandedTask && (
        <TaskDetailModal
          task={expandedTask}
          spaces={spaces}
          currentUser={currentUser ? currentUser.name : "Alex"}
          currentUsername={currentUser ? currentUser.username : "alex"}
          userColor={currentUser?.avatar_color}
          onClose={() => setExpandedTask(null)}
          onUpdateTask={handleUpdateTask}
          onAddNote={handleAddNote}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          spaces={spaces}
          currentUser={currentUser ? currentUser.name : "Alex"}
          userColor={userColor}
          defaultSpaceId={selectedSpaceId !== "all" ? selectedSpaceId : undefined}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTask={handleCreateTask}
          onCreateSpace={async (name: string) => {
            return await handleCreateSpace(name, "purple", "folder");
          }}
        />
      )}

      {/* Create Space Modal */}
      {isSpaceModalOpen && (
        <CreateSpaceModal
          onClose={() => setIsSpaceModalOpen(false)}
          onCreateSpace={handleCreateSpace}
        />
      )}

      {/* User Settings Modal */}
      {isSettingsModalOpen && currentUser && (
        <UserSettingsModal
          user={currentUser}
          initialTab={settingsInitialTab}
          onClose={() => setIsSettingsModalOpen(false)}
          onUpdateUser={(updatedUser) => {
            setCurrentUser(updatedUser);
            fetchData();
          }}
        />
      )}

      {/* Friends & People Modal */}
      {isFriendsModalOpen && currentUser && (
        <FriendsModal
          currentUser={currentUser}
          onClose={() => setIsFriendsModalOpen(false)}
          onFriendsChanged={fetchData}
        />
      )}

      {/* Space Members Modal */}
      {selectedSpaceForMembers && currentUser && (
        <SpaceMembersModal
          space={selectedSpaceForMembers}
          currentUser={currentUser}
          onClose={() => setSelectedSpaceForMembers(null)}
          onMembersUpdated={fetchData}
          onOpenFriendsModal={() => {
            setSelectedSpaceForMembers(null);
            setIsFriendsModalOpen(true);
          }}
          onDeleteSpace={(sp) => setSpaceToDelete(sp)}
        />
      )}

      {/* Group Context Menu (Right Click & Options Trigger) */}
      {contextMenuSpace && (
        <GroupContextMenu
          space={contextMenuSpace.space}
          x={contextMenuSpace.x}
          y={contextMenuSpace.y}
          onClose={() => setContextMenuSpace(null)}
          onSelectGroup={(id) => {
            setSelectedSpaceId(id);
            setActiveFilter("all");
          }}
          onManageMembers={(sp) => {
            setSelectedSpaceForSettings(sp);
            setGroupSettingsInitialTab("members");
          }}
          onOpenSettings={(sp) => {
            setSelectedSpaceForSettings(sp);
            setGroupSettingsInitialTab("general");
          }}
          onDeleteGroup={(sp) => setSpaceToDelete(sp)}
        />
      )}

      {/* Group Settings Modal (Edit Name/Color/Icon, Add People, Delete Group) */}
      {selectedSpaceForSettings && currentUser && (
        <GroupSettingsModal
          space={selectedSpaceForSettings}
          currentUser={currentUser}
          initialTab={groupSettingsInitialTab}
          onClose={() => setSelectedSpaceForSettings(null)}
          onUpdateSpace={handleUpdateSpace}
          onDeleteSpace={(sp) => {
            setSelectedSpaceForSettings(null);
            setSpaceToDelete(sp);
          }}
          onMembersChanged={fetchData}
          onOpenFriendsModal={() => {
            setSelectedSpaceForSettings(null);
            setIsFriendsModalOpen(true);
          }}
        />
      )}

      {/* Delete Group Confirmation Modal (Requires typing group name) */}
      {spaceToDelete && (
        <DeleteSpaceModal
          space={spaceToDelete}
          onClose={() => setSpaceToDelete(null)}
          onConfirmDelete={handleDeleteSpace}
        />
      )}
    </div>
  );
}
