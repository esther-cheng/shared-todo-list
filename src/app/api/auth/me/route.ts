import { parseSessionCookie, getSessionUserFromToken, verifyPassword, hashPassword } from "@/lib/auth";
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    return NextResponse.json({ user });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("Get session error:", error);
    return NextResponse.json({ user: null });
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
    const { name, username, avatar_color, current_password, new_password } = body;

    // Fetch existing user with password_hash
    const existing = await sql`
      SELECT id, username, name, password_hash, avatar_color 
      FROM users 
      WHERE id = ${user.id}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const currentRecord = existing[0];

    let cleanName = currentRecord.name;
    if (typeof name === "string" && name.trim()) {
      cleanName = name.trim();
    }

    let cleanUsername = currentRecord.username;
    if (typeof username === "string" && username.trim()) {
      cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
      if (cleanUsername !== currentRecord.username) {
        // Check uniqueness
        const duplicate = await sql`
          SELECT id FROM users WHERE username = ${cleanUsername} AND id != ${user.id}
        `;
        if (duplicate.length > 0) {
          return NextResponse.json(
            { error: "Username is already taken by another account" },
            { status: 400 }
          );
        }
      }
    }

    let cleanAvatarColor = currentRecord.avatar_color;
    if (typeof avatar_color === "string" && avatar_color.trim()) {
      cleanAvatarColor = avatar_color.trim().toLowerCase();
    }

    let newPasswordHash = currentRecord.password_hash;
    const cleanNewPassword = typeof new_password === "string" ? new_password.trim() : "";
    if (cleanNewPassword) {
      if (!current_password) {
        return NextResponse.json(
          { error: "Current password is required to change your password." },
          { status: 400 }
        );
      }
      const isValid = await verifyPassword(current_password, currentRecord.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Incorrect current password. Password changes were not saved." },
          { status: 400 }
        );
      }
      if (cleanNewPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }
      newPasswordHash = await hashPassword(cleanNewPassword);
    }

    const updated = await sql`
      UPDATE users 
      SET 
        name = ${cleanName}, 
        username = ${cleanUsername}, 
        avatar_color = ${cleanAvatarColor}, 
        password_hash = ${newPasswordHash}
      WHERE id = ${user.id}
      RETURNING id, username, name, avatar_color, created_at;
    `;

    return NextResponse.json({ user: updated[0] });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
