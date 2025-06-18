/**
 * Parse params found in path of the request URL
 *
 * @param {Request} request
 * @param {object} options
 * @param {string} options.DNS_ROOT
 * @returns {{
 *   clientBase36Address?: string
 *   blobId?: string
 *   error?: string
 * }}
 */
export function parseRequest(request, { DNS_ROOT }) {
  const url = new URL(request.url)
  console.log({ msg: 'retrieval request', DNS_ROOT, url })

  if (!url.hostname.endsWith(DNS_ROOT)) {
    return {
      error: `Invalid hostname: ${url.hostname}. It must end with ${DNS_ROOT}.`,
    }
  }
  const clientBase36Address = url.hostname.slice(0, -DNS_ROOT.length)

  const [blobId] = url.pathname.split('/').filter(Boolean)
  if (!blobId) {
    return { error: 'Missing required path element: `/{BlobID}`' }
  }

  return { clientBase36Address, blobId }
}
