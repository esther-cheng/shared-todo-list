import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { canAddUserToSpace } from "@/lib/friends";
import { NextResponse } from "next/server";
import { SpaceMember } from "@/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: spaceId } = await params;

    // Check if space exists and user has access
    const spaceRows = await sql`
      SELECT id, name, created_by FROM groups WHERE id = ${spaceId};
    `;
    if (spaceRows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const memberRows = await sql`
      SELECT 
        COALESCE(sm.group_id, sm.space_id) as space_id,
        sm.role,
        sm.created_at,
        u.id as user_id,
        u.username,
        u.name,
        u.avatar_color,
        u.is_private
      FROM group_members sm
      JOIN users u ON u.id = sm.user_id
      WHERE (sm.group_id = ${spaceId} OR sm.space_id = ${spaceId})
      ORDER BY sm.role DESC, u.name ASC;
    `;

    const members: SpaceMember[] = memberRows.map((r) => ({
      user_id: r.user_id,
      username: r.username,
      name: r.name,
      avatar_color: r.avatar_color,
      role: r.role as "owner" | "member",
      is_private: Boolean(r.is_private),
      created_at: r.created_at,
    }));

    return NextResponse.json({ members });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Fetch space members error:", error);
    return NextResponse.json({ error: "Failed to fetch space members" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: spaceId } = await params;
    const body = await req.json();
    const { user_id: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Verify group exists
    const spaceRows = await sql`
      SELECT id, name, created_by FROM groups WHERE id = ${spaceId};
    `;
    if (spaceRows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const space = spaceRows[0];

    // 2. Caller must be a member or creator of the space
    const callerMember = await sql`
      SELECT role FROM group_members 
      WHERE (group_id = ${spaceId} OR space_id = ${spaceId}) AND user_id = ${user.id};
    `;
    const isCallerAllowed = callerMember.length > 0 || space.created_by === user.id;
    if (!isCallerAllowed) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 });
    }

    // 3. Verify target user exists
    const targetRows = await sql`
      SELECT id, username, name, avatar_color, is_private 
      FROM users 
      WHERE id = ${targetUserId};
    `;
    if (targetRows.length === 0) {
      return NextResponse.json({ error: "User to add not found" }, { status: 404 });
    }
    const targetUser = targetRows[0];

    // 4. Check if already a member
    const existingMember = await sql`
      SELECT role FROM group_members 
      WHERE (group_id = ${spaceId} OR space_id = ${spaceId}) AND user_id = ${targetUserId};
    `;
    if (existingMember.length > 0) {
      return NextResponse.json({ error: `${targetUser.name} is already a member of this group` }, { status: 409 });
    }

    // 5. CRITICAL CHECK: User privacy & friendship
    // Rule: "you can only add friends or public users to your spaces"
    const check = await canAddUserToSpace(user.id, targetUserId);
    if (!check.allowed) {
      return NextResponse.json(
        { error: check.reason || "This user is private. You can only add friends or public users to your groups." },
        { status: 403 }
      );
    }

    // 6. Insert new member
    await sql`
      INSERT INTO group_members (group_id, space_id, user_id, role)
      VALUES (${spaceId}, ${spaceId}, ${targetUserId}, 'member')
      ON CONFLICT (group_id, user_id) DO NOTHING;
    `;

    // 7. Return refreshed members list
    const memberRows = await sql`
      SELECT 
        COALESCE(sm.group_id, sm.space_id) as space_id,
        sm.role,
        sm.created_at,
        u.id as user_id,
        u.username,
        u.name,
        u.avatar_color,
        u.is_private
      FROM group_members sm
      JOIN users u ON u.id = sm.user_id
      WHERE (sm.group_id = ${spaceId} OR sm.space_id = ${spaceId})
      ORDER BY sm.role DESC, u.name ASC;
    `;

    const members: SpaceMember[] = memberRows.map((r) => ({
      user_id: r.user_id,
      username: r.username,
      name: r.name,
      avatar_color: r.avatar_color,
      role: r.role as "owner" | "member",
      is_private: Boolean(r.is_private),
      created_at: r.created_at,
    }));

    return NextResponse.json({
      message: `${targetUser.name} added to ${space.name}`,
      members,
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Add space member error:", error);
    return NextResponse.json({ error: "Failed to add space member" }, { status: 500 });
  }
}

