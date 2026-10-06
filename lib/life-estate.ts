const LIFE_ESTATE_NAME = /(?:^|\s)(?:LE|L\/E|LIFE ESTATE|LIFE EST)\.?$/i

/** Grand List owners in a life estate are usually suffixed LE. */
export function isLifeEstateName(name: string | null | undefined): boolean {
  if (!name) return false
  return LIFE_ESTATE_NAME.test(name.trim())
}

/**
 * Vermont Property Transfer Tax return line F2.
 * 02 is "Life Estate".
 */
export function interestIsLifeEstate(code: unknown, other: unknown): boolean {
  const normalized = String(code ?? '').trim()
  if (normalized === '02' || normalized === '2') return true
  return String(other ?? '').toLowerCase().includes('life estate')
}
