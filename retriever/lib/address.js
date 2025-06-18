/**
 * Validates that address matches ethereum 0x format. This function does not
 * validate address checksum.
 *
 * @param {string} address
 * @returns {boolean}
 */
export function isValidSuiAddress(address) {
  return /^0x[a-fA-F0-9]{64}$/.test(address)
}
