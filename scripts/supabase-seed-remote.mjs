import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'

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

function splitSqlStatements(sql) {
  const withoutComments = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  return withoutComments
    .split(/;\s*(?=\n\s*(?:INSERT|UPDATE|DELETE|CREATE|ALTER|SELECT)\b)/gi)
    .map((statement) => statement.trim())
    .filter(Boolean)
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
const seedSql = readFileSync(resolve(process.cwd(), 'supabase/seed.sql'), 'utf8')
const statements = splitSqlStatements(seedSql)

console.log(`Applying ${statements.length} seed statements to remote database...`)

const tempDir = mkdtempSync(join(tmpdir(), 'eparkgo-seed-'))

try {
  for (const [index, statement] of statements.entries()) {
    const preview = statement.split('\n')[0].slice(0, 72)
    console.log(`[${index + 1}/${statements.length}] ${preview}...`)
    const tempFile = join(tempDir, `${String(index + 1).padStart(2, '0')}.sql`)
    writeFileSync(tempFile, `${statement};\n`, 'utf8')
    run(
      'npx',
      ['supabase', 'db', 'query', '--file', tempFile, '--db-url', dbUrl],
      envLocal,
    )
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

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

console.log('Seed and type generation complete.')
