import { sql } from "./db";

export type FriendshipStatus = "none" | "friends" | "pending_sent" | "pending_received";

/**
 * Check if two users are accepted friends.
 */
export async function areUsersFriends(userId1: string, userId2: string): Promise<boolean> {
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

/**
 * Determine friendship status between caller and target.
 */
export async function getFriendshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<{ status: FriendshipStatus; friendshipId?: string }> {
  if (currentUserId === targetUserId) {
    return { status: "none" };
  }

  const rows = await sql`
    SELECT id, user_id, friend_id, status
    FROM friendships
    WHERE 
      (user_id = ${currentUserId} AND friend_id = ${targetUserId}) OR
      (user_id = ${targetUserId} AND friend_id = ${currentUserId})
    LIMIT 1;
  `;

  if (rows.length === 0) {
    return { status: "none" };
  }

  const row = rows[0];
  if (row.status === "accepted") {
    return { status: "friends", friendshipId: row.id };
  }

  if (row.user_id === currentUserId) {
    return { status: "pending_sent", friendshipId: row.id };
  } else {
    return { status: "pending_received", friendshipId: row.id };
  }
}

/**
 * Check whether a user is allowed to be added to a space by adder.
 * Rule: User can only add friends OR public users.
 */
export async function canAddUserToSpace(
  adderId: string,
  targetUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (adderId === targetUserId) {
    return { allowed: true };
  }

  const targetUsers = await sql`
    SELECT id, username, name, is_private
    FROM users
    WHERE id = ${targetUserId}
    LIMIT 1;
  `;

  if (targetUsers.length === 0) {
    return { allowed: false, reason: "User not found" };
  }

  const target = targetUsers[0];

  // If user is public, they can be added directly
  if (!target.is_private) {
    return { allowed: true };
  }

  // If user is private, they must be friends with the adder
  const friends = await areUsersFriends(adderId, targetUserId);
  if (friends) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `@${target.username} has a private profile. You can only add them to spaces if you are friends.`,
  };
}
