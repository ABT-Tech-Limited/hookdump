import { db } from "../db/client.js";
import { hooks } from "../db/schema.js";
import { eq, and, isNotNull, lt, or, isNull } from "drizzle-orm";
import { config } from "../config.js";

// Simple email sending using fetch (no external dependencies)
async function sendAlertEmail(
  to: string,
  hookName: string,
  hookId: string,
  timeoutMinutes: number
): Promise<boolean> {
  // If no SMTP is configured, log to console
  if (!config.smtpHost) {
    console.log(`[Monitor Alert] Hook "${hookName}" (${hookId}) has not received webhooks for ${timeoutMinutes} minutes. Would send email to: ${to}`);
    return true;
  }

  // For production, you would integrate with an email service here
  // Options: Resend, SendGrid, AWS SES, SMTP
  // For now, we'll just log and return true
  console.log(`[Monitor Alert] Sending alert to ${to} for hook "${hookName}"`);

  // TODO: Implement actual email sending
  // Example with Resend:
  // const resend = new Resend(config.resendApiKey);
  // await resend.emails.send({
  //   from: 'alerts@hookdump.dev',
  //   to,
  //   subject: `[Hookdump] Alert: No webhooks received for "${hookName}"`,
  //   text: `Your hook "${hookName}" has not received any webhooks in the last ${timeoutMinutes} minutes.`
  // });

  return true;
}

export async function checkMonitors(): Promise<void> {
  const now = new Date();

  // Find all hooks with monitoring enabled
  const monitoredHooks = await db
    .select()
    .from(hooks)
    .where(
      and(
        eq(hooks.monitorEnabled, true),
        isNotNull(hooks.monitorTimeoutMinutes),
        isNotNull(hooks.monitorNotifyEmail)
      )
    );

  for (const hook of monitoredHooks) {
    if (!hook.monitorTimeoutMinutes || !hook.monitorNotifyEmail) continue;

    const timeoutMs = hook.monitorTimeoutMinutes * 60 * 1000;
    const lastEvent = hook.lastEventAt ? new Date(hook.lastEventAt) : null;
    const lastAlert = hook.monitorLastAlertAt
      ? new Date(hook.monitorLastAlertAt)
      : null;

    // Check if we should alert
    let shouldAlert = false;

    if (!lastEvent) {
      // Never received an event - alert if hook is older than timeout
      const hookCreated = new Date(hook.createdAt);
      if (now.getTime() - hookCreated.getTime() > timeoutMs) {
        shouldAlert = true;
      }
    } else {
      // Check if last event is older than timeout
      if (now.getTime() - lastEvent.getTime() > timeoutMs) {
        shouldAlert = true;
      }
    }

    // Don't alert again if we already alerted recently (within timeout period)
    if (shouldAlert && lastAlert) {
      if (now.getTime() - lastAlert.getTime() < timeoutMs) {
        shouldAlert = false;
      }
    }

    if (shouldAlert) {
      const success = await sendAlertEmail(
        hook.monitorNotifyEmail,
        hook.name,
        hook.id,
        hook.monitorTimeoutMinutes
      );

      if (success) {
        // Update last alert time
        await db
          .update(hooks)
          .set({ monitorLastAlertAt: now.toISOString() })
          .where(eq(hooks.id, hook.id));
      }
    }
  }
}

let monitorInterval: NodeJS.Timeout | null = null;

export function startMonitorService(): void {
  // Run every minute
  const intervalMs = 60 * 1000;

  console.log("[Monitor] Starting monitor service (checking every 1 minute)");

  // Run immediately on start
  checkMonitors().catch((err) => {
    console.error("[Monitor] Error checking monitors:", err);
  });

  // Then run periodically
  monitorInterval = setInterval(() => {
    checkMonitors().catch((err) => {
      console.error("[Monitor] Error checking monitors:", err);
    });
  }, intervalMs);
}

export function stopMonitorService(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log("[Monitor] Stopped monitor service");
  }
}
