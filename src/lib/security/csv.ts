const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'] as const

export function neutralizeCsvCell(value: string): string {
  const normalized = value.replace(/\r?\n/g, ' ').trim()
  if (!normalized) {
    return ''
  }

  if (FORMULA_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return `'${normalized}`
  }

  if (normalized.includes('"') || normalized.includes(',') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`
  }

  return normalized
}

export function serializeCsvRow(values: string[]): string {
  return values.map((value) => neutralizeCsvCell(value)).join(',')
}

export function serializeCsv(rows: string[][]): string {
  return rows.map((row) => serializeCsvRow(row)).join('\r\n')
}
