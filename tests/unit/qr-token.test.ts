import { describe, expect, it } from 'vitest'

import {
  buildVerifyUrl,
  decodeQrToken,
  extractTokenFromPayload,
  generateQrToken,
  hashQrToken,
  isValidQrToken,
  redactQrPayload,
  rewriteQrPayloadHost,
} from '@/lib/security/qr-token'

describe('qr token helpers', () => {
  it('generates 43-character base64url tokens', () => {
    const token = generateQrToken()
    expect(token).toHaveLength(43)
    expect(isValidQrToken(token)).toBe(true)
  })

  it('decodes generated tokens to 32 bytes', () => {
    const token = generateQrToken()
    expect(decodeQrToken(token)).toHaveLength(32)
  })

  it('extracts tokens from verify fragment payloads', () => {
    const token = generateQrToken()
    const payload = buildVerifyUrl('https://app.example.test', token)

    expect(extractTokenFromPayload(payload)).toBe(token)
  })

  it('rejects invalid token shapes', () => {
    expect(isValidQrToken('short')).toBe(false)
    expect(() => decodeQrToken('short')).toThrow('Invalid QR token shape')
  })

  it('hashes decoded qr tokens with sha-256', () => {
    const token = generateQrToken()
    expect(hashQrToken(token)).toHaveLength(32)
  })

  it('returns null for malformed verify payloads', () => {
    expect(extractTokenFromPayload(null)).toBeNull()
    expect(extractTokenFromPayload('https://app.example.test/verify')).toBeNull()
    expect(extractTokenFromPayload('https://app.example.test/verify#bad.token')).toBeNull()
  })

  it('returns the original payload when rewrite cannot extract a token', () => {
    expect(rewriteQrPayloadHost('not-a-payload', 'https://app.example.test')).toBe(
      'not-a-payload',
    )
  })

  it('rewrites qr payload hosts using the configured app url', () => {
    const token = generateQrToken()
    const rewritten = rewriteQrPayloadHost(
      `https://legacy.example.test/verify#v1.${token}`,
      'https://app.example.test',
    )

    expect(rewritten).toBe(buildVerifyUrl('https://app.example.test', token))
    expect(rewriteQrPayloadHost(null, 'https://app.example.test')).toBeNull()
  })

  it('redacts qr payload fields from nested objects', () => {
    const token = generateQrToken()
    const redacted = redactQrPayload({
      qr_payload: buildVerifyUrl('https://app.example.test', token),
      nested: { token },
    })

    expect(redacted).toEqual({
      qr_payload: '[REDACTED_QR_PAYLOAD]',
      nested: { token: '[REDACTED_QR_PAYLOAD]' },
    })
  })

  it('redacts arrays and primitive passthrough values', () => {
    expect(redactQrPayload('plain-text')).toBe('plain-text')
    expect(redactQrPayload(['https://app.example.test/verify#v1.abc'])).toEqual([
      '[REDACTED_QR_PAYLOAD]',
    ])
    expect(redactQrPayload(42)).toBe(42)
  })
})
