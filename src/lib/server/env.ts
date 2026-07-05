import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: z.string().min(32).default('development-auth-secret-change-before-production'),
  DATABASE_URL: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  PROCUREIQ_DATA_PATH: z.string().default('/tmp/procureiq-data.json'),
  QUOTE_STORAGE_PATH: z.string().default('/tmp/procureiq-quotes'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().max(25_000_000).default(10_000_000),
  ALLOWED_UPLOAD_MIME_TYPES: z.string().default('application/pdf,image/png,image/jpeg,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  BILLING_PROVIDER: z.enum(['none', 'stripe']).default('none'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  INTERNAL_ADMIN_EMAILS: z.string().default(''),
  AI_PROVIDER: z.enum(['local', 'openai', 'azure']).default('local'),
  OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  AZURE_OPENAI_API_VERSION: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.AI_PROVIDER === 'openai' && !value.OPENAI_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['OPENAI_API_KEY'],
      message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai.',
    });
  }

  if (value.AI_PROVIDER === 'azure') {
    if (!value.AZURE_OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AZURE_OPENAI_API_KEY'],
        message: 'AZURE_OPENAI_API_KEY is required when AI_PROVIDER=azure.',
      });
    }

    if (!value.AZURE_OPENAI_ENDPOINT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AZURE_OPENAI_ENDPOINT'],
        message: 'AZURE_OPENAI_ENDPOINT is required when AI_PROVIDER=azure.',
      });
    }

    if (!value.AZURE_OPENAI_DEPLOYMENT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AZURE_OPENAI_DEPLOYMENT'],
        message: 'AZURE_OPENAI_DEPLOYMENT is required when AI_PROVIDER=azure.',
      });
    }

    if (!value.AZURE_OPENAI_API_VERSION) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AZURE_OPENAI_API_VERSION'],
        message: 'AZURE_OPENAI_API_VERSION is required when AI_PROVIDER=azure.',
      });
    }
  }
});

export const env = envSchema.parse(process.env);

export const uploadPolicy = {
  maxBytes: env.MAX_UPLOAD_BYTES,
  allowedMimeTypes: env.ALLOWED_UPLOAD_MIME_TYPES.split(',')
    .map((type: string) => type.trim())
    .filter(Boolean),
};
