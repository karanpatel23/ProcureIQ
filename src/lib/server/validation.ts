import { z } from 'zod';

export const signupSchema = z.object({ name: z.string().min(2).max(120), email: z.string().email().max(255), password: z.string().min(12).max(128) });
export const loginSchema = z.object({ email: z.string().email().max(255), password: z.string().min(1).max(128) });
export const forgotPasswordSchema = z.object({ email: z.string().email().max(255) });
export const resetPasswordSchema = z.object({ token: z.string().min(16).max(256), password: z.string().min(12).max(128) });
export const workspaceSchema = z.object({
  companyName: z.string().min(2).max(160),
  industryCategory: z.string().min(2).max(120),
  teamSize: z.string().max(80).optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  procurementEmail: z.string().email().optional().or(z.literal('')),
  mainPurchasingWorkflow: z.enum(['materials', 'parts', 'equipment', 'subcontractors', 'packaging', 'services', 'other']),
  currentTools: z.array(z.enum(['Email', 'Excel', 'QuickBooks', 'ERP/MRP', 'Other'])).min(1),
  ownerTitle: z.enum(['Procurement manager', 'Finance approver', 'Operations', 'Admin', 'Supplier manager', 'Approver', 'Viewer', 'Other']).optional(),
});

export const deleteAccountSchema = z.object({ confirm: z.string().min(1).max(255) });

const currencyEnum = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'CNY', 'Other']);
const annualSpendEnum = z.enum(['Under $100K', '$100K–$1M', '$1M–$10M', '$10M–$50M', '$50M+']);
const supplierCountEnum = z.enum(['1–10', '11–50', '51–200', '201–1000', '1000+']);
export const companyProfileFields = { currencyEnum, annualSpendEnum, supplierCountEnum };
export const workspaceUpdateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  industryCategory: z.string().min(2).max(120).optional(),
  teamSize: z.string().max(80).optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  procurementEmail: z.string().email().optional().or(z.literal('')),
  mainPurchasingWorkflow: z.enum(['materials', 'parts', 'equipment', 'subcontractors', 'packaging', 'services', 'other']).optional(),
  currentTools: z.array(z.enum(['Email', 'Excel', 'QuickBooks', 'ERP/MRP', 'Other'])).min(1).optional(),
  country: z.string().max(80).optional().or(z.literal('')),
  currency: currencyEnum.optional().or(z.literal('')),
  annualSpendBand: annualSpendEnum.optional().or(z.literal('')),
  supplierCountBand: supplierCountEnum.optional().or(z.literal('')),
  taxId: z.string().max(60).optional().or(z.literal('')),
  approvalThreshold: z.coerce.number().nonnegative().max(1_000_000_000).optional().or(z.literal('')),
});

export const personaEnum = z.enum(['Procurement manager', 'Finance approver', 'Operations', 'Admin', 'Supplier manager', 'Approver', 'Viewer', 'Other']);
export const memberInviteSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  role: z.enum(['admin', 'member', 'viewer']),
  title: personaEnum,
});
export const memberUpdateSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']).optional(),
  title: personaEnum.optional(),
});
export const supplierSchema = z.object({
  name: z.string().min(2).max(160), contactPerson: z.string().max(120).optional().or(z.literal('')), email: z.string().email().optional().or(z.literal('')), phone: z.string().max(60).optional().or(z.literal('')), website: z.string().url().optional().or(z.literal('')), category: z.string().max(120).optional().or(z.literal('')), typicalItems: z.string().max(800).optional().or(z.literal('')), paymentTerms: z.string().max(160).optional().or(z.literal('')), notes: z.string().max(1200).optional().or(z.literal('')), status: z.enum(['active', 'inactive']).default('active'), preferred: z.boolean().optional(),
});
export const rfqItemInputSchema = z.object({ itemName: z.string().min(1).max(180), description: z.string().max(1000).optional().or(z.literal('')), quantity: z.coerce.number().positive(), unit: z.string().max(40).optional().or(z.literal('')), requiredDate: z.string().optional().or(z.literal('')), notes: z.string().max(800).optional().or(z.literal('')) });
export const rfqSchema = z.object({ title: z.string().min(2).max(180), description: z.string().max(2000).optional().or(z.literal('')), neededBy: z.string().optional().or(z.literal('')), deliveryLocation: z.string().max(240).optional().or(z.literal('')), internalReference: z.string().max(160).optional().or(z.literal('')), supplierIds: z.array(z.string()).default([]), items: z.array(rfqItemInputSchema).min(1) });

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
