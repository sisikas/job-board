import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outgoing email through a Gmail account over SMTP.
 *
 *   GMAIL_USER          the sending address, e.g. thegoodsort.jobs@gmail.com
 *   GMAIL_APP_PASSWORD  a Google "app password" (needs 2-Step Verification on
 *                       the account); not the normal Gmail password
 *
 * Gmail caps sending at roughly 500 emails a day.
 */

type Email = { to: string; subject: string; text: string; html: string; replyTo?: string };

const AD_REQUEST_INBOX = "sissikasimati@gmail.com";

let transporter: Transporter | undefined;

async function sendEmail(email: Email): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — would send to ${email.to}:\n${email.text}\n`);
      return;
    }
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set");
  }

  transporter ??= nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  await transporter.sendMail({ from: `The Good Sort <${user}>`, ...email });
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendAdRequestEmail(input: {
  email: string;
  business: string;
  role: string;
  city: string;
  pay: string;
  description: string;
  about: string;
  apply: string;
}): Promise<void> {
  const adminUrl = `${(process.env.SITE_URL || "https://thegoodsort.vercel.app").replace(/\/$/, "")}/admin/requests`;
  const lines = [
    ["Business", input.business],
    ["Role", input.role],
    ["City", input.city],
    ["Pay", input.pay || "Not given"],
    ["Email", input.email],
    ["How people apply", input.apply],
  ];
  const text =
    `New ad request\n\n` +
    lines.map(([label, value]) => `${label}: ${value}`).join("\n") +
    `\n\nAbout the kitchen:\n${input.about}\n\nThe job:\n${input.description}\n\nOpen in admin:\n${adminUrl}`;
  const rows = lines
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 8px"><strong>${label}.</strong> ${escapeHtml(value)}</p>`,
    )
    .join("");

  await sendEmail({
    to: AD_REQUEST_INBOX,
    replyTo: input.email,
    subject: `New ad request: ${input.business} — ${input.role}, ${input.city}`,
    text,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#211c14">
        <h2 style="margin:0 0 16px">New ad request</h2>
        ${rows}
        <p style="margin:20px 0 8px"><strong>About the kitchen.</strong></p>
        <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.about)}</p>
        <p style="margin:20px 0 8px"><strong>The job.</strong></p>
        <p style="margin:0;white-space:pre-wrap">${escapeHtml(input.description)}</p>
        <p style="margin:24px 0">
          <a href="${adminUrl}" style="background:#517228;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold">
            Open ad requests
          </a>
        </p>
      </div>
    `,
  });
}
