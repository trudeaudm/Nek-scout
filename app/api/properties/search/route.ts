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
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const where: any = {}

    if (county) {
      where.county = county
    }

    if (town) {
      where.town = { contains: town, mode: 'insensitive' }
    }

    if (minAcres) {
      where.acreage = { gte: parseFloat(minAcres) }
    }

    if (outOfState === 'true') {
      where.owner = {
        outOfStateOwner: true
      }
    }

    if (ownershipYears) {
      where.transfer = {
        ownershipYears: { gte: parseInt(ownershipYears) }
      }
    }

    if (ownerType) {
      where.owner = {
        ...where.owner,
        ownerType: ownerType
      }
    }

    if (minDevelopmentScore) {
      where.scores = {
        developmentScore: { gte: parseInt(minDevelopmentScore) }
      }
    }

    if (minRentalScore) {
      where.scores = {
        ...where.scores,
        rentalScore: { gte: parseInt(minRentalScore) }
      }
    }

    if (excludeFloodplain === 'true') {
      where.constraints = {
        ...where.constraints,
        floodplain: false
      }
    }

    if (excludeWetlands === 'true') {
      where.constraints = {
        ...where.constraints,
        wetlands: false
      }
    }

    if (includeCurrentUse === 'false') {
      where.constraints = {
        ...where.constraints,
        currentUse: false
      }
    }

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
            overallOpportunityScore: 'desc'
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
