import { describe, expect, it } from 'vitest'

import { loginSchema } from '@/features/auth/schemas'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'staff@eparkgo.local',
      password: 'Staff123!@#',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'Staff123!@#',
    })

    expect(result.success).toBe(false)
  })

  it('rejects short passwords', () => {
    const result = loginSchema.safeParse({
      email: 'staff@eparkgo.local',
      password: 'short',
    })

    expect(result.success).toBe(false)
  })
})
