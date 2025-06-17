/**
 * @param {string} base64url
 * @returns {bigint}
 */
export function base64UrlToBigInt(base64url) {
  // Convert Base64URL to standard Base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='

  // Decode to binary string
  const binaryStr = atob(base64)

  // Convert binary string to hex string
  const hex = Array.from(binaryStr)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')

  // Convert hex string to BigInt
  return BigInt('0x' + hex)
}
