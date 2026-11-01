import { sql } from "@/lib/db";
import { parseSessionCookie, getSessionUserFromToken } from "@/lib/auth";
import { NextResponse } from "next/server";

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

    const { id } = await params;
    const body = await req.json();
    const { author = user.name, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Extract @mentions like @alex, @partner, @mom
    const matches = content.match(/@[a-zA-Z0-9_-]+/g) || [];
    const taggedUsers = Array.from(new Set(matches.map((m: string) => m.toLowerCase())));

    const noteId = "note-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

    const result = await sql`
      INSERT INTO task_notes (id, task_id, author, content, tagged_users)
      VALUES (${noteId}, ${id}, ${author}, ${content}, ${taggedUsers})
      RETURNING *;
    `;

    // Bump last_activity_at on the task
    await sql`
      UPDATE tasks 
      SET last_activity_at = NOW(), updated_at = NOW() 
      WHERE id = ${id};
    `;

    return NextResponse.json({ note: result[0] });
  } catch (error) {
    console.error("Failed to add note:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}

