import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await sql`
      SELECT id, channel, title, message, task_id, status, created_at
      FROM notification_logs
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 15;
    `;

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Get notification logs error:", error);
    return NextResponse.json({ error: "Failed to load notification logs" }, { status: 500 });
  }
}

