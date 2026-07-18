import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename)
  const content = readFileSync(path, 'utf8')
  const entries = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    entries[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
  }

  return entries
}

function run(command, args, env, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })

  if (!capture) {
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
  }

  if (result.status !== 0) {
    if (capture) {
      if (result.stdout) process.stdout.write(result.stdout)
      if (result.stderr) process.stderr.write(result.stderr)
    }
    process.exit(result.status ?? 1)
  }

  return result
}

const envLocal = loadEnvFile('.env.local')
const projectRef = envLocal.SUPABASE_PROJECT_ID || 'nvjkigmnltxxvaimmxbg'
const password = encodeURIComponent(envLocal.SUPABASE_DB_PASSWORD || '')
const dbUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`

console.log('Pushing migrations and seed to remote database...')
run(
  'npx',
  ['supabase', 'db', 'push', '--db-url', dbUrl, '--include-seed', '--yes'],
  envLocal,
)

console.log('Generating TypeScript types from remote database...')
const typesResult = run(
  'npx',
  ['supabase', 'gen', 'types', 'typescript', '--db-url', dbUrl, '--schema', 'public'],
  envLocal,
  { capture: true },
)

writeFileSync(
  resolve(process.cwd(), 'src/lib/supabase/database.types.ts'),
  typesResult.stdout ?? '',
  'utf8',
)

console.log('Remote database deploy complete.')
