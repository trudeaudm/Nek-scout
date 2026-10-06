'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Map,
  TextSearch,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const PropertyMap = dynamic(
  () => import('@/components/PropertyMap').then((mod) => mod.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-lg border border-[#d7e0d4] bg-[#f4f7f2] text-sm text-[#5c6b63]">
        Loading map...
      </div>
    ),
  }
)

interface PropertyCardProps {
  property: any
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(false)

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-[#e5f0e6] text-[#1f4a32]'
    if (score >= 60) return 'bg-[#e4eef0] text-[#1e4a52]'
    if (score >= 40) return 'bg-[#f4ecd8] text-[#6a5424]'
    return 'bg-[#eef1ee] text-[#4d5c55]'
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
    <Card className="border border-[#d7e0d4] bg-[#fbfcfa] shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="font-display text-3xl font-medium tracking-tight text-[#1c3330]">
              {property.town}, VT
            </CardTitle>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#3e5348]">
              <span className="font-medium text-[#2a5c63]">
                {property.acreage?.toFixed(1) || '?'} acres
              </span>
              <span className="text-[#b7c4bb]">/</span>
              <span>{property.county} County</span>
            </div>
            <p className="mt-1 text-sm text-[#5c6b63]">{property.address}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.16em] text-[#7a8a82] uppercase">Score</div>
            <div
              className={`mt-1 inline-flex min-w-14 items-center justify-center rounded-md px-3 py-2 font-display text-3xl ${getScoreBadgeColor(
                property.scores?.overallOpportunityScore || 0
              )}`}
            >
              {property.scores?.overallOpportunityScore || 0}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-lg bg-[#f4f7f2] p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <div className="text-[11px] tracking-wide text-[#7a8a82] uppercase">Tenure</div>
              <div className="mt-0.5 text-base text-[#1c3330]">
                {property.transfer?.ownershipYears
                  ? `${property.transfer.ownershipYears} years`
                  : 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-wide text-[#7a8a82] uppercase">Owner location</div>
              <div className="mt-0.5 text-base text-[#1c3330]">
                {property.owner?.mailingState || 'VT'}
                {property.owner?.outOfStateOwner && (
                  <span className="ml-2 text-sm text-[#8a5a24]">Out of state</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-wide text-[#7a8a82] uppercase">Owner type</div>
              <div className="mt-0.5 text-base text-[#1c3330]">
                {property.owner?.ownerType || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-[11px] tracking-wide text-[#7a8a82] uppercase">Best fit</div>
              <div className="mt-0.5 text-base text-[#1c3330]">
                {bestStrategy.name}
                <span className="ml-2 text-sm text-[#5c6b63]">{bestStrategy.score}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
            {property.acreage && property.acreage >= 10 && (
              <Badge className="border-[#c9dccb] bg-[#eef5ef] font-normal text-[#24543a]">
                Large acreage
              </Badge>
            )}
            {property.owner?.absenteeOwner && (
              <Badge className="border-[#ead7b8] bg-[#f8f1e4] font-normal text-[#6a5424]">
                Absentee owner
              </Badge>
            )}
            {property.transfer?.ownershipYears &&
              property.transfer.ownershipYears >= 20 && (
                <Badge className="border-[#d5ddd8] bg-[#f4f7f2] font-normal text-[#1c3330]">
                  Long tenure ({property.transfer.ownershipYears}+ years)
                </Badge>
              )}
            {property.owner?.ownerType === 'estate' && (
              <Badge className="border-[#e4d0c4] bg-[#f8f1ec] font-normal text-[#6b3d2e]">
                Estate
              </Badge>
            )}
            {property.owner?.ownerType === 'trust' && (
              <Badge className="border-[#c9d8dc] bg-[#eef4f5] font-normal text-[#1e4a52]">
                Trust
              </Badge>
            )}
        </div>

        {property.constraints && (property.constraints.currentUse || property.constraints.floodplain || 
          property.constraints.wetlands || property.constraints.conservedLand) && (
          <div className="border-t border-[#e4ebe3] pt-3">
            <div className="mb-2 flex items-center gap-2 text-xs text-[#8a5a24]">
              <AlertTriangle className="size-3.5" strokeWidth={1.75} />
              Due diligence
            </div>
            <div className="flex flex-wrap gap-2">
              {property.constraints.currentUse && (
                <Badge className="border-[#ead7b8] bg-[#f8f1e4] font-normal text-[#6a5424]">
                  Current use
                </Badge>
              )}
              {property.constraints.floodplain && (
                <Badge className="border-[#c9d8dc] bg-[#eef4f5] font-normal text-[#1e4a52]">
                  Floodplain
                </Badge>
              )}
              {property.constraints.wetlands && (
                <Badge className="border-[#c9dccb] bg-[#eef5ef] font-normal text-[#24543a]">
                  Wetlands
                </Badge>
              )}
              {property.constraints.conservedLand && (
                <Badge className="border-[#e4d0c4] bg-[#f8f1ec] font-normal text-[#6b3d2e]">
                  Conserved
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 border-t border-[#e4ebe3] pt-4">
          <Button
            variant={showMap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className={showMap ? "bg-[#1c3330] text-white hover:bg-[#2a4a42]" : "border-[#c9d5c8] text-[#1c3330]"}
          >
            <Map className="size-3.5" strokeWidth={1.75} />
            {showMap ? 'Hide map' : 'Map'}
          </Button>
          <Button
            variant={showDetails ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className={showDetails ? "flex-1 bg-[#1c3330] text-white hover:bg-[#2a4a42]" : "flex-1 border-[#c9d5c8] text-[#1c3330]"}
          >
            {showDetails ? (
              <ChevronDown className="size-3.5" strokeWidth={1.75} />
            ) : (
              <ChevronRight className="size-3.5" strokeWidth={1.75} />
            )}
            {showDetails ? 'Hide details' : 'Details'}
          </Button>
          {!explanation && !showDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExplanation}
              disabled={loadingExplanation}
              className="flex-1 border-[#c9d5c8] text-[#2a5c63]"
            >
              <TextSearch className="size-3.5" strokeWidth={1.75} />
              {loadingExplanation ? 'Loading' : 'Analysis'}
            </Button>
          )}
        </div>

        {(showMap || showDetails) && (
          <div className="pt-4 border-t">
            {property.latitude != null && property.longitude != null ? (
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                parcelId={property.parcelId}
                label={property.address || property.town}
              />
            ) : (
              <p className="text-sm text-slate-500">
                No map location is stored for this parcel.
              </p>
            )}
          </div>
        )}

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
                    <span className="font-display text-lg text-[#2a5c63]">
                      {property.scores?.saleLikelihoodScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Based on tenure, ownership type, and location signals</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Development Potential</span>
                    <span className="font-display text-lg text-[#3e6b54]">
                      {property.scores?.developmentScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Acreage, constraints, and subdivision possibilities</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Rental Potential</span>
                    <span className="font-display text-lg text-[#2a5c63]">
                      {property.scores?.rentalScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Property type, location, and income potential</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Flip Potential</span>
                    <span className="font-display text-lg text-[#6a5424]">
                      {property.scores?.flipScore || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Building condition, location, and value-add opportunity</p>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700">Legal Complexity</span>
                    <span className="font-display text-lg text-[#6b3d2e]">
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
                  className="w-full border-[#c9d5c8] text-[#2a5c63]"
                >
                  <TextSearch className="size-3.5" strokeWidth={1.75} />
                  {loadingExplanation ? 'Loading' : 'Write an analysis'}
                </Button>
              </div>
            )}
          </div>
        )}

        {explanation && (
          <div className="rounded-lg border border-[#e4ebe3] bg-[#f4f7f2] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-[#1c3330]">
              <TextSearch className="size-3.5" strokeWidth={1.75} />
              Analysis
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-line">
              {explanation}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
