#!/usr/bin/env node
// CLI to fetch a blob from a random aggregator and from 0x.mainnet.walcdn.io, measuring TTFB and TTLB
import { getRandomAggregator } from '../retriever/lib/aggregators.js'
import { base64UrlToBigInt } from '../retriever/lib/base64.js'

function nowMs() {
  const [s, ns] = process.hrtime()
  return s * 1000 + ns / 1e6
}

async function fetchWithTiming(url) {
  const start = nowMs()
  const stats = {
    ttfb: null,
    ttlb: null,
    size: 0,
    status: null,
    headers: null,
  }

  const res = await fetch(url)
  stats.status = res.status
  stats.headers = res.headers
  const reader = res.body.getReader()
  let first = true
  while (true) {
    const t = await reader.read()
    if (first) {
      stats.ttfb = nowMs() - start
      first = false
    }
    if (t.done) break
    stats.size += t.value.length
  }
  stats.ttlb = nowMs() - start
  return stats
}

async function main() {
  const [, , blobId] = process.argv
  if (!blobId) {
    console.error('Usage: measure-response-time.js <blobId>')
    process.exit(1)
  }

  const seed = base64UrlToBigInt(blobId)
  const aggregator = getRandomAggregator(seed)
  const aggUrl = `${aggregator}/v1/blobs/${blobId}`
  console.log(`Fetching from random aggregator: ${aggUrl}`)
  try {
    const aggRes = await fetchWithTiming(aggUrl)
    console.log(
      `Aggregator: status=${aggRes.status}, TTFB=${aggRes.ttfb.toFixed(1)}ms, TTLB=${aggRes.ttlb.toFixed(1)}ms, size=${aggRes.size}`,
    )
  } catch (e) {
    console.error('Aggregator fetch failed:', e)
  }

  // 2. 0x.mainnet.walcdn.io (cold)
  const mainnetUrl = `https://3rkdb89wnwzj3f2i7hnvuyna5vn7glk9vf3igtht9x6ejmboly.walcdn.io/${blobId}`
  console.log(`Fetching from mainnet (cold): ${mainnetUrl}`)
  try {
    const cold = await fetchWithTiming(mainnetUrl)
    console.log(
      `Mainnet (cold): status=${cold.status}, TTFB=${cold.ttfb.toFixed(1)}ms, TTLB=${cold.ttlb.toFixed(1)}ms, size=${cold.size}`,
    )
  } catch (e) {
    console.error('Mainnet cold fetch failed:', e)
  }

  // 3. 0x.mainnet.walcdn.io (cache)
  console.log(`Fetching from mainnet (cache): ${mainnetUrl}`)
  try {
    const cached = await fetchWithTiming(mainnetUrl)
    console.log(
      `Mainnet (cache): status=${cached.status}, TTFB=${cached.ttfb.toFixed(1)}ms, TTLB=${cached.ttlb.toFixed(1)}ms, size=${cached.size}`,
    )
  } catch (e) {
    console.error('Mainnet cache fetch failed:', e)
  }
}

main()
