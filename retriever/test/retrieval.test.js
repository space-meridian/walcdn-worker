import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retrieveFile } from '../lib/retrieval.js'

describe('retrieveFile', () => {
  const aggregatorUrl = 'https://example.com'
  const aggregatorUrl2 = 'https://example2.com'
  const rootCid = 'bafy123abc'
  const defaultCacheTtl = 86400
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'CF-Cache-Status': 'HIT' }),
    })
    global.fetch = fetchMock
  })

  it('constructs the correct URLs', async () => {
    await retrieveFile([aggregatorUrl], rootCid)
    expect(fetchMock).toHaveBeenCalledWith(
      `${aggregatorUrl}/v1/blobs/${rootCid}`,
      expect.any(Object),
    )
  })

  it('uses the default cacheTtl if not provided', async () => {
    await retrieveFile([aggregatorUrl], rootCid)
    const options = fetchMock.mock.calls[0][1]
    expect(options.cf.cacheTtlByStatus['200-299']).toBe(defaultCacheTtl)
  })

  it('uses the provided cacheTtl', async () => {
    await retrieveFile([aggregatorUrl], rootCid, 1234)
    const options = fetchMock.mock.calls[0][1]
    expect(options.cf.cacheTtlByStatus['200-299']).toBe(1234)
  })

  it('sets correct cacheTtlByStatus and cacheEverything', async () => {
    await retrieveFile([aggregatorUrl], rootCid, 555)
    const options = fetchMock.mock.calls[0][1]
    expect(options.cf).toEqual({
      cacheTtlByStatus: {
        '200-299': 555,
        404: 0,
        '500-599': 0,
      },
      cacheEverything: true,
    })
  })

  it('returns the fetch response and aggregatorUrl', async () => {
    const response = {
      ok: true,
      status: 200,
      headers: new Headers({ 'CF-Cache-Status': 'HIT' }),
    }
    fetchMock.mockResolvedValueOnce(response)
    const result = await retrieveFile([aggregatorUrl], rootCid)
    expect(result.response).toBe(response)
    expect(result.aggregatorUrl).toBe(aggregatorUrl)
  })

  it('returns the first successful response from multiple URLs', async () => {
    // Simulate second URL is slower but successful
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  headers: new Headers({ 'CF-Cache-Status': 'HIT' }),
                }),
              50,
            ),
          ),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'CF-Cache-Status': 'HIT' }),
        }),
      )
    const result = await retrieveFile([aggregatorUrl, aggregatorUrl2], rootCid)
    expect([aggregatorUrl, aggregatorUrl2]).toContain(result.aggregatorUrl)
    expect(result.response.ok).toBe(true)
  })

  it('throws if all fetches fail', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({}),
    })
    await expect(
      retrieveFile([aggregatorUrl, aggregatorUrl2], rootCid),
    ).rejects.toThrow('All promises were rejected')
  })
})
