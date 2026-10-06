'use client'

import { useEffect, useState } from 'react'
import { PropertyCard } from '@/components/PropertyCard'
import { Button } from '@/components/ui/button'

interface PropertyListProps {
  searchParams: any
}

export function PropertyList({ searchParams }: PropertyListProps) {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchProperties()
  }, [searchParams])

  const fetchProperties = async (newOffset = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...searchParams,
        limit: limit.toString(),
        offset: newOffset.toString()
      })

      const response = await fetch(`/api/properties/search?${params}`)
      const data = await response.json()

      setProperties(data.properties)
      setTotal(data.total)
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
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg shadow-lg p-12 text-center border-2 border-slate-200">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">
          No Properties Found
        </h3>
        <p className="text-slate-600 text-lg mb-4">
          Try adjusting your search filters to see more results.
        </p>
        <p className="text-sm text-slate-500">
          Tip: Start with broader criteria like county or minimum acreage
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg shadow-md p-5 border-l-4 border-blue-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-900">
              {total} {total === 1 ? 'Property' : 'Properties'} Found
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Showing {offset + 1}-{Math.min(offset + limit, total)} • Sorted by Opportunity Score
            </p>
          </div>
          <div className="text-4xl">📊</div>
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
              className="px-8 py-6 font-bold text-base border-2"
            >
              ← Previous Page
            </Button>
          )}
          {offset + limit < total && (
            <Button 
              onClick={handleLoadMore}
              className="px-8 py-6 font-bold text-base bg-blue-600 hover:bg-blue-700"
            >
              Next Page →
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
