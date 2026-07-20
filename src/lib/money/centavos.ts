const MAX_CENTAVOS = BigInt(999_999_999_999)

export function isCanonicalCentavosString(value: string): boolean {
  if (!/^[0-9]+$/.test(value)) {
    return false
  }

  try {
    const amount = BigInt(value)
    return amount >= BigInt(0) && amount <= MAX_CENTAVOS
  } catch {
    return false
  }
}

export function parseCentavosString(value: string): bigint {
  if (!isCanonicalCentavosString(value)) {
    throw new Error('Invalid centavos amount')
  }

  return BigInt(value)
}

export function centavosToString(value: bigint): string {
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

export { MAX_CENTAVOS }
