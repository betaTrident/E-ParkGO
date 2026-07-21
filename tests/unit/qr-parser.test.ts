/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  parseQrFragment,
  QR_FRAGMENT_PREFIX,
  readFragmentFromWindow,
  removeFragmentFromHistory,
  stripFragmentFromUrl,
} from '@/lib/security/qr-parser'
import { generateQrToken } from '@/lib/security/qr-token'

describe('qr-parser', () => {
  it('parses a valid v1 fragment token', () => {
    const token = generateQrToken()
    const parsed = parseQrFragment(`${QR_FRAGMENT_PREFIX}${token}`)

    expect(parsed).toEqual({
      version: 'v1',
      token,
    })
  })

  it('rejects unknown fragment versions', () => {
    const token = generateQrToken()
    expect(parseQrFragment(`v2.${token}`)).toBeNull()
  })

  it('rejects malformed token lengths', () => {
    expect(parseQrFragment(`${QR_FRAGMENT_PREFIX}tooshort`)).toBeNull()
  })

  it('strips fragments from urls without leaking token path segments', () => {
    const token = generateQrToken()
    const url = `https://app.local/verify#${QR_FRAGMENT_PREFIX}${token}`

    expect(stripFragmentFromUrl(url)).toBe('https://app.local/verify')
  })

  it('returns null for empty fragments', () => {
    expect(parseQrFragment('')).toBeNull()
    expect(parseQrFragment('#')).toBeNull()
  })

  it('parses hash-prefixed fragments', () => {
    const token = generateQrToken()
    expect(parseQrFragment(`#${QR_FRAGMENT_PREFIX}${token}`)?.token).toBe(token)
  })

  it('strips urls that do not contain fragments', () => {
    expect(stripFragmentFromUrl('https://app.local/scanner')).toBe(
      'https://app.local/scanner',
    )
  })

  it('reads and removes browser fragments without retaining token history', () => {
    const token = generateQrToken()
    window.history.replaceState({}, '', `/verify#${QR_FRAGMENT_PREFIX}${token}`)
    const replaceSpy = vi.spyOn(window.history, 'replaceState')

    expect(readFragmentFromWindow()).toBe(`${QR_FRAGMENT_PREFIX}${token}`)
    removeFragmentFromHistory('/verify')
    expect(replaceSpy).toHaveBeenCalledWith(window.history.state, document.title, '/verify')
    replaceSpy.mockRestore()
  })
})

afterEach(() => {
  window.history.replaceState({}, '', '/')
})
