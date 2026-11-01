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

    const { id } = await params;
    const tasks = await sql`
      SELECT 
        t.*,
        s.name AS space_name,
        s.color AS space_color,
        s.icon AS space_icon
      FROM tasks t
      LEFT JOIN spaces s ON t.space_id = s.id
      WHERE t.id = ${id};
    `;

    if (tasks.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const notes = await sql`
      SELECT * FROM task_notes
      WHERE task_id = ${id}
      ORDER BY created_at ASC;
    `;

    return NextResponse.json({ task: { ...tasks[0], notes } });
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
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

    const { id } = await params;
    const body = await req.json();
    const { status, description, title, deadline, lead_time_days } = body;

    const existing = await sql`SELECT * FROM tasks WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const current = existing[0];
    const newStatus = status ?? current.status;
    const newTitle = title ?? current.title;
    const newDescription = description !== undefined ? description : current.description;
    const newDeadline = deadline !== undefined ? deadline : current.deadline;
    const newLeadTime = lead_time_days !== undefined ? Number(lead_time_days) : current.lead_time_days;

    let newReminderDate = current.reminder_date;
    if (newDeadline && newLeadTime > 0) {
      const d = new Date(newDeadline);
      newReminderDate = new Date(d.getTime() - newLeadTime * 24 * 60 * 60 * 1000).toISOString();
    } else if (newDeadline) {
      newReminderDate = newDeadline;
    }

    const updated = await sql`
      UPDATE tasks
      SET 
        status = ${newStatus},
        title = ${newTitle},
        description = ${newDescription},
        deadline = ${newDeadline ? new Date(newDeadline).toISOString() : null},
        lead_time_days = ${newLeadTime},
        reminder_date = ${newReminderDate ? new Date(newReminderDate).toISOString() : null},
        updated_at = NOW(),
        last_activity_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    return NextResponse.json({ task: updated[0] });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
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

    const { id } = await params;
    await sql`DELETE FROM tasks WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

