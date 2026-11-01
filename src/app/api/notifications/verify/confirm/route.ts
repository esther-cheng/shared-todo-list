import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json({ error: "Please enter the complete 6-digit verification code." }, { status: 400 });
    }

    const cleanCode = code.trim();

    // Query active code
    const matching = await sql`
      SELECT id, target, expires_at 
      FROM verification_codes
      WHERE user_id = ${user.id} 
        AND type = 'email'
        AND code = ${cleanCode} 
        AND expires_at > NOW()
      ORDER BY created_at DESC 
      LIMIT 1;
    `;

    if (matching.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please check the code or request a new one." },
        { status: 400 }
      );
    }

    const targetVerified = matching[0].target;

    // Mark as verified in user_notification_settings
    const updated = await sql`
      UPDATE user_notification_settings
      SET email = ${targetVerified}, email_verified = true, updated_at = NOW()
      WHERE user_id = ${user.id}
      RETURNING *;
    `;

    // Delete used code
    await sql`
      DELETE FROM verification_codes 
      WHERE user_id = ${user.id} AND type = 'email';
    `;

    // Log verification event
    const logId = "nlog-verified-" + Date.now();
    await sql`
      INSERT INTO notification_logs (id, user_id, channel, title, message, status)
      VALUES (
        ${logId}, 
        ${user.id}, 
        'email', 
        'Email verified successfully', 
        ${"Email (" + targetVerified + ") is now confirmed and active for Tandem notifications."}, 
        'delivered'
      );
    `;

    return NextResponse.json({
      success: true,
      message: "Email address verified successfully!",
      settings: updated[0],
    });
  } catch (error: any) {
    console.error("Confirm verification code error:", error);
    return NextResponse.json({ error: "Failed to confirm verification code" }, { status: 500 });
  }
}
