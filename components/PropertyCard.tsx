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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">
              {property.town}, VT — {property.acreage?.toFixed(1) || '?'} acres
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">{property.address}</p>
          </div>
          <Badge
            className={`text-lg font-bold ${getScoreBadgeColor(
              property.scores?.overallOpportunityScore || 0
            )}`}
          >
            {property.scores?.overallOpportunityScore || 0}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Owner Mailing State:</span>{' '}
            {property.owner?.mailingState || 'VT'}
          </div>
          <div>
            <span className="font-medium">Ownership Tenure:</span>{' '}
            {property.transfer?.ownershipYears
              ? `~${property.transfer.ownershipYears} years`
              : 'Unknown'}
          </div>
          <div>
            <span className="font-medium">Owner Type:</span>{' '}
            {property.owner?.ownerType || 'Unknown'}
          </div>
          <div>
            <span className="font-medium">Best Strategy:</span>{' '}
            {bestStrategy.name} ({bestStrategy.score}/100)
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-sm font-medium mb-2">Key Factors:</div>
          <div className="flex flex-wrap gap-2">
            {property.acreage && property.acreage >= 10 && (
              <Badge variant="outline">Large acreage</Badge>
            )}
            {property.owner?.absenteeOwner && (
              <Badge variant="outline">Absentee ownership</Badge>
            )}
            {property.transfer?.ownershipYears &&
              property.transfer.ownershipYears >= 20 && (
                <Badge variant="outline">Long tenure</Badge>
              )}
            {property.owner?.ownerType === 'estate' && (
              <Badge variant="outline">Estate</Badge>
            )}
            {property.owner?.ownerType === 'trust' && (
              <Badge variant="outline">Trust</Badge>
            )}
          </div>
        </div>

        {property.constraints && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium mb-2">Considerations:</div>
            <div className="flex flex-wrap gap-2">
              {property.constraints.currentUse && (
                <Badge variant="outline" className="bg-yellow-50">
                  Current Use review needed
                </Badge>
              )}
              {property.constraints.floodplain && (
                <Badge variant="outline" className="bg-blue-50">
                  Floodplain
                </Badge>
              )}
              {property.constraints.wetlands && (
                <Badge variant="outline" className="bg-green-50">
                  Wetlands
                </Badge>
              )}
              {property.constraints.conservedLand && (
                <Badge variant="outline" className="bg-red-50">
                  Conserved land
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          {!explanation && !showDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExplanation}
              disabled={loadingExplanation}
            >
              {loadingExplanation ? 'Loading...' : 'AI Explanation'}
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
              <div className="font-medium mb-2">Investment Scores:</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sale Likelihood:</span>
                  <span className="font-medium">
                    {property.scores?.saleLikelihoodScore || 0}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Development Potential:</span>
                  <span className="font-medium">
                    {property.scores?.developmentScore || 0}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rental Potential:</span>
                  <span className="font-medium">
                    {property.scores?.rentalScore || 0}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Flip Potential:</span>
                  <span className="font-medium">
                    {property.scores?.flipScore || 0}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Legal Complexity:</span>
                  <span className="font-medium">
                    {property.scores?.legalComplexityScore || 0}/100
                  </span>
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
