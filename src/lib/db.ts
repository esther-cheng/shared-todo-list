import { neon } from "@neondatabase/serverless";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  return url.replace(/^["']|["']$/g, "").trim();
}

export const sql = neon(getDatabaseUrl());
