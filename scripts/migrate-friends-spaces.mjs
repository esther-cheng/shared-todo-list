import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

// Load .env.local / .env
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
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("No DATABASE_URL found in environment or .env.local");
  process.exit(1);
}

const sql = neon(dbUrl.replace(/^["']|["']$/g, "").trim());

async function main() {
  console.log("Running migration for privacy, friendships, and group memberships...");

  // 0. Remove any legacy spaces / space_members views if they exist
  await sql`DROP VIEW IF EXISTS space_members CASCADE;`;
  await sql`DROP VIEW IF EXISTS spaces CASCADE;`;

  // 1. Add is_private column to users
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
  `;
  console.log("✓ Added is_private column to users");

  // 2. Ensure groups table exists and has created_by column
  const groupsTableCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'groups';
  `;

  // If a legacy base table named spaces exists and groups does not, rename it
  const spacesTableCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'spaces';
  `;
  if (spacesTableCheck.length > 0 && spacesTableCheck[0].table_type === 'BASE TABLE' && groupsTableCheck.length === 0) {
    await sql`ALTER TABLE spaces RENAME TO groups;`;
    console.log("✓ Renamed legacy spaces table to groups");
  } else if (groupsTableCheck.length === 0) {
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
  }

  // Ensure created_by column exists on groups
  await sql`
    ALTER TABLE groups 
    ADD COLUMN IF NOT EXISTS created_by TEXT;
  `;
  console.log("✓ Added created_by column to groups table");

  // 3. Create friendships table
  await sql`
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'accepted', -- 'pending', 'accepted'
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_user_friend UNIQUE (user_id, friend_id)
    );
  `;
  console.log("✓ Created friendships table");

  // 4. Ensure group_members table exists
  const groupMembersCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'group_members';
  `;

  // If a legacy base table named space_members exists and group_members does not, rename it
  const spaceMembersCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'space_members';
  `;
  if (spaceMembersCheck.length > 0 && spaceMembersCheck[0].table_type === 'BASE TABLE' && groupMembersCheck.length === 0) {
    await sql`ALTER TABLE space_members RENAME TO group_members;`;
    console.log("✓ Renamed legacy space_members table to group_members");
  } else if (groupMembersCheck.length === 0) {
    await sql`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        space_id TEXT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'member'
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (group_id, user_id)
      );
    `;
    console.log("✓ Created group_members table");
  }

  // Ensure group_members has group_id column
  const initialCols = (await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'group_members';
  `).map((c) => c.column_name);

  if (initialCols.includes("space_id") && !initialCols.includes("group_id")) {
    await sql`ALTER TABLE group_members RENAME COLUMN space_id TO group_id;`;
  }
  if (!initialCols.includes("space_id")) {
    await sql`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS space_id TEXT;`;
    await sql`UPDATE group_members SET space_id = group_id WHERE space_id IS NULL;`;
  }

  // 5. Populate initial memberships for existing groups so demo data continues to work
  const groups = await sql`SELECT id FROM groups;`;
  const users = await sql`SELECT id, username FROM users;`;

  if (users.length > 0) {
    const firstUserId = users[0].id;
    for (const group of groups) {
      await sql`
        UPDATE groups 
        SET created_by = ${firstUserId} 
        WHERE id = ${group.id} AND created_by IS NULL;
      `;
      for (const u of users) {
        await sql`
          INSERT INTO group_members (group_id, space_id, user_id, role)
          VALUES (${group.id}, ${group.id}, ${u.id}, ${u.id === firstUserId ? 'owner' : 'member'})
          ON CONFLICT (group_id, user_id) DO NOTHING;
        `;
      }
    }
    console.log(`✓ Ensured memberships for ${groups.length} groups`);
  }

  // 6. If alex and taylor exist, establish friendship for demo ease
  const alex = users.find(u => u.username === "alex");
  const taylor = users.find(u => u.username === "taylor");
  if (alex && taylor) {
    await sql`
      INSERT INTO friendships (id, user_id, friend_id, status)
      VALUES 
        ('friend-alex-taylor-1', ${alex.id}, ${taylor.id}, 'accepted')
      ON CONFLICT (user_id, friend_id) DO NOTHING;
    `;
    console.log("✓ Connected alex and taylor as initial demo friends");
  }

  console.log("Migration completed successfully!");
}

main().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
