import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getOrCreateNotificationSettings } from "@/lib/notifications";
import { sendVerificationCodeDelivery } from "@/lib/delivery";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { target } = body;

    const settings = await getOrCreateNotificationSettings(user.id);

    // Resolve email destination
    const destination = (typeof target === "string" && target.trim())
      ? target.trim().toLowerCase()
      : settings.email;

    if (!destination) {
      return NextResponse.json(
        { error: "Please enter a valid email address first." },
        { status: 400 }
      );
    }

    // Format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      return NextResponse.json({ error: "Please enter a valid email address format." }, { status: 400 });
    }

    // Update settings with the target if different
    if (destination !== settings.email) {
      await sql`
        UPDATE user_notification_settings 
        SET email = ${destination}, email_verified = false, updated_at = NOW() 
        WHERE user_id = ${user.id};
      `;
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeId = "vcode-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous active codes for this user
    await sql`
      DELETE FROM verification_codes 
      WHERE user_id = ${user.id} AND type = 'email';
    `;

    // Save new code
    await sql`
      INSERT INTO verification_codes (id, user_id, target, type, code, expires_at)
      VALUES (${codeId}, ${user.id}, ${destination}, 'email', ${code}, ${expiresAt.toISOString()});
    `;

    // Send code via Resend
    const delivery = await sendVerificationCodeDelivery({
      target: destination,
      code,
      userName: user.name,
    });

    const isLive = delivery.provider === "resend";

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${destination}.`,
      target: destination,
      type: "email",
      provider: delivery.provider,
      // Provide demoCode only in development / simulation mode when live credentials are not set
      demoCode: !isLive ? code : undefined,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Send verification code error:", error);
    return NextResponse.json({ error: "Failed to generate verification code" }, { status: 500 });
  }
}
