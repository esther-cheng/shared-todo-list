"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { X, Lock, Loader2, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [username, setUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tandem_remembered_username") || "";
    }
    return "";
  });
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarColor, setAvatarColor] = useState("purple");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const colors = [
    { id: "purple", class: "bg-[#B78AF2]" },
    { id: "orange", class: "bg-[#FF705B]" },
    { id: "sky", class: "bg-[#BFEAF7]" },
    { id: "emerald", class: "bg-[#A8DCCB]" },
    { id: "rose", class: "bg-[#F472B6]" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp
        ? { username, name, password, avatar_color: avatarColor }
        : { username, password, remember_me: rememberMe };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Authentication failed");
      }

      if (!isSignUp) {
        if (rememberMe) {
          localStorage.setItem("tandem_remembered_username", username.trim());
        } else {
          localStorage.removeItem("tandem_remembered_username");
        }
      }

      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#171923]/50 backdrop-blur-xs transition-all overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#FFFFFF] rounded-[18px] max-h-[82vh] flex flex-col shadow-2xl border border-[#D8D7DE] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with high-visibility Close Button */}
        <div className="sticky top-0 z-20 bg-[#FFFFFF] flex items-center justify-between px-5 py-3 border-b border-[#D8D7DE] shrink-0">
          <div>
            <h3 className="font-semibold text-[15px] text-[#171923]">
              {isSignUp ? "Create account" : "Sign in to Tandem"}
            </h3>
            <p className="text-[11px] text-[#777783]">
              Access your shared tasks
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3.5 shrink-0">
          <div className="grid grid-cols-2 p-1 rounded-[10px] bg-[#F4F3F5] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`min-h-[34px] rounded-[8px] transition-all flex items-center justify-center ${
                !isSignUp
                  ? "bg-white text-[#171923] shadow-xs font-semibold"
                  : "text-[#777783] hover:text-[#171923]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`min-h-[34px] rounded-[8px] transition-all flex items-center justify-center ${
                isSignUp
                  ? "bg-white text-[#171923] shadow-xs font-semibold"
                  : "text-[#777783] hover:text-[#171923]"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-5 mt-2.5 p-2.5 rounded-[8px] bg-[#FFF0ED] border border-[#FED7CE] text-[#C2410C] text-[11px] font-medium shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
          {isSignUp && (
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
                Your Name
              </label>
              <input
                type="text"
                required={isSignUp}
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#777783]">
                @
              </span>
              <input
                type="text"
                required
                placeholder="alex"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                className="w-full text-xs pl-7 pr-3 py-2 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-[#777783] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-8 pr-9 py-2 rounded-[8px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[38px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#777783] hover:text-[#171923] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox on Sign In */}
          {!isSignUp && (
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-[4px] border-[#D8D7DE] text-[#171923] focus:ring-[#B78AF2] accent-[#171923] cursor-pointer"
                />
                <span className="text-[12px] font-medium text-[#171923]">Remember me</span>
              </label>
              <span className="text-[11px] text-[#777783]">Stay signed in</span>
            </div>
          )}

          {/* Color picker on signup */}
          {isSignUp && (
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1.5 block">
                Avatar Accent
              </label>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAvatarColor(c.id)}
                    className={`w-7 h-7 rounded-full ${c.class} transition-all flex items-center justify-center ${
                      avatarColor === c.id ? "ring-2 ring-offset-2 ring-[#171923] scale-105" : "opacity-80 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full py-2.5 rounded-[10px] text-xs font-semibold text-white bg-[#171923] hover:bg-[#2D313E] shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                <span>Create account</span>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
