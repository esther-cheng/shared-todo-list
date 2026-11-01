import { sql } from "@/lib/db";
import { hashPassword, createSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, name, password, avatar_color = "purple", is_private = false } = body;

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const cleanName = (name && name.trim()) || cleanUsername;

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE username = ${cleanUsername};
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = "user-" + crypto.randomUUID();

    const insertResult = await sql`
      INSERT INTO users (id, username, name, password_hash, avatar_color, is_private)
      VALUES (${userId}, ${cleanUsername}, ${cleanName}, ${passwordHash}, ${avatar_color}, ${Boolean(is_private)})
      RETURNING id, username, name, avatar_color, is_private, created_at;
    `;

    const user = insertResult[0];

    // Create session
    const sessionId = await createSession(userId);

    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
