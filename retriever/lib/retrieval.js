/**
 * Retrieves the file under the blobID from the constructed URLs.
 *
 * @param {string[]} aggregatorUrls - List of base URLs to storage providers
 *   serving the blob.
 * @param {string} blobId - The ID of the blob to retrieve.
 * @param {number} [cacheTtl=86400] - Cache TTL in seconds (default: 86400).
 *   Default is `86400`
 * @returns {Promise<{
 *   response: Response
 *   cacheMiss: null | boolean
 *   aggregatorUrl: string
 * }>}
 *   - The response from the first successful fetch request, the cache miss and the
 *       content length.
 */
export async function retrieveFile(aggregatorUrls, blobId, cacheTtl = 86400) {
  const controllers = aggregatorUrls.map(() => new AbortController())

  const fetchPromises = aggregatorUrls.map((aggregatorUrl, i) =>
    fetch(`${aggregatorUrl}/v1/blobs/${blobId}`, {
      signal: controllers[i].signal,
      cf: {
        cacheTtlByStatus: { '200-299': cacheTtl, 404: 0, '500-599': 0 },
        cacheEverything: true,
      },
    }).then((response) => {
      if (!response.ok) throw new Error(`Failed: ${response.status}`)
      // Abort all other requests once we get a success
      controllers.forEach((c, idx) => idx !== i && c.abort())
      return { response, aggregatorUrl }
    }),
  )

  const { response, aggregatorUrl } = await Promise.any(fetchPromises)
  return {
    response,
    aggregatorUrl,
    cacheMiss: response.headers.get('CF-Cache-Status') !== 'HIT',
  }
}

/**
 * Measures the egress of a request by reading from a readable stream and return
 * the total number of bytes transferred.
 *
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader - The reader for the
 *   readable stream.
 * @returns {Promise<number>} - A promise that resolves to the total number of
 *   bytes transferred.
 */
export async function measureStreamedEgress(reader) {
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
  }
  return total
}
