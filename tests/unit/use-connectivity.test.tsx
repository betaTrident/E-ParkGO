import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useConnectivity } from '@/hooks/use-connectivity'

describe('useConnectivity', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('starts online before the first probe for stable SSR hydration', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    const { result } = renderHook(() => useConnectivity(1_000))

    expect(result.current.status).toBe('online')
  })

  it('marks the client online when the health probe succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    const { result } = renderHook(() => useConnectivity(1_000))

    await waitFor(() => {
      expect(result.current.status).toBe('online')
    })
  })

  it('marks the client offline when navigator reports offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })

    const { result } = renderHook(() => useConnectivity(1_000))

    await act(async () => {
      await result.current.probe()
    })

    expect(result.current.status).toBe('offline')
  })

  it('marks degraded responses when the health probe fails while online', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    const { result } = renderHook(() => useConnectivity(1_000))

    await act(async () => {
      await result.current.probe()
    })

    expect(result.current.status).toBe('degraded')
  })

  it('marks degraded when the health endpoint returns a non-success status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    const { result } = renderHook(() => useConnectivity(1_000))

    await act(async () => {
      await result.current.probe()
    })

    expect(result.current.status).toBe('degraded')
  })
})
