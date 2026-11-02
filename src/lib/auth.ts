import bcrypt from "bcryptjs";
import { sql } from "./db";
import { User } from "@/types";

export const SESSION_COOKIE_NAME = "tandem_session_id";
export const REMEMBERED_SESSION_DAYS = 60; // 60 days persistent login
export const STANDARD_SESSION_DAYS = 1;   // 1 day session fallback

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, rememberMe: boolean = true): Promise<string> {
  const sessionId = "sess_" + crypto.randomUUID();
  const durationDays = rememberMe ? REMEMBERED_SESSION_DAYS : STANDARD_SESSION_DAYS;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()});
  `;

  return sessionId;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE id = ${sessionId};`;
}

export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getSessionUserFromToken(sessionId: string | null): Promise<User | null> {
  if (!sessionId) return null;

  try {
    const result = await sql`
      SELECT u.id, u.username, u.name, u.avatar_color, u.is_private, u.created_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ${sessionId} AND s.expires_at > NOW();
    `;

    if (result.length === 0) return null;
    return result[0] as User;
  } catch (error) {
    console.error("Failed to query session user:", error);
    return null;
  }
}
