import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SearchedUser } from "@/types";

export async function GET(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const currentUser = await getSessionUserFromToken(sessionId);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Accepted friends (can be user_id or friend_id)
    const acceptedRows = await sql`
      SELECT 
        f.id as friendship_id,
        u.id, u.username, u.name, u.avatar_color, u.is_private
      FROM friendships f
      JOIN users u ON (
        (f.user_id = ${currentUser.id} AND u.id = f.friend_id) OR
        (f.friend_id = ${currentUser.id} AND u.id = f.user_id)
      )
      WHERE f.status = 'accepted'
      ORDER BY u.name ASC;
    `;

    const friends: SearchedUser[] = acceptedRows.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.name,
      avatar_color: r.avatar_color,
      is_private: Boolean(r.is_private),
      friendship_status: "friends",
      can_add_to_space: true,
    }));

    // 2. Incoming pending requests (target is currentUser)
    const incomingRows = await sql`
      SELECT 
        f.id as friendship_id,
        u.id, u.username, u.name, u.avatar_color, u.is_private
      FROM friendships f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ${currentUser.id} AND f.status = 'pending'
      ORDER BY f.created_at DESC;
    `;

    const pending_incoming: SearchedUser[] = incomingRows.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.name,
      avatar_color: r.avatar_color,
      is_private: Boolean(r.is_private),
      friendship_status: "pending_received",
      can_add_to_space: !r.is_private,
    }));

    // 3. Outgoing pending requests (requester is currentUser)
    const outgoingRows = await sql`
      SELECT 
        f.id as friendship_id,
        u.id, u.username, u.name, u.avatar_color, u.is_private
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ${currentUser.id} AND f.status = 'pending'
      ORDER BY f.created_at DESC;
    `;

    const pending_outgoing: SearchedUser[] = outgoingRows.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.name,
      avatar_color: r.avatar_color,
      is_private: Boolean(r.is_private),
      friendship_status: "pending_sent",
      can_add_to_space: !r.is_private,
    }));

    return NextResponse.json({
      friends,
      pending_incoming,
      pending_outgoing,
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Fetch friends error:", error);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const currentUser = await getSessionUserFromToken(sessionId);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const targetUserId = body.friend_id || body.target_user_id;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === currentUser.id) {
      return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
    }

    // Check if target user exists
    const targetUserCheck = await sql`
      SELECT id, username, name, is_private FROM users WHERE id = ${targetUserId};
    `;
    if (targetUserCheck.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check existing friendship record in either direction
    const existing = await sql`
      SELECT id, user_id, friend_id, status
      FROM friendships
      WHERE 
        (user_id = ${currentUser.id} AND friend_id = ${targetUserId}) OR
        (user_id = ${targetUserId} AND friend_id = ${currentUser.id});
    `;

    if (existing.length > 0) {
      const record = existing[0];
      if (record.status === "accepted") {
        return NextResponse.json({ message: "Already friends", status: "friends" });
      }

      // If other user already requested to friend current user, auto-accept!
      if (record.user_id === targetUserId && record.friend_id === currentUser.id) {
        await sql`
          UPDATE friendships
          SET status = 'accepted'
          WHERE id = ${record.id};
        `;
        return NextResponse.json({ message: "Friend request accepted", status: "friends" });
      }

      // If current user already sent request
      return NextResponse.json({ message: "Friend request already sent", status: "pending_sent" });
    }

    // Create new friend request / friendship
    const newId = "fr_" + crypto.randomUUID();
    await sql`
      INSERT INTO friendships (id, user_id, friend_id, status)
      VALUES (${newId}, ${currentUser.id}, ${targetUserId}, 'accepted');
    `;

    return NextResponse.json({
      message: "Friend added successfully",
      status: "friends",
      friendship_id: newId,
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Add friend error:", error);
    return NextResponse.json({ error: "Failed to add friend" }, { status: 500 });
  }
}

