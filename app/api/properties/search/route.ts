import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const county = searchParams.get('county')
  const town = searchParams.get('town')
  const minAcres = searchParams.get('minAcres')
  const outOfState = searchParams.get('outOfState')
  const ownershipYears = searchParams.get('ownershipYears')
  const ownerType = searchParams.get('ownerType')
  const minDevelopmentScore = searchParams.get('minDevelopmentScore')
  const minRentalScore = searchParams.get('minRentalScore')
  const excludeFloodplain = searchParams.get('excludeFloodplain')
  const excludeWetlands = searchParams.get('excludeWetlands')
  const includeCurrentUse = searchParams.get('includeCurrentUse')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const lifeEstate = searchParams.get('lifeEstate')
  const listed = searchParams.get('listed')
  const parcelIds = searchParams.get('parcelIds')
  const sortBy = searchParams.get('sortBy') || 'overall'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const where: any = {}

    if (county) {
      where.county = county
    }

    if (town) {
      where.town = { contains: town.trim(), mode: 'insensitive' }
    }

    if (minAcres) {
      where.acreage = { gte: parseFloat(minAcres) }
    }

    const price: { gte?: number; lte?: number } = {}
    if (minPrice) price.gte = parseFloat(minPrice)
    if (maxPrice) price.lte = parseFloat(maxPrice)
    if (price.gte != null || price.lte != null) {
      where.totalAssessedValue = price
    }

    if (lifeEstate === 'true' || lifeEstate === 'false') {
      where.lifeEstate = lifeEstate === 'true'
    }

    if (listed === 'true') where.listed = true
    if (listed === 'false') where.listed = false
    if (listed === 'unknown') where.listed = null

    if (parcelIds) {
      const ids = parcelIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 200)
      where.parcelId = { in: ids }
    }

    // Build owner conditions
    const ownerConditions: any = {}
    if (outOfState === 'true' || outOfState === 'false') {
      ownerConditions.outOfStateOwner = outOfState === 'true'
    }
    if (ownerType) {
      ownerConditions.ownerType = ownerType
    }
    if (Object.keys(ownerConditions).length > 0) {
      where.owner = ownerConditions
    }

    // Build transfer conditions
    if (ownershipYears) {
      where.transfer = {
        ownershipYears: { gte: parseInt(ownershipYears) }
      }
    }

    // Build scores conditions
    const scoresConditions: any = {}
    if (minDevelopmentScore) {
      scoresConditions.developmentScore = { gte: parseInt(minDevelopmentScore) }
    }
    if (minRentalScore) {
      scoresConditions.rentalScore = { gte: parseInt(minRentalScore) }
    }
    if (Object.keys(scoresConditions).length > 0) {
      where.scores = scoresConditions
    }

    // Build constraints conditions
    const constraintsConditions: any = {}
    if (excludeFloodplain === 'true') {
      constraintsConditions.floodplain = false
    }
    if (excludeWetlands === 'true') {
      constraintsConditions.wetlands = false
    }
    if (includeCurrentUse === 'false') {
      constraintsConditions.currentUse = false
    }
    if (includeCurrentUse === 'true') {
      constraintsConditions.currentUse = true
    }
    if (Object.keys(constraintsConditions).length > 0) {
      where.constraints = constraintsConditions
    }

    // Determine sort field based on sortBy parameter
    const getSortField = (sort: string) => {
      switch (sort) {
        case 'sale':
          return 'saleLikelihoodScore'
        case 'development':
          return 'developmentScore'
        case 'rental':
          return 'rentalScore'
        case 'flip':
          return 'flipScore'
        default:
          return 'overallOpportunityScore'
      }
    }

    const sortField = getSortField(sortBy)
    const orderBy =
      sortBy === 'price-asc'
        ? { totalAssessedValue: { sort: 'asc' as const, nulls: 'last' as const } }
        : sortBy === 'price-desc'
          ? { totalAssessedValue: { sort: 'desc' as const, nulls: 'last' as const } }
          : { scores: { [sortField]: 'desc' as const } }

    const [properties, total] = await Promise.all([
      prisma.parcel.findMany({
        where,
        include: {
          owner: true,
          transfer: true,
          constraints: true,
          scores: true
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.parcel.count({ where })
    ])

    return NextResponse.json({
      properties,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search properties' },
      { status: 500 }
    )
  }
}
