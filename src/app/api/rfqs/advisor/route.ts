import { z } from 'zod';
import { handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { requireWorkspace } from '@/lib/server/auth';
import { analyzeRfq } from '@/lib/server/rfq-advisor';

const advisorSchema = z.object({
  title: z.string().max(180).optional(),
  description: z.string().max(2000).optional(),
  neededBy: z.string().max(40).optional(),
  deliveryLocation: z.string().max(240).optional(),
  supplierCount: z.number().int().nonnegative().optional(),
  items: z.array(z.object({
    itemName: z.string().max(180).optional(),
    description: z.string().max(1000).optional(),
    quantity: z.coerce.number().optional(),
    unit: z.string().max(40).optional(),
  })).max(50).optional(),
});

export async function POST(request: Request) {
  try {
    await requireWorkspace();
    const input = await parseJson(request, advisorSchema);
    return jsonOk({ advice: analyzeRfq(input) });
  } catch (error) {
    return handleApiError(error);
  }
}
