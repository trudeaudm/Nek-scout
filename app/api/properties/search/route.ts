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
  const sortBy = searchParams.get('sortBy') || 'overall'
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const where: any = {}

    if (county) {
      where.county = county
    }

    if (town) {
      where.town = { contains: town }
    }

    if (minAcres) {
      where.acreage = { gte: parseFloat(minAcres) }
    }

    // Build owner conditions
    const ownerConditions: any = {}
    if (outOfState === 'true') {
      ownerConditions.outOfStateOwner = true
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

    const [properties, total] = await Promise.all([
      prisma.parcel.findMany({
        where,
        include: {
          owner: true,
          transfer: true,
          constraints: true,
          scores: true
        },
        orderBy: {
          scores: {
            [sortField]: 'desc'
          }
        },
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
