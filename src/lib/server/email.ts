import { env } from './env';

/*
 * Email delivery abstraction. When RESEND_API_KEY + EMAIL_FROM are configured,
 * messages are delivered through Resend's HTTP API (no SDK dependency). Without
 * a provider, the message is recorded to the server log and returned with
 * delivery: 'logged' — so the workflow always completes and the caller can be
 * honest in the UI about whether mail actually left the building. Delivery is
 * never silently faked.
 */
export type EmailMessage = { to: string; subject: string; text: string; replyTo?: string };
export type EmailResult = { to: string; delivery: 'sent' | 'logged' | 'failed'; id?: string; error?: string };

export function emailProviderConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  if (!emailProviderConfigured()) {
    console.log(JSON.stringify({ level: 'info', event: 'email.logged', to: message.to, subject: message.subject }));
    return { to: message.to, delivery: 'logged' };
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: message.to, subject: message.subject, text: message.text, reply_to: message.replyTo }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(JSON.stringify({ level: 'error', event: 'email.failed', to: message.to, status: response.status, detail: detail.slice(0, 300) }));
      return { to: message.to, delivery: 'failed', error: `Provider responded ${response.status}` };
    }
    const body = (await response.json().catch(() => ({}))) as { id?: string };
    return { to: message.to, delivery: 'sent', id: body.id };
  } catch (error) {
    return { to: message.to, delivery: 'failed', error: error instanceof Error ? error.message : 'send failed' };
  }
}

export async function sendEmails(messages: EmailMessage[]): Promise<EmailResult[]> {
  return Promise.all(messages.map(sendEmail));
}
