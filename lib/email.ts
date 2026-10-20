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

type Email = { to: string; subject: string; text: string; html: string };

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
