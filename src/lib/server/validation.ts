import { z } from 'zod';

export const signupSchema = z.object({ name: z.string().min(2).max(120), email: z.string().email().max(255), password: z.string().min(12).max(128) });
export const loginSchema = z.object({ email: z.string().email().max(255), password: z.string().min(1).max(128) });
export const workspaceSchema = z.object({
  companyName: z.string().min(2).max(160),
  industryCategory: z.string().min(2).max(120),
  teamSize: z.string().max(80).optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  procurementEmail: z.string().email().optional().or(z.literal('')),
  mainPurchasingWorkflow: z.enum(['materials', 'parts', 'equipment', 'subcontractors', 'packaging', 'services', 'other']),
  currentTools: z.array(z.enum(['Email', 'Excel', 'QuickBooks', 'ERP/MRP', 'Other'])).min(1),
});
