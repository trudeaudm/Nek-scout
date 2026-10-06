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
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No properties found
        </h3>
        <p className="text-slate-600">
          Try adjusting your search filters to see more results.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-sm text-slate-600">
          Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} properties
        </p>
      </div>

      <div className="space-y-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {total > limit && (
        <div className="flex justify-center gap-4">
          {offset > 0 && (
            <Button onClick={handlePrevious} variant="outline">
              Previous
            </Button>
          )}
          {offset + limit < total && (
            <Button onClick={handleLoadMore}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
