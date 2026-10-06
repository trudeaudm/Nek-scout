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
    <Card className="shadow-lg border-2 border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b-2 border-slate-200">
        <CardTitle className="text-xl font-bold text-slate-900">
          🔍 Search Filters
        </CardTitle>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Use these filters to find properties that match your investment criteria. 
          All filters are optional - start broad and refine as needed.
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Location</label>
            <p className="text-xs text-slate-500 mb-2">Choose a county in the Northeast Kingdom</p>
            <Select
              value={filters.county || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, county: value === 'all' ? '' : (value || '') })
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
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              Out-of-State Owner
            </label>
            <p className="text-xs text-slate-500 mb-2">Owners with mailing addresses outside Vermont</p>
            <Select
              value={filters.outOfState || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, outOfState: value === 'all' ? '' : (value || '') })
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
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              Ownership Tenure
            </label>
            <p className="text-xs text-slate-500 mb-2">How long the current owner has held the property</p>
            <Select
              value={filters.ownershipYears || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, ownershipYears: value === "all" ? "" : (value || "") })
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
                setFilters({ ...filters, ownerType: value === "all" ? "" : (value || "") })
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

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase">Investment Strategy</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              Development Score
            </label>
            <p className="text-xs text-slate-500 mb-2">Land suitable for subdivision or building (0-100)</p>
            <Input
              type="number"
              placeholder="Min score (e.g., 70)"
              value={filters.minDevelopmentScore}
              onChange={(e) =>
                setFilters({ ...filters, minDevelopmentScore: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">
              Rental Score
            </label>
            <p className="text-xs text-slate-500 mb-2">Potential as income-producing rental property (0-100)</p>
            <Input
              type="number"
              placeholder="Min score (e.g., 70)"
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
                setFilters({ ...filters, excludeFloodplain: value === "all" ? "" : (value || "") })
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
                setFilters({ ...filters, excludeWetlands: value === "all" ? "" : (value || "") })
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

          <div className="flex gap-2 pt-6 border-t-2 border-slate-200">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold text-base py-6"
            >
              🔍 Search Properties
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1 font-semibold border-2"
            >
              ↺ Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
