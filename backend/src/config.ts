export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  databasePath: process.env.DATABASE_PATH || "./data/hookdump.db",
  maxEventsPerHook: parseInt(process.env.MAX_EVENTS_PER_HOOK || "100", 10),
  // Email notification settings (optional)
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "alerts@hookdump.dev",
  // Alternative: Resend API
  resendApiKey: process.env.RESEND_API_KEY || "",
};
