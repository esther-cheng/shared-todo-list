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

async function testNotificationFlow() {
  console.log("=== Testing Notification System Flow ===");

  // 1. Sign in as demo user (alex)
  console.log("\n1. Signing in as alex...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "alex", password: "password123" }),
  });

  const cookie = loginRes.headers.get("set-cookie") || "";
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error("Login failed: " + JSON.stringify(loginData));
  console.log("✓ Signed in successfully. User:", loginData.user.username);

  const authHeaders = {
    "Content-Type": "application/json",
    cookie: cookie.split(";")[0],
  };

  // 2. Fetch notification settings
  console.log("\n2. Fetching notification settings...");
  const settingsRes = await fetch(`${BASE_URL}/api/notifications/settings`, {
    headers: authHeaders,
  });
  const settingsData = await settingsRes.json();
  if (!settingsRes.ok || !settingsData.settings) {
    throw new Error("Failed to get settings: " + JSON.stringify(settingsData));
  }
  console.log("✓ Current notification settings loaded:", {
    email: settingsData.settings.email,
    email_verified: settingsData.settings.email_verified,
    phone_number: settingsData.settings.phone_number,
    phone_verified: settingsData.settings.phone_verified,
    timing: settingsData.settings.timing,
  });

  // 3. Update settings with email, mobile, and custom preferences
  console.log("\n3. Updating contact info & notification preferences...");
  const patchRes = await fetch(`${BASE_URL}/api/notifications/settings`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      email: "alex.tandem.test@example.com",
      phone_number: "+15552345678",
      notify_mentions: true,
      notify_prep_window: true,
      notify_due_soon: true,
      notify_task_completed: true,
      notify_space_invite: true,
      timing: "instant",
    }),
  });
  const patchData = await patchRes.json();
  if (!patchRes.ok) throw new Error("Failed to patch settings: " + JSON.stringify(patchData));
  console.log("✓ Settings updated. Verification required:", patchData.reverificationRequired);

  // 4. Request email verification code
  console.log("\n4. Requesting email verification code...");
  const sendEmailCodeRes = await fetch(`${BASE_URL}/api/notifications/verify/send`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ type: "email", target: "alex.tandem.test@example.com" }),
  });
  const sendEmailData = await sendEmailCodeRes.json();
  if (!sendEmailCodeRes.ok || !sendEmailData.demoCode) {
    throw new Error("Failed to send email verification: " + JSON.stringify(sendEmailData));
  }
  console.log(`✓ Code generated for email (${sendEmailData.target}): ${sendEmailData.demoCode}`);

  // 5. Test invalid code rejection
  console.log("\n5. Testing invalid code rejection...");
  const badCodeRes = await fetch(`${BASE_URL}/api/notifications/verify/confirm`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ type: "email", code: "000000" }),
  });
  if (badCodeRes.status !== 400) {
    throw new Error("Expected 400 error for bad code, got: " + badCodeRes.status);
  }
  console.log("✓ Invalid code correctly rejected with 400");

  // 6. Confirm valid email verification code
  console.log("\n6. Confirming valid email verification code...");
  const confirmEmailRes = await fetch(`${BASE_URL}/api/notifications/verify/confirm`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ type: "email", code: sendEmailData.demoCode }),
  });
  const confirmEmailData = await confirmEmailRes.json();
  if (!confirmEmailRes.ok || !confirmEmailData.settings?.email_verified) {
    throw new Error("Failed to verify email: " + JSON.stringify(confirmEmailData));
  }
  console.log("✓ Email verified successfully:", confirmEmailData.settings.email_verified);

  // 7. Request phone verification code
  console.log("\n7. Requesting mobile phone verification code...");
  const sendPhoneCodeRes = await fetch(`${BASE_URL}/api/notifications/verify/send`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ type: "phone", target: "+15552345678" }),
  });
  const sendPhoneData = await sendPhoneCodeRes.json();
  if (!sendPhoneCodeRes.ok || !sendPhoneData.demoCode) {
    throw new Error("Failed to send phone verification: " + JSON.stringify(sendPhoneData));
  }
  console.log(`✓ Code generated for phone (${sendPhoneData.target}): ${sendPhoneData.demoCode}`);

  // 8. Confirm valid phone verification code
  console.log("\n8. Confirming valid mobile verification code...");
  const confirmPhoneRes = await fetch(`${BASE_URL}/api/notifications/verify/confirm`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ type: "phone", code: sendPhoneData.demoCode }),
  });
  const confirmPhoneData = await confirmPhoneRes.json();
  if (!confirmPhoneRes.ok || !confirmPhoneData.settings?.phone_verified) {
    throw new Error("Failed to verify phone: " + JSON.stringify(confirmPhoneData));
  }
  console.log("✓ Mobile number verified successfully:", confirmPhoneData.settings.phone_verified);

  // 9. Dispatch a test notification
  console.log("\n9. Testing alert dispatch...");
  const testAlertRes = await fetch(`${BASE_URL}/api/notifications/test`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ channel: "email" }),
  });
  const testAlertData = await testAlertRes.json();
  if (!testAlertRes.ok) throw new Error("Failed to dispatch test alert: " + JSON.stringify(testAlertData));
  console.log("✓ Test alert result:", testAlertData.message);

  // 10. Fetch notification logs
  console.log("\n10. Fetching notification logs...");
  const logsRes = await fetch(`${BASE_URL}/api/notifications/logs`, {
    headers: authHeaders,
  });
  const logsData = await logsRes.json();
  if (!logsRes.ok || !Array.isArray(logsData.logs)) {
    throw new Error("Failed to load logs: " + JSON.stringify(logsData));
  }
  console.log(`✓ Found ${logsData.logs.length} notification log records`);
  for (const log of logsData.logs.slice(0, 3)) {
    console.log(`  - [${log.channel.toUpperCase()}] ${log.title}: ${log.message.slice(0, 60)}...`);
  }

  console.log("\n🎉 ALL NOTIFICATION SYSTEM VERIFICATION TESTS PASSED!");
}

testNotificationFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

