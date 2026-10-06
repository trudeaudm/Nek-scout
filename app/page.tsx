'use client'

import { useState } from 'react'
import { PropertySearch } from '@/components/PropertySearch'
import { PropertyList } from '@/components/PropertyList'

export default function Home() {
  const [searchParams, setSearchParams] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSearch = (params: any) => {
    setSearchParams(params)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-lg border-b-4 border-blue-600">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Vermont Off-Market Property Finder
          </h1>
          <p className="text-blue-100 text-lg font-medium">
            🎯 Northeast Kingdom Investment Opportunities
          </p>
          <p className="text-blue-200 text-sm mt-2">
            Discover high-potential properties with ownership-transition signals
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <PropertySearch onSearch={handleSearch} />
          </aside>

          <div className="lg:col-span-3">
            <PropertyList searchParams={searchParams} key={refreshKey} />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600">
          <p>Data sources: Vermont Grand List, GIS parcels, property transfer records</p>
          <p className="mt-2">For informational purposes only. Verify all data independently.</p>
        </div>
      </footer>
    </div>
  )
}
