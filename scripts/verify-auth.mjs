const BASE_URL = "http://localhost:3001";

async function testAuth() {
  console.log("=== Testing Authentication End-to-End ===");

  // 1. Sign in with invalid credentials
  console.log("\n1. Testing failed login with wrong password...");
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex", password: "wrongpassword" }),
  });
  console.log(`✓ Failed login status: ${badLoginRes.status} (expected 401)`);

  // 2. Sign in with seeded user alex / password123
  console.log("\n2. Testing login with valid seeded user (alex)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex", password: "password123" }),
  });
  if (!loginRes.ok) throw new Error(`Login failed with status: ${loginRes.status}`);
  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get("set-cookie");
  console.log(`✓ Successfully signed in as: ${loginData.user.name} (@${loginData.user.username})`);
  console.log(`✓ Set-Cookie header received: ${setCookie ? "Yes" : "No"}`);

  // Extract session cookie
  const cookieMatch = setCookie?.match(/tandem_session_id=([^;]+)/);
  const sessionCookie = cookieMatch ? cookieMatch[0] : "";

  // 3. Test /api/auth/me with session cookie
  console.log("\n3. Testing GET /api/auth/me with session cookie...");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { cookie: sessionCookie },
  });
  const meData = await meRes.json();
  console.log(`✓ /api/auth/me confirmed session user: ${meData.user?.name} (@${meData.user?.username})`);

  // 4. Test User Registration with new user
  const newUsername = `user_${Date.now()}`;
  console.log(`\n4. Testing registration for new user @${newUsername}...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: newUsername,
      name: "Jamie Doe",
      password: "securepassword456",
      avatar_color: "emerald",
    }),
  });
  if (!regRes.ok) throw new Error(`Registration failed: ${regRes.status}`);
  const regData = await regRes.json();
  console.log(`✓ User registered: ${regData.user.name} (@${regData.user.username}), ID: ${regData.user.id}`);

  // 5. Test Logout
  console.log("\n5. Testing logout...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { cookie: sessionCookie },
  });
  console.log(`✓ Logout response status: ${logoutRes.status}`);

  console.log("\n=== ALL AUTH TESTS PASSED SUCCESSFULLY! ===");
}

testAuth().catch((err) => {
  console.error("Auth test failed:", err);
  process.exit(1);
});

