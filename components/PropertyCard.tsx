'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PropertyCardProps {
  property: any
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getBestStrategy = () => {
    const { scores } = property
    const strategies = [
      { name: 'Development', score: scores.developmentScore },
      { name: 'Rental', score: scores.rentalScore },
      { name: 'Flip', score: scores.flipScore }
    ]
    strategies.sort((a, b) => b.score - a.score)
    return strategies[0]
  }

  const fetchExplanation = async () => {
    setLoadingExplanation(true)
    try {
      const response = await fetch(`/api/properties/${property.id}/explain`)
      const data = await response.json()
      setExplanation(data.explanation)
    } catch (error) {
      console.error('Failed to fetch explanation:', error)
    } finally {
      setLoadingExplanation(false)
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)
  }

  const bestStrategy = getBestStrategy()

  return (
    <Card className="hover:shadow-xl transition-all hover:border-blue-200 border-2">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white pb-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
              {property.town}, VT
            </CardTitle>
            <div className="flex items-center gap-3 text-lg font-semibold text-slate-700">
              <span className="text-blue-600">{property.acreage?.toFixed(1) || '?'} acres</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{property.county} County</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">{property.address}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs font-semibold text-slate-500 mb-1">OPPORTUNITY SCORE</div>
            <Badge
              className={`text-3xl font-bold px-6 py-3 ${getScoreBadgeColor(
                property.scores?.overallOpportunityScore || 0
              )}`}
            >
              {property.scores?.overallOpportunityScore || 0}
            </Badge>
            <div className="text-xs text-slate-500 mt-1 text-center max-w-[120px]">
              Combined rating of sale likelihood & investment potential
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="mb-3">
            <div className="font-bold text-blue-900 text-sm uppercase tracking-wide">
              Why This Property May Be Available
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Public records showing factors that often indicate seller receptivity
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">OWNERSHIP TENURE</div>
              <div className="text-lg font-bold text-blue-900">
                {property.transfer?.ownershipYears
                  ? `${property.transfer.ownershipYears} years`
                  : 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">OWNER LOCATION</div>
              <div className="text-lg font-bold text-blue-900">
                {property.owner?.mailingState || 'VT'}
                {property.owner?.outOfStateOwner && (
                  <span className="ml-2 text-sm text-orange-600">• Out of State</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">OWNER TYPE</div>
              <div className="text-lg font-bold text-blue-900">
                {property.owner?.ownerType || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700 font-semibold mb-1">BEST STRATEGY</div>
              <div className="text-lg font-bold text-blue-900">
                {bestStrategy.name}
              </div>
              <div className="text-sm text-blue-700">
                Score: {bestStrategy.score}/100
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <div className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">
            Why This Property Ranks High
          </div>
          <div className="flex flex-wrap gap-2">
            {property.acreage && property.acreage >= 10 && (
              <Badge className="bg-green-100 text-green-800 border-green-300 font-semibold">
                ✓ Large Acreage
              </Badge>
            )}
            {property.owner?.absenteeOwner && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-semibold">
                ✓ Absentee Owner
              </Badge>
            )}
            {property.transfer?.ownershipYears &&
              property.transfer.ownershipYears >= 20 && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">
                  ✓ Long Tenure ({property.transfer.ownershipYears}+ years)
                </Badge>
              )}
            {property.owner?.ownerType === 'estate' && (
              <Badge className="bg-red-100 text-red-800 border-red-300 font-semibold">
                ✓ Estate Ownership
              </Badge>
            )}
            {property.owner?.ownerType === 'trust' && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold">
                ✓ Trust Ownership
              </Badge>
            )}
          </div>
        </div>

        {property.constraints && (property.constraints.currentUse || property.constraints.floodplain || 
          property.constraints.wetlands || property.constraints.conservedLand) && (
          <div className="pt-2 border-t border-slate-200">
            <div className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-wide">
              ⚠ Due Diligence Required
            </div>
            <div className="flex flex-wrap gap-2">
              {property.constraints.currentUse && (
                <Badge className="bg-yellow-100 text-yellow-900 border-yellow-300 font-medium">
                  Current Use Review
                </Badge>
              )}
              {property.constraints.floodplain && (
                <Badge className="bg-blue-100 text-blue-900 border-blue-300 font-medium">
                  Floodplain Zone
                </Badge>
              )}
              {property.constraints.wetlands && (
                <Badge className="bg-teal-100 text-teal-900 border-teal-300 font-medium">
                  Wetlands Present
                </Badge>
              )}
              {property.constraints.conservedLand && (
                <Badge className="bg-red-100 text-red-900 border-red-300 font-medium">
                  Conservation Restrictions
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button
            variant={showDetails ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 font-semibold"
          >
            {showDetails ? '▼ Hide Details' : '▶ Show Full Details'}
          </Button>
          {!explanation && !showDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExplanation}
              disabled={loadingExplanation}
              className="flex-1 font-semibold border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {loadingExplanation ? '⏳ Loading...' : '🤖 AI Analysis'}
            </Button>
          )}
        </div>

        {showDetails && (
          <div className="pt-4 border-t space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Land Value:</span>{' '}
                {formatCurrency(property.landValue)}
              </div>
              <div>
                <span className="font-medium">Building Value:</span>{' '}
                {formatCurrency(property.buildingValue)}
              </div>
              <div>
                <span className="font-medium">Total Assessed:</span>{' '}
                {formatCurrency(property.totalAssessedValue)}
              </div>
              <div>
                <span className="font-medium">Year Built:</span>{' '}
                {property.yearBuilt || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Property Class:</span>{' '}
                {property.propertyClass || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">County:</span> {property.county}
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="font-bold text-slate-800 mb-3">Detailed Scoring Breakdown</div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Sale Likelihood</span>
                    <span className="text-lg font-bold text-blue-600">
                      {property.scores?.saleLikelihoodScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Based on tenure, ownership type, and location signals</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Development Potential</span>
                    <span className="text-lg font-bold text-green-600">
                      {property.scores?.developmentScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Acreage, constraints, and subdivision possibilities</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Rental Potential</span>
                    <span className="text-lg font-bold text-purple-600">
                      {property.scores?.rentalScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Property type, location, and income potential</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Flip Potential</span>
                    <span className="text-lg font-bold text-orange-600">
                      {property.scores?.flipScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Building condition, location, and value-add opportunity</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Legal Complexity</span>
                    <span className="text-lg font-bold text-amber-600">
                      {property.scores?.legalComplexityScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Title, ownership structure, and regulatory considerations</p>
                </div>
              </div>
            </div>

            {!explanation && (
              <div className="pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchExplanation}
                  disabled={loadingExplanation}
                  className="w-full"
                >
                  {loadingExplanation ? 'Loading...' : 'Generate AI Explanation'}
                </Button>
              </div>
            )}
          </div>
        )}

        {explanation && (
          <div className="pt-4 border-t bg-slate-50 p-4 rounded-lg">
            <div className="font-medium text-sm mb-2">AI Analysis:</div>
            <div className="text-sm text-slate-700 whitespace-pre-line">
              {explanation}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
