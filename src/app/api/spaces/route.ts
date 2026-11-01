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

    const spaces = await sql`
      SELECT id, name, slug, color, icon, created_at
      FROM spaces
      ORDER BY name ASC;
    `;
    return NextResponse.json({ spaces });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
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
    const { name, color = "purple", icon = "folder" } = body;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const id = "space-" + Date.now();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const result = await sql`
      INSERT INTO spaces (id, name, slug, color, icon)
      VALUES (${id}, ${name}, ${slug}, ${color}, ${icon})
      RETURNING *;
    `;

    return NextResponse.json({ space: result[0] });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") throw error;
    console.error("Failed to create space:", error);
    return NextResponse.json({ error: "Failed to create space" }, { status: 500 });
  }
}
