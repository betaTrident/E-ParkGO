import { renameSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

const e2ePort = process.env.E2E_PORT ?? '3001'
const root = process.cwd()
const envFiles = ['.env', '.env.local']
const backups = envFiles.map((file) => ({
  original: resolve(root, file),
  backup: resolve(root, `${file}.e2e-bak`),
}))

function isolateRemoteEnvFiles() {
  for (const { original, backup } of backups) {
    if (existsSync(original)) {
      renameSync(original, backup)
    }
  }
}

function restoreRemoteEnvFiles() {
  for (const { original, backup } of backups) {
    if (existsSync(backup)) {
      renameSync(backup, original)
    }
  }
}

const childEnv = {
  ...process.env,
  PORT: e2ePort,
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:55321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.E2E_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${e2ePort}`,
  APP_ENV: 'development',
  RECEIPT_SIGNING_SECRET:
    process.env.RECEIPT_SIGNING_SECRET ??
    '0123456789abcdef0123456789abcdef0123456789abcdef',
}

isolateRemoteEnvFiles()

const child = spawn(
  'npx',
  ['next', 'dev', '--turbopack', '-p', e2ePort],
  {
    cwd: root,
    env: childEnv,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

function shutdown(code) {
  restoreRemoteEnvFiles()
  process.exit(code ?? 1)
}

process.on('exit', () => {
  restoreRemoteEnvFiles()
})

child.on('exit', (code) => {
  shutdown(code)
})

process.on('SIGINT', () => {
  child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  child.kill('SIGTERM')
})
