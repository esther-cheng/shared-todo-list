import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SpaceMember } from "@/types";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: spaceId, userId: targetUserId } = await params;

    // Verify group exists
    const spaceRows = await sql`
      SELECT id, name, created_by FROM groups WHERE id = ${spaceId};
    `;
    if (spaceRows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const space = spaceRows[0];

    // Caller must be group owner OR caller is removing themselves
    const callerMember = await sql`
      SELECT role FROM group_members 
      WHERE (group_id = ${spaceId} OR space_id = ${spaceId}) AND user_id = ${user.id};
    `;
    const isOwner = (callerMember[0]?.role === "owner") || (space.created_by === user.id);
    const isSelf = user.id === targetUserId;

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: "Only group owners can remove other members" }, { status: 403 });
    }

    // Check if target is in group
    const targetMember = await sql`
      SELECT role FROM group_members 
      WHERE (group_id = ${spaceId} OR space_id = ${spaceId}) AND user_id = ${targetUserId};
    `;
    if (targetMember.length === 0) {
      return NextResponse.json({ error: "Member not found in group" }, { status: 404 });
    }

    if (targetMember[0].role === "owner" && !isSelf) {
      return NextResponse.json({ error: "Group owner cannot be removed" }, { status: 400 });
    }

    // Delete membership
    await sql`
      DELETE FROM group_members 
      WHERE (group_id = ${spaceId} OR space_id = ${spaceId}) AND user_id = ${targetUserId};
    `;

    // Refreshed member list
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
      message: "Member removed from space",
      members,
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Remove space member error:", error);
    return NextResponse.json({ error: "Failed to remove space member" }, { status: 500 });
  }
}

