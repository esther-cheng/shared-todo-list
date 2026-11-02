import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not defined in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log("Running migration for task categories...");

  // 1. Add category column to tasks table
  await sql`
    ALTER TABLE tasks 
    ADD COLUMN IF NOT EXISTS category TEXT;
  `;
  console.log("✓ Added category column to tasks table");

  // 2. Set default categories for existing tasks based on their titles if empty
  await sql`
    UPDATE tasks
    SET category = 'documents'
    WHERE category IS NULL AND (title ILIKE '%passport%' OR title ILIKE '%inspection%' OR title ILIKE '%tax%');
  `;
  await sql`
    UPDATE tasks
    SET category = 'shopping'
    WHERE category IS NULL AND (title ILIKE '%gift%' OR title ILIKE '%buy%' OR title ILIKE '%order%');
  `;
  await sql`
    UPDATE tasks
    SET category = 'travel'
    WHERE category IS NULL AND (title ILIKE '%trip%' OR title ILIKE '%travel%' OR title ILIKE '%flight%');
  `;
  console.log("✓ Populated default categories for existing sample tasks");

  console.log("✅ Task categories migration finished successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

