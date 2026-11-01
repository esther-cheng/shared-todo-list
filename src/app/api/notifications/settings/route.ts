import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getOrCreateNotificationSettings } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getOrCreateNotificationSettings(user.id, `${user.username}@example.com`);
    return NextResponse.json({ settings });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Get notification settings error:", error);
    return NextResponse.json({ error: "Failed to load notification settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const current = await getOrCreateNotificationSettings(user.id, `${user.username}@example.com`);

    const {
      email,
      notify_mentions,
      notify_prep_window,
      notify_due_soon,
      notify_task_completed,
      notify_space_invite,
      channel_email,
      channel_push,
      timing,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
    } = body;

    let newEmail = current.email;
    let emailVerified = current.email_verified;
    if (typeof email === "string") {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== (current.email || "").toLowerCase()) {
        newEmail = cleanEmail || null;
        // If email changed, require re-verification
        emailVerified = false;
      }
    } else if (email === null) {
      newEmail = null;
      emailVerified = false;
    }

    const updated = await sql`
      UPDATE user_notification_settings
      SET
        email = ${newEmail},
        email_verified = ${emailVerified},
        notify_mentions = ${typeof notify_mentions === "boolean" ? notify_mentions : current.notify_mentions},
        notify_prep_window = ${typeof notify_prep_window === "boolean" ? notify_prep_window : current.notify_prep_window},
        notify_due_soon = ${typeof notify_due_soon === "boolean" ? notify_due_soon : current.notify_due_soon},
        notify_task_completed = ${typeof notify_task_completed === "boolean" ? notify_task_completed : current.notify_task_completed},
        notify_space_invite = ${typeof notify_space_invite === "boolean" ? notify_space_invite : current.notify_space_invite},
        channel_email = ${typeof channel_email === "boolean" ? channel_email : current.channel_email},
        channel_push = ${typeof channel_push === "boolean" ? channel_push : (current.channel_push ?? true)},
        timing = ${timing === "daily_digest" ? "daily_digest" : "instant"},
        quiet_hours_enabled = ${typeof quiet_hours_enabled === "boolean" ? quiet_hours_enabled : current.quiet_hours_enabled},
        quiet_hours_start = ${typeof quiet_hours_start === "string" ? quiet_hours_start : current.quiet_hours_start || "22:00"},
        quiet_hours_end = ${typeof quiet_hours_end === "string" ? quiet_hours_end : current.quiet_hours_end || "08:00"},
        updated_at = NOW()
      WHERE user_id = ${user.id}
      RETURNING *;
    `;

    return NextResponse.json({
      settings: updated[0],
      reverificationRequired: {
        email: !emailVerified && Boolean(newEmail),
      },
    });
  } catch (error: any) {
    console.error("Update notification settings error:", error);
    return NextResponse.json({ error: "Failed to save notification settings" }, { status: 500 });
  }
}
