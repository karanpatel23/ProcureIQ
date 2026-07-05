import { handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { createId, mutateDb, now } from '@/lib/server/db';
import { leadRequestSchema } from '@/lib/server/validation';

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, leadRequestSchema);
    const lead = await mutateDb((db) => {
      const timestamp = now();
      const lead = { id: createId('lead'), type: input.type, name: input.name, workEmail: input.workEmail.toLowerCase(), company: input.company, industry: input.industry || undefined, mainPurchasingWorkflow: input.mainPurchasingWorkflow || undefined, estimatedSupplierQuotesPerMonth: input.estimatedSupplierQuotesPerMonth || undefined, currentTools: input.currentTools || undefined, message: input.message || undefined, sourcePath: new URL(request.url).pathname, status: 'new' as const, createdAt: timestamp, updatedAt: timestamp };
      db.leadRequests.push(lead);
      return lead;
    });
    // Leads must survive ephemeral serverless storage: emit a structured log so
    // every submission is also captured in the platform's function logs.
    console.log(JSON.stringify({ level: 'info', event: 'lead.created', leadId: lead.id, type: lead.type, name: lead.name, workEmail: lead.workEmail, company: lead.company, industry: lead.industry, mainPurchasingWorkflow: lead.mainPurchasingWorkflow, estimatedSupplierQuotesPerMonth: lead.estimatedSupplierQuotesPerMonth, currentTools: lead.currentTools, message: lead.message, at: lead.createdAt }));
    return jsonOk({ lead, message: 'Thanks — the ProcureIQ team will follow up shortly.' }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
