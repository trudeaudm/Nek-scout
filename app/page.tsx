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
          <p className="text-blue-200 text-base mt-3 max-w-3xl">
            Find properties with public signals suggesting the owner may be receptive to selling. 
            Properties are scored based on ownership tenure, absentee ownership, and investment potential.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-bold text-slate-900 mb-3">📖 How to Use This Tool</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold text-blue-900 mb-1">1. Start Broad</div>
              <p className="text-slate-600">Begin with just a county or minimum acreage. You can always refine later.</p>
            </div>
            <div>
              <div className="font-semibold text-blue-900 mb-1">2. Look for High Scores</div>
              <p className="text-slate-600">Properties scoring 70+ show strong ownership-transition signals and investment potential.</p>
            </div>
            <div>
              <div className="font-semibold text-blue-900 mb-1">3. Verify Everything</div>
              <p className="text-slate-600">Always conduct due diligence: title search, zoning checks, and site visits before proceeding.</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <PropertySearch onSearch={handleSearch} />
          </aside>

          <div className="lg:col-span-3">
            <PropertyList searchParams={searchParams} key={refreshKey} />
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 border-t-4 border-blue-600 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-white font-bold text-lg mb-3">Important Information</h3>
            <div className="text-slate-300 text-sm space-y-2 leading-relaxed">
              <p>
                <strong className="text-blue-300">Data Sources:</strong> Vermont Grand List (2025), 
                GIS parcels, property transfer records dating back to 1986
              </p>
              <p>
                <strong className="text-blue-300">For Informational Use Only:</strong> All data must be verified independently. 
                Scores are based on public records and do not guarantee seller interest or property suitability.
              </p>
              <p>
                <strong className="text-blue-300">Required Due Diligence:</strong> Before making any investment decisions, 
                conduct thorough title searches, zoning verification, environmental assessments, and consult with 
                legal and financial professionals.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
