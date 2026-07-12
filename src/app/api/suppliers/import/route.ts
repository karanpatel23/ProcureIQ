import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { parseSupplierCsv } from '@/lib/server/csv-import';
import { createId, mutateDb, now } from '@/lib/server/db';

// Bulk supplier import from a CSV / QuickBooks vendor export. Row-level
// results; existing suppliers (case-insensitive name match) are skipped, never
// overwritten. Kills the 30-suppliers-by-hand onboarding problem.
export async function POST(request: Request) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin']);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) throw new ApiError(400, 'FILE_REQUIRED', 'Upload a CSV file (e.g. a QuickBooks vendor export).');
    if (file.size > 2_000_000) throw new ApiError(400, 'FILE_TOO_LARGE', 'CSV must be under 2 MB.');
    const parsed = parseSupplierCsv(await file.text());
    if (!parsed.rows.length && parsed.skipped.length) throw new ApiError(422, 'CSV_UNUSABLE', parsed.skipped[0].reason);

    const result = await mutateDb((db) => {
      const existing = new Set(db.suppliers.filter((s) => s.workspaceId === workspace.id && !s.archivedAt).map((s) => s.name.trim().toLowerCase()));
      let created = 0;
      const duplicates: string[] = [];
      const timestamp = now();
      for (const row of parsed.rows) {
        if (existing.has(row.name.toLowerCase())) { duplicates.push(row.name); continue; }
        existing.add(row.name.toLowerCase());
        db.suppliers.push({ id: createId('sup'), workspaceId: workspace.id, name: row.name, email: row.email, phone: row.phone, website: row.website, category: row.category, paymentTerms: row.paymentTerms, preferred: row.preferred ?? false, status: 'active', createdAt: timestamp, updatedAt: timestamp });
        created += 1;
      }
      return { created, duplicates };
    }, { workspaceId: workspace.id });

    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'supplier.imported', entityType: 'supplier', metadata: { fileName: file.name, created: result.created, duplicates: result.duplicates.length, skipped: parsed.skipped.length } });
    return jsonOk({ created: result.created, duplicates: result.duplicates, skipped: parsed.skipped, headerMap: parsed.headerMap, message: `Imported ${result.created} supplier(s). ${result.duplicates.length} already existed, ${parsed.skipped.length} row(s) skipped.` }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
