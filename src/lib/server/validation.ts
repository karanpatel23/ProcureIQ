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
export const supplierSchema = z.object({
  name: z.string().min(2).max(160), contactPerson: z.string().max(120).optional().or(z.literal('')), email: z.string().email().optional().or(z.literal('')), phone: z.string().max(60).optional().or(z.literal('')), website: z.string().url().optional().or(z.literal('')), category: z.string().max(120).optional().or(z.literal('')), typicalItems: z.string().max(800).optional().or(z.literal('')), paymentTerms: z.string().max(160).optional().or(z.literal('')), notes: z.string().max(1200).optional().or(z.literal('')), status: z.enum(['active', 'inactive']).default('active'),
});
export const rfqItemInputSchema = z.object({ itemName: z.string().min(1).max(180), description: z.string().max(1000).optional().or(z.literal('')), quantity: z.coerce.number().positive(), unit: z.string().max(40).optional().or(z.literal('')), requiredDate: z.string().optional().or(z.literal('')), notes: z.string().max(800).optional().or(z.literal('')) });
export const rfqSchema = z.object({ title: z.string().min(2).max(180), description: z.string().max(2000).optional().or(z.literal('')), neededBy: z.string().optional().or(z.literal('')), deliveryLocation: z.string().max(240).optional().or(z.literal('')), internalReference: z.string().max(160).optional().or(z.literal('')), supplierIds: z.array(z.string()).default([]), items: z.array(rfqItemInputSchema).min(1) });
<<<<<<< HEAD

export const leadRequestSchema = z.object({
  type: z.enum(['demo', 'contact']),
  name: z.string().min(2).max(120),
  workEmail: z.string().email().max(255),
  company: z.string().min(2).max(160),
  industry: z.string().max(120).optional().or(z.literal('')),
  mainPurchasingWorkflow: z.string().max(160).optional().or(z.literal('')),
  estimatedSupplierQuotesPerMonth: z.string().max(80).optional().or(z.literal('')),
  currentTools: z.string().max(240).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
});
export const billingPlanSchema = z.object({ plan: z.enum(['starter', 'growth', 'pro', 'enterprise']) });
=======
>>>>>>> origin/main
