import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const sessionId = parseSessionCookie(req.headers.get("cookie"));
    const user = await getSessionUserFromToken(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const taggedUser = searchParams.get("taggedUser");
    const radar = searchParams.get("radar");

    let query = `
      SELECT 
        t.id,
        t.space_id,
        t.title,
        t.description,
        t.deadline,
        t.lead_time_days,
        t.reminder_date,
        t.status,
        t.created_by,
        t.created_at,
        t.updated_at,
        t.last_activity_at,
        s.name AS space_name,
        s.color AS space_color,
        s.icon AS space_icon,
        COUNT(DISTINCT n.id)::int AS notes_count,
        COALESCE(
          (
            SELECT array_agg(DISTINCT u)
            FROM task_notes tn, unnest(tn.tagged_users) AS u
            WHERE tn.task_id = t.id
          ),
          ARRAY[]::text[]
        ) AS tagged_users,
        (
          SELECT json_build_object('author', tn.author, 'content', tn.content, 'created_at', tn.created_at)
          FROM task_notes tn
          WHERE tn.task_id = t.id
          ORDER BY tn.created_at DESC
          LIMIT 1
        ) AS latest_note
      FROM tasks t
      LEFT JOIN spaces s ON t.space_id = s.id
      LEFT JOIN task_notes n ON t.id = n.task_id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (spaceId && spaceId !== "all") {
      params.push(spaceId);
      query += ` AND t.space_id = $${params.length}`;
    }

    if (status && status !== "all") {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }

    if (taggedUser) {
      const normalizedUser = taggedUser.startsWith("@") ? taggedUser : `@${taggedUser}`;
      params.push(normalizedUser);
      query += ` AND t.id IN (
        SELECT task_id FROM task_notes WHERE $${params.length} = ANY(tagged_users)
      )`;
    }

    if (radar === "true") {
      query += ` AND t.status = 'todo' AND (
        t.reminder_date <= NOW() OR 
        t.deadline <= NOW() + INTERVAL '60 days'
      )`;
    }

    query += `
      GROUP BY t.id, s.name, s.color, s.icon
      ORDER BY 
        CASE WHEN t.status = 'todo' THEN 1 WHEN t.status = 'in_progress' THEN 2 ELSE 3 END ASC,
        t.deadline ASC NULLS LAST,
        t.created_at DESC;
    `;

    const tasks = await sql.query(query, params);
    return NextResponse.json({ tasks });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
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
    const {
      space_id,
      title,
      description = "",
      deadline = null,
      lead_time_days = 0,
      created_by = user.name,
    } = body;

    if (!space_id || !title) {
      return NextResponse.json({ error: "space_id and title are required" }, { status: 400 });
    }

    const id = "task-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

    let reminder_date: string | null = null;
    if (deadline && Number(lead_time_days) > 0) {
      const deadlineDate = new Date(deadline);
      const reminder = new Date(deadlineDate.getTime() - Number(lead_time_days) * 24 * 60 * 60 * 1000);
      reminder_date = reminder.toISOString();
    } else if (deadline) {
      reminder_date = deadline;
    }

    const result = await sql`
      INSERT INTO tasks (
        id, space_id, title, description, deadline, lead_time_days, reminder_date, status, created_by, last_activity_at
      )
      VALUES (
        ${id},
        ${space_id},
        ${title},
        ${description},
        ${deadline ? new Date(deadline).toISOString() : null},
        ${Number(lead_time_days)},
        ${reminder_date ? new Date(reminder_date).toISOString() : null},
        'todo',
        ${created_by},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({ task: result[0] });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
