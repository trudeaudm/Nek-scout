import { Parcel, Owner, Transfer, Constraints } from '@prisma/client'

type ParcelWithRelations = Parcel & {
  owner: Owner
  transfer: Transfer | null
  constraints: Constraints | null
}

export function calculateSaleLikelihoodScore(
  parcel: ParcelWithRelations
): number {
  let score = 0
  const { owner, transfer } = parcel

  if (transfer?.ownershipYears) {
    if (transfer.ownershipYears > 40) {
      score += 35
    } else if (transfer.ownershipYears > 30) {
      score += 25
    } else if (transfer.ownershipYears > 20) {
      score += 15
    }
  }

  if (owner.mailingState && owner.mailingState !== 'VT') {
    score += 25

    const warmStateBonus = ['FL', 'AZ', 'NC', 'SC']
    if (warmStateBonus.includes(owner.mailingState)) {
      score += 5
    }
  }

  if (owner.ownerType === 'trust') {
    score += 10
  } else if (owner.ownerType === 'estate') {
    score += 30
  } else if (owner.ownerType === 'LLC' || owner.ownerType === 'corporation') {
    score += 5
  }

  return Math.min(score, 100)
}

export function calculateFlipScore(parcel: ParcelWithRelations): number {
  let score = 0

  if (!parcel.buildingValue || !parcel.landValue) return 0

  const buildingToLandRatio = parcel.buildingValue / parcel.landValue
  if (buildingToLandRatio < 1) {
    score += 30
  } else if (buildingToLandRatio < 2) {
    score += 20
  }

  if (parcel.yearBuilt && parcel.yearBuilt < 1980) {
    score += 20
  } else if (parcel.yearBuilt && parcel.yearBuilt < 2000) {
    score += 10
  }

  const strongMarkets = [
    'St. Johnsbury',
    'Lyndon',
    'Newport',
    'Derby',
    'Burke'
  ]
  if (strongMarkets.some(market => 
    parcel.town.toLowerCase().includes(market.toLowerCase())
  )) {
    score += 30
  }

  if (
    parcel.totalAssessedValue &&
    parcel.totalAssessedValue < 200000
  ) {
    score += 20
  }

  return Math.min(score, 100)
}

export function calculateRentalScore(parcel: ParcelWithRelations): number {
  let score = 0

  const rentalClasses = ['2 unit', '3 unit', '4 unit', 'multi-family']
  if (
    parcel.propertyClass &&
    rentalClasses.some(cls => 
      parcel.propertyClass?.toLowerCase().includes(cls)
    )
  ) {
    score += 40
  }

  const jobCenters = [
    'St. Johnsbury',
    'Newport',
    'Lyndon',
    'Derby',
    'Burke',
    'Hardwick'
  ]
  if (jobCenters.some(center => 
    parcel.town.toLowerCase().includes(center.toLowerCase())
  )) {
    score += 30
  }

  if (
    parcel.totalAssessedValue &&
    parcel.totalAssessedValue < 250000
  ) {
    score += 20
  }

  if (parcel.propertyClass?.toLowerCase().includes('residential')) {
    score += 10
  }

  return Math.min(score, 100)
}

export function calculateDevelopmentScore(
  parcel: ParcelWithRelations
): number {
  let score = 0
  const { constraints } = parcel

  if (parcel.acreage && parcel.acreage >= 10) {
    score += 30
    if (parcel.acreage >= 20) {
      score += 10
    }
    if (parcel.acreage >= 40) {
      score += 10
    }
  } else {
    return 0
  }

  if (constraints) {
    if (constraints.wetlands) {
      score -= 15
    }
    if (constraints.floodplain) {
      score -= 20
    }
    if (constraints.conservedLand) {
      return 0
    }
    if (constraints.steepSlope) {
      score -= 10
    }
  }

  const developmentTowns = [
    'St. Johnsbury',
    'Lyndon',
    'Newport',
    'Derby',
    'Burke',
    'Hardwick',
    'Barton'
  ]
  if (developmentTowns.some(town => 
    parcel.town.toLowerCase().includes(town.toLowerCase())
  )) {
    score += 30
  }

  return Math.max(0, Math.min(score, 100))
}

export function calculateLegalComplexityScore(
  parcel: ParcelWithRelations
): number {
  let score = 0

  if (parcel.owner.ownerType === 'estate') {
    score += 30
  } else if (parcel.owner.ownerType === 'trust') {
    score += 20
  } else if (parcel.owner.ownerType === 'corporation') {
    score += 15
  } else if (parcel.owner.ownerType === 'LLC') {
    score += 10
  }

  if (parcel.constraints?.currentUse) {
    score += 20
  }

  if (parcel.constraints?.conservedLand) {
    score += 40
  }

  return Math.min(score, 100)
}

export function calculateOverallOpportunityScore(
  saleLikelihood: number,
  investmentPotential: number,
  strategyFit: number,
  legalComplexity: number
): number {
  const weighted =
    saleLikelihood * 0.4 +
    investmentPotential * 0.3 +
    strategyFit * 0.2 -
    legalComplexity * 0.1

  return Math.round(Math.max(0, Math.min(weighted, 100)))
}

export function calculateAllScores(parcel: ParcelWithRelations) {
  const saleLikelihoodScore = calculateSaleLikelihoodScore(parcel)
  const flipScore = calculateFlipScore(parcel)
  const rentalScore = calculateRentalScore(parcel)
  const developmentScore = calculateDevelopmentScore(parcel)
  const legalComplexityScore = calculateLegalComplexityScore(parcel)

  const investmentPotential = Math.max(flipScore, rentalScore, developmentScore)
  const strategyFit = Math.max(flipScore, rentalScore, developmentScore)

  const overallOpportunityScore = calculateOverallOpportunityScore(
    saleLikelihoodScore,
    investmentPotential,
    strategyFit,
    legalComplexityScore
  )

  return {
    saleLikelihoodScore,
    flipScore,
    rentalScore,
    developmentScore,
    legalComplexityScore,
    overallOpportunityScore
  }
}
