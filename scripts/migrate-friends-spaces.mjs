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
  console.log("Running migration for privacy, friendships, and space memberships...");

  // 1. Add is_private column to users
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
  `;
  console.log("✓ Added is_private column to users");

  // 2. Add created_by column to spaces or groups (handling view vs base table)
  const spacesTableCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'spaces';
  `;
  const isSpacesBaseTable = spacesTableCheck.length > 0 && spacesTableCheck[0].table_type === 'BASE TABLE';

  const groupsTableCheck = await sql`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'groups';
  `;
  const isGroupsBaseTable = groupsTableCheck.length > 0 && groupsTableCheck[0].table_type === 'BASE TABLE';

  if (isSpacesBaseTable) {
    await sql`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS created_by TEXT;
    `;
    console.log("✓ Added created_by column to spaces table");
  } else if (isGroupsBaseTable) {
    await sql`
      ALTER TABLE groups 
      ADD COLUMN IF NOT EXISTS created_by TEXT;
    `;
    console.log("✓ Added created_by column to groups table");
  } else {
    await sql`
      CREATE TABLE IF NOT EXISTS spaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        created_by TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("✓ Created spaces table with created_by column");
  }

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

  // 4. Create space_members / group_members table if not exists
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

  const hasSpaceMembers = spaceMembersCheck.length > 0;
  const hasGroupMembers = groupMembersCheck.length > 0;

  if (!hasSpaceMembers && !hasGroupMembers) {
    if (isGroupsBaseTable) {
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
    } else {
      await sql`
        CREATE TABLE IF NOT EXISTS space_members (
          space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'member'
          created_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (space_id, user_id)
        );
      `;
      console.log("✓ Created space_members table");
    }
  } else {
    console.log("✓ Membership relation (group_members or space_members) ready");
  }

  // 5. Populate initial memberships for existing spaces so demo data continues to work
  const spaces = isGroupsBaseTable
    ? await sql`SELECT id FROM groups;`
    : await sql`SELECT id FROM spaces;`;
  const users = await sql`SELECT id, username FROM users;`;

  if (users.length > 0) {
    const firstUserId = users[0].id;

    if (isGroupsBaseTable) {
      const groupMemberCols = (await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'group_members';
      `).map((c) => c.column_name);
      const hasSpaceIdCol = groupMemberCols.includes("space_id");

      for (const space of spaces) {
        await sql`
          UPDATE groups 
          SET created_by = ${firstUserId} 
          WHERE id = ${space.id} AND created_by IS NULL;
        `;
        for (const u of users) {
          if (hasSpaceIdCol) {
            await sql`
              INSERT INTO group_members (group_id, space_id, user_id, role)
              VALUES (${space.id}, ${space.id}, ${u.id}, ${u.id === firstUserId ? 'owner' : 'member'})
              ON CONFLICT (group_id, user_id) DO NOTHING;
            `;
          } else {
            await sql`
              INSERT INTO group_members (group_id, user_id, role)
              VALUES (${space.id}, ${u.id}, ${u.id === firstUserId ? 'owner' : 'member'})
              ON CONFLICT (group_id, user_id) DO NOTHING;
            `;
          }
        }
      }
    } else {
      for (const space of spaces) {
        await sql`
          UPDATE spaces 
          SET created_by = ${firstUserId} 
          WHERE id = ${space.id} AND created_by IS NULL;
        `;
        for (const u of users) {
          await sql`
            INSERT INTO space_members (space_id, user_id, role)
            VALUES (${space.id}, ${u.id}, ${u.id === firstUserId ? 'owner' : 'member'})
            ON CONFLICT (space_id, user_id) DO NOTHING;
          `;
        }
      }
    }
    console.log(`✓ Ensured memberships for ${spaces.length} spaces`);
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

