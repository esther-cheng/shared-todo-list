import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { canAddUserToSpace } from "@/lib/friends";
import { NextResponse } from "next/server";
import { SpaceMember } from "@/types";

export async function GET(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch spaces/groups accessible to the user:
    // Groups where user is a member, creator, or group has no members (legacy fallback)
    const spaces = await sql`
      SELECT s.id, s.name, s.slug, s.color, s.icon, s.created_by, s.created_at,
             COUNT(DISTINCT t.id)::int as task_count
      FROM groups s
      LEFT JOIN group_members sm ON (sm.group_id = s.id OR sm.space_id = s.id)
      LEFT JOIN tasks t ON (t.group_id = s.id OR t.space_id = s.id)
      WHERE sm.user_id = ${user.id} 
         OR s.created_by = ${user.id}
         OR NOT EXISTS (SELECT 1 FROM group_members WHERE group_id = s.id OR space_id = s.id)
      GROUP BY s.id, s.name, s.slug, s.color, s.icon, s.created_by, s.created_at
      ORDER BY s.name ASC;
    `;

    // Fetch members for each returned space
    const spaceIds = spaces.map((s) => s.id);
    const membersBySpace: Record<string, SpaceMember[]> = {};

    if (spaceIds.length > 0) {
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
        WHERE (sm.group_id = ANY(${spaceIds}) OR sm.space_id = ANY(${spaceIds}))
        ORDER BY sm.role DESC, u.name ASC;
      `;

      for (const row of memberRows) {
        if (!membersBySpace[row.space_id]) {
          membersBySpace[row.space_id] = [];
        }
        membersBySpace[row.space_id].push({
          user_id: row.user_id,
          username: row.username,
          name: row.name,
          avatar_color: row.avatar_color,
          role: row.role as "owner" | "member",
          is_private: Boolean(row.is_private),
          created_at: row.created_at,
        });
      }
    }

    const spacesWithMembers = spaces.map((s) => ({
      ...s,
      members: membersBySpace[s.id] || [],
      member_count: (membersBySpace[s.id] || []).length,
    }));

    return NextResponse.json({ spaces: spacesWithMembers });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Failed to fetch spaces:", error);
    return NextResponse.json({ error: "Failed to fetch spaces" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color = "purple", icon = "folder", member_ids = [] } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const id = "space-" + Date.now();
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Validate invited member_ids: Must be friends or public users
    if (Array.isArray(member_ids) && member_ids.length > 0) {
      for (const memberId of member_ids) {
        if (memberId === user.id) continue;
        const check = await canAddUserToSpace(user.id, memberId);
        if (!check.allowed) {
          return NextResponse.json(
            { error: check.reason || "Cannot add private user without being friends." },
            { status: 403 }
          );
        }
      }
    }

    // Insert group with creator
    const result = await sql`
      INSERT INTO groups (id, name, slug, color, icon, created_by)
      VALUES (${id}, ${name.trim()}, ${slug}, ${color}, ${icon}, ${user.id})
      RETURNING *;
    `;

    const space = result[0];

    // Add creator as owner in group_members
    await sql`
      INSERT INTO group_members (group_id, space_id, user_id, role)
      VALUES (${id}, ${id}, ${user.id}, 'owner');
    `;

    // Add selected members
    if (Array.isArray(member_ids)) {
      for (const memberId of member_ids) {
        if (memberId && memberId !== user.id) {
          await sql`
            INSERT INTO group_members (group_id, space_id, user_id, role)
            VALUES (${id}, ${id}, ${memberId}, 'member')
            ON CONFLICT (group_id, user_id) DO NOTHING;
          `;
        }
      }
    }

    // Fetch members for response
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
      WHERE (sm.group_id = ${id} OR sm.space_id = ${id})
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
      space: {
        ...space,
        task_count: 0,
        members,
        member_count: members.length,
      },
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "digest" in error && error.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Failed to create space:", error);
    return NextResponse.json({ error: "Failed to create space" }, { status: 500 });
  }
}
