"use client";

import React, { useState } from "react";
import { User } from "@/types";
import { 
  Users, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";

interface WelcomeViewProps {
  onLoginSuccess: (user: User) => void;
}

export function WelcomeView({ onLoginSuccess }: WelcomeViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarColor, setAvatarColor] = useState("purple");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const avatarColors = [
    { id: "purple", bg: "bg-[#B78AF2]", border: "border-[#9F67E8]" },
    { id: "orange", bg: "bg-[#FF705B]", border: "border-[#F0553E]" },
    { id: "sky", bg: "bg-[#BFEAF7]", border: "border-[#90DCF2]" },
    { id: "emerald", bg: "bg-[#A8DCCB]", border: "border-[#7EC9B2]" },
    { id: "rose", bg: "bg-[#F472B6]", border: "border-[#EC4899]" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp
        ? { username: username.trim(), name: name.trim(), password, avatar_color: avatarColor }
        : { username: username.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Authentication failed");
      }

      onLoginSuccess(data.user);
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
    <div className="min-h-screen bg-[#F4F3F5] text-[#171923] flex flex-col font-sans selection:bg-[#B78AF2]/30">
      {/* Top Welcome Bar */}
      <header className="w-full border-b border-[#D8D7DE] bg-[#FFFFFF]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#171923] text-white flex items-center justify-center font-display text-2xl font-bold shadow-xs select-none">
            T
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-display text-3xl sm:text-[32px] font-bold tracking-normal text-[#171923] leading-none">
              Tandem
            </span>
            <span className="hidden sm:inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF7F3] text-[#1E745A] border border-[#A8DCCB]">
              Life&apos;s better in sync.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-[8px] transition-colors ${
              !isSignUp ? "text-[#171923] bg-[#F4F3F5]" : "text-[#777783] hover:text-[#171923]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-[8px] bg-[#171923] text-white hover:bg-[#2D313E] transition-colors shadow-xs"
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Hero & Authentication Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-14 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Brand Story & Features */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-bold text-[#171923] tracking-tight leading-[1.2]">
                Welcome to{" "}
                <span className="font-display font-normal text-4xl sm:text-6xl text-[#171923]">
                  Tandem
                </span>
                .
              </h1>
              <p className="text-lg sm:text-xl text-[#777783] max-w-xl font-normal leading-relaxed">
                Life&apos;s better in sync.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="bg-[#FFFFFF] p-4 rounded-[16px] border border-[#D8D7DE] shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#F5EEFD] text-[#6B21A8] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#171923]">Shared Spaces</h3>
                <p className="text-[12px] text-[#777783] leading-normal">
                  House, travel, wedding, or finances. Color-coded walls with social feeds.
                </p>
              </div>

              <div className="bg-[#FFFFFF] p-4 rounded-[16px] border border-[#D8D7DE] shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#FFF0ED] text-[#C2410C] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#171923]">Long-Horizon Planning</h3>
                <p className="text-[12px] text-[#777783] leading-normal">
                  Set deadlines months or years out with built-in prep lead times.
                </p>
              </div>

              <div className="bg-[#FFFFFF] p-4 rounded-[16px] border border-[#D8D7DE] shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#EBF7F3] text-[#1E745A] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#171923]">Untouched Radar</h3>
                <p className="text-[12px] text-[#777783] leading-normal">
                  Automatically flags stalled tasks before they slip through the cracks.
                </p>
              </div>

              <div className="bg-[#FFFFFF] p-4 rounded-[16px] border border-[#D8D7DE] shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#EFF8FB] text-[#0E7490] flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#171923]">Notes & @Mentions</h3>
                <p className="text-[12px] text-[#777783] leading-normal">
                  Keep context attached to every task. Tag your partner directly.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Sign In / Sign Up Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-[#FFFFFF] rounded-[20px] border border-[#D8D7DE] shadow-[0_4px_24px_rgba(23,25,35,0.06)] p-6 sm:p-7 space-y-5">
              
              {/* Card Header & Switcher */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[17px] text-[#171923]">
                    {isSignUp ? "Create your account" : "Sign in"}
                  </h2>
                  <span className="text-[11px] font-medium text-[#777783] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1E745A]" />
                    Secure login
                  </span>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 p-1 rounded-[10px] bg-[#F4F3F5] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError(null);
                    }}
                    className={`min-h-[36px] rounded-[8px] transition-all flex items-center justify-center ${
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
                    className={`min-h-[36px] rounded-[8px] transition-all flex items-center justify-center ${
                      isSignUp
                        ? "bg-white text-[#171923] shadow-xs font-semibold"
                        : "text-[#777783] hover:text-[#171923]"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-[10px] bg-[#FFF0ED] border border-[#FED7CE] text-[#C2410C] text-[12px] font-medium">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {isSignUp && (
                  <div>
                    <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required={isSignUp}
                      placeholder="e.g. Alex Morgan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-[13px] px-3.5 py-2.5 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[42px] transition-all placeholder:text-[#777783]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    placeholder="e.g. alex"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-[13px] px-3.5 py-2.5 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[42px] transition-all placeholder:text-[#777783]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1 block">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-[13px] pl-3.5 pr-10 py-2.5 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none text-[#171923] min-h-[42px] transition-all placeholder:text-[#777783]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#777783] hover:text-[#171923] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="text-[11px] font-semibold tracking-wider text-[#777783] uppercase mb-1.5 block">
                      Avatar Color Accent
                    </label>
                    <div className="flex items-center gap-2.5">
                      {avatarColors.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAvatarColor(c.id)}
                          className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                            avatarColor === c.id
                              ? "ring-2 ring-offset-2 ring-[#171923] scale-110"
                              : "opacity-70 hover:opacity-100"
                          }`}
                          aria-label={`Select ${c.id} color`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[44px] rounded-[10px] bg-[#171923] text-white hover:bg-[#2D313E] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-1 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#B78AF2]" />
                  ) : (
                    <>
                      <span>{isSignUp ? "Create Tandem Account" : "Sign In to Tandem"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D8D7DE] py-5 px-4 text-center text-xs text-[#777783]">
        <p>Tandem — Life&apos;s better in sync. • Designed with care for shared lives</p>
      </footer>
    </div>
  );
}