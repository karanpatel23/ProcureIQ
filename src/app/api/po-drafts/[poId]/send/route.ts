import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, now, readDb } from '@/lib/server/db';
import { emailProviderConfigured, sendEmail } from '@/lib/server/email';

type PoLine = { itemName?: string; description?: string; quantity?: number; unit?: string; unitPrice?: number; extendedPrice?: number };
type PoDraft = {
  id: string; workspaceId: string; status: string; poNumber?: string; poDate?: string; supplierId?: string; supplierName?: string;
  buyerCompany?: string; shipTo?: string; paymentTerms?: string; deliveryDate?: string; lines?: PoLine[]; subtotal?: number; taxes?: number; freight?: number; total?: number; sentAt?: string; updatedAt?: string;
};

function formatPoEmail(po: PoDraft): string {
  const lines = (po.lines ?? []).map((l, i) => `${i + 1}. ${l.itemName ?? l.description ?? 'Item'} — ${l.quantity ?? 0} ${l.unit ?? ''} @ ${Number(l.unitPrice ?? 0).toLocaleString()} = ${Number(l.extendedPrice ?? 0).toLocaleString()}`).join('\n');
  return `Purchase Order ${po.poNumber ?? ''}\nDate: ${po.poDate ?? ''}\nFrom: ${po.buyerCompany ?? ''}\nTo: ${po.supplierName ?? ''}\nShip to: ${po.shipTo ?? 'To be confirmed'}\nPayment terms: ${po.paymentTerms ?? 'To be confirmed'}\n\nItems:\n${lines}\n\nSubtotal: ${Number(po.subtotal ?? 0).toLocaleString()}\nTaxes: ${Number(po.taxes ?? 0).toLocaleString()}\nFreight: ${Number(po.freight ?? 0).toLocaleString()}\nTotal: ${Number(po.total ?? 0).toLocaleString()}\n\nPlease confirm acceptance and expected ship date.`;
}

// Human-gated PO send. A PO must be human-approved first; the loop and draft
// never send on their own. Honest logged fallback when no email provider.
export async function POST(_: Request, { params }: { params: Promise<{ poId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin']);
    const { poId } = await params;
    const db = await readDb({ workspaceId: workspace.id });
    const po = db.purchaseOrderDrafts.find((item) => item.id === poId && item.workspaceId === workspace.id) as unknown as PoDraft | undefined;
    if (!po) throw new ApiError(404, 'PO_NOT_FOUND', 'PO draft was not found.');
    if (po.status === 'draft_requires_human_approval') throw new ApiError(400, 'PO_NOT_APPROVED', 'Approve the PO before sending it.');

    const supplier = db.suppliers.find((s) => s.id === po.supplierId && s.workspaceId === workspace.id);
    if (!supplier?.email) throw new ApiError(400, 'NO_SUPPLIER_EMAIL', 'This supplier has no email on file. Export the PO and send it manually.');

    const result = await sendEmail({ to: supplier.email, subject: `Purchase Order ${po.poNumber ?? ''} — ${po.buyerCompany ?? ''}`, text: formatPoEmail(po), replyTo: workspace.procurementEmail || user.email });
    if (result.delivery === 'failed') throw new ApiError(502, 'PO_SEND_FAILED', `Could not send the PO: ${result.error ?? 'provider error'}.`);

    await mutateDb((store) => {
      const target = store.purchaseOrderDrafts.find((item) => item.id === poId && item.workspaceId === workspace.id) as unknown as PoDraft | undefined;
      if (target) { target.status = 'exported'; target.sentAt = now(); target.updatedAt = now(); }
    }, { workspaceId: workspace.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'po.sent', entityType: 'purchase_order_draft', entityId: po.id, metadata: { to: supplier.email, delivery: result.delivery } });

    return jsonOk({
      delivery: result.delivery,
      to: supplier.email,
      message: emailProviderConfigured()
        ? `Purchase order sent to ${supplier.email}.`
        : `Email provider is not configured, so the PO was recorded for ${supplier.email} but not delivered. Configure RESEND_API_KEY and EMAIL_FROM to send for real.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
