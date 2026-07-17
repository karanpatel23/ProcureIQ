import { handleApiError, jsonOk } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { emailProviderConfigured, sendEmail } from '@/lib/server/email';

// Sends a test email to the signed-in user's OWN address and returns the real
// delivery result (sent / failed / logged, with the provider error when there
// is one). Exists so a deployment operator can verify email configuration
// end-to-end without spelunking through server logs. Only ever mails yourself.
export async function POST() {
  try {
    const { user } = await requireUser();
    const result = await sendEmail({
      to: user.email,
      subject: 'Corven test email — your configuration works',
      text: `This is a test email from your Corven deployment.\n\nIf you are reading this in your inbox, RESEND_API_KEY and EMAIL_FROM are configured correctly and password resets, verification, welcome emails, and RFQ sending will all deliver.\n\n— Corven`,
    });
    return jsonOk({ configured: emailProviderConfigured(), ...result });
  } catch (error) { return handleApiError(error); }
}
