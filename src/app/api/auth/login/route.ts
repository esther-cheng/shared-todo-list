import { sql } from "@/lib/db";
import { verifyPassword, createSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, remember_me = true } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Query user
    const users = await sql`
      SELECT id, username, name, password_hash, avatar_color, created_at
      FROM users
      WHERE username = ${cleanUsername};
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const user = users[0];
    const isMatch = await verifyPassword(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create session with remember_me option
    const isRememberMe = Boolean(remember_me);
    const sessionId = await createSession(user.id, isRememberMe);

    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar_color: user.avatar_color,
      created_at: user.created_at,
    };

    const response = NextResponse.json({ user: safeUser });
    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: "lax" | "strict" | "none";
      path: string;
      maxAge?: number;
    } = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };

    if (isRememberMe) {
      cookieOptions.maxAge = 60 * 24 * 60 * 60; // 60 days
    }

    response.cookies.set(SESSION_COOKIE_NAME, sessionId, cookieOptions);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
