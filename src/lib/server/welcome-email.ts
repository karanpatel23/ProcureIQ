import { env } from './env';
import { sendEmail } from './email';

/*
 * Welcome email — sent once, the moment a new account becomes active (right
 * after signup verification, or on first OAuth sign-in). Structure follows the
 * pattern that performs best for professional B2B SaaS: a value-led subject, a
 * one-line reaffirmation, a single primary CTA, three micro-resources, and a
 * human sign-off. Delivery goes through the shared provider abstraction, so it
 * is only really sent when an email provider is configured.
 */
function baseUrl(request: Request): string {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, '');
  try { return new URL(request.url).origin; } catch { return 'https://corven.com'; }
}

function firstNameOf(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first && first.length <= 40 ? first : 'there';
}

export function buildWelcomeEmail(name: string, ctaUrl: string) {
  const first = firstNameOf(name);
  const subject = `Welcome to Corven, ${first} — your workspace is ready`;

  const text = [
    `Welcome to Corven, ${first}.`,
    ``,
    `Corven is your AI decision layer for procurement — supplier quotes, exceptions, and approvals brought into one clear, human-controlled workflow.`,
    ``,
    `Your first step: set up your workspace.`,
    ctaUrl,
    ``,
    `Once you're in, you can:`,
    `  • Send RFQs to multiple suppliers in minutes.`,
    `  • Compare quotes side by side with AI that surfaces the real best value.`,
    `  • Turn the winning quote into a purchase order draft — with you in control of every decision.`,
    ``,
    `If there's anything I can help with, just reply to this email — it reaches me directly.`,
    ``,
    `Karan Patel`,
    `Founder, Corven`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Welcome to Corven</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Set up your workspace and run your first supplier quote comparison in minutes.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6e8ec;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#0e1116;padding:22px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;"><div style="width:34px;height:34px;border-radius:9px;background:linear-gradient(150deg,#9db0cc,#6b7c98);color:#0e1116;font-weight:800;font-size:20px;text-align:center;line-height:34px;">C</div></td>
            <td style="padding-left:12px;color:#e9e6e7;font-size:19px;font-weight:700;letter-spacing:-0.2px;">Corven</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:38px 40px 8px;">
          <h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#12161d;font-weight:800;letter-spacing:-0.4px;">Welcome to Corven, ${first}.</h1>
          <p style="margin:0 0 22px;font-size:15.5px;line-height:1.65;color:#41474f;">Corven is your AI decision layer for procurement — supplier quotes, exceptions, and approvals brought into one clear, <strong style="color:#12161d;">human-controlled</strong> workflow.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 30px;"><tr><td style="border-radius:10px;background:#2c3a55;">
            <a href="${ctaUrl}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Set up your workspace →</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:0 40px;">
          <div style="border-top:1px solid #eceef1;padding-top:22px;">
            <p style="margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#8a919b;">Once you're in, you can</p>
            ${[
              ['Send RFQs in minutes', 'Reach multiple suppliers with a single, structured request for quote.'],
              ['Compare quotes with AI', 'See quotes side by side, with the real best value surfaced — not just the lowest price.'],
              ['Draft POs, in control', 'Turn the winning quote into a purchase order draft. Every decision stays yours.'],
            ].map(([t, d]) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px;"><tr>
              <td style="width:8px;vertical-align:top;padding-top:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#6b7c98;"></div></td>
              <td style="padding-left:14px;"><span style="font-size:14.5px;font-weight:700;color:#1a1f27;">${t}.</span> <span style="font-size:14.5px;color:#565d66;">${d}</span></td>
            </tr></table>`).join('')}
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px 36px;">
          <div style="border-top:1px solid #eceef1;padding-top:22px;">
            <p style="margin:0 0 18px;font-size:14.5px;line-height:1.6;color:#41474f;">If there's anything I can help with, just reply to this email — it reaches me directly.</p>
            <p style="margin:0;font-size:14.5px;line-height:1.5;color:#1a1f27;"><strong>Karan Patel</strong><br><span style="color:#8a919b;">Founder, Corven</span></p>
          </div>
        </td></tr>
        <tr><td style="background:#f7f8fa;padding:18px 40px;border-top:1px solid #eceef1;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#9aa1ab;">You're receiving this because you created a Corven account. Corven — the AI decision layer for procurement.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

export async function sendWelcomeEmail(request: Request, to: string, name: string) {
  const { subject, text, html } = buildWelcomeEmail(name, `${baseUrl(request)}/onboarding`);
  return sendEmail({ to, subject, text, html });
}
