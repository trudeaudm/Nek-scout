import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateExplanation(property: any): string {
  const { owner, transfer, constraints, scores } = property
  
  const factors: string[] = []
  const risks: string[] = []
  const strategies: string[] = []

  if (transfer?.ownershipYears && transfer.ownershipYears >= 20) {
    factors.push(
      `long ownership tenure (approximately ${transfer.ownershipYears} years)`
    )
  }

  if (owner.outOfStateOwner) {
    factors.push(
      `out-of-state mailing address (${owner.mailingState || 'unknown state'})`
    )
  }

  if (owner.ownerType === 'estate') {
    factors.push('estate ownership')
  } else if (owner.ownerType === 'trust') {
    factors.push('trust ownership')
  }

  if (property.acreage && property.acreage >= 10) {
    factors.push(`substantial acreage (${property.acreage.toFixed(1)} acres)`)
  }

  if (constraints?.floodplain) {
    risks.push('floodplain designation - requires careful review')
  }

  if (constraints?.wetlands) {
    risks.push('wetlands present - may limit development')
  }

  if (constraints?.currentUse) {
    risks.push(
      'Current Use enrollment - review tax implications and withdrawal requirements'
    )
  }

  if (constraints?.conservedLand) {
    risks.push('conserved land - development restrictions apply')
  }

  if (!constraints?.floodplain && !constraints?.conservedLand) {
    risks.push('no obvious floodplain or conservation restrictions')
  }

  if (scores.developmentScore >= 70) {
    strategies.push('land development')
  }

  if (scores.rentalScore >= 70) {
    strategies.push('rental investment')
  }

  if (scores.flipScore >= 70) {
    strategies.push('value-add flip')
  }

  if (strategies.length === 0) {
    strategies.push('long-term hold')
  }

  let explanation = `This parcel ranks highly with an opportunity score of ${scores.overallOpportunityScore}/100. `

  if (factors.length > 0) {
    explanation += `It combines ${factors.join(', ')}, which are objective signals suggesting potential owner receptivity. `
  }

  if (strategies.length > 0) {
    explanation += `It may be suitable for ${strategies.join(' or ')} strategies. `
  }

  explanation += '\n\nDue diligence requirements: '
  
  const dueDiligence = [
    'local zoning review',
    'access and frontage verification',
    'wastewater feasibility',
    'title examination'
  ]

  if (constraints?.currentUse) {
    dueDiligence.push('Current Use penalty calculation')
  }

  explanation += dueDiligence.join(', ') + '.'

  if (risks.length > 0) {
    explanation += `\n\nNotable considerations: ${risks.join('; ')}.`
  }

  return explanation
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const property = await prisma.parcel.findUnique({
      where: { id },
      include: {
        owner: true,
        transfer: true,
        constraints: true,
        scores: true
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const explanation = generateExplanation(property)

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error('Explanation generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
