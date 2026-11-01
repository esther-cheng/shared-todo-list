import { sql } from "@/lib/db";
import { UserNotificationSettings } from "@/types";
import { sendEmail, sendPushNotificationToUser } from "@/lib/delivery";

/**
 * Retrieves or creates default notification settings for a user.
 */
export async function getOrCreateNotificationSettings(
  userId: string,
  userFallbackEmail?: string
): Promise<UserNotificationSettings> {
  const existing = await sql`
    SELECT * FROM user_notification_settings WHERE user_id = ${userId};
  `;

  if (existing.length > 0) {
    return existing[0] as UserNotificationSettings;
  }

  const id = "notif-set-" + userId;
  const email = userFallbackEmail || null;

  const created = await sql`
    INSERT INTO user_notification_settings (
      id, user_id, email, email_verified,
      notify_mentions, notify_prep_window, notify_due_soon, notify_task_completed,
      notify_space_invite, channel_email, channel_push, timing, quiet_hours_enabled
    ) VALUES (
      ${id}, ${userId}, ${email}, false,
      true, true, true, false,
      true, true, true, 'instant', false
    )
    ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
    RETURNING *;
  `;

  return created[0] as UserNotificationSettings;
}

/**
 * Dispatches a notification if the user has opted in and channel is active.
 */
export async function dispatchNotification({
  userId,
  title,
  message,
  taskId,
  triggerType,
}: {
  userId: string;
  title: string;
  message: string;
  taskId?: string | null;
  triggerType: "mention" | "prep_window" | "due_soon" | "task_completed" | "space_invite" | "test";
}): Promise<{ dispatched: boolean; channels: string[]; reason?: string }> {
  try {
    const settings = await getOrCreateNotificationSettings(userId);

    // Check trigger preference
    if (triggerType === "mention" && !settings.notify_mentions) {
      return { dispatched: false, channels: [], reason: "User opted out of mention notifications" };
    }
    if (triggerType === "prep_window" && !settings.notify_prep_window) {
      return { dispatched: false, channels: [], reason: "User opted out of prep window notifications" };
    }
    if (triggerType === "due_soon" && !settings.notify_due_soon) {
      return { dispatched: false, channels: [], reason: "User opted out of due soon notifications" };
    }
    if (triggerType === "task_completed" && !settings.notify_task_completed) {
      return { dispatched: false, channels: [], reason: "User opted out of completed task notifications" };
    }
    if (triggerType === "space_invite" && !settings.notify_space_invite) {
      return { dispatched: false, channels: [], reason: "User opted out of invite notifications" };
    }

    const channels: ("email" | "push")[] = [];

    // Push notification delivery
    if (settings.channel_push) {
      channels.push("push");
    }

    // Email delivery
    if (settings.channel_email && settings.email && settings.email_verified) {
      channels.push("email");
    }

    const activeChannels: string[] =
      channels.length > 0 ? channels : triggerType === "test" ? ["push"] : [];

    for (const ch of activeChannels) {
      const logId = "nlog-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

      if (ch === "email" && settings.email && settings.email_verified) {
        await sendEmail({
          to: settings.email,
          subject: title,
          html: `<p style="font-family: sans-serif; font-size: 14px; color: #171923; line-height: 1.5;">${message}</p>`,
          text: message,
        });
      } else if (ch === "push") {
        await sendPushNotificationToUser({
          userId,
          title,
          message,
          url: taskId ? `/?task=${taskId}` : "/",
        });
      }

      await sql`
        INSERT INTO notification_logs (
          id, user_id, channel, title, message, task_id, status
        ) VALUES (
          ${logId}, ${userId}, ${ch}, ${title}, ${message}, ${taskId || null}, 'delivered'
        );
      `;
    }

    return {
      dispatched: activeChannels.length > 0,
      channels: activeChannels,
    };
  } catch (error) {
    console.error("Failed to dispatch notification:", error);
    return { dispatched: false, channels: [], reason: "Internal error" };
  }
}
