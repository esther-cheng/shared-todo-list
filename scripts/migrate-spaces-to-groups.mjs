import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
const envFiles = [".env.local", ".env"];
for (const file of envFiles) {
  const envPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const idx = trimmed.indexOf("=");
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          let value = trimmed.slice(idx + 1).trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ No DATABASE_URL found.");
  process.exit(1);
}

const sql = neon(dbUrl.replace(/^["']|["']$/g, "").trim());

async function migrate() {
  console.log("=== Migrating spaces and space_members to groups and group_members ===");

  // 1. Rename spaces to groups if spaces is a base table
  const spacesTableCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'spaces';
  `;

  const groupsTableCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'groups';
  `;

  if (spacesTableCheck.length > 0 && spacesTableCheck[0].table_type === 'BASE TABLE' && groupsTableCheck.length === 0) {
    console.log("Renaming table spaces -> groups...");
    await sql`ALTER TABLE spaces RENAME TO groups;`;
    console.log("✓ Renamed spaces to groups");
  } else if (groupsTableCheck.length === 0) {
    console.log("Creating groups table...");
    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("✓ Created groups table");
  } else {
    console.log("✓ groups table already exists");
  }

  // 2. Rename space_members to group_members if space_members is a base table
  const spaceMembersCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'space_members';
  `;

  const groupMembersCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'group_members';
  `;

  if (spaceMembersCheck.length > 0 && spaceMembersCheck[0].table_type === 'BASE TABLE' && groupMembersCheck.length === 0) {
    console.log("Renaming table space_members -> group_members...");
    await sql`ALTER TABLE space_members RENAME TO group_members;`;
    console.log("✓ Renamed space_members to group_members");
  } else if (groupMembersCheck.length === 0) {
    console.log("Creating group_members table...");
    await sql`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (group_id, user_id)
      );
    `;
    console.log("✓ Created group_members table");
  } else {
    console.log("✓ group_members table already exists");
  }

  // 3. Ensure group_members has group_id column
  const initialCols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'group_members';
  `;
  const initialColNames = initialCols.map((c) => c.column_name);

  if (initialColNames.includes("space_id") && !initialColNames.includes("group_id")) {
    console.log("Renaming column group_members.space_id -> group_id...");
    await sql`ALTER TABLE group_members RENAME COLUMN space_id TO group_id;`;
    console.log("✓ Renamed space_id to group_id");
  }

  // Refresh column list
  const currentCols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'group_members';
  `;
  const currentColNames = currentCols.map((c) => c.column_name);

  if (!currentColNames.includes("space_id")) {
    await sql`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS space_id TEXT;`;
    await sql`UPDATE group_members SET space_id = group_id WHERE space_id IS NULL;`;
  }
  if (!currentColNames.includes("group_id")) {
    await sql`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES groups(id) ON DELETE CASCADE;`;
    await sql`UPDATE group_members SET group_id = space_id WHERE group_id IS NULL;`;
  }

  // 4. Ensure tasks has group_id column pointing to groups(id)
  const taskCols = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'tasks';
  `;
  const taskColNames = taskCols.map((c) => c.column_name);

  if (!taskColNames.includes("group_id")) {
    console.log("Adding group_id column to tasks table...");
    await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_id TEXT REFERENCES groups(id) ON DELETE CASCADE;`;
    await sql`UPDATE tasks SET group_id = space_id WHERE group_id IS NULL;`;
    console.log("✓ Added group_id column to tasks and backfilled from space_id");
  }

  // 5. Create compatibility views for spaces and space_members if not present
  try {
    await sql`
      CREATE OR REPLACE VIEW spaces AS 
        SELECT id, name, slug, color, icon, created_by, created_at FROM groups;
    `;
    console.log("✓ Created compatibility view spaces -> groups");
  } catch (err) {
    console.warn("View spaces notice:", err.message);
  }

  try {
    await sql`
      CREATE OR REPLACE VIEW space_members AS 
        SELECT group_id AS space_id, group_id, user_id, role, created_at FROM group_members;
    `;
    console.log("✓ Created compatibility view space_members -> group_members");
  } catch (err) {
    console.warn("View space_members notice:", err.message);
  }

  console.log("\n✅ Database migration to groups & group_members completed successfully!\n");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
