'use client'

import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Hammer,
  Home,
  LandPlot,
  Search,
  Target,
  TrendingUp,
} from 'lucide-react'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PropertyListProps {
  searchParams: any
  mode?: 'search' | 'saved'
  savedIds?: string[]
}

export function PropertyList({
  searchParams,
  mode = 'search',
  savedIds = [],
}: PropertyListProps) {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [sortBy, setSortBy] = useState('overall')
  const limit = 20
  const savedKey = savedIds.join(',')

  useEffect(() => {
    if (mode === 'saved' && savedIds.length === 0) {
      setProperties([])
      setTotal(0)
      setOffset(0)
      setLoading(false)
      return
    }
    fetchProperties(0)
  }, [searchParams, sortBy, mode, savedKey])

  const fetchProperties = async (newOffset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(mode === 'saved' ? { parcelIds: savedIds.join(',') } : searchParams),
        limit: limit.toString(),
        offset: newOffset.toString(),
        sortBy: sortBy
      })

      const response = await fetch(`/api/properties/search?${params}`)
      const data = await response.json()

      setProperties(data.properties || [])
      setTotal(data.total || 0)
      setOffset(newOffset)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    fetchProperties(offset + limit)
  }

  const handlePrevious = () => {
    fetchProperties(Math.max(0, offset - limit))
  }

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Loading properties...</div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-xl border border-[#d7e0d4] bg-[#fbfcfa] px-8 py-14 text-center">
        <Search className="mx-auto size-6 text-[#3e6b54]" strokeWidth={1.5} />
        <h3 className="font-display mt-4 text-2xl text-[#1c3330]">
          {mode === 'saved' ? 'No saved properties' : 'No properties found'}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#5c6b63]">
          {mode === 'saved'
            ? 'Save a parcel from the browse list. The list stays in this browser.'
            : 'Widen the search. A county or a minimum acreage is usually enough to start.'}
        </p>
      </div>
    )
  }

  const getSortLabel = () => {
    const labels: { [key: string]: string } = {
      overall: 'Overall Opportunity',
      sale: 'Sale Likelihood',
      development: 'Development Potential',
      rental: 'Rental Potential',
      flip: 'Flip Potential',
      'price-asc': 'Appraisal, low to high',
      'price-desc': 'Appraisal, high to low',
    }
    return labels[sortBy] || 'Overall Opportunity'
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#d7e0d4] bg-[#fbfcfa] p-5">
        <div className="mb-4 flex items-center gap-3">
          <LandPlot className="size-5 text-[#3e6b54]" strokeWidth={1.5} />
          <div>
            <p className="font-display text-2xl text-[#1c3330]">
              {total.toLocaleString()} {total === 1 ? 'property' : 'properties'}
            </p>
            <p className="text-sm text-[#5c6b63]">
              Showing {offset + 1}–{Math.min(offset + limit, total)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-[#5c6b63] whitespace-nowrap">
            Sort
          </label>
          <Select value={sortBy} onValueChange={(value) => {
            setSortBy(value || 'overall')
            setOffset(0)
          }}>
            <SelectTrigger className="w-[240px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">
                <span className="inline-flex items-center gap-2">
                  <Target className="size-3.5" strokeWidth={1.75} />
                  Overall opportunity
                </span>
              </SelectItem>
              <SelectItem value="sale">
                <span className="inline-flex items-center gap-2">
                  <TrendingUp className="size-3.5" strokeWidth={1.75} />
                  Sale likelihood
                </span>
              </SelectItem>
              <SelectItem value="development">
                <span className="inline-flex items-center gap-2">
                  <LandPlot className="size-3.5" strokeWidth={1.75} />
                  Development potential
                </span>
              </SelectItem>
              <SelectItem value="rental">
                <span className="inline-flex items-center gap-2">
                  <Home className="size-3.5" strokeWidth={1.75} />
                  Rental potential
                </span>
              </SelectItem>
              <SelectItem value="flip">
                <span className="inline-flex items-center gap-2">
                  <Hammer className="size-3.5" strokeWidth={1.75} />
                  Flip potential
                </span>
              </SelectItem>
              <SelectItem value="price-asc">
                <span className="inline-flex items-center gap-2">
                  <CircleDollarSign className="size-3.5" strokeWidth={1.75} />
                  Appraisal, low to high
                </span>
              </SelectItem>
              <SelectItem value="price-desc">
                <span className="inline-flex items-center gap-2">
                  <CircleDollarSign className="size-3.5" strokeWidth={1.75} />
                  Appraisal, high to low
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {total > limit && (
        <div className="flex justify-center gap-4 mt-8">
          {offset > 0 && (
            <Button
              onClick={handlePrevious}
              variant="outline"
              className="h-10 border-[#c9d5c8] px-4 text-[#1c3330]"
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
              Previous
            </Button>
          )}
          {offset + limit < total && (
            <Button
              onClick={handleLoadMore}
              className="h-10 bg-[#1c3330] px-4 text-white hover:bg-[#2a4a42]"
            >
              Next
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
