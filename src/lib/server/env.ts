import { z } from 'zod';

const envSchema = z.object({
  AUTH_SECRET: z.string().min(32).default('development-auth-secret-change-before-production'),
  DATABASE_URL: z.string().url().optional(),
  PROCUREIQ_DATA_PATH: z.string().default('/tmp/procureiq-data.json'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10_000_000),
  ALLOWED_UPLOAD_MIME_TYPES: z.string().default('application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
});

export const env = envSchema.parse(process.env);

export const uploadPolicy = {
  maxBytes: env.MAX_UPLOAD_BYTES,
  allowedMimeTypes: env.ALLOWED_UPLOAD_MIME_TYPES.split(',').map((type) => type.trim()).filter(Boolean),
};
