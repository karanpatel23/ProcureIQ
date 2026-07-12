import { z } from 'zod';
import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, now, readDb } from '@/lib/server/db';
import { emailProviderConfigured, sendEmails, type EmailMessage } from '@/lib/server/email';
import { generateRfqEmailDraft } from '@/lib/server/rfq-email';

const sendSchema = z.object({
  supplierIds: z.array(z.string()).optional(),
  // Optional per-send overrides; the stored/generated draft is used otherwise.
  subject: z.string().max(200).optional(),
  body: z.string().max(20_000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ rfqId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId } = await params;
    const input = await parseJson(request, sendSchema);
    const db = await readDb({ workspaceId: workspace.id });

    const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id);
    if (!rfq) throw new ApiError(404, 'RFQ_NOT_FOUND', 'RFQ was not found.');

    const targetIds = input.supplierIds?.length ? input.supplierIds : rfq.supplierIds;
    if (!targetIds.length) throw new ApiError(400, 'NO_SUPPLIERS', 'Select at least one supplier to send this RFQ to.');

    const suppliers = db.suppliers.filter((item) => targetIds.includes(item.id) && item.workspaceId === workspace.id && !item.archivedAt);
    const items = db.rfqItems.filter((item) => item.rfqId === rfq.id && item.workspaceId === workspace.id);

    const withEmail = suppliers.filter((supplier) => supplier.email);
    const withoutEmail = suppliers.filter((supplier) => !supplier.email);

    const bodyText = input.body ?? rfq.emailDraft ?? generateRfqEmailDraft({ rfq, items, suppliers, workspaceName: workspace.name });
    const subject = input.subject ?? `RFQ — ${rfq.title}`;
    const replyTo = workspace.procurementEmail || user.email;

    const messages: EmailMessage[] = withEmail.map((supplier) => ({ to: supplier.email as string, subject, text: bodyText, replyTo }));
    const results = await sendEmails(messages);

    const sentCount = results.filter((r) => r.delivery === 'sent').length;
    const loggedCount = results.filter((r) => r.delivery === 'logged').length;
    const failed = results.filter((r) => r.delivery === 'failed');

    // Advance status ONLY when email actually left the building. "Logged" means
    // no provider is configured and nothing was delivered — marking the RFQ
    // "sent" in that state would be a lie the product tells by default.
    if (sentCount > 0) {
      await mutateDb((draft) => {
        const target = draft.rfqs.find((item) => item.id === rfq.id && item.workspaceId === workspace.id);
        if (target) { target.status = 'sent'; target.sentAt = now(); target.updatedAt = now(); }
      }, { workspaceId: workspace.id });
    }

    await writeAuditLog({
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: 'rfq.sent',
      entityType: 'rfq',
      entityId: rfq.id,
      metadata: { recipients: withEmail.map((s) => s.email), sentCount, loggedCount, failedCount: failed.length, provider: emailProviderConfigured() ? 'resend' : 'logged' },
    });

    return jsonOk({
      delivery: emailProviderConfigured() ? 'sent' : 'logged',
      sentCount,
      loggedCount,
      results,
      skippedNoEmail: withoutEmail.map((supplier) => ({ id: supplier.id, name: supplier.name })),
      message: emailProviderConfigured()
        ? `RFQ sent to ${sentCount} supplier(s).`
        : `Email provider is not configured, so the RFQ was recorded for ${loggedCount} supplier(s) but not delivered. The RFQ stays in draft — configure RESEND_API_KEY and EMAIL_FROM to send for real, or email it yourself and use “Mark as sent”.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
