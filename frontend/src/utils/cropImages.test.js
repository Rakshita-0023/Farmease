import { describe, expect, it } from 'vitest'
import { getCropImage } from './cropImages'

describe('crop image mapping', () => {
  it('maps known commodity aliases to local assets', () => {
    expect(getCropImage('Wheat')).toBe('/wheat.jpeg')
    expect(getCropImage('arhar dal')).toBe('/Arhar_Dal.webp')
  })

  it('uses the local wheat asset for unknown or empty crop names', () => {
    expect(getCropImage('unlisted crop')).toBe('/wheat.jpeg')
    expect(getCropImage()).toBe('/wheat.jpeg')
  })
})
