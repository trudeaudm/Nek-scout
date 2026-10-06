'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PropertySearchProps {
  onSearch: (params: any) => void
}

export function PropertySearch({ onSearch }: PropertySearchProps) {
  const [filters, setFilters] = useState({
    county: '',
    town: '',
    minAcres: '',
    outOfState: '',
    ownershipYears: '',
    ownerType: '',
    minDevelopmentScore: '',
    minRentalScore: '',
    excludeFloodplain: '',
    excludeWetlands: '',
    includeCurrentUse: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '')
    )
    onSearch(cleanedFilters)
  }

  const handleReset = () => {
    setFilters({
      county: '',
      town: '',
      minAcres: '',
      outOfState: '',
      ownershipYears: '',
      ownerType: '',
      minDevelopmentScore: '',
      minRentalScore: '',
      excludeFloodplain: '',
      excludeWetlands: '',
      includeCurrentUse: ''
    })
    onSearch({})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">County</label>
            <Select
              value={filters.county || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, county: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All counties</SelectItem>
                <SelectItem value="Caledonia">Caledonia</SelectItem>
                <SelectItem value="Orleans">Orleans</SelectItem>
                <SelectItem value="Essex">Essex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Town</label>
            <Input
              type="text"
              placeholder="e.g., Lyndon"
              value={filters.town}
              onChange={(e) =>
                setFilters({ ...filters, town: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Acres
            </label>
            <Input
              type="number"
              placeholder="e.g., 10"
              value={filters.minAcres}
              onChange={(e) =>
                setFilters({ ...filters, minAcres: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Out-of-State Owner
            </label>
            <Select
              value={filters.outOfState || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, outOfState: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Ownership Tenure (years)
            </label>
            <Select
              value={filters.ownershipYears || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, ownershipYears: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="20">20+ years</SelectItem>
                <SelectItem value="30">30+ years</SelectItem>
                <SelectItem value="40">40+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Owner Type
            </label>
            <Select
              value={filters.ownerType || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, ownerType: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="trust">Trust</SelectItem>
                <SelectItem value="estate">Estate</SelectItem>
                <SelectItem value="LLC">LLC</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Min Development Score
            </label>
            <Input
              type="number"
              placeholder="e.g., 70"
              value={filters.minDevelopmentScore}
              onChange={(e) =>
                setFilters({ ...filters, minDevelopmentScore: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Min Rental Score
            </label>
            <Input
              type="number"
              placeholder="e.g., 70"
              value={filters.minRentalScore}
              onChange={(e) =>
                setFilters({ ...filters, minRentalScore: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Exclude Floodplain
            </label>
            <Select
              value={filters.excludeFloodplain || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, excludeFloodplain: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">No preference</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Exclude Wetlands
            </label>
            <Select
              value={filters.excludeWetlands || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, excludeWetlands: value === 'all' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">No preference</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
