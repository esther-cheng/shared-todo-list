import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { NextResponse } from "next/server";

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
    const spaceRows = await sql`
      SELECT id, name, slug, color, icon, created_by, created_at
      FROM groups
      WHERE id = ${spaceId};
    `;

    if (spaceRows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ space: spaceRows[0] });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Fetch group error:", error);
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}

export async function DELETE(
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

    // 1. Verify group exists
    const spaceRows = await sql`
      SELECT id, name, created_by FROM groups WHERE id = ${spaceId};
    `;
    if (spaceRows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const space = spaceRows[0];

    // 2. Check access permissions
    const callerMember = await sql`
      SELECT role FROM group_members 
      WHERE (group_id = ${spaceId} OR space_id = ${spaceId}) AND user_id = ${user.id};
    `;
    const anyMembers = await sql`
      SELECT 1 FROM group_members WHERE group_id = ${spaceId} OR space_id = ${spaceId} LIMIT 1;
    `;

    const hasAccess =
      callerMember.length > 0 ||
      space.created_by === user.id ||
      anyMembers.length === 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have permission to delete this group" },
        { status: 403 }
      );
    }

    // 3. Delete dependent records and the space itself
    await sql`
      DELETE FROM task_notes 
      WHERE task_id IN (SELECT id FROM tasks WHERE group_id = ${spaceId} OR space_id = ${spaceId});
    `;
    await sql`DELETE FROM tasks WHERE group_id = ${spaceId} OR space_id = ${spaceId};`;
    await sql`DELETE FROM group_members WHERE group_id = ${spaceId} OR space_id = ${spaceId};`;
    await sql`DELETE FROM groups WHERE id = ${spaceId};`;

    return NextResponse.json({
      success: true,
      deleted_id: spaceId,
      name: space.name,
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Delete group error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}

export async function PATCH(
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

    // 1. Verify group exists
    const spaceRows = await sql`
      SELECT id, name, color, icon, created_by FROM groups WHERE id = ${spaceId};
    `;
    if (spaceRows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const space = spaceRows[0];

    // 2. Check access permissions
    const callerMember = await sql`
      SELECT role FROM group_members 
      WHERE (group_id = ${spaceId} OR space_id = ${spaceId}) AND user_id = ${user.id};
    `;
    const anyMembers = await sql`
      SELECT 1 FROM group_members WHERE group_id = ${spaceId} OR space_id = ${spaceId} LIMIT 1;
    `;

    const hasAccess =
      callerMember.length > 0 ||
      space.created_by === user.id ||
      anyMembers.length === 0;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have permission to edit this group" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, color, icon } = body;

    const trimmedName = typeof name === "string" ? name.trim() : undefined;
    if (trimmedName !== undefined && trimmedName === "") {
      return NextResponse.json({ error: "Group name cannot be empty" }, { status: 400 });
    }

    const updatedRows = await sql`
      UPDATE groups
      SET
        name = COALESCE(${trimmedName ?? null}, name),
        slug = COALESCE(${trimmedName ? trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : null}, slug),
        color = COALESCE(${color ?? null}, color),
        icon = COALESCE(${icon ?? null}, icon)
      WHERE id = ${spaceId}
      RETURNING id, name, slug, color, icon, created_by, created_at;
    `;

    // Also fetch updated members
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

    const updatedSpace = {
      ...updatedRows[0],
      members: memberRows.map((r) => ({
        user_id: r.user_id,
        username: r.username,
        name: r.name,
        avatar_color: r.avatar_color,
        role: r.role as "owner" | "member",
        is_private: Boolean(r.is_private),
        created_at: r.created_at,
      })),
    };

    return NextResponse.json({ success: true, space: updatedSpace });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Update group error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}
