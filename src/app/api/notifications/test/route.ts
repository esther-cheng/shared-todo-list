import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getOrCreateNotificationSettings, dispatchNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { channel = "push" } = body;

    const settings = await getOrCreateNotificationSettings(user.id);

    if (channel === "email") {
      if (!settings.email || !settings.email_verified) {
        return NextResponse.json(
          { error: "Please enter and verify your email address before testing email notifications." },
          { status: 400 }
        );
      }
    } else if (channel === "push") {
      const subs = await sql`
        SELECT id FROM push_subscriptions WHERE user_id = ${user.id} LIMIT 1;
      `;
      if (subs.length === 0) {
        return NextResponse.json(
          { error: "No active browser push subscriptions found for your account. Please click 'Enable push notifications' first." },
          { status: 400 }
        );
      }
    }

    const title = channel === "push" ? "Tandem Web Push Test" : "Tandem Email Notification Test";
    const message = `Hello ${user.name}! Your ${channel === "push" ? "browser push" : "email"} alerts are active and ready to deliver task reminders, prep window alerts, and mentions.`;

    const result = await dispatchNotification({
      userId: user.id,
      title,
      message,
      triggerType: "test",
    });

    return NextResponse.json({
      success: true,
      message: `Test alert sent successfully via ${channel === "push" ? "Browser Push" : "Email"}!`,
      result,
    });
  } catch (error: any) {
    console.error("Test notification error:", error);
    return NextResponse.json({ error: "Failed to dispatch test notification" }, { status: 500 });
  }
}
