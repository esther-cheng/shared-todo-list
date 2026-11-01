import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { getFriendshipStatus } from "@/lib/friends";
import { NextResponse } from "next/server";
import { SearchedUser } from "@/types";

export async function GET(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const currentUser = await getSessionUserFromToken(sessionId);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    let usersQuery;
    if (query) {
      const searchPattern = `%${query}%`;
      usersQuery = await sql`
        SELECT id, username, name, avatar_color, is_private, created_at
        FROM users
        WHERE id != ${currentUser.id}
          AND (
            LOWER(username) LIKE ${searchPattern}
            OR LOWER(name) LIKE ${searchPattern}
          )
        ORDER BY name ASC
        LIMIT 25;
      `;
    } else {
      // Default: return recent active users up to 20
      usersQuery = await sql`
        SELECT id, username, name, avatar_color, is_private, created_at
        FROM users
        WHERE id != ${currentUser.id}
        ORDER BY name ASC
        LIMIT 20;
      `;
    }

    // Determine friendship status and whether caller can add them to spaces
    const results: SearchedUser[] = await Promise.all(
      usersQuery.map(async (u) => {
        const { status } = await getFriendshipStatus(currentUser.id, u.id);
        const isFriend = status === "friends";
        const canAdd = !u.is_private || isFriend;

        return {
          id: u.id,
          username: u.username,
          name: u.name,
          avatar_color: u.avatar_color,
          is_private: Boolean(u.is_private),
          friendship_status: status,
          can_add_to_space: canAdd,
        };
      })
    );

    return NextResponse.json({ users: results });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("User search error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
