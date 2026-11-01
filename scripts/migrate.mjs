import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// 1. Load environment variables from .env.local / .env if DATABASE_URL isn't already in process.env
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
  console.error("\n❌ Error: No DATABASE_URL found.");
  console.error("Please set DATABASE_URL in .env.local or provide it inline, e.g.:");
  console.error("  DATABASE_URL=\"postgres://...\" npm run db:migrate\n");
  process.exit(1);
}

// 2. Display masked connection target for safety
try {
  const parsed = new URL(dbUrl.replace(/^["']|["']$/g, "").trim());
  const masked = `${parsed.protocol}//${parsed.username}:****@${parsed.host}${parsed.pathname}`;
  console.log(`\n========================================`);
  console.log(`🚀 Database Migration Runner`);
  console.log(`📍 Target Database: ${masked}`);
  console.log(`========================================\n`);
} catch {
  console.log(`\n🚀 Database Migration Runner (DATABASE_URL provided)\n`);
}

// 3. Find and run all migration scripts in scripts/
const scriptsDir = path.resolve(process.cwd(), "scripts");
const migrationFiles = [
  "migrate-friends-spaces.mjs",
  "migrate-notifications.mjs",
  "migrate-web-push.mjs",
];

for (const file of migrationFiles) {
  const filePath = path.join(scriptsDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Warning: Migration file not found: ${file}`);
    continue;
  }

  console.log(`▶ Running ${file}...`);
  const result = spawnSync("node", [filePath], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  if (result.status !== 0) {
    console.error(`\n❌ Migration failed on ${file} (exit code ${result.status})\n`);
    process.exit(result.status || 1);
  }
  console.log(`----------------------------------------`);
}

console.log("\n✅ All migrations completed successfully!\n");

