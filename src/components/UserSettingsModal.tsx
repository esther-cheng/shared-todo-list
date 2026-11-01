"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { AVATAR_COLORS, getUserAvatarStyle } from "@/lib/colors";
import { 
  X, 
  User as UserIcon, 
  Palette, 
  Lock, 
  Check, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

interface UserSettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

type SettingsTab = "profile" | "color" | "security";

export function UserSettingsModal({
  user,
  onClose,
  onUpdateUser,
}: UserSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [savedUser, setSavedUser] = useState<User>(user);

  // Form states
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [avatarColor, setAvatarColor] = useState(user.avatar_color || "purple");

  // Keep savedUser in sync if prop changes
  React.useEffect(() => {
    setSavedUser(user);
  }, [user]);

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
  const cleanNewPassword = newPassword.trim();
  const currentAvatarStyle = getUserAvatarStyle(avatarColor);
  const hasPasswordMismatch = Boolean(confirmPassword && newPassword !== confirmPassword);

  // Determine if the current active tab has changes and is valid to save
  let canSave = false;
  if (activeTab === "profile") {
    const isProfileChanged = name.trim() !== savedUser.name || cleanUsername !== savedUser.username;
    const isProfileValid = name.trim().length > 0 && cleanUsername.length > 0;
    canSave = isProfileChanged && isProfileValid;
  } else if (activeTab === "color") {
    const isColorChanged = avatarColor !== (savedUser.avatar_color || "purple");
    canSave = isColorChanged;
  } else if (activeTab === "security") {
    const isSecurityEntered = cleanNewPassword.length > 0;
    const isSecurityValid =
      isSecurityEntered &&
      currentPassword.length > 0 &&
      cleanNewPassword.length >= 6 &&
      cleanNewPassword === confirmPassword.trim();
    canSave = isSecurityValid;
  }

  const isSaveDisabled = isLoading || !canSave;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaveDisabled) return;

    setError(null);
    setSuccessMessage(null);

    const payload: Record<string, string> = {};

    if (activeTab === "profile") {
      if (!name.trim()) {
        setError("Display name cannot be empty.");
        return;
      }
      if (!cleanUsername) {
        setError("Username cannot be empty.");
        return;
      }
      payload.name = name.trim();
      payload.username = cleanUsername;
    } else if (activeTab === "color") {
      payload.avatar_color = avatarColor;
    } else if (activeTab === "security") {
      if (!currentPassword) {
        setError("Please enter your current password to save a new password.");
        return;
      }
      if (cleanNewPassword.length < 6) {
        setError("New password must be at least 6 characters.");
        return;
      }
      if (cleanNewPassword !== confirmPassword.trim()) {
        setError("New passwords do not match.");
        return;
      }
      payload.current_password = currentPassword;
      payload.new_password = cleanNewPassword;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update settings");
      }

      setSavedUser(data.user);
      onUpdateUser(data.user);

      if (activeTab === "profile") {
        setName(data.user.name);
        setUsername(data.user.username);
        setSuccessMessage("Profile details saved successfully!");
      } else if (activeTab === "color") {
        setAvatarColor(data.user.avatar_color || "purple");
        setSuccessMessage("Avatar color saved successfully!");
      } else if (activeTab === "security") {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setSuccessMessage("Password updated successfully!");
      }

      // Automatically clear success toast after 3.5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171923]/50 backdrop-blur-xs transition-all overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-[#FFFFFF] rounded-[20px] sm:rounded-[24px] border border-[#D8D7DE] shadow-[0_10px_32px_rgba(23,25,35,0.12)] overflow-hidden my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8D7DE]/70 bg-[#FFFFFF] shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-[#171923] tracking-tight">
              User Settings
            </h2>
            <p className="text-[12px] text-[#777783] mt-0.5">
              Manage your personal profile, colors, and security.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[10px] text-[#777783] hover:text-[#171923] hover:bg-[#F4F3F5] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-[#D8D7DE]/60 bg-[#F4F3F5]/50 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab("profile");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex items-center gap-2 py-3 px-3.5 text-[13px] font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "profile"
                ? "border-[#B78AF2] text-[#171923]"
                : "border-transparent text-[#777783] hover:text-[#171923]"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("color");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex items-center gap-2 py-3 px-3.5 text-[13px] font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "color"
                ? "border-[#B78AF2] text-[#171923]"
                : "border-transparent text-[#777783] hover:text-[#171923]"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Avatar & Color</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("security");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex items-center gap-2 py-3 px-3.5 text-[13px] font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === "security"
                ? "border-[#B78AF2] text-[#171923]"
                : "border-transparent text-[#777783] hover:text-[#171923]"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Password & Security</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          <div className="p-6 space-y-5">
            {/* Success Banner */}
            {successMessage && (
              <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-[#EFF8F5] border border-[#CCEBE1] text-[#065F46] text-[13px] animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-[#065F46] shrink-0 stroke-[2.5]" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-[12px] bg-[#FFF2EE] border border-[#FEDACE] text-[#C2410C] text-[13px] animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-[#FF705B] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: Profile & Account */}
            {activeTab === "profile" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#171923] mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    required
                    className="w-full px-3.5 py-2.5 rounded-[12px] text-[14px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none transition-all placeholder:text-[#777783] text-[#171923] min-h-[44px]"
                  />
                  <p className="text-[11px] text-[#777783] mt-1.5">
                    Your full or preferred name displayed to your partner and across tasks.
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#171923] mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777783] font-semibold text-[14px] select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="alex"
                      required
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-[12px] text-[14px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none transition-all placeholder:text-[#777783] text-[#171923] min-h-[44px]"
                    />
                  </div>
                  <p className="text-[11px] text-[#777783] mt-1.5">
                    Your unique tag for @mentions in notes and tasks.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Avatar & Color */}
            {activeTab === "color" && (
              <div className="space-y-5">
                {/* Live Preview Card */}
                <div className="p-4 rounded-[16px] bg-[#F4F3F5] border border-[#D8D7DE]/70 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${currentAvatarStyle.bg} ${currentAvatarStyle.text} font-bold text-xl flex items-center justify-center shadow-xs shrink-0 select-none`}>
                    {name.trim() ? name.trim()[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#777783] uppercase tracking-wider block">
                      Live Preview
                    </span>
                    <h4 className="text-[15px] font-bold text-[#171923] leading-tight mt-0.5">
                      {name || "User Name"}
                    </h4>
                    <span className="text-[12px] font-medium text-[#777783]">
                      @{username.toLowerCase().replace(/^@/, "")}
                    </span>
                  </div>
                </div>

                {/* Color Palette Choices */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#171923] mb-2.5">
                    Choose Your Avatar Palette
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {Object.entries(AVATAR_COLORS).map(([colorKey, colorConfig]) => {
                      const isSelected = avatarColor === colorKey;
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setAvatarColor(colorKey)}
                          className={`flex items-center gap-3 p-2.5 rounded-[12px] border text-left transition-all ${
                            isSelected
                              ? "border-[#171923] bg-[#FFFFFF] shadow-sm ring-2 ring-[#B78AF2]/40"
                              : "border-[#D8D7DE] bg-[#FFFFFF] hover:bg-[#F4F3F5]"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full ${colorConfig.bg} ${colorConfig.text} font-bold text-xs flex items-center justify-center shrink-0`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-[12px] font-semibold text-[#171923]">
                            {colorConfig.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#777783] mt-2">
                    Used to tint your profile pill, avatar icon, and mention cards.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: Password & Security */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-[12px] bg-[#F4F3F5] text-[#171923] text-[12px]">
                  <ShieldCheck className="w-4 h-4 text-[#B78AF2] shrink-0" />
                  <span>Leave password fields blank if you do not wish to update your password.</span>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#171923] mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-3.5 pr-11 py-2.5 rounded-[12px] text-[14px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none transition-all placeholder:text-[#777783] text-[#171923] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777783] hover:text-[#171923] rounded-[6px] transition-colors"
                      aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#171923] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-3.5 pr-11 py-2.5 rounded-[12px] text-[14px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none transition-all placeholder:text-[#777783] text-[#171923] min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777783] hover:text-[#171923] rounded-[6px] transition-colors"
                      aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#171923] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`w-full pl-3.5 pr-11 py-2.5 rounded-[12px] text-[14px] bg-[#FFFFFF] border focus:outline-none transition-all placeholder:text-[#777783] text-[#171923] min-h-[44px] ${
                        hasPasswordMismatch
                          ? "border-[#FF705B] focus:border-[#FF705B] ring-1 ring-[#FF705B] bg-[#FFF2EE]/40"
                          : "border-[#D8D7DE] focus:border-[#B78AF2]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777783] hover:text-[#171923] rounded-[6px] transition-colors"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {hasPasswordMismatch && (
                    <p className="text-[11px] font-semibold text-[#FF705B] mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 text-[#FF705B] shrink-0" />
                      <span>Passwords do not match</span>
                    </p>
                  )}
                  {confirmPassword && !hasPasswordMismatch && newPassword.length >= 6 && (
                    <p className="text-[11px] font-semibold text-[#065F46] mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <Check className="w-3.5 h-3.5 text-[#065F46] shrink-0 stroke-[2.5]" />
                      <span>Passwords match</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#F4F3F5] border-t border-[#D8D7DE]/70 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-[#171923] bg-[#FFFFFF] border border-[#D8D7DE] hover:bg-[#F4F3F5] active:scale-[0.98] transition-all min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-semibold transition-all min-h-[44px] shadow-xs select-none ${
                isSaveDisabled
                  ? "bg-[#D8D7DE] text-[#777783] cursor-not-allowed shadow-none"
                  : "bg-[#171923] text-white hover:bg-[#2D313E] active:scale-[0.98] cursor-pointer"
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#B78AF2]" />}
              <span>Save changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

