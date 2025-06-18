import { describe, it, expect } from 'vitest'
import { parseRequest } from '../lib/request.js'

const DNS_ROOT = '.walcdn.io'
const TEST_WALLET = '3rkdb89wnx4000000000000000000000000000000000000000'
const TEST_BLOB_ID = 'lTg8X_Jf3zvWDAxutgcINWCoPBHo9fT6hXw3MoN'

describe('parseRequest', () => {
  it('should parse clientWalletAddress and blobId from a URL with both params', () => {
    const request = { url: `https://${TEST_WALLET}${DNS_ROOT}/${TEST_BLOB_ID}` }
    const result = parseRequest(request, { DNS_ROOT })
    expect(result).toEqual({
      clientBase36Address: TEST_WALLET,
      blobId: TEST_BLOB_ID,
    })
  })

  it('should parse clientWalletAddress and blobId from a URL with leading slash', () => {
    const request = {
      url: `https://${TEST_WALLET}${DNS_ROOT}//${TEST_BLOB_ID}`,
    }
    const result = parseRequest(request, { DNS_ROOT })
    expect(result).toEqual({
      clientBase36Address: TEST_WALLET,
      blobId: TEST_BLOB_ID,
    })
  })

  it('should return descriptive error for missing blobId', () => {
    const request = { url: `https://${TEST_WALLET}${DNS_ROOT}/` }
    const result = parseRequest(request, { DNS_ROOT })
    expect(result).toEqual({
      error: 'Missing required path element: `/{BlobID}`',
    })
  })

  it('should return undefined for both if no params in path', () => {
    const request = { url: 'https://walcdn.io' }
    const result = parseRequest(request, { DNS_ROOT })
    expect(result).toEqual({
      error: 'Invalid hostname: walcdn.io. It must end with .walcdn.io.',
    })
  })

  it('should ignore query parameters', () => {
    const request = {
      url: `https://${TEST_WALLET}${DNS_ROOT}/${TEST_BLOB_ID}?foo=bar`,
    }
    const result = parseRequest(request, { DNS_ROOT })
    expect(result).toEqual({
      clientBase36Address: TEST_WALLET,
      blobId: TEST_BLOB_ID,
    })
  })
})
