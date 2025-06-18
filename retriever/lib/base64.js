/**
 * @param {string} base64url
 * @returns {bigint}
 */
export function base64UrlToBigInt(base64url) {
  const hex = '0x' + Buffer.from(base64url, 'base64url').toString('hex')
  return BigInt(hex)
}
