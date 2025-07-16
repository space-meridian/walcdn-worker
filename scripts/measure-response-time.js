#!/usr/bin/env node
// CLI to fetch a blob from a random aggregator and from 0x.mainnet.walcdn.io, measuring TTFB and TTLB
import { getRandomAggregator } from '../retriever/lib/aggregators.js'
import { base64UrlToBigInt } from '../retriever/lib/base64.js'

function nowMs() {
  const [s, ns] = process.hrtime()
  return s * 1000 + ns / 1e6
}

function calculatePercentile(array, percentile) {
  // Validate inputs
  if (!Array.isArray(array) || array.length === 0) {
    throw new Error('Array must be non-empty')
  }

  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100')
  }

  // Sort the array in ascending order
  const sorted = [...array].sort((a, b) => a - b)

  // Handle edge cases
  if (percentile === 0) return sorted[0]
  if (percentile === 100) return sorted[sorted.length - 1]

  // Calculate the index using the "nearest rank" method
  const index = (percentile / 100) * (sorted.length - 1)

  // If index is a whole number, return that element
  if (Number.isInteger(index)) {
    return sorted[index]
  }

  // Otherwise, interpolate between the two nearest values
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
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
  const [, , blobId, iterations = '10'] = process.argv
  if (!blobId) {
    console.error('Usage: measure-response-time.js <blobId> [iterations]')
    process.exit(1)
  }

  const numIterations = parseInt(iterations, 10)
  if (isNaN(numIterations) || numIterations < 1) {
    console.error('Iterations must be a positive number')
    process.exit(1)
  }

  // 1. Measure retrievals from a random aggregator
  const seed = base64UrlToBigInt(blobId)
  const aggregator = getRandomAggregator(seed)
  const aggUrl = `${aggregator}/v1/blobs/${blobId}`
  await fetch(aggUrl) // Warm up the aggregator

  const aggregatorTtfbTimings = []
  const aggregatorTtlbTimings = []
  console.log(`\nFetching from random aggregator: ${aggUrl}`)
  try {
    for (let i = 0; i < numIterations; i++) {
      const { ttfb, ttlb } = await fetchWithTiming(aggUrl)

      aggregatorTtfbTimings.push(ttfb)
      aggregatorTtlbTimings.push(ttlb)

      process.stdout.write(`\rProgress: ${i + 1}/${numIterations}`)
    }
    console.log()
  } catch (e) {
    console.error('Aggregator fetch failed:', e)
  }

  const mainnetUrl = `https://3rkdb89wnwzj3f2i7hnvuyna5vn7glk9vf3igtht9x6ejmboly.walcdn.io/${blobId}`
  await fetch(mainnetUrl) // Warm up the WalCDN

  const walcdnTtfbTimings = []
  const walcdnTtlbTimings = []
  // 2. Measure retrievals from 0x.walcdn.io
  console.log(`\nFetching from WalCDN: ${mainnetUrl}`)
  try {
    for (let i = 0; i < numIterations; i++) {
      const { ttfb, ttlb } = await fetchWithTiming(mainnetUrl)

      walcdnTtfbTimings.push(ttfb)
      walcdnTtlbTimings.push(ttlb)

      process.stdout.write(`\rProgress: ${i + 1}/${numIterations}`)
    }
    console.log()
  } catch (e) {
    console.error('WalCDN cold fetch failed:', e)
  }

  console.log('\nAggregator timings:')
  console.log('\nTTFB percentiles:\n')
  console.log(
    `50th: ${calculatePercentile(aggregatorTtfbTimings, 50).toFixed(1)}ms`,
  )
  console.log(
    `90th: ${calculatePercentile(aggregatorTtfbTimings, 90).toFixed(1)}ms`,
  )
  console.log(
    `99th: ${calculatePercentile(aggregatorTtfbTimings, 99).toFixed(1)}ms\n`,
  )
  console.log('TTLB percentiles:\n')
  console.log(
    `50th: ${calculatePercentile(aggregatorTtlbTimings, 50).toFixed(1)}ms`,
  )
  console.log(
    `90th: ${calculatePercentile(aggregatorTtlbTimings, 90).toFixed(1)}ms`,
  )
  console.log(
    `99th: ${calculatePercentile(aggregatorTtlbTimings, 99).toFixed(1)}ms`,
  )

  console.log('\nWalCDN timings:')
  console.log('\nTTFB percentiles:\n')
  console.log(
    `50th: ${calculatePercentile(walcdnTtfbTimings, 50).toFixed(1)}ms`,
  )
  console.log(
    `90th: ${calculatePercentile(walcdnTtfbTimings, 90).toFixed(1)}ms`,
  )
  console.log(
    `99th: ${calculatePercentile(walcdnTtfbTimings, 99).toFixed(1)}ms\n`,
  )
  console.log('TTLB percentiles:\n')
  console.log(
    `50th: ${calculatePercentile(walcdnTtlbTimings, 50).toFixed(1)}ms`,
  )
  console.log(
    `90th: ${calculatePercentile(walcdnTtlbTimings, 90).toFixed(1)}ms`,
  )
  console.log(
    `99th: ${calculatePercentile(walcdnTtlbTimings, 99).toFixed(1)}ms`,
  )
}

main()
