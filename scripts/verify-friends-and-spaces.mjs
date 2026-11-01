import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

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
        process.env[key] = value;
      }
    }
  }
}

const sql = neon(process.env.DATABASE_URL);

// Core business logic to verify
async function areUsersFriends(userId1, userId2) {
  if (userId1 === userId2) return true;
  const rows = await sql`
    SELECT id FROM friendships
    WHERE status = 'accepted'
      AND (
        (user_id = ${userId1} AND friend_id = ${userId2}) OR
        (user_id = ${userId2} AND friend_id = ${userId1})
      )
    LIMIT 1;
  `;
  return rows.length > 0;
}

async function canAddUserToSpace(adderId, targetUserId) {
  if (adderId === targetUserId) return { allowed: true };
  const targetUsers = await sql`
    SELECT id, username, name, is_private
    FROM users
    WHERE id = ${targetUserId}
    LIMIT 1;
  `;
  if (targetUsers.length === 0) return { allowed: false, reason: "User not found" };
  const target = targetUsers[0];

  if (!target.is_private) {
    return { allowed: true };
  }

  const friends = await areUsersFriends(adderId, targetUserId);
  if (friends) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `@${target.username} has a private profile. You can only add them to spaces if you are friends.`,
  };
}

async function runTests() {
  console.log("=== VERIFYING FRIENDS, PRIVACY, AND SPACES ===");

  const passwordHash = await bcrypt.hash("password123", 10);
  const now = Date.now();

  const userAliceId = `test-alice-${now}`;
  const userBobId = `test-bob-${now}`;
  const userCharlieId = `test-charlie-${now}`;

  await sql`
    INSERT INTO users (id, username, name, password_hash, avatar_color, is_private)
    VALUES 
      (${userAliceId}, ${'alice_' + now}, 'Alice Test', ${passwordHash}, 'sky', false),
      (${userBobId}, ${'bob_' + now}, 'Bob Test', ${passwordHash}, 'rose', true),
      (${userCharlieId}, ${'charlie_' + now}, 'Charlie Test', ${passwordHash}, 'purple', false);
  `;
  console.log("✓ Created test users: Alice (public), Bob (private), Charlie (tester)");

  // TEST 1: Public user Alice can be added to space directly
  const canAddAlice = await canAddUserToSpace(userCharlieId, userAliceId);
  if (!canAddAlice.allowed) {
    throw new Error("FAIL: Public user Alice should be allowed to be added to space!");
  }
  console.log("✓ Test 1: Public user Alice can be added to Charlie's space directly without needing friendship");

  // TEST 2: Private user Bob CANNOT be added before friendship
  const canAddBobBeforeFriend = await canAddUserToSpace(userCharlieId, userBobId);
  if (canAddBobBeforeFriend.allowed) {
    throw new Error("FAIL: Private user Bob should NOT be allowed before becoming friends!");
  }
  console.log("✓ Test 2: Private user Bob is blocked. Reason:", canAddBobBeforeFriend.reason);

  // TEST 3: Friend Bob
  const friendshipId = `test-fr-${now}`;
  await sql`
    INSERT INTO friendships (id, user_id, friend_id, status)
    VALUES (${friendshipId}, ${userCharlieId}, ${userBobId}, 'accepted');
  `;
  const areFriends = await areUsersFriends(userCharlieId, userBobId);
  if (!areFriends) {
    throw new Error("FAIL: Charlie and Bob should be friends now!");
  }
  console.log("✓ Test 3: Charlie and Bob established mutual friendship");

  // TEST 4: Now Bob CAN be added to spaces
  const canAddBobAfterFriend = await canAddUserToSpace(userCharlieId, userBobId);
  if (!canAddBobAfterFriend.allowed) {
    throw new Error("FAIL: Private user Bob should now be allowed to be added to space after friending!");
  }
  console.log("✓ Test 4: Private user Bob CAN now be added to space since they are friends!");

  // TEST 5: Create a space with members option
  const testSpaceId = `test-space-${now}`;
  await sql`
    INSERT INTO spaces (id, name, slug, color, icon, created_by)
    VALUES (${testSpaceId}, 'Charlie Project', ${'charlie-proj-' + now}, 'purple', 'star', ${userCharlieId});
  `;
  await sql`
    INSERT INTO space_members (space_id, user_id, role)
    VALUES 
      (${testSpaceId}, ${userCharlieId}, 'owner'),
      (${testSpaceId}, ${userAliceId}, 'member'),
      (${testSpaceId}, ${userBobId}, 'member');
  `;

  const membersInSpace = await sql`
    SELECT user_id, role FROM space_members WHERE space_id = ${testSpaceId};
  `;
  if (membersInSpace.length !== 3) {
    throw new Error(`FAIL: Expected 3 members in space, got ${membersInSpace.length}`);
  }
  console.log(`✓ Test 5: Space created with initial members (owner + Alice + Bob). Total members: ${membersInSpace.length}`);

  // Clean up test records
  await sql`DELETE FROM spaces WHERE id = ${testSpaceId};`;
  await sql`DELETE FROM friendships WHERE id = ${friendshipId};`;
  await sql`DELETE FROM users WHERE id IN (${userAliceId}, ${userBobId}, ${userCharlieId});`;
  console.log("✓ Cleaned up test data cleanly");

  console.log("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✨");
}

runTests().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
