import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    test: {
      include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      env: {
        NEXT_PUBLIC_SUPABASE_URL:
          env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key',
        NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        SUPABASE_SERVICE_ROLE_KEY:
          env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key',
        RECEIPT_SIGNING_SECRET:
          env.RECEIPT_SIGNING_SECRET ??
          '0123456789abcdef0123456789abcdef0123456789abcdef',
        APP_ENV: env.APP_ENV ?? 'development',
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        thresholds: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
        exclude: [
          'node_modules/**',
          'tests/**',
          '**/*.config.*',
          'src/components/ui/**',
          'src/lib/supabase/database.types.ts',
        ],
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  }
})
