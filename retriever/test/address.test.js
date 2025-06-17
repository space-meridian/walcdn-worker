import { describe, it, expect } from 'vitest'
// Assume you have a function isValidSuiAddress to test
import { isValidSuiAddress } from '../lib/address.js'

describe('isValidSuiAddress', () => {
  const cases = [
    {
      name: 'valid mixed-case address',
      input:
        '0xAaBbCcDdEeFf00112233445566778899AaBbCcDdEeFf00112233445566778899',
      expected: true,
    },
    {
      name: 'address with 0x prefix',
      input: '0x' + 'a'.repeat(64),
      expected: true,
    },
    {
      name: 'address without 0x prefix',
      input: 'a'.repeat(64),
      expected: false,
    },
    {
      name: 'address with less than 64 hex chars',
      input: '0x' + 'a'.repeat(63),
      expected: false,
    },
    {
      name: 'address with more than 64 hex chars',
      input: '0x' + 'a'.repeat(65),
      expected: false,
    },
    {
      name: 'address with invalid characters',
      input: '0x' + 'Z'.repeat(64),
      expected: false,
    },
    {
      name: 'empty string',
      input: '',
      expected: false,
    },
    {
      name: 'empty address',
      input: '0x',
      expected: false,
    },
    {
      // @ts-expect-error
      input: null,
      expected: false,
    },
    {
      name: 'undefined',
      // @ts-expect-error
      input: undefined,
      expected: false,
    },
  ]

  cases.forEach(({ name, input, expected }) => {
    it(`returns ${expected} for ${name}`, () => {
      expect(isValidSuiAddress(input)).toBe(expected)
    })
  })
})
