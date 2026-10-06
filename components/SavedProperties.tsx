'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'nek-scout-saved'

interface SavedPropertiesValue {
  ids: string[]
  has: (parcelId: string) => boolean
  toggle: (parcelId: string) => void
}

const SavedPropertiesContext = createContext<SavedPropertiesValue>({
  ids: [],
  has: () => false,
  toggle: () => {},
})

export function SavedPropertiesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(stored)) {
        setIds(stored.filter((id) => typeof id === 'string'))
      }
    } catch {
      setIds([])
    }
  }, [])

  const toggle = (parcelId: string) => {
    setIds((current) => {
      const next = current.includes(parcelId)
        ? current.filter((id) => id !== parcelId)
        : [parcelId, ...current]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <SavedPropertiesContext.Provider
      value={{
        ids,
        has: (parcelId) => ids.includes(parcelId),
        toggle,
      }}
    >
      {children}
    </SavedPropertiesContext.Provider>
  )
}

export function useSavedProperties() {
  return useContext(SavedPropertiesContext)
}
