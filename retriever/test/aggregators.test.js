import { describe, it, expect, vi } from 'vitest'
import { AGGREGATORS, getRandomAggregator } from '../lib/aggregators.js'

describe('getRandomAggregator', () => {
  it('returns a deterministic aggregator when seed is provided', () => {
    const seed = 5n
    const idx = Number(seed % BigInt(AGGREGATORS.length))
    expect(getRandomAggregator(seed)).toBe(AGGREGATORS[idx])
  })

  it('returns the first aggregator when seed is 0', () => {
    expect(getRandomAggregator(0n)).toBe(AGGREGATORS[0])
  })

  it('returns the last aggregator when seed is AGGREGATORS.length - 1', () => {
    const seed = BigInt(AGGREGATORS.length - 1)
    expect(getRandomAggregator(seed)).toBe(AGGREGATORS[AGGREGATORS.length - 1])
  })

  it('wraps around if seed >= AGGREGATORS.length', () => {
    const seed = BigInt(AGGREGATORS.length + 2)
    const idx = Number(seed % BigInt(AGGREGATORS.length))
    expect(getRandomAggregator(seed)).toBe(AGGREGATORS[idx])
  })

  it('returns a random aggregator when seed is not provided', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const expectedIdx = Math.floor(0.5 * AGGREGATORS.length)
    expect(getRandomAggregator()).toBe(AGGREGATORS[expectedIdx])
    Math.random.mockRestore()
  })

  it('returns different aggregators for different seeds', () => {
    const agg1 = getRandomAggregator(1n)
    const agg2 = getRandomAggregator(2n)
    expect(agg1).not.toBe(agg2)
  })
})
