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
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

async function main() {
  console.log("Connecting to Neon Postgres...");

  // 1. Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_color TEXT DEFAULT 'purple',
      is_private BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ Users table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ Sessions table ready");

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
  console.log("✓ Groups table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'accepted',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_user_friend UNIQUE (user_id, friend_id)
    );
  `;
  console.log("✓ Friendships table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (group_id, user_id)
    );
  `;
  console.log("✓ Group members table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
      space_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      deadline TIMESTAMPTZ,
      lead_time_days INTEGER DEFAULT 0,
      reminder_date TIMESTAMPTZ,
      status TEXT DEFAULT 'todo',
      created_by TEXT DEFAULT 'Alex',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      last_activity_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ Tasks table ready");

  // Ensure legacy compatibility views are dropped (spaces removed in favor of groups)
  try {
    await sql`DROP VIEW IF EXISTS space_members CASCADE;`;
    await sql`DROP VIEW IF EXISTS spaces CASCADE;`;
  } catch {
    // Ignore
  }

  await sql`
    CREATE TABLE IF NOT EXISTS task_notes (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      tagged_users TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ Task notes table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS user_notification_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      email TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      phone_number TEXT,
      phone_verified BOOLEAN NOT NULL DEFAULT false,
      notify_mentions BOOLEAN NOT NULL DEFAULT true,
      notify_prep_window BOOLEAN NOT NULL DEFAULT true,
      notify_due_soon BOOLEAN NOT NULL DEFAULT true,
      notify_task_completed BOOLEAN NOT NULL DEFAULT false,
      notify_space_invite BOOLEAN NOT NULL DEFAULT true,
      channel_email BOOLEAN NOT NULL DEFAULT true,
      channel_sms BOOLEAN NOT NULL DEFAULT true,
      timing TEXT NOT NULL DEFAULT 'instant',
      quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
      quiet_hours_start TEXT DEFAULT '22:00',
      quiet_hours_end TEXT DEFAULT '08:00',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ user_notification_settings table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target TEXT NOT NULL,
      type TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ verification_codes table ready");

  await sql`
    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ notification_logs table ready");

  // Seed default demo user if none exists
  const existingUsers = await sql`SELECT COUNT(*) FROM users;`;
  if (parseInt(existingUsers[0].count) === 0) {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash("password123", 10);
    await sql`
      INSERT INTO users (id, username, name, password_hash, avatar_color)
      VALUES 
        ('user-alex', 'alex', 'Alex', ${hash}, 'purple'),
        ('user-taylor', 'taylor', 'Taylor', ${hash}, 'orange')
      ON CONFLICT (id) DO NOTHING;
    `;
    console.log("✓ Default demo users seeded (alex / taylor with password: password123)");
  }

  // 2. Seed initial spaces
  const defaultSpaces = [
    { id: "space-couples", name: "Couples List", slug: "couples", color: "purple", icon: "heart" },
    { id: "space-errands", name: "Home & Errands", slug: "errands", color: "orange", icon: "home" },
    { id: "space-travel", name: "Travel & Adventures", slug: "travel", color: "sky", icon: "plane" },
    { id: "space-finance", name: "Future & Finance", slug: "finance", color: "emerald", icon: "sparkles" },
  ];

  for (const space of defaultSpaces) {
    await sql`
      INSERT INTO groups (id, name, slug, color, icon)
      VALUES (${space.id}, ${space.name}, ${space.slug}, ${space.color}, ${space.icon})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        color = EXCLUDED.color,
        icon = EXCLUDED.icon;
    `;
  }
  console.log("✓ Default groups seeded");

  // 3. Seed user-specified tasks if not already seeded
  const existingTasks = await sql`SELECT COUNT(*) FROM tasks;`;
  if (parseInt(existingTasks[0].count) === 0) {
    // 1. "renew passport with a deadline of august 2028"
    // Lead time: 6 weeks (42 days)
    const passportDeadline = new Date("2028-08-31T23:59:59Z");
    const passportLeadTimeDays = 42;
    const passportReminderDate = new Date(passportDeadline.getTime() - passportLeadTimeDays * 24 * 60 * 60 * 1000);

    const task1Id = "task-passport-2028";
    await sql`
      INSERT INTO tasks (id, space_id, title, description, deadline, lead_time_days, reminder_date, status, created_by, last_activity_at)
      VALUES (
        ${task1Id},
        'space-couples',
        'Renew passport for upcoming travels',
        'Need to renew our 10-year passports before Europe trip in late 2028. Make sure to get certified passport photos and submit renewal form DS-82.',
        ${passportDeadline.toISOString()},
        ${passportLeadTimeDays},
        ${passportReminderDate.toISOString()},
        'todo',
        'Alex',
        NOW() - INTERVAL '15 days'
      );
    `;

    // 2. "get mom birthday gift with a deadline of july 2027"
    // Lead time: 14 days
    const momGiftDeadline = new Date("2027-07-15T23:59:59Z");
    const momGiftLeadTimeDays = 14;
    const momGiftReminderDate = new Date(momGiftDeadline.getTime() - momGiftLeadTimeDays * 24 * 60 * 60 * 1000);

    const task2Id = "task-mom-gift-2027";
    await sql`
      INSERT INTO tasks (id, space_id, title, description, deadline, lead_time_days, reminder_date, status, created_by, last_activity_at)
      VALUES (
        ${task2Id},
        'space-couples',
        'Get Mom birthday gift',
        'Mom mentioned she loved that ceramic pottery workshop and cashmere scarf. Coordinate with @partner so we do not double purchase.',
        ${momGiftDeadline.toISOString()},
        ${momGiftLeadTimeDays},
        ${momGiftReminderDate.toISOString()},
        'todo',
        'Alex',
        NOW() - INTERVAL '10 days'
      );
    `;

    // 3. An imminent task that is upcoming and untouched to demonstrate the radar window
    const urgentDeadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    const urgentLeadDays = 7; // lead time is 7 days, so reminder date is 2 days ago!
    const urgentReminderDate = new Date(urgentDeadline.getTime() - urgentLeadDays * 24 * 60 * 60 * 1000);

    const task3Id = "task-car-inspection";
    await sql`
      INSERT INTO tasks (id, space_id, title, description, deadline, lead_time_days, reminder_date, status, created_by, last_activity_at)
      VALUES (
        ${task3Id},
        'space-errands',
        'Annual vehicle safety & emissions inspection',
        'State inspection expires end of this week. Needs to be dropped off at the local mechanic before Saturday.',
        ${urgentDeadline.toISOString()},
        ${urgentLeadDays},
        ${urgentReminderDate.toISOString()},
        'todo',
        'Alex',
        NOW() - INTERVAL '8 days'
      );
    `;

    // Add sample notes with @mentions
    await sql`
      INSERT INTO task_notes (id, task_id, author, content, tagged_users)
      VALUES
        ('note-1', ${task1Id}, 'Taylor', 'Check if we can do the online renewal pilot instead of mail-in @alex', ARRAY['@alex']),
        ('note-2', ${task2Id}, 'Taylor', 'I took a photo of the scarf brand she liked! Will upload later @alex', ARRAY['@alex']),
        ('note-3', ${task3Id}, 'Alex', 'Booked a tentative slot for Thursday morning @partner', ARRAY['@partner']);
    `;
    console.log("✓ Sample tasks and tagged notes seeded");
  }

  const groupsCount = await sql`SELECT count(*) FROM groups;`;
  const tasksCount = await sql`SELECT count(*) FROM tasks;`;
  const notesCount = await sql`SELECT count(*) FROM task_notes;`;

  console.log(`Database ready: ${groupsCount[0].count} groups, ${tasksCount[0].count} tasks, ${notesCount[0].count} notes.`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
