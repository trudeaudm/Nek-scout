import { PrismaClient } from '@prisma/client'
import { NEK_TOWNS } from './import-vcgi'

/**
 * Marks parcels that match a current Realtor.com for-sale ad.
 * A failed lookup leaves existing flags alone.
 */

const GRAPHQL_URL = 'https://www.realtor.com/frontdoor/graphql'
const SEARCH_QUERY = `
  query ConsumerSearchQuery($query: HomeSearchCriteria!, $limit: Int, $offset: Int) {
    home_search(query: $query, limit: $limit, offset: $offset) {
      total
      results {
        list_price
        permalink
        location {
          address {
            line
            city
            coordinate { lat lon }
          }
        }
      }
    }
  }
`

const STREET_SUFFIXES = new Set([
  'RD', 'ROAD', 'DR', 'DRIVE', 'LN', 'LANE', 'ST', 'STREET', 'AVE', 'AVENUE',
  'HWY', 'HIGHWAY', 'RTE', 'ROUTE', 'CIR', 'CIRCLE', 'CT', 'COURT', 'PL',
  'PLACE', 'TER', 'TERRACE', 'PKWY', 'WAY', 'BLVD', 'BOULEVARD', 'TRL',
  'TRAIL', 'EXT', 'EXTENSION',
])

const prisma = new PrismaClient()

export interface PublicListing {
  town: string
  searchTown: string
  address: string
  price?: number
  url?: string
  latitude?: number
  longitude?: number
}

export interface ParcelPoint {
  id: string
  town: string
  address: string
  latitude?: number | null
  longitude?: number | null
  acreage?: number | null
}

function townKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/^st /, 'saint ')
    .trim()
}

function townsCompatible(parcelTown: string, listing: PublicListing): boolean {
  const parcel = townKey(parcelTown)
  const city = townKey(listing.town)
  const searched = townKey(listing.searchTown)
  if (parcel === city || parcel === searched) return true
  if (
    (parcel === 'saint johnsbury' || parcel === 'st johnsbury') &&
    (city === 'saint johnsbury' || city === 'st johnsbury' || searched === 'saint johnsbury')
  ) {
    return true
  }
  if (
    city === 'newport' &&
    (parcel === 'newport city' || parcel === 'newport town') &&
    parcel === searched
  ) {
    return true
  }
  return false
}

function normalizeAddress(value: string): string {
  return value
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function streetNumber(value: string): string | undefined {
  return normalizeAddress(value).match(/^(\d+)/)?.[1]
}

function streetTokens(value: string): string[] {
  const number = streetNumber(value)
  return normalizeAddress(value)
    .split(' ')
    .filter((token) => token && token !== number && !STREET_SUFFIXES.has(token) && token !== 'LOT' && token !== 'UNIT' && token !== 'AND')
}

function addressesMatch(parcelAddress: string, listingAddress: string): boolean {
  const parcelNumber = streetNumber(parcelAddress)
  const listingNumber = streetNumber(listingAddress)
  if (!parcelNumber || !listingNumber || parcelNumber !== listingNumber) return false
  const parcelTokens = streetTokens(parcelAddress)
  const listingTokens = streetTokens(listingAddress)
  if (parcelTokens.length === 0 || listingTokens.length === 0) return false
  const shorter = parcelTokens.length <= listingTokens.length ? parcelTokens : listingTokens
  const longer = new Set(parcelTokens.length <= listingTokens.length ? listingTokens : parcelTokens)
  return shorter.every((token) => longer.has(token))
}

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(a))
}

function matchRadius(acreage?: number | null): number {
  if (!acreage || acreage < 10) return 200
  if (acreage < 40) return 450
  if (acreage < 100) return 800
  return 1200
}

export function matchListings(
  listings: PublicListing[],
  parcels: ParcelPoint[]
): Map<string, PublicListing> {
  const matched = new Map<string, PublicListing>()
  const claimed = new Set<string>()

  for (const listing of listings) {
    let chosen: ParcelPoint | undefined

    if (listing.latitude != null && listing.longitude != null) {
      const nearby = parcels
        .filter(
          (parcel) =>
            parcel.latitude != null &&
            parcel.longitude != null &&
            !claimed.has(parcel.id)
        )
        .map((parcel) => ({
          parcel,
          meters: distanceMeters(
            listing.latitude as number,
            listing.longitude as number,
            parcel.latitude as number,
            parcel.longitude as number
          ),
        }))
        .filter((item) => item.meters <= matchRadius(item.parcel.acreage))
        .sort((a, b) => a.meters - b.meters)

      const numbered = nearby.find((item) =>
        addressesMatch(item.parcel.address, listing.address)
      )
      if (numbered) {
        chosen = numbered.parcel
      } else if (
        nearby.length === 1 ||
        (nearby.length > 1 && nearby[0].meters * 2 < nearby[1].meters)
      ) {
        chosen = nearby[0].parcel
      }
    }

    if (!chosen) {
      const byAddress = parcels.filter(
        (parcel) =>
          !claimed.has(parcel.id) &&
          townsCompatible(parcel.town, listing) &&
          addressesMatch(parcel.address, listing.address)
      )
      if (byAddress.length === 1) chosen = byAddress[0]
    }

    if (chosen) {
      claimed.add(chosen.id)
      matched.set(chosen.id, listing)
    }
  }

  return matched
}

function searchPhrases(town: string): string[] {
  const phrases = [`${town}, VT`]
  if (town === 'Saint Johnsbury') phrases.push('St. Johnsbury, VT')
  if (town === 'Brighton') phrases.push('Island Pond, VT')
  return phrases
}

async function fetchLocation(location: string): Promise<PublicListing[] | null> {
  const searchTown = location.replace(/, VT$/i, '')
  const listings: PublicListing[] = []
  let offset = 0
  let total = Number.POSITIVE_INFINITY

  while (offset < total && offset < 1000) {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'rdc-client-name': 'RDC_WEB',
        'rdc-client-version': '1.0.0',
        Origin: 'https://www.realtor.com',
        Referer: 'https://www.realtor.com/',
      },
      body: JSON.stringify({
        operationName: 'ConsumerSearchQuery',
        variables: {
          query: {
            status: ['for_sale'],
            search_location: { location },
          },
          limit: 200,
          offset,
        },
        query: SEARCH_QUERY,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.log(`Listing source returned ${response.status} for ${location}.`)
      return null
    }

    const json = await response.json()
    const page = json?.data?.home_search
    if (!page) {
      console.log(`Listing source had no results for ${location}.`)
      return null
    }

    total = Number(page.total) || 0
    const rows = page.results || []
    for (const row of rows) {
      const address = row?.location?.address
      if (!address?.line) continue
      listings.push({
        town: String(address.city || searchTown),
        searchTown,
        address: String(address.line),
        price: Number(row.list_price) || undefined,
        url: row.permalink
          ? `https://www.realtor.com/realestateandhomes-detail/${row.permalink}`
          : undefined,
        latitude: address.coordinate?.lat,
        longitude: address.coordinate?.lon,
      })
    }

    if (rows.length === 0) break
    offset += rows.length
  }

  return listings
}

async function fetchAllListings(): Promise<PublicListing[] | null> {
  const seen = new Set<string>()
  const listings: PublicListing[] = []

  for (const town of Object.values(NEK_TOWNS).flat()) {
    for (const phrase of searchPhrases(town)) {
      const found = await fetchLocation(phrase)
      if (found === null) return null
      let added = 0
      for (const listing of found) {
        const key = listing.url || `${listing.address}|${listing.latitude}|${listing.longitude}`
        if (seen.has(key)) continue
        seen.add(key)
        listings.push(listing)
        added++
      }
      console.log(`${phrase}: ${found.length} ads, ${added} new`)
    }
  }

  return listings
}

async function main() {
  const listings = await fetchAllListings()
  if (listings === null) {
    console.log('Stopping. Parcel listing flags were left unchanged.')
    return
  }
  if (listings.length === 0) {
    console.log('No for-sale ads were returned. Listing flags were left unchanged.')
    return
  }

  const parcels = await prisma.parcel.findMany({
    select: {
      id: true,
      town: true,
      address: true,
      latitude: true,
      longitude: true,
      acreage: true,
    },
  })
  const matched = matchListings(listings, parcels)
  console.log(`Matching ${matched.size} of ${listings.length} ads to ${parcels.length} parcels.`)

  await prisma.$transaction(
    async (tx) => {
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
    },
    { timeout: 180000 }
  )

  console.log(`Marked ${matched.size} parcels as listed.`)
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Listing import failed:', error)
      process.exitCode = 1
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
