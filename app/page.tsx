'use client'

import { useState } from 'react'
import { Compass, ShieldCheck, Trees, TrendingUp } from 'lucide-react'
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
    <div className="min-h-screen bg-[#f3f6f1] text-[#24312c]">
      <header className="border-b border-[#1a3330] bg-[#1c3330] text-[#f4f7f2]">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-4 flex items-center gap-2 text-xs tracking-[0.22em] text-[#c5d5c8] uppercase">
            <Trees className="size-4" strokeWidth={1.5} />
            NEK Scout
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-white sm:text-5xl">
            Vermont off-market property finder
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#d5e2d8]">
            Northeast Kingdom land with public signals that an owner may be open to a conversation.
            Scores weigh tenure, absentee ownership, and investment potential.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-6 border-b border-[#d7e0d4] pb-8 md:grid-cols-3">
          <div className="flex gap-3">
            <Compass className="mt-0.5 size-4 shrink-0 text-[#3e6b54]" strokeWidth={1.75} />
            <div>
              <div className="text-sm font-medium text-[#1c3330]">Start broad</div>
              <p className="mt-1 text-sm leading-relaxed text-[#5c6b63]">
                Begin with a county or a minimum acreage, then narrow the list.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-[#2a5c63]" strokeWidth={1.75} />
            <div>
              <div className="text-sm font-medium text-[#1c3330]">Read the score</div>
              <p className="mt-1 text-sm leading-relaxed text-[#5c6b63]">
                Properties at 70 or above show stronger ownership-transition signals.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6a5424]" strokeWidth={1.75} />
            <div>
              <div className="text-sm font-medium text-[#1c3330]">Verify on the ground</div>
              <p className="mt-1 text-sm leading-relaxed text-[#5c6b63]">
                Confirm title, zoning, and the site itself before you act.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <PropertySearch onSearch={handleSearch} />
          </aside>

          <div className="lg:col-span-3">
            <PropertyList searchParams={searchParams} key={refreshKey} />
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-[#d7e0d4] bg-[#1c3330] text-[#d5e2d8]">
        <div className="container mx-auto max-w-3xl px-4 py-10 text-center text-sm leading-relaxed">
          <h2 className="font-display text-xl text-white">Before you rely on a record</h2>
          <p className="mt-4">
            Figures come from the Vermont Grand List (2025), GIS parcels, and transfer records back to 1986.
          </p>
          <p className="mt-2">
            This is informational. Scores describe public records and do not mean an owner wants to sell, or that a parcel is suitable.
          </p>
          <p className="mt-2">
            Title search, zoning, environmental review, and professional advice still come first.
          </p>
        </div>
      </footer>
    </div>
  )
}
