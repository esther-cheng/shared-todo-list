import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const currentUser = await getSessionUserFromToken(sessionId);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetId } = await params;
    const body = await req.json();
    const { action } = body; // 'accept' | 'decline'

    // Look up friendship by either friendship id OR target user id
    const rows = await sql`
      SELECT id, user_id, friend_id, status
      FROM friendships
      WHERE 
        id = ${targetId} OR
        (user_id = ${targetId} AND friend_id = ${currentUser.id}) OR
        (friend_id = ${targetId} AND user_id = ${currentUser.id});
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    const friendship = rows[0];

    if (action === "accept") {
      await sql`
        UPDATE friendships
        SET status = 'accepted'
        WHERE id = ${friendship.id};
      `;
      return NextResponse.json({ success: true, status: "friends" });
    } else if (action === "decline") {
      await sql`
        DELETE FROM friendships
        WHERE id = ${friendship.id};
      `;
      return NextResponse.json({ success: true, status: "none" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Update friendship error:", error);
    return NextResponse.json({ error: "Failed to update friendship" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const currentUser = await getSessionUserFromToken(sessionId);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetId } = await params;

    // Delete friendship where currentUser is involved
    const result = await sql`
      DELETE FROM friendships
      WHERE 
        (id = ${targetId} AND (user_id = ${currentUser.id} OR friend_id = ${currentUser.id})) OR
        (user_id = ${currentUser.id} AND friend_id = ${targetId}) OR
        (friend_id = ${currentUser.id} AND user_id = ${targetId})
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Delete friendship error:", error);
    return NextResponse.json({ error: "Failed to remove friendship" }, { status: 500 });
  }
}

