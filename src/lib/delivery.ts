import webpush from "web-push";
import { sql } from "@/lib/db";

/**
 * Production Delivery Providers for Tandem Notifications
 * - Email: Resend REST API (https://resend.com)
 * - Push: W3C Web Push Protocol with VAPID (100% Free, Native Browser & Mobile)
 * 
 * Falls back gracefully to simulated/development mode if Resend API key is not provided.
 */

// Initialize Web Push VAPID credentials
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BJkyZUclNiiEupWD8JfwcjzPWEmYL39zVDSCpCtg4QRd-XFFc4kQk0OuI1BK_SMmmlNuFfiLpXc4PwvB6UkxVAs";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "dTAXrky1_QpCsHMYa8thJ73NJ1HHE-kOIB-ePZGVW80";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@tandem.app";

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn("Failed to set web-push VAPID details:", err);
}

export interface DeliveryResult {
  success: boolean;
  provider: "resend" | "web-push" | "simulated";
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend API (or simulate if RESEND_API_KEY is not set)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Tandem <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[Resend Simulated Email] To: ${to} | Subject: "${subject}"`);
    return {
      success: true,
      provider: "simulated",
      id: "sim-email-" + Date.now(),
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text: text || subject,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Resend Error]", data);
      return {
        success: false,
        provider: "resend",
        error: data.message || "Failed to deliver email through Resend",
      };
    }

    console.log(`[Resend Email Delivered] Message ID: ${data.id} to ${to}`);
    return {
      success: true,
      provider: "resend",
      id: data.id,
    };
  } catch (error: any) {
    console.error("[Resend Network Error]", error);
    return {
      success: false,
      provider: "resend",
      error: error?.message || "Resend connection error",
    };
  }
}

/**
 * Sends Web Push notifications to all active browser/device subscriptions of a user
 */
export async function sendPushNotificationToUser({
  userId,
  title,
  message,
  url = "/",
}: {
  userId: string;
  title: string;
  message: string;
  url?: string;
}): Promise<{ sent: number; failed: number }> {
  try {
    const subs = await sql`
      SELECT id, endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ${userId};
    `;

    if (subs.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      message,
      icon: "/window.svg",
      url,
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err: any) {
        failed++;
        console.error(`[WebPush Send Error] Endpoint ${sub.endpoint}:`, err?.statusCode || err?.message);
        // Automatically prune expired or revoked subscriptions (HTTP 410 Gone or 404 Not Found)
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          console.log(`[WebPush] Pruning expired subscription: ${sub.id}`);
          await sql`DELETE FROM push_subscriptions WHERE id = ${sub.id};`;
        }
      }
    }

    return { sent, failed };
  } catch (err) {
    console.error("[WebPush Query Error]:", err);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Sends a 6-digit confirmation code via email (Resend)
 */
export async function sendVerificationCodeDelivery({
  target,
  code,
  userName = "there",
}: {
  target: string;
  type?: "email";
  code: string;
  userName?: string;
}): Promise<DeliveryResult> {
  const subject = `Your Tandem Verification Code: ${code}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F3F5; color: #171923;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #FFFFFF; border-radius: 18px; border: 1px solid #D8D7DE; padding: 32px; box-shadow: 0 4px 18px rgba(23, 25, 35, 0.05);">
          <tr>
            <td>
              <div style="font-size: 24px; font-weight: 700; color: #171923; margin-bottom: 8px;">
                Tandem <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #B78AF2;"></span>
              </div>
              <div style="font-size: 13px; color: #777783; margin-bottom: 24px;">
                Life&apos;s better in sync.
              </div>
              <p style="font-size: 15px; color: #171923; line-height: 1.5; margin: 0 0 16px 0;">
                Hi ${userName},
              </p>
              <p style="font-size: 14px; color: #777783; line-height: 1.5; margin: 0 0 20px 0;">
                Here is your 6-digit verification code to confirm your email address for Tandem task notifications:
              </p>
              <div style="background-color: #F4ECFC; border: 1px solid #E5D4F9; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #6B21A8;">
                  ${code}
                </span>
              </div>
              <p style="font-size: 12px; color: #777783; line-height: 1.4; margin: 0;">
                This code expires in 10 minutes. If you did not request this verification, you can safely disregard this email.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  const text = `Your Tandem verification code is: ${code}. It expires in 10 minutes.`;
  return sendEmail({ to: target, subject, html, text });
}
