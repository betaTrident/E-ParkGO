import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename)
  if (!existsSync(path)) return {}

  const entries = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    entries[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim()
  }

  return entries
}

const runtimeEnv = {
  ...loadEnvFile('.env'),
  ...loadEnvFile('.env.local'),
  ...process.env,
}
const projectId = runtimeEnv.SUPABASE_PROJECT_ID

if (!projectId) {
  throw new Error('SUPABASE_PROJECT_ID is required for remote type generation')
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    'supabase',
    'gen',
    'types',
    'typescript',
    '--project-id',
    projectId,
    '--schema',
    'public',
  ],
  {
    cwd: process.cwd(),
    env: runtimeEnv,
    encoding: 'utf8',
    shell: false,
  },
)

if (result.status !== 0) {
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}

const outputPath = resolve(process.cwd(), 'src/lib/supabase/database.types.ts')
writeFileSync(outputPath, result.stdout ?? '', 'utf8')

console.log('Remote TypeScript types generated without applying migrations or seed data.')
