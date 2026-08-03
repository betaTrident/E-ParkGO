import { isValidQrToken } from '@/lib/security/qr-token'

export const QR_FRAGMENT_PREFIX = 'v1.'

const FRAGMENT_PATTERN = /^v1\.([A-Za-z0-9_-]{43})$/

export interface ParsedQrFragment {
  token: string
  version: 'v1'
}

export function parseQrFragment(fragment: string | null | undefined): ParsedQrFragment | null {
  if (!fragment) {
    return null
  }

  const trimmed = fragment.startsWith('#') ? fragment.slice(1) : fragment
  const match = FRAGMENT_PATTERN.exec(trimmed)

  if (!match?.[1] || !isValidQrToken(match[1])) {
    return null
  }

  return {
    version: 'v1',
    token: match[1],
  }
}

export function stripFragmentFromUrl(url: string): string {
  const hashIndex = url.indexOf('#')
  if (hashIndex === -1) {
    return url
  }

  return url.slice(0, hashIndex)
}

export function readFragmentFromWindow(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const fragment = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash

  return fragment || null
}

export function removeFragmentFromHistory(fallbackPath = '/verify'): void {
  if (typeof window === 'undefined') {
    return
  }

  const sanitizedPath = stripFragmentFromUrl(
    `${window.location.pathname}${window.location.search}`,
  )
  const target = sanitizedPath || fallbackPath
  window.history.replaceState(window.history.state, document.title, target)
}
