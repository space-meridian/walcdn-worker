import basex from '../vendor/base-x.js'

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
const base36 = basex(ALPHABET, 'base36')

/**
 * @param {string} base36String
 * @returns {string}
 */
export const base36ToHex = (base36String) => {
  if (typeof base36String !== 'string') {
    throw new TypeError('Input must be a string')
  }

  const bytes = base36.decode(base36String)
  return (
    '0x' +
    Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  )
}
