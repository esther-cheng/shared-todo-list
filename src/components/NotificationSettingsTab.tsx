"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, UserNotificationSettings } from "@/types";
import { 
  Bell, 
  Mail, 
  Check, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Send, 
  Loader2, 
  AtSign,
  Calendar,
  CheckCircle2,
  Users
} from "lucide-react";

interface NotificationSettingsTabProps {
  user: User;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

function ToggleSwitch({ checked, onChange, disabled, label, id }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#B78AF2] focus:ring-offset-2 ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      } ${checked ? "bg-[#171923]" : "bg-[#D8D7DE]"}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationSettingsTab({ user }: NotificationSettingsTabProps) {
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [notifyPrepWindow, setNotifyPrepWindow] = useState(true);
  const [notifyDueSoon, setNotifyDueSoon] = useState(true);
  const [notifyTaskCompleted, setNotifyTaskCompleted] = useState(false);
  const [notifySpaceInvite, setNotifySpaceInvite] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelPush, setChannelPush] = useState(true);
  const [timing, setTiming] = useState<"instant" | "daily_digest">("instant");

  // Email Verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);
  const [demoCodeHelper, setDemoCodeHelper] = useState<string | null>(null);
  const [codeSentMessage, setCodeSentMessage] = useState<string | null>(null);

  // Web Push state
  const [pushSupported, setPushSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [serverVapidKey, setServerVapidKey] = useState<string | null>(null);

  // Test Notification state
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  // Check Web Push support & initial status
  const checkPushStatus = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushSupported(false);
      return;
    }

    setPermissionState(Notification.permission);

    try {
      // Fetch server status & VAPID key
      const res = await fetch("/api/notifications/push");
      const data = await res.json();
      if (data.vapidPublicKey) {
        setServerVapidKey(data.vapidPublicKey);
      }

      if (Notification.permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setIsPushSubscribed(true);
        } else if (data.hasSubscriptions) {
          setIsPushSubscribed(true);
        }
      }
    } catch (err) {
      console.warn("Could not retrieve push status:", err);
    }
  }, []);

  // Load current settings from API
  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setEmail(data.settings.email || "");
        setNotifyMentions(Boolean(data.settings.notify_mentions));
        setNotifyPrepWindow(Boolean(data.settings.notify_prep_window));
        setNotifyDueSoon(Boolean(data.settings.notify_due_soon));
        setNotifyTaskCompleted(Boolean(data.settings.notify_task_completed));
        setNotifySpaceInvite(Boolean(data.settings.notify_space_invite));
        setChannelEmail(Boolean(data.settings.channel_email));
        setChannelPush(Boolean(data.settings.channel_push ?? true));
        setTiming(data.settings.timing === "daily_digest" ? "daily_digest" : "instant");
      }
    } catch (err) {
      console.error("Failed to load notification settings:", err);
      setError("Unable to load notification settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    checkPushStatus();
  }, [checkPushStatus]);

  // Save preference changes
  const handleSavePreferences = async (overrides?: Partial<UserNotificationSettings>) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      email: email.trim() || null,
      notify_mentions: notifyMentions,
      notify_prep_window: notifyPrepWindow,
      notify_due_soon: notifyDueSoon,
      notify_task_completed: notifyTaskCompleted,
      notify_space_invite: notifySpaceInvite,
      channel_email: channelEmail,
      channel_push: channelPush,
      timing,
      ...overrides,
    };

    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update notification settings");
      }

      setSettings(data.settings);
      setSuccessMessage("Preferences saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save changes.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Subscribe to Web Push Notifications
  const handleEnablePush = async () => {
    setIsSubscribingPush(true);
    setError(null);
    setTestSuccess(null);

    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        throw new Error("Web push notifications are not supported in this browser.");
      }

      // Request permission
      const perm = await Notification.requestPermission();
      setPermissionState(perm);

      if (perm !== "granted") {
        throw new Error(
          perm === "denied"
            ? "Notification permission was blocked in browser settings. Please allow notifications for this site in your browser settings."
            : "Notification permission was dismissed."
        );
      }

      // Register or get service worker
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      }
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      let key = serverVapidKey;
      if (!key) {
        const res = await fetch("/api/notifications/push");
        const json = await res.json();
        key = json.vapidPublicKey;
        setServerVapidKey(key);
      }

      if (!key) {
        throw new Error("Push notification credentials could not be loaded.");
      }

      // Subscribe via PushManager
      const existingSub = await registration.pushManager.getSubscription();
      let sub = existingSub;
      if (!sub) {
        const convertedKey = urlBase64ToUint8Array(key);
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // Extract keys
      const rawP256dh = sub.getKey("p256dh");
      const rawAuth = sub.getKey("auth");
      if (!rawP256dh || !rawAuth) {
        throw new Error("Could not extract push encryption keys.");
      }

      const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawP256dh))));
      const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawAuth))));

      // Register on server
      const saveRes = await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: { p256dh, auth },
          userAgent: navigator.userAgent,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || saveData.error) {
        throw new Error(saveData.error || "Failed to register push subscription on server");
      }

      setIsPushSubscribed(true);
      setChannelPush(true);
      await handleSavePreferences({ channel_push: true });
      setSuccessMessage("Web push notifications enabled for this device!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to enable push notifications.");
      }
    } finally {
      setIsSubscribingPush(false);
    }
  };

  // Toggle Push Notifications on/off
  const handleTogglePush = async (nextChecked: boolean) => {
    if (nextChecked) {
      if (!isPushSubscribed || permissionState !== "granted") {
        await handleEnablePush();
      } else {
        setChannelPush(true);
        await handleSavePreferences({ channel_push: true });
      }
    } else {
      setChannelPush(false);
      await handleSavePreferences({ channel_push: false });
    }
  };

  // Toggle Email Notifications on/off
  const handleToggleEmail = async (nextChecked: boolean) => {
    if (nextChecked && (!email.trim() || !settings?.email_verified)) {
      setError("Please enter and verify your email address before enabling email alerts.");
      return;
    }
    setChannelEmail(nextChecked);
    await handleSavePreferences({ channel_email: nextChecked });
  };

  // Trigger email verification code
  const handleSendEmailVerification = async () => {
    setError(null);
    setCodeSentMessage(null);
    setDemoCodeHelper(null);
    setIsSendingCode(true);

    const target = email.trim();
    if (!target) {
      setError("Please enter your email address before verifying.");
      setIsSendingCode(false);
      return;
    }

    try {
      const res = await fetch("/api/notifications/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setIsVerifyingEmail(true);
      setVerificationCode("");
      setCodeSentMessage(data.message);
      if (data.demoCode) {
        setDemoCodeHelper(data.demoCode);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send verification code.");
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  // Confirm verification code
  const handleConfirmVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verificationCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsConfirmingCode(true);
    setError(null);

    try {
      const res = await fetch("/api/notifications/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          code: verificationCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Invalid verification code.");
      }

      setSettings(data.settings);
      setIsVerifyingEmail(false);
      setVerificationCode("");
      setDemoCodeHelper(null);
      setCodeSentMessage(null);
      setChannelEmail(true);
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to confirm code.");
      }
    } finally {
      setIsConfirmingCode(false);
    }
  };

  // Dispatch a test alert
  const handleSendTestNotification = async (channel: "push" | "email") => {
    if (channel === "push") {
      setIsSendingTestPush(true);
    } else {
      setIsSendingTestEmail(true);
    }
    setTestSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to send test ${channel} alert`);
      }
      setTestSuccess(data.message);
      setTimeout(() => setTestSuccess(null), 4500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`Failed to send test alert.`);
      }
    } finally {
      if (channel === "push") {
        setIsSendingTestPush(false);
      } else {
        setIsSendingTestEmail(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-[#777783] gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#B78AF2]" />
        <span className="text-xs">Loading notification preferences...</span>
      </div>
    );
  }

  const isEmailVerified = Boolean(settings?.email_verified && settings?.email === email.trim());
  const pushActive = Boolean(channelPush && isPushSubscribed && permissionState === "granted");

  return (
    <div className="space-y-5 text-xs text-[#171923]">
      {/* Feedback Messages */}
      {error && (
        <div className="p-3 rounded-[12px] bg-[#FFF5ED] border border-[#FED7CE] text-[#C2410C] flex items-start gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-[12px] bg-[#EFF8F5] border border-[#CCEBE1] text-[#065F46] flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span className="leading-relaxed font-medium">{successMessage}</span>
        </div>
      )}

      {testSuccess && (
        <div className="p-3 rounded-[12px] bg-[#F4ECFC] border border-[#E5D4F9] text-[#6B21A8] flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4 shrink-0 text-[#B78AF2]" />
          <span className="leading-relaxed font-medium">{testSuccess}</span>
        </div>
      )}

      {/* SECTION 1: Notification Channels */}
      <div className="space-y-3">
        <div>
          <h3 className="text-[13px] font-bold text-[#171923] tracking-tight">
            Notification Channels
          </h3>
          <p className="text-[11px] text-[#777783] mt-0.5">
            Turn alerts on or off for your browser and verified email address.
          </p>
        </div>

        {/* 1. Web Push Notifications Card */}
        <div className="p-3.5 sm:p-4 rounded-[14px] bg-[#FFFFFF] border border-[#D8D7DE] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[10px] bg-[#BFEAF7]/40 text-[#171923] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#171923]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[13px] text-[#171923]">Browser & Web Push</span>
                  {pushActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF8F5] text-[#065F46] border border-[#CCEBE1]">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Active</span>
                    </span>
                  ) : permissionState === "denied" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF5ED] text-[#C2410C] border border-[#FED7CE]">
                      <AlertCircle className="w-3 h-3" />
                      <span>Blocked</span>
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#777783] mt-0.5">
                  Receive instant popup reminders directly on your desktop or mobile browser.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="shrink-0 flex items-center">
              <ToggleSwitch
                checked={pushActive}
                disabled={isSubscribingPush || !pushSupported}
                onChange={handleTogglePush}
                label="Toggle web push notifications"
              />
            </div>
          </div>

          {/* Device Active Bar & Test Action */}
          {pushActive && (
            <div className="pt-2 flex items-center justify-between border-t border-[#D8D7DE]/50">
              <span className="text-[11px] text-[#777783]">
                Push alerts are enabled for this device.
              </span>
              <button
                type="button"
                onClick={() => handleSendTestNotification("push")}
                disabled={isSendingTestPush}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 min-h-[32px]"
                title="Send a sample push alert to verify instant delivery"
              >
                {isSendingTestPush ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#171923]" />
                ) : (
                  <Sparkles className="w-3 h-3 text-[#B78AF2]" />
                )}
                <span>Test push</span>
              </button>
            </div>
          )}

          {isSubscribingPush && (
            <div className="flex items-center gap-2 p-2 rounded-[8px] bg-[#F4F3F5] text-[11px] text-[#777783]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B78AF2]" />
              <span>Connecting device to browser push service...</span>
            </div>
          )}

          {permissionState === "denied" && (
            <p className="text-[11px] text-[#C2410C] bg-[#FFF5ED] p-2.5 rounded-[8px] border border-[#FED7CE] leading-relaxed">
              Push notifications are blocked in your browser settings. To enable them, click the lock or settings icon next to your browser URL bar and allow notifications for this site.
            </p>
          )}
        </div>

        {/* 2. Email Notifications Card */}
        <div className="p-3.5 sm:p-4 rounded-[14px] bg-[#FFFFFF] border border-[#D8D7DE] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[10px] bg-[#F4F3F5] text-[#171923] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-[#171923]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[13px] text-[#171923]">Email Notifications</span>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF8F5] text-[#065F46] border border-[#CCEBE1]">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF5ED] text-[#C2410C] border border-[#FED7CE]">
                      <Clock className="w-3 h-3" />
                      <span>Unverified</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#777783] mt-0.5">
                  Receive task reminders and daily digests sent to your verified email address.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="shrink-0 flex items-center">
              <ToggleSwitch
                checked={Boolean(channelEmail && isEmailVerified)}
                disabled={!isEmailVerified}
                onChange={handleToggleEmail}
                label="Toggle email notifications"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="flex-1 text-xs sm:text-[13px] px-3 py-2 rounded-[10px] bg-[#FFFFFF] border border-[#D8D7DE] focus:border-[#B78AF2] focus:outline-none min-h-[40px] text-[#171923]"
            />

            {!isEmailVerified && (
              <button
                type="button"
                onClick={handleSendEmailVerification}
                disabled={isSendingCode || !email.trim()}
                className="px-3.5 py-2 rounded-[10px] text-xs font-semibold bg-[#171923] text-white hover:bg-[#2D313E] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 min-h-[40px]"
              >
                {isSendingCode ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>Verify email</span>
              </button>
            )}

            {isEmailVerified && (
              <button
                type="button"
                onClick={() => handleSendTestNotification("email")}
                disabled={isSendingTestEmail}
                className="px-3 py-2 rounded-[10px] text-xs font-semibold bg-[#F4F3F5] text-[#171923] hover:bg-[#D8D7DE] transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 min-h-[40px]"
                title="Send a sample email to verify delivery"
              >
                {isSendingTestEmail ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#171923]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#B78AF2]" />
                )}
                <span>Test email</span>
              </button>
            )}
          </div>

          {/* Email Verification Box */}
          {isVerifyingEmail && (
            <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#B78AF2]/40 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#171923]">
                  Enter 6-digit confirmation code
                </span>
                <button
                  type="button"
                  onClick={() => setIsVerifyingEmail(false)}
                  className="text-[#777783] hover:text-[#171923] font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {codeSentMessage && (
                <p className="text-[11px] text-[#777783] leading-relaxed">
                  {codeSentMessage}
                </p>
              )}

              {demoCodeHelper && (
                <div className="flex items-center gap-1.5 p-2 rounded-[8px] bg-[#EFF8F5] text-[#065F46] text-[11px] border border-[#CCEBE1]">
                  <span>Demo code:</span>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(demoCodeHelper)}
                    className="font-mono font-bold underline px-1 py-0.5 rounded hover:bg-white cursor-pointer"
                    title="Click to automatically fill code"
                  >
                    {demoCodeHelper}
                  </button>
                  <span className="text-[10px] opacity-75">(click to fill)</span>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-32 px-3 py-2 rounded-[8px] bg-white border border-[#D8D7DE] text-center font-mono text-[16px] font-bold tracking-[0.2em] focus:border-[#B78AF2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmVerificationCode}
                  disabled={isConfirmingCode || verificationCode.length !== 6}
                  className="flex-1 px-4 py-2 rounded-[8px] bg-[#171923] text-white font-semibold text-xs hover:bg-[#2D313E] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isConfirmingCode ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm code</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Determine When to be Notified */}
      <div className="space-y-3 pt-2 border-t border-[#D8D7DE]/70">
        <div>
          <h3 className="text-[13px] font-bold text-[#171923] tracking-tight">
            When would you like to be notified?
          </h3>
          <p className="text-[11px] text-[#777783] mt-0.5">
            Select the events and timeline triggers that prompt notifications.
          </p>
        </div>

        <div className="space-y-2">
          {/* Trigger 1: Mentions */}
          <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-[8px] bg-white text-[#B78AF2] flex items-center justify-center shrink-0 mt-0.5">
                <AtSign className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-semibold text-[13px] text-[#171923]">
                  Notes & @Mentions
                </span>
                <span className="block text-[11px] text-[#777783] leading-snug">
                  Notify when another collaborator tags you directly in task context or notes.
                </span>
              </div>
            </div>
            <ToggleSwitch
              checked={notifyMentions}
              onChange={(checked) => {
                setNotifyMentions(checked);
                handleSavePreferences({ notify_mentions: checked });
              }}
              label="Toggle mention alerts"
            />
          </div>

          {/* Trigger 2: Prep time start window */}
          <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-[8px] bg-white text-[#171923] flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-semibold text-[13px] text-[#171923]">
                  Prep Time & Start Windows
                </span>
                <span className="block text-[11px] text-[#777783] leading-snug">
                  Alert when a multi-week task reaches its calculated work kickoff window.
                </span>
              </div>
            </div>
            <ToggleSwitch
              checked={notifyPrepWindow}
              onChange={(checked) => {
                setNotifyPrepWindow(checked);
                handleSavePreferences({ notify_prep_window: checked });
              }}
              label="Toggle prep window alerts"
            />
          </div>

          {/* Trigger 3: Imminent deadline */}
          <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-[8px] bg-white text-[#FF705B] flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-semibold text-[13px] text-[#171923]">
                  Imminent Deadlines (24 Hours)
                </span>
                <span className="block text-[11px] text-[#777783] leading-snug">
                  Send reminder alert 24 hours prior to a target deadline.
                </span>
              </div>
            </div>
            <ToggleSwitch
              checked={notifyDueSoon}
              onChange={(checked) => {
                setNotifyDueSoon(checked);
                handleSavePreferences({ notify_due_soon: checked });
              }}
              label="Toggle imminent deadline alerts"
            />
          </div>

          {/* Trigger 4: Space & Friend Invites */}
          <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-[8px] bg-white text-[#065F46] flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-semibold text-[13px] text-[#171923]">
                  Shared Spaces & Collaborators
                </span>
                <span className="block text-[11px] text-[#777783] leading-snug">
                  Notify when someone invites you to join a space or accepts your connection.
                </span>
              </div>
            </div>
            <ToggleSwitch
              checked={notifySpaceInvite}
              onChange={(checked) => {
                setNotifySpaceInvite(checked);
                handleSavePreferences({ notify_space_invite: checked });
              }}
              label="Toggle shared space alerts"
            />
          </div>

          {/* Trigger 5: Task Finished */}
          <div className="p-3 rounded-[12px] bg-[#F4F3F5] border border-[#D8D7DE]/70 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-[8px] bg-white text-[#171923] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-semibold text-[13px] text-[#171923]">
                  Task Completions
                </span>
                <span className="block text-[11px] text-[#777783] leading-snug">
                  Send notification when a collaborator marks a task completed.
                </span>
              </div>
            </div>
            <ToggleSwitch
              checked={notifyTaskCompleted}
              onChange={(checked) => {
                setNotifyTaskCompleted(checked);
                handleSavePreferences({ notify_task_completed: checked });
              }}
              label="Toggle task completion alerts"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Notification Frequency / Timing */}
      <div className="space-y-3 pt-2 border-t border-[#D8D7DE]/70">
        <div>
          <h3 className="text-[13px] font-bold text-[#171923] tracking-tight">
            Delivery Schedule
          </h3>
          <p className="text-[11px] text-[#777783] mt-0.5">
            Choose whether to receive real-time alerts or consolidated daily summaries.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setTiming("instant");
              handleSavePreferences({ timing: "instant" });
            }}
            className={`p-3 rounded-[12px] border text-left transition-all cursor-pointer ${
              timing === "instant"
                ? "bg-white border-[#171923] shadow-xs"
                : "bg-[#F4F3F5] border-transparent hover:bg-[#EBE9ED]"
            }`}
          >
            <span className="block font-semibold text-[12px] text-[#171923]">Instant alerts</span>
            <span className="block text-[11px] text-[#777783] mt-0.5">
              Sent immediately as activity happens
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTiming("daily_digest");
              handleSavePreferences({ timing: "daily_digest" });
            }}
            className={`p-3 rounded-[12px] border text-left transition-all cursor-pointer ${
              timing === "daily_digest"
                ? "bg-white border-[#171923] shadow-xs"
                : "bg-[#F4F3F5] border-transparent hover:bg-[#EBE9ED]"
            }`}
          >
            <span className="block font-semibold text-[12px] text-[#171923]">Daily summary</span>
            <span className="block text-[11px] text-[#777783] mt-0.5">
              Consolidated morning digest
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
