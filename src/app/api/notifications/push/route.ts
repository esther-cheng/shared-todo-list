import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { VAPID_PUBLIC_KEY } from "@/lib/delivery";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await sql`
      SELECT id, endpoint, user_agent, created_at, updated_at
      FROM push_subscriptions
      WHERE user_id = ${user.id}
      ORDER BY updated_at DESC;
    `;

    return NextResponse.json({
      vapidPublicKey: VAPID_PUBLIC_KEY,
      hasSubscriptions: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
      subscriptions,
    });
  } catch (error: any) {
    console.error("Get push status error:", error);
    return NextResponse.json({ error: "Failed to load push subscription status" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys, userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid push subscription object. Required: endpoint, keys.p256dh, keys.auth" },
        { status: 400 }
      );
    }

    const id = "psub-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const agent = userAgent || (typeof req.headers.get === "function" ? req.headers.get("user-agent") : null) || null;

    // Save or update subscription
    await sql`
      INSERT INTO push_subscriptions (
        id, user_id, endpoint, p256dh, auth, user_agent, updated_at
      ) VALUES (
        ${id}, ${user.id}, ${endpoint}, ${keys.p256dh}, ${keys.auth}, ${agent}, NOW()
      )
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW();
    `;

    // Ensure channel_push is active in settings
    await sql`
      UPDATE user_notification_settings
      SET channel_push = true, updated_at = NOW()
      WHERE user_id = ${user.id};
    `;

    return NextResponse.json({
      success: true,
      message: "Browser push subscription registered successfully!",
    });
  } catch (error: any) {
    console.error("Register push subscription error:", error);
    return NextResponse.json({ error: "Failed to register push subscription" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint } = body;

    if (endpoint) {
      await sql`
        DELETE FROM push_subscriptions
        WHERE user_id = ${user.id} AND endpoint = ${endpoint};
      `;
    } else {
      await sql`
        DELETE FROM push_subscriptions
        WHERE user_id = ${user.id};
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Push subscription(s) removed successfully.",
    });
  } catch (error: any) {
    console.error("Delete push subscription error:", error);
    return NextResponse.json({ error: "Failed to remove push subscription" }, { status: 500 });
  }
}

