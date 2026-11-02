"use client";

import React, { useState, useRef, useEffect } from "react";
import { User as UserType, Task, SearchedUser } from "@/types";
import { Search, Plus, Bell, LogIn, LogOut, X, Settings, ChevronDown, Users } from "lucide-react";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { SearchDropdown } from "@/components/SearchDropdown";
import { getUserAvatarStyle } from "@/lib/colors";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currentUser: UserType | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenCreateModal: () => void;
  onOpenSettings?: () => void;
  onOpenFriends?: () => void;
  tasks?: Task[];
  taggedTasks?: Task[];
  dismissedTaskIds?: string[];
  onDismissTask?: (taskId: string) => void;
  onDismissAll?: () => void;
  onResetDismissed?: () => void;
  onSelectTask?: (task: Task) => void;
  onSelectUser?: (user: SearchedUser) => void;
  taggedCount?: number;
  userColor?: string;
  onOpenTaggedFilter: () => void;
  onFilterByMention?: (mention: string) => void;
  onOpenNotificationSettings?: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenCreateModal,
  onOpenSettings = () => {},
  onOpenFriends = () => {},
  tasks = [],
  taggedTasks = [],
  dismissedTaskIds = [],
  onDismissTask = () => {},
  onDismissAll = () => {},
  onResetDismissed = () => {},
  onSelectTask = () => {},
  onSelectUser = () => {},
  taggedCount,
  onOpenTaggedFilter,
  onFilterByMention,
  onOpenNotificationSettings,
}: HeaderProps) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Focus mobile search input when it expands
  useEffect(() => {
    if (isMobileSearchOpen) {
      const timer = setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isMobileSearchOpen]);

  // Click outside and escape key handling for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(target) &&
        (!mobileSearchContainerRef.current || !mobileSearchContainerRef.current.contains(target))
      ) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNotificationsOpen(false);
        setIsUserMenuOpen(false);
        setIsSearchOpen(false);
      }
    };

    if (isNotificationsOpen || isUserMenuOpen || isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen, isUserMenuOpen, isSearchOpen]);

  // Compute active notification count
  const activeTaggedTasks = taggedTasks.filter((t) => !dismissedTaskIds.includes(t.id));
  const activeCount = typeof taggedCount === "number" ? taggedCount : activeTaggedTasks.length;
  const userAvatarStyle = getUserAvatarStyle(currentUser?.avatar_color);

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#D8D7DE] px-3 sm:px-8 py-2.5 sm:py-3.5 transition-colors w-full max-w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* Brand / Logo */}
        <div
          className={`flex items-center gap-2 sm:gap-3 transition-all duration-150 ease-out ${
            isMobileSearchOpen
              ? "max-w-0 opacity-0 pointer-events-none scale-95 overflow-hidden -mr-2 md:max-w-none md:opacity-100 md:scale-100 md:mr-0 md:flex md:shrink-0"
              : "max-w-[220px] opacity-100 scale-100 shrink-0 min-w-0 flex"
          }`}
        >
          {/* Logo icon - hidden first on mobile when space is constrained */}
          <div className="hidden sm:flex w-10 h-10 rounded-[12px] bg-[#171923] text-white items-center justify-center font-display text-2xl font-bold shadow-xs select-none shrink-0">
            T
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="font-display text-2xl sm:text-[32px] font-bold text-[#171923] tracking-normal leading-none">
                Tandem
              </span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
            </div>
            <p className="hidden sm:block text-[12px] text-[#777783] font-medium leading-none mt-1">
              Life&apos;s better in sync.
            </p>
          </div>
        </div>

        {/* Mobile Search Bar - transforms from magnifying glass button, grows left and overtakes the logo */}
        <div
          ref={mobileSearchContainerRef}
          className={`md:hidden flex-1 min-w-0 transition-all duration-150 ease-out origin-right ${
            isMobileSearchOpen ? "block animate-in slide-in-from-right-3 duration-150 fade-in" : "hidden"
          }`}
        >
          <div className="relative flex items-center bg-[#F4F3F5] rounded-[12px] border border-transparent focus-within:border-[var(--color-primary)] focus-within:bg-[#FFFFFF] transition-all px-2.5 py-1 min-h-[38px]">
            <Search className="w-4 h-4 text-[#777783] shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="Search tasks, context, @mentions..."
              className="w-full pl-2 pr-1 bg-transparent text-xs text-[#171923] placeholder:text-[#777783] outline-none"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  mobileInputRef.current?.focus();
                }}
                className="p-1 text-[#777783] hover:text-[#171923] rounded-full shrink-0 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                setIsSearchOpen(false);
              }}
              className="ml-1 p-1 text-[#777783] hover:text-[#171923] hover:bg-[#D8D7DE]/50 rounded-full shrink-0 cursor-pointer"
              aria-label="Close search"
              title="Close search"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Mobile Search Dropdown */}
            <SearchDropdown
              query={searchQuery}
              tasks={tasks}
              currentUser={currentUser}
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              onSelectTask={(task) => {
                onSelectTask(task);
                setIsMobileSearchOpen(false);
                setIsSearchOpen(false);
              }}
              onSelectUser={(user) => {
                onSelectUser?.(user);
                setIsMobileSearchOpen(false);
                setIsSearchOpen(false);
              }}
              onFilterByMention={(mention) => {
                if (onFilterByMention) {
                  onFilterByMention(mention);
                } else {
                  onSearchChange(mention);
                }
                setIsMobileSearchOpen(false);
                setIsSearchOpen(false);
              }}
            />
          </div>
        </div>

        {/* Global Search - Desktop */}
        <div className="flex-1 max-w-md hidden md:block" ref={searchContainerRef}>
          <div className="relative">
            <Search className="w-4 h-4 text-[#777783] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="Search tasks, context, @mentions, users..."
              className="w-full pl-9 pr-4 py-2 rounded-[12px] text-[14px] bg-[#F4F3F5] border border-transparent focus:border-[var(--color-primary)] focus:bg-[#FFFFFF] focus:outline-none transition-all placeholder:text-[#777783] text-[#171923]"
            />

            {/* Dropdown sorted into Tasks, Mentions, Users */}
            <SearchDropdown
              query={searchQuery}
              tasks={tasks}
              currentUser={currentUser}
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              onSelectTask={onSelectTask}
              onSelectUser={onSelectUser}
              onFilterByMention={(mention) => {
                if (onFilterByMention) {
                  onFilterByMention(mention);
                } else {
                  onSearchChange(mention);
                }
                setIsSearchOpen(false);
              }}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle (Magnifying glass button) */}
          {!isMobileSearchOpen && (
            <button
              onClick={() => {
                setIsMobileSearchOpen(true);
                setIsSearchOpen(true);
              }}
              className="md:hidden p-2 sm:p-2.5 rounded-[12px] text-[#171923] hover:bg-[#F4F3F5] transition-all min-w-[36px] sm:min-w-[44px] min-h-[36px] sm:min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Search"
              title="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Friends & People Button */}
          {currentUser && (
            <button
              type="button"
              onClick={onOpenFriends}
              className="p-2 sm:p-2.5 rounded-[12px] text-[#171923] hover:bg-[#F4F3F5] transition-colors min-w-[36px] sm:min-w-[44px] min-h-[36px] sm:min-h-[44px] flex items-center justify-center cursor-pointer select-none shrink-0"
              title="Friends & People"
              aria-label="Friends & People"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative shrink-0" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev);
                setIsUserMenuOpen(false);
              }}
              className={`relative p-2 sm:p-2.5 rounded-[12px] transition-colors min-w-[36px] sm:min-w-[44px] min-h-[36px] sm:min-h-[44px] flex items-center justify-center cursor-pointer select-none shrink-0 ${
                isNotificationsOpen
                  ? "bg-[#171923] text-white"
                  : "text-[#171923] hover:bg-[#F4F3F5]"
              }`}
              title="Notifications & Tagged Tasks"
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="w-4 h-4" />
              {activeCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-2 sm:right-2 min-w-[15px] h-3.5 sm:min-w-[16px] sm:h-4 text-[9px] sm:text-[10px] font-bold rounded-full bg-[#FF705B] text-white flex items-center justify-center px-0.5 sm:px-1 pointer-events-none">
                  {activeCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <NotificationDropdown
                tasks={taggedTasks}
                dismissedTaskIds={dismissedTaskIds}
                onDismissTask={onDismissTask}
                onDismissAll={onDismissAll}
                onResetDismissed={onResetDismissed}
                onSelectTask={onSelectTask}
                onClose={() => setIsNotificationsOpen(false)}
                onViewAllTagged={onOpenTaggedFilter}
                onOpenSettings={onOpenNotificationSettings || onOpenSettings}
                currentUsername={currentUser ? currentUser.username : "alex"}
              />
            )}
          </div>

          {/* Desktop New Task Button (to the left of user profile) */}
          <button
            onClick={onOpenCreateModal}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-[14px] font-semibold text-white bg-[#171923] hover:bg-[#2D313E] shadow-xs active:scale-[0.98] transition-all min-h-[42px] shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New task</span>
          </button>

          {/* User Profile / Auth Button */}
          {currentUser ? (
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen((prev) => !prev);
                  setIsNotificationsOpen(false);
                }}
                className={`flex items-center gap-1.5 sm:gap-2.5 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-[12px] border transition-all min-h-[36px] sm:min-h-[42px] cursor-pointer select-none shrink-0 ${
                  isUserMenuOpen
                    ? "bg-[#FFFFFF] border-[#171923] shadow-xs"
                    : "bg-[#F4F3F5] border-[#D8D7DE]/70 hover:bg-[#EAE8ED] hover:border-[#D8D7DE]"
                }`}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                aria-label="User account menu"
              >
                {/* Profile Picture / Avatar */}
                <div
                  className={`w-7 h-7 rounded-full ${userAvatarStyle.bg} ${userAvatarStyle.text} font-bold flex items-center justify-center text-[12px] shadow-2xs shrink-0 select-none`}
                >
                  {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                </div>

                {/* Display name & username */}
                <div className="hidden sm:block text-left leading-tight">
                  <span className="font-semibold text-[#171923] block text-[13px] max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] text-[#777783] block max-w-[120px] truncate">
                    @{currentUser.username}
                  </span>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#777783] transition-transform duration-150 shrink-0 ${
                    isUserMenuOpen ? "rotate-180 text-[#171923]" : ""
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 bg-[#FFFFFF] rounded-[16px] border border-[#D8D7DE] shadow-[0_10px_32px_rgba(23,25,35,0.12)] p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  role="menu"
                >
                  {/* Account overview header */}
                  <div className="px-3 py-2 border-b border-[#D8D7DE]/60 mb-1">
                    <p className="text-[13px] font-bold text-[#171923] truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-[#777783] truncate">
                      @{currentUser.username}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-0.5">
                    {/* User Settings */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-[#171923] hover:bg-[#F4F3F5] rounded-[10px] transition-colors group cursor-pointer text-left"
                      role="menuitem"
                    >
                      <Settings className="w-4 h-4 text-[#777783] group-hover:text-[#171923] transition-colors shrink-0" />
                      <span>User settings</span>
                    </button>

                    {/* Sign out */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-[#FF705B] hover:bg-[#FFF2EE] rounded-[10px] transition-colors group cursor-pointer text-left"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4 text-[#FF705B] transition-colors shrink-0" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[12px] text-xs font-semibold text-[#171923] bg-[#FFFFFF] border border-[#D8D7DE] hover:bg-[#F4F3F5] transition-all min-h-[36px] sm:min-h-[40px] shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-[#171923]" />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
