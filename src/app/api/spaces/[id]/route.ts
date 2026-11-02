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
      FROM spaces
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
      SELECT id, name, created_by FROM spaces WHERE id = ${spaceId};
    `;
    if (spaceRows.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    const space = spaceRows[0];

    // 2. Check access permissions
    const callerMember = await sql`
      SELECT role FROM space_members 
      WHERE space_id = ${spaceId} AND user_id = ${user.id};
    `;
    const anyMembers = await sql`
      SELECT 1 FROM space_members WHERE space_id = ${spaceId} LIMIT 1;
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
      WHERE task_id IN (SELECT id FROM tasks WHERE space_id = ${spaceId});
    `;
    await sql`DELETE FROM tasks WHERE space_id = ${spaceId};`;
    await sql`DELETE FROM space_members WHERE space_id = ${spaceId};`;
    await sql`DELETE FROM spaces WHERE id = ${spaceId};`;

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
