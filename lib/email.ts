/**
 * Outgoing email via Resend's HTTP API (https://resend.com/docs/api-reference).
 *
 *   RESEND_API_KEY  required to actually send
 *   EMAIL_FROM      e.g. "The Good Sort <hello@thegoodsort.com>"; the default
 *                   sandbox sender can only deliver to your own Resend address
 */

const DEFAULT_FROM = "The Good Sort <onboarding@resend.dev>";

type Email = { to: string; subject: string; text: string; html: string };

async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email] RESEND_API_KEY not set — would send to ${email.to}:\n${email.text}\n`);
      return;
    }
    throw new Error("RESEND_API_KEY is not set");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || DEFAULT_FROM, ...email }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}

export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Reset your The Good Sort password",
    text:
      `Someone asked to reset the password for your The Good Sort account.\n\n` +
      `Choose a new password here (the link works for 1 hour):\n${link}\n\n` +
      `If this wasn't you, you can ignore this email — your password won't change.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#211c14">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>Someone asked to reset the password for your The Good Sort account.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#517228;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">
            Choose a new password
          </a>
        </p>
        <p style="font-size:13px;color:#7d7263">This link works for 1 hour. If this wasn't you, you can ignore this email — your password won't change.</p>
      </div>
    `,
  });
}
