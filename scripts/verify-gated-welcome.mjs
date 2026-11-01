// Verify that all data and pages are completely gated when not logged in
const BASE_URL = "http://localhost:3001";

async function run() {
  console.log("=== Testing Gated App & Welcome Flow ===");

  // 1. Unauthenticated checks
  console.log("1. Checking unauthenticated access...");
  const tasksRes = await fetch(`${BASE_URL}/api/tasks`);
  console.log(`- GET /api/tasks status: ${tasksRes.status} (expected 401)`);
  if (tasksRes.status !== 401) throw new Error("Expected 401 on /api/tasks");

  const spacesRes = await fetch(`${BASE_URL}/api/spaces`);
  console.log(`- GET /api/spaces status: ${spacesRes.status} (expected 401)`);
  if (spacesRes.status !== 401) throw new Error("Expected 401 on /api/spaces");

  const meRes = await fetch(`${BASE_URL}/api/auth/me`);
  const meData = await meRes.json();
  console.log(`- GET /api/auth/me user: ${JSON.stringify(meData.user)} (expected null)`);
  if (meData.user !== null) throw new Error("Expected null user on /api/auth/me");

  // 2. Login
  console.log("\n2. Logging in as alex...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex", password: "password123" }),
  });
  if (!loginRes.ok) throw new Error("Login failed");
  const cookieHeader = loginRes.headers.get("set-cookie");
  console.log(`- Login successful. Cookie received: ${cookieHeader?.split(";")[0]}`);

  const cookie = cookieHeader?.split(";")[0] || "";

  // 3. Authenticated checks
  console.log("\n3. Checking authenticated access...");
  const authMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { cookie },
  });
  const authMeData = await authMeRes.json();
  console.log(`- GET /api/auth/me logged in as: ${authMeData.user?.name} (@${authMeData.user?.username})`);
  if (authMeData.user?.username !== "alex") throw new Error("Expected alex user");

  const authTasksRes = await fetch(`${BASE_URL}/api/tasks`, {
    headers: { cookie },
  });
  const authTasksData = await authTasksRes.json();
  console.log(`- GET /api/tasks count: ${authTasksData.tasks?.length} tasks returned`);
  if (!Array.isArray(authTasksData.tasks)) throw new Error("Expected tasks array");

  const authSpacesRes = await fetch(`${BASE_URL}/api/spaces`, {
    headers: { cookie },
  });
  const authSpacesData = await authSpacesRes.json();
  console.log(`- GET /api/spaces count: ${authSpacesData.spaces?.length} spaces returned`);
  if (!Array.isArray(authSpacesData.spaces)) throw new Error("Expected spaces array");

  // 4. Logout
  console.log("\n4. Logging out...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });
  const clearedCookieHeader = logoutRes.headers.get("set-cookie");
  console.log(`- Logout successful. Cleared cookie received: ${clearedCookieHeader?.split(";")[0]}`);

  // 5. Verify gated again
  console.log("\n5. Verifying unauthenticated access after logout...");
  const postLogoutMe = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { cookie: clearedCookieHeader?.split(";")[0] || "" },
  });
  const postLogoutMeData = await postLogoutMe.json();
  console.log(`- GET /api/auth/me user: ${JSON.stringify(postLogoutMeData.user)} (expected null)`);
  if (postLogoutMeData.user !== null) throw new Error("Expected null user after logout");

  console.log("\n All gating and auth flow tests passed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

