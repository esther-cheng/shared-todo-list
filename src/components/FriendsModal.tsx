"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, SearchedUser, FriendsData } from "@/types";
import { getUserAvatarStyle } from "@/lib/colors";
import { 
  X, 
  Search, 
  UserPlus, 
  UserCheck, 
  Users, 
  Lock, 
  Globe, 
  Loader2, 
  UserX,
  Check,
  Clock,
  Sparkles
} from "lucide-react";

interface FriendsModalProps {
  currentUser: User;
  onClose: () => void;
  onFriendsChanged?: () => void;
}

type TabType = "find" | "friends" | "requests";

export function FriendsModal({ currentUser, onClose, onFriendsChanged }: FriendsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("find");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendsData, setFriendsData] = useState<FriendsData>({
    friends: [],
    pending_incoming: [],
    pending_outgoing: [],
  });
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load friends and requests
  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      if (data.friends) {
        setFriendsData({
          friends: data.friends || [],
          pending_incoming: data.pending_incoming || [],
          pending_outgoing: data.pending_outgoing || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
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
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  // Add friend
  const handleAddFriend = async (targetUser: SearchedUser) => {
    setActionLoadingId(targetUser.id);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: targetUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`You are now friends with ${targetUser.name}!`);
        await fetchFriends();
        await searchUsers(searchQuery);
        onFriendsChanged?.();
      } else {
        showToast(data.error || "Failed to add friend");
      }
    } catch (err) {
      console.error("Add friend error:", err);
      showToast("Failed to connect with friend");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (targetUserId: string, name: string) => {
    setActionLoadingId(targetUserId);
    try {
      const res = await fetch(`/api/friends/${targetUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Removed ${name} from friends`);
        await fetchFriends();
        await searchUsers(searchQuery);
        onFriendsChanged?.();
      } else {
        showToast("Failed to remove friend");
      }
    } catch (err) {
      console.error("Remove friend error:", err);
      showToast("Failed to remove friend");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Accept incoming request
  const handleAcceptRequest = async (targetUserId: string, name: string) => {
    setActionLoadingId(targetUserId);
    try {
      const res = await fetch(`/api/friends/${targetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok) {
        showToast(`Accepted friend request from ${name}`);
        await fetchFriends();
        await searchUsers(searchQuery);
        onFriendsChanged?.();
      } else {
        showToast("Failed to accept request");
      }
    } catch (err) {
      console.error("Accept friend error:", err);
      showToast("Failed to accept request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const incomingCount = friendsData.pending_incoming.length;

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#171923] text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#171923] tracking-tight flex items-center gap-2">
                Friends & People
              </h2>
              <p className="text-[12px] text-[#777783]">
                Connect with partners, family, and teammates to share groups.
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

        {/* Tab Segmented Control */}
        <div className="px-5 py-2.5 border-b border-[#D8D7DE]/70 bg-[#F4F3F5]/80 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#EBE9ED] rounded-[12px] text-xs">
            <button
              onClick={() => setActiveTab("find")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 font-semibold rounded-[9px] transition-all cursor-pointer ${
                activeTab === "find"
                  ? "bg-[#FFFFFF] text-[#171923] shadow-xs"
                  : "text-[#777783] hover:text-[#171923]"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find People</span>
            </button>

            <button
              onClick={() => setActiveTab("friends")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 font-semibold rounded-[9px] transition-all cursor-pointer ${
                activeTab === "friends"
                  ? "bg-[#FFFFFF] text-[#171923] shadow-xs"
                  : "text-[#777783] hover:text-[#171923]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Friends ({friendsData.friends.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 font-semibold rounded-[9px] transition-all cursor-pointer relative ${
                activeTab === "requests"
                  ? "bg-[#FFFFFF] text-[#171923] shadow-xs"
                  : "text-[#777783] hover:text-[#171923]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Requests</span>
              {incomingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#FF705B]" />
              )}
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-[12px] bg-[#EFF8F5] border border-[#CCEBE1] text-[#065F46] text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-[#065F46] shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: Find People */}
          {activeTab === "find" && (
            <div className="space-y-4">
              {/* Search Field */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#777783] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find people by name or @username..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-[12px] text-[13px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[42px]"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-[#777783] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Policy Explainer Card */}
              <div className="p-3 rounded-[14px] bg-[#F4F3F5] border border-[#D8D7DE]/70 text-xs text-[#777783] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#B78AF2] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-[#171923] font-semibold">Privacy Policy:</strong>{" "}
                  Public users can be added directly to any group. Private users must be your friend before they can be added to your groups.
                </p>
              </div>

              {/* Results List */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase px-1">
                  {searchQuery.trim() ? "Search Results" : "People on Tandem"}
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#777783] bg-[#F4F3F5]/50 rounded-[16px] border border-dashed border-[#D8D7DE]">
                    {isSearching ? "Searching..." : "No users found matching your search."}
                  </div>
                ) : (
                  searchResults.map((user) => {
                    const avatarStyle = getUserAvatarStyle(user.avatar_color);
                    const isFriend = user.friendship_status === "friends";
                    const isPendingSent = user.friendship_status === "pending_sent";
                    const isPendingReceived = user.friendship_status === "pending_received";
                    const isActionLoading = actionLoadingId === user.id;

                    return (
                      <div
                        key={user.id}
                        className="p-3 rounded-[14px] bg-[#FFFFFF] border border-[#D8D7DE] hover:border-[#B78AF2]/70 transition-all flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-bold text-sm flex items-center justify-center shrink-0 select-none shadow-xs`}>
                            {user.name[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[14px] text-[#171923] truncate">
                                {user.name}
                              </span>
                              {user.is_private ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#B78AF2]/15 text-[#6B21A8] border border-[#B78AF2]/30">
                                  <Lock className="w-2.5 h-2.5" />
                                  Private
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#A8DCCB]/25 text-[#065F46] border border-[#A8DCCB]/50">
                                  <Globe className="w-2.5 h-2.5" />
                                  Public
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#777783] block truncate">
                              @{user.username}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          {isFriend ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#EFF8F5] text-[#065F46] border border-[#CCEBE1] text-xs font-semibold select-none">
                                <UserCheck className="w-3.5 h-3.5" />
                                Friends
                              </span>
                              <button
                                onClick={() => handleRemoveFriend(user.id, user.name)}
                                disabled={isActionLoading}
                                title="Unfriend"
                                className="w-7 h-7 rounded-[8px] text-[#777783] hover:text-[#FF705B] hover:bg-[#FFF0ED] flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isPendingReceived ? (
                            <button
                              onClick={() => handleAcceptRequest(user.id, user.name)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-[10px] bg-[#171923] text-white hover:bg-[#2D313E] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                            >
                              {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                              Accept
                            </button>
                          ) : isPendingSent ? (
                            <span className="px-3 py-1.5 rounded-[10px] bg-[#F4F3F5] text-[#777783] text-xs font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Requested
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddFriend(user)}
                              disabled={isActionLoading}
                              className="px-3.5 py-1.5 rounded-[10px] bg-[#171923] text-white hover:bg-[#2D313E] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                            >
                              {isActionLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              Add Friend
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: My Friends */}
          {activeTab === "friends" && (
            <div className="space-y-3">
              {friendsData.friends.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#777783] bg-[#F4F3F5]/50 rounded-[16px] border border-dashed border-[#D8D7DE] space-y-2">
                  <Users className="w-8 h-8 text-[#D8D7DE] mx-auto" />
                  <p className="font-semibold text-[#171923] text-[14px]">No friends yet</p>
                  <p>Search for people on Tandem to add them as your friends.</p>
                  <button
                    onClick={() => setActiveTab("find")}
                    className="mt-2 px-4 py-2 rounded-[10px] bg-[#171923] text-white text-xs font-semibold cursor-pointer"
                  >
                    Find People
                  </button>
                </div>
              ) : (
                friendsData.friends.map((friend) => {
                  const avatarStyle = getUserAvatarStyle(friend.avatar_color);
                  const isActionLoading = actionLoadingId === friend.id;

                  return (
                    <div
                      key={friend.id}
                      className="p-3.5 rounded-[14px] bg-[#FFFFFF] border border-[#D8D7DE] flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-bold text-sm flex items-center justify-center shrink-0 select-none shadow-xs`}>
                          {friend.name[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[14px] text-[#171923] truncate">
                              {friend.name}
                            </span>
                            {friend.is_private ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#B78AF2]/15 text-[#6B21A8]">
                                <Lock className="w-2.5 h-2.5" />
                                Private
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#A8DCCB]/25 text-[#065F46]">
                                <Globe className="w-2.5 h-2.5" />
                                Public
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#777783] block truncate">
                            @{friend.username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-[#065F46] bg-[#EFF8F5] px-2 py-1 rounded-[8px] border border-[#CCEBE1] hidden sm:inline">
                          Eligible for groups
                        </span>
                        <button
                          onClick={() => handleRemoveFriend(friend.id, friend.name)}
                          disabled={isActionLoading}
                          className="px-2.5 py-1.5 rounded-[9px] text-xs font-semibold text-[#777783] hover:text-[#FF705B] hover:bg-[#FFF0ED] border border-[#D8D7DE] cursor-pointer transition-colors"
                        >
                          {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Unfriend"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: Requests */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase px-1 block mb-2">
                  Received Requests ({friendsData.pending_incoming.length})
                </span>
                {friendsData.pending_incoming.length === 0 ? (
                  <p className="text-xs text-[#777783] p-4 bg-[#F4F3F5]/50 rounded-[12px] border border-dashed border-[#D8D7DE] text-center">
                    No pending friend requests.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {friendsData.pending_incoming.map((req) => {
                      const avatarStyle = getUserAvatarStyle(req.avatar_color);
                      const isActionLoading = actionLoadingId === req.id;

                      return (
                        <div
                          key={req.id}
                          className="p-3 rounded-[14px] bg-[#FFFFFF] border border-[#D8D7DE] flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-bold text-xs flex items-center justify-center shrink-0`}>
                              {req.name[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-[#171923] block truncate">
                                {req.name}
                              </span>
                              <span className="text-[11px] text-[#777783] block truncate">
                                @{req.username}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAcceptRequest(req.id, req.name)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-[9px] bg-[#171923] text-white hover:bg-[#2D313E] text-xs font-semibold cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRemoveFriend(req.id, req.name)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1.5 rounded-[9px] text-xs font-semibold text-[#777783] hover:bg-[#F4F3F5] cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase px-1 block mb-2">
                  Sent Requests ({friendsData.pending_outgoing.length})
                </span>
                {friendsData.pending_outgoing.length === 0 ? (
                  <p className="text-xs text-[#777783] p-4 bg-[#F4F3F5]/50 rounded-[12px] border border-dashed border-[#D8D7DE] text-center">
                    No outgoing requests.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {friendsData.pending_outgoing.map((req) => {
                      const avatarStyle = getUserAvatarStyle(req.avatar_color);

                      return (
                        <div
                          key={req.id}
                          className="p-3 rounded-[14px] bg-[#FFFFFF] border border-[#D8D7DE] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-full ${avatarStyle.bg} ${avatarStyle.text} font-bold text-xs flex items-center justify-center shrink-0`}>
                              {req.name[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-[#171923] block truncate">
                                {req.name}
                              </span>
                              <span className="text-[11px] text-[#777783] block truncate">
                                @{req.username}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFriend(req.id, req.name)}
                            className="text-xs font-medium text-[#777783] hover:text-[#FF705B] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

