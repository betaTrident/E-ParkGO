import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

function getLocalDbPort() {
  const config = readFileSync(resolve(process.cwd(), 'supabase/config.toml'), 'utf8')
  const dbSection = config.match(/\[db\][\s\S]*?(?=\n\[|$)/)?.[0] ?? ''
  const portMatch = dbSection.match(/^port\s*=\s*(\d+)/m)
  return portMatch?.[1] ?? '54322'
}

const dbUrl = `postgresql://postgres:postgres@127.0.0.1:${getLocalDbPort()}/postgres`

const result = spawnSync(
  'npx',
  [
    'supabase',
    'gen',
    'types',
    'typescript',
    '--db-url',
    dbUrl,
    '--schema',
    'public',
  ],
  {
    cwd: process.cwd(),
    env: { ...process.env, SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID || 'E-ParkGO' },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  },
)

if (result.status !== 0) {
  if (result.stderr) process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}

writeFileSync(
  resolve(process.cwd(), 'src/lib/supabase/database.types.ts'),
  result.stdout ?? '',
  'utf8',
)

console.log('Generated src/lib/supabase/database.types.ts from local Supabase.')
