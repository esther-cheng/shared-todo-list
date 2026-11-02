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

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  console.log("=== Testing Space Creation From Task Page ===");

  // 1. Sign in as demo user alex
  console.log("\n1. Signing in...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex", password: "password123" }),
  });
  const cookie = loginRes.headers.get("set-cookie") || "";
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error("Login failed: " + JSON.stringify(loginData));
  console.log("✓ Signed in as alex");

  const authHeaders = {
    "Content-Type": "application/json",
    cookie: cookie.split(";")[0],
  };

  // 2. Simulate inline creation of a space (as triggered by "+ 'New Summer Trip'")
  const inlineSpaceName = "Summer Trip " + Date.now();
  console.log(`\n2. Creating inline space: + '${inlineSpaceName}'...`);
  const createSpaceRes = await fetch(`${BASE_URL}/api/spaces`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: inlineSpaceName,
      color: "purple",
      icon: "folder",
    }),
  });
  const createSpaceData = await createSpaceRes.json();
  if (!createSpaceRes.ok || !createSpaceData.space) {
    throw new Error("Failed to create inline space: " + JSON.stringify(createSpaceData));
  }
  const createdSpace = createSpaceData.space;
  console.log(`✓ Inline space created successfully: id=${createdSpace.id}, name='${createdSpace.name}'`);

  // 3. Create a task assigned to this newly created space
  console.log("\n3. Creating task inside the newly created space...");
  const taskTitle = "Book AirBnB for Summer";
  const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: taskTitle,
      description: "Find cozy cabin near the lake",
      space_id: createdSpace.id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      lead_time_days: 3,
      created_by: "Alex",
    }),
  });
  const createTaskData = await createTaskRes.json();
  if (!createTaskRes.ok || !createTaskData.task) {
    throw new Error("Failed to create task: " + JSON.stringify(createTaskData));
  }
  const createdTask = createTaskData.task;
  console.log(`✓ Task created: id=${createdTask.id}, title='${createdTask.title}', space_id=${createdTask.space_id}`);

  // 4. Fetch the task directly to verify space attribution
  console.log("\n4. Verifying task space details...");
  const getTaskRes = await fetch(`${BASE_URL}/api/tasks/${createdTask.id}`, {
    headers: authHeaders,
  });
  const getTaskData = await getTaskRes.json();
  if (!getTaskRes.ok || !getTaskData.task) {
    throw new Error("Failed to fetch task: " + JSON.stringify(getTaskData));
  }
  if (getTaskData.task.space_name !== inlineSpaceName) {
    throw new Error(`Expected space_name='${inlineSpaceName}', got '${getTaskData.task.space_name}'`);
  }
  console.log(`✓ Verified task space_name matches '${getTaskData.task.space_name}'`);

  // 5. Clean up task and space
  console.log("\n5. Cleaning up test task and test space...");
  await fetch(`${BASE_URL}/api/tasks/${createdTask.id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  // Delete space directly via database
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  await sql`DELETE FROM groups WHERE id = ${createdSpace.id};`;
  console.log("✓ Cleanup finished cleanly");

  console.log("\n🎉 ALL INLINE SPACE CREATION TESTS PASSED!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

