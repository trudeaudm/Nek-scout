'use client'

import { useState } from 'react'
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
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
    minPrice: '',
    maxPrice: '',
    lifeEstate: '',
    listed: '',
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
      minPrice: '',
      maxPrice: '',
      lifeEstate: '',
      listed: '',
      excludeFloodplain: '',
      excludeWetlands: '',
      includeCurrentUse: ''
    })
    onSearch({})
  }

  return (
    <Card className="border border-[#d7e0d4] bg-[#fbfcfa] shadow-sm">
      <CardHeader className="border-b border-[#e4ebe3]">
        <CardTitle className="flex items-center gap-2 text-lg font-medium text-[#1c3330]">
          <SlidersHorizontal className="size-4 text-[#3e6b54]" strokeWidth={1.75} />
          Filters
        </CardTitle>
        <p className="mt-2 text-sm leading-relaxed text-[#5c6b63]">
          Every filter is optional. Start with a place or a size, then refine.
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

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1c3330]">
              Appraisal
            </label>
            <p className="mb-2 text-xs text-[#5c6b63]">Grand List value, low to high</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters({ ...filters, minPrice: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1c3330]">
              Life estate
            </label>
            <p className="mb-2 text-xs text-[#5c6b63]">
              Owner name ends in LE, or the latest deed conveyed a life estate
            </p>
            <Select
              value={filters.lifeEstate || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, lifeEstate: value === 'all' ? '' : (value || '') })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="true">Life estate</SelectItem>
                <SelectItem value="false">Not a life estate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1c3330]">
              On the market
            </label>
            <p className="mb-2 text-xs text-[#5c6b63]">
              Matched to a public for-sale ad. Unchecked parcels stay out of both lists.
            </p>
            <Select
              value={filters.listed || undefined}
              onValueChange={(value) =>
                setFilters({ ...filters, listed: value === 'all' ? '' : (value || '') })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="true">Listed</SelectItem>
                <SelectItem value="false">Not listed</SelectItem>
                <SelectItem value="unknown">Not checked yet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#1c3330]">
              Current use
            </label>
            <p className="mb-2 text-xs text-[#5c6b63]">
              Enrolled land is more expensive to develop
            </p>
            <Select
              value={filters.includeCurrentUse || undefined}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  includeCurrentUse: value === 'all' ? '' : (value || ''),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="true">Current use only</SelectItem>
                <SelectItem value="false">Exclude current use</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-[#e4ebe3] pt-4">
            <p className="text-xs font-medium tracking-wide text-[#5c6b63] uppercase">Investment strategy</p>
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
              Exclude floodplain
            </label>
            <p className="mb-2 text-xs text-[#5c6b63]">FEMA special flood hazard area</p>
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
              Exclude wetlands
            </label>
            <p className="mb-2 text-xs text-[#5c6b63]">Vermont Significant Wetland Inventory</p>
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

          <div className="flex gap-2 border-t border-[#e4ebe3] pt-6">
            <Button
              type="submit"
              className="h-10 flex-1 bg-[#1c3330] font-medium text-white hover:bg-[#2a4a42]"
            >
              <Search className="size-4" strokeWidth={1.75} />
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-10 flex-1 border-[#c9d5c8] font-medium text-[#1c3330]"
            >
              <RotateCcw className="size-4" strokeWidth={1.75} />
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
