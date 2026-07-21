const CENTAVOS_PATTERN = /^(?:0|[1-9]\d{0,14})$/
export const MAX_CENTAVOS = BigInt(999_999_999_999)

export type CentavosString = string

export function isCanonicalCentavosString(value: string): boolean {
  if (!CENTAVOS_PATTERN.test(value)) {
    return false
  }

  try {
    const amount = BigInt(value)
    return amount >= BigInt(0) && amount <= MAX_CENTAVOS
  } catch {
    return false
  }
}

export function isCentavosString(value: string): boolean {
  return isCanonicalCentavosString(value)
}

export function parseCentavosString(value: string): bigint {
  if (!isCanonicalCentavosString(value)) {
    throw new Error('Invalid centavos amount')
  }

  return BigInt(value)
}

export function centavosToString(value: bigint): CentavosString {
  if (value < BigInt(0) || value > MAX_CENTAVOS) {
    throw new Error('Centavos amount out of bounds')
  }

  return value.toString()
}

export function formatCentavosPhp(value: bigint | number | string): string {
  const cents = typeof value === 'bigint' ? value : BigInt(value)
  const pesos = Number(cents) / 100
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(pesos)
}

export function formatCentavosForDisplay(value: bigint | CentavosString): string {
  const centavos = typeof value === 'bigint' ? value : parseCentavosString(value)
  return formatCentavosPhp(centavos)
}
