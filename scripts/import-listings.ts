import { PrismaClient } from '@prisma/client'
import { NEK_TOWNS } from './import-vcgi'

/**
 * Marks parcels that match a current public for-sale ad.
 * Listing sites often refuse unattended requests. When that happens this
 * leaves `listed` unset, so unchecked parcels are not treated as off-market.
 */

const prisma = new PrismaClient()

interface PublicListing {
  town: string
  address: string
  price?: number
  url?: string
}

function normalizeAddress(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function streetNumber(value: string): string | undefined {
  return normalizeAddress(value).match(/^(\d+)/)?.[1]
}

async function fetchTownListings(town: string): Promise<PublicListing[] | null> {
  const slug = `${town.replace(/\s+/g, '_')}_VT`
  const response = await fetch(
    `https://www.realtor.com/realestateandhomes-search/${slug}`,
    {
      headers: {
        Accept: 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(20000),
    }
  )

  if (response.status === 403 || response.status === 429 || response.status === 503) {
    console.log(`Listing source refused ${town} (${response.status}).`)
    return null
  }
  if (!response.ok) {
    console.log(`Listing source returned ${response.status} for ${town}.`)
    return null
  }

  const html = await response.text()
  const marker = html.indexOf('__NEXT_DATA__')
  if (marker === -1) {
    console.log(`Listing page for ${town} had no listing payload.`)
    return null
  }

  const start = html.indexOf('>', marker) + 1
  const end = html.indexOf('</script>', start)
  let payload: any
  try {
    payload = JSON.parse(html.slice(start, end))
  } catch {
    console.log(`Listing payload for ${town} could not be read.`)
    return []
  }

  const homes: any[] =
    payload?.props?.pageProps?.properties ||
    payload?.props?.pageProps?.searchResults?.home_search?.results ||
    []

  return homes
    .map((home) => {
      const location = home.location || home.address || {}
      const line = location.line || location.street || home.address_line || ''
      const city = location.city || home.city || town
      return {
        town: String(city),
        address: String(line),
        price: Number(home.list_price || home.price) || undefined,
        url: home.permalink
          ? `https://www.realtor.com/realestateandhomes-detail/${home.permalink}`
          : undefined,
      }
    })
    .filter((listing) => listing.address)
}

async function main() {
  const towns = Object.values(NEK_TOWNS).flat()
  const listings: PublicListing[] = []

  for (const town of towns) {
    const found = await fetchTownListings(town)
    if (found === null) {
      console.log('Stopping. Parcel listing flags were left unchanged.')
      return
    }
    listings.push(...found)
    console.log(`${town}: ${found.length} public listings`)
  }

  if (listings.length === 0) {
    console.log('No readable for-sale homes. Listing flags were left unchanged.')
    return
  }

  const parcels = await prisma.parcel.findMany({
    select: { id: true, town: true, address: true },
  })

  const byTown = new Map<string, typeof parcels>()
  for (const parcel of parcels) {
    const key = parcel.town.toLowerCase()
    const group = byTown.get(key) || []
    group.push(parcel)
    byTown.set(key, group)
  }

  const matched = new Map<string, PublicListing>()
  for (const listing of listings) {
    const candidates = byTown.get(listing.town.toLowerCase()) || []
    const number = streetNumber(listing.address)
    const street = normalizeAddress(listing.address)
    const hit = candidates.find((parcel) => {
      const parcelStreet = normalizeAddress(parcel.address)
      if (number && streetNumber(parcel.address) !== number) return false
      return parcelStreet.includes(street) || street.includes(parcelStreet)
    })
    if (hit) matched.set(hit.id, listing)
  }

  await prisma.$transaction(async (tx) => {
    await tx.parcel.updateMany({
      data: { listed: false, listingUrl: null, listingPrice: null },
    })
    for (const [id, listing] of matched) {
      await tx.parcel.update({
        where: { id },
        data: {
          listed: true,
          listingUrl: listing.url,
          listingPrice: listing.price,
        },
      })
    }
  })

  console.log(`Matched ${matched.size} parcels to a public listing.`)
}

main()
  .catch((error) => {
    console.error('Listing import failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
