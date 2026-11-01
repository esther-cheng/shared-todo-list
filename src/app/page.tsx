"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Task, Space, User } from "@/types";
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
import { isTaskUntouched, isTaskTaggedForUser } from "@/lib/colors";
import { Plus, Loader2, CheckSquare } from "lucide-react";

export default function HomePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & State
  const [currentView, setCurrentView] = useState<"wall" | "list" | "calendar">("wall");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "tagged" | "radar">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>([]);

  // Quick inline add
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSpaceId, setQuickSpaceId] = useState("");

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
      const [spacesRes, tasksRes] = await Promise.all([
        fetch("/api/spaces"),
        fetch("/api/tasks"),
      ]);
      const spacesData = await spacesRes.json();
      const tasksData = await tasksRes.json();

      if (spacesData.spaces) {
        setSpaces(spacesData.spaces);
        if (!quickSpaceId && spacesData.spaces.length > 0) {
          setQuickSpaceId(spacesData.spaces[0].id);
        }
      }
      if (tasksData.tasks) {
        setTasks(tasksData.tasks);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [quickSpaceId]);

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

  // Quick wall post
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickSpaceId) return;

    await handleCreateTask({
      title: quickTitle,
      description: "",
      space_id: quickSpaceId,
      deadline: null,
      lead_time_days: 0,
      created_by: currentUser ? currentUser.name : "Alex",
    });
    setQuickTitle("");
  };

  // Create space
  const handleCreateSpace = async (name: string, color: string, icon: string) => {
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, icon }),
      });
      const data = await res.json();
      if (data.space) {
        setSpaces((prev) => [...prev, data.space]);
      }
    } catch (err) {
      console.error("Failed to create space:", err);
    }
  };

  // Filter tasks based on search, space, and focus filter
  const currentUsername = currentUser ? currentUser.username.toLowerCase() : "alex";

  const filteredTasks = tasks.filter((t) => {
    // Space filter
    if (selectedSpaceId !== "all" && t.space_id !== selectedSpaceId) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) ?? false;
      const matchSpace = t.space_name?.toLowerCase().includes(q) ?? false;
      if (!matchTitle && !matchDesc && !matchSpace) return false;
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

  const radarCount = tasks.filter((t) => isTaskUntouched(t)).length;
  const taggedTasks = tasks.filter((t) => isTaskTaggedForUser(t, currentUser));
  const activeTaggedTasks = taggedTasks.filter((t) => !dismissedTaskIds.includes(t.id));
  const activeTaggedCount = activeTaggedTasks.length;

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
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        taggedTasks={taggedTasks}
        dismissedTaskIds={dismissedTaskIds}
        onDismissTask={handleDismissNotification}
        onDismissAll={handleDismissAllNotifications}
        onResetDismissed={handleResetDismissedNotifications}
        onSelectTask={handleExpandTask}
        taggedCount={activeTaggedCount}
        onOpenTaggedFilter={() => {
          setActiveFilter("tagged");
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
        taggedCount={activeTaggedCount}
        onOpenCreateSpace={() => setIsSpaceModalOpen(true)}
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
              taggedCount={activeTaggedCount}
              radarCount={radarCount}
              onOpenCreateSpaceModal={() => setIsSpaceModalOpen(true)}
            />
          </div>

          {/* Center Main Stage */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* Quick Add Post Box (Social Wall Style) */}
            {currentView === "wall" && (
              <div className="bg-[#FFFFFF] border border-[#D8D7DE] rounded-[18px] p-3 sm:p-4 shadow-[0_2px_10px_rgba(23,25,35,0.02)] transition-all">
                <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder={
                      currentUser
                        ? `Post as ${currentUser.name}...`
                        : "Post a shared task to the wall..."
                    }
                    className="flex-1 text-[14px] px-3.5 py-2.5 rounded-[12px] bg-[#F4F3F5] border border-transparent focus:border-[#B78AF2] focus:bg-[#FFFFFF] focus:outline-none transition-all placeholder:text-[#777783] text-[#171923] min-h-[44px]"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={quickSpaceId}
                      onChange={(e) => setQuickSpaceId(e.target.value)}
                      className="text-[13px] font-medium px-3 py-2 rounded-[12px] bg-[#F4F3F5] border border-transparent focus:outline-none cursor-pointer text-[#171923] min-h-[44px] flex-1 sm:flex-none"
                    >
                      {spaces.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      disabled={!quickTitle.trim()}
                      className="min-h-[44px] px-5 rounded-[12px] text-xs font-semibold text-white bg-[#171923] hover:bg-[#2D313E] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter Status Bar */}
            <div className="flex items-center justify-between gap-2 px-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#171923] text-[14px]">
                  {selectedSpaceId === "all"
                    ? "All spaces"
                    : spaces.find((s) => s.id === selectedSpaceId)?.name}
                </span>
                {activeFilter !== "all" && (
                  <span className="font-semibold px-2.5 py-0.5 rounded-full bg-[#F5EEFD] text-[#6B21A8] border border-[#E5D4F9]">
                    Filter: {activeFilter}
                  </span>
                )}
                <span className="text-[#777783] font-normal">
                  ({filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"})
                </span>
              </div>
            </div>

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
                      Post your first task using the input above or tap the + button.
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
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
                onExpandTask={handleExpandTask}
              />
            )}
          </div>

          {/* Right Sidebar: Untouched Radar Window (Desktop only) */}
          <div className="hidden lg:block w-80 shrink-0 space-y-6">
            <UntouchedRadar
              tasks={tasks}
              onExpandTask={handleExpandTask}
            />
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
          defaultSpaceId={selectedSpaceId !== "all" ? selectedSpaceId : undefined}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTask={handleCreateTask}
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
          onClose={() => setIsSettingsModalOpen(false)}
          onUpdateUser={(updatedUser) => {
            setCurrentUser(updatedUser);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
