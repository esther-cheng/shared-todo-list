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
  console.log("Running migration for notification system...");

  // 1. Create user_notification_settings table
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

  // 2. Create verification_codes table
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

  // 3. Create notification_logs table
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

  // 4. Create default settings for existing users
  const users = await sql`SELECT id, username FROM users;`;
  for (const u of users) {
    const existing = await sql`SELECT id FROM user_notification_settings WHERE user_id = ${u.id};`;
    if (existing.length === 0) {
      const settingId = "notif-set-" + u.id;
      const demoEmail = `${u.username}@example.com`;
      await sql`
        INSERT INTO user_notification_settings (
          id, user_id, email, email_verified, phone_number, phone_verified
        ) VALUES (
          ${settingId}, ${u.id}, ${demoEmail}, false, null, false
        ) ON CONFLICT (user_id) DO NOTHING;
      `;
    }
  }
  console.log(`✓ Seeded default notification settings for ${users.length} user(s)`);

  console.log("Notification system migration completed successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
