import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename)
  if (!existsSync(path)) return {}
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
  const executable = process.platform === 'win32' && command === 'npx' ? 'npx.cmd' : command
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: false,
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
const sharedEnv = { ...envLocal, ...process.env }
const projectRef = sharedEnv.SUPABASE_PROJECT_ID

if (!projectRef) {
  throw new Error('SUPABASE_PROJECT_ID is required; refusing to target an implicit project')
}

console.log('Linking Supabase project...')
run('npx', ['supabase', 'link', '--project-ref', projectRef, '--yes'], sharedEnv)

console.log('Pushing migrations to linked project...')
run(
  'npx',
  ['supabase', 'db', 'push', '--linked', '--yes'],
  sharedEnv,
)

console.log('Generating TypeScript types from linked project...')
const typesResult = run(
  'npx',
  ['supabase', 'gen', 'types', 'typescript', '--linked', '--schema', 'public'],
  sharedEnv,
  { capture: true },
)

writeFileSync(
  resolve(process.cwd(), 'src/lib/supabase/database.types.ts'),
  typesResult.stdout ?? '',
  'utf8',
)

console.log('Remote deploy complete.')
