import { createHash, randomBytes } from 'node:crypto'

const BASE64URL_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
const QR_FRAGMENT_PREFIX = 'v1.'

export function generateQrToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashQrToken(token: string): Buffer {
  return createHash('sha256').update(decodeQrToken(token)).digest()
}

export function decodeQrToken(token: string): Buffer {
  if (!isValidQrToken(token)) {
    throw new Error('Invalid QR token shape')
  }

  const normalized = token.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(`${normalized}${padding}`, 'base64')
}

export function isValidQrToken(token: string): boolean {
  return BASE64URL_TOKEN_PATTERN.test(token)
}

export function buildVerifyUrl(appUrl: string, token: string): string {
  const base = appUrl.replace(/\/$/, '')
  return `${base}/verify#${QR_FRAGMENT_PREFIX}${token}`
}

export function extractTokenFromPayload(payload: string | null | undefined): string | null {
  if (!payload) {
    return null
  }

  const hashIndex = payload.indexOf('#')
  if (hashIndex === -1) {
    return null
  }

  const fragment = payload.slice(hashIndex + 1)
  if (!fragment.startsWith(QR_FRAGMENT_PREFIX)) {
    return null
  }

  const token = fragment.slice(QR_FRAGMENT_PREFIX.length)
  return isValidQrToken(token) ? token : null
}

export function rewriteQrPayloadHost(payload: string | null, appUrl: string): string | null {
  const token = extractTokenFromPayload(payload)
  if (!token) {
    return payload
  }

  return buildVerifyUrl(appUrl, token)
}

export function redactQrPayload(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.includes('#v1.') ? '[REDACTED_QR_PAYLOAD]' : value
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactQrPayload(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => {
        if (key === 'qr_payload' || key === 'qr_token' || key === 'token') {
          return [key, '[REDACTED_QR_PAYLOAD]']
        }

        return [key, redactQrPayload(nested)]
      }),
    )
  }

  return value
}
