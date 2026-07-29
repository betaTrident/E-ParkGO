import { describe, expect, it } from 'vitest'

import { neutralizeCsvCell, serializeCsv } from '@/lib/security/csv'

describe('csv security', () => {
  it('neutralizes formula injection prefixes', () => {
    expect(neutralizeCsvCell('=1+1')).toBe("'=1+1")
    expect(neutralizeCsvCell('+1234')).toBe("'+1234")
    expect(neutralizeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)")
  })

  it('escapes commas and quotes', () => {
    expect(neutralizeCsvCell('hello, "world"')).toBe('"hello, ""world"""')
  })

  it('serializes rows with CRLF endings', () => {
    expect(serializeCsv([
      ['a', 'b'],
      ['=danger', 'ok'],
    ])).toBe("a,b\r\n'=danger,ok")
  })
})
