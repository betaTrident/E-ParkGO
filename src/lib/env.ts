import { z } from 'zod'

const browserEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
})

const serverEnvSchema = browserEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  RECEIPT_SIGNING_SECRET: z.string().min(32, 'RECEIPT_SIGNING_SECRET must be at least 32 characters'),
})

export type BrowserEnv = z.infer<typeof browserEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

export const env = browserEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})

/**
 * Returns validated server-only environment variables.
 * Call only from server-side code: Route Handlers, Server Components, middleware.
 * Throws at startup if any required server variable is missing or malformed.
 */
export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    ...env,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    APP_ENV: process.env.APP_ENV,
    RECEIPT_SIGNING_SECRET: process.env.RECEIPT_SIGNING_SECRET,
  })
}
