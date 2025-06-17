import { isValidEthereumAddress } from '../lib/address.js'
import { getRandomAggregator as defaultGetAggregator } from '../lib/aggregators.js'
import { base64UrlToBigInt } from '../lib/blob.js'
import { parseRequest } from '../lib/request.js'
import {
  retrieveFile as defaultRetrieveFile,
  measureStreamedEgress,
} from '../lib/retrieval.js'
import { logRetrievalResult } from '../lib/store.js'

export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} ctx
   * @param {object} options
   * @param {typeof defaultGetAggregator} [options.getAggregator]
   * @param {typeof defaultRetrieveFile} [options.retrieveFile]
   * @returns
   */
  async fetch(
    request,
    env,
    ctx,
    {
      getAggregator = defaultGetAggregator,
      retrieveFile = defaultRetrieveFile,
    } = {},
  ) {
    const requestTimestamp = new Date().toISOString()
    const workerStartedAt = performance.now()
    const requestCountryCode = request.headers.get('CF-IPCountry')
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const {
      clientWalletAddress: clientAddress,
      blobId,
      error: parsingError,
    } = parseRequest(request, env)
    if (parsingError) {
      console.error(parsingError)
      return new Response(parsingError, { status: 400 })
    }

    if (!clientAddress || !blobId) {
      return new Response('Missing required fields', { status: 400 })
    }

    if (!isValidEthereumAddress(clientAddress)) {
      return new Response(
        `Invalid address: ${clientAddress}. Address must be a valid ethereum address.`,
        { status: 400 },
      )
    }

    // Timestamp to measure file retrieval performance (from cache and from SP)
    const fetchStartedAt = performance.now()
    const seed = base64UrlToBigInt(blobId)
    const aggregatorUrl = getAggregator(seed)
    const { response, cacheMiss } = await retrieveFile(
      aggregatorUrl,
      blobId,
      env.CACHE_TTL,
    )

    const retrievalResultEntry = {
      aggregatorUrl,
      clientAddress,
      cacheMiss,
      egressBytes: null, // Will be populated later
      responseStatus: response.status,
      timestamp: requestTimestamp,
      performanceStats: {
        fetchTtfb: null, // Will be populated later
        fetchTtlb: null, // Will be populated later
        workerTtfb: null, // Will be populated later
      },
      requestCountryCode,
    }

    if (!response.body) {
      // The upstream response does not have any readable body
      // There is no need to measure response body size, we can
      // return the original response object.
      const firstByteAt = performance.now()
      ctx.waitUntil(
        logRetrievalResult(env, {
          ...retrievalResultEntry,
          egressBytes: 0, // No body to measure
          performanceStats: {
            fetchTtfb: firstByteAt - fetchStartedAt,
            fetchTtlb: firstByteAt - fetchStartedAt,
            workerTtfb: firstByteAt - workerStartedAt,
          },
        }),
      )
      return response
    }

    // Stream and count bytes
    // We create two identical streams, one for the egress measurement and the other for returning the response as soon as possible
    const [returnedStream, egressMeasurementStream] = response.body.tee()
    const reader = egressMeasurementStream.getReader()
    const firstByteAt = performance.now()

    ctx.waitUntil(
      (async () => {
        const egressBytes = await measureStreamedEgress(reader)
        const lastByteFetchedAt = performance.now()

        await logRetrievalResult(env, {
          ...retrievalResultEntry,
          egressBytes,
          performanceStats: {
            fetchTtfb: firstByteAt - fetchStartedAt,
            fetchTtlb: lastByteFetchedAt - fetchStartedAt,
            workerTtfb: firstByteAt - workerStartedAt,
          },
        })
      })(),
    )

    // Return immediately, proxying the transformed response
    return new Response(returnedStream, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  },
}
