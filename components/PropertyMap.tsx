'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
} from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

const PARCEL_LAYER =
  'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/ArcGIS/rest/services/FS_VCGI_OPENDATA_Cadastral_VTPARCELS_poly_standardized_parcels_SP_v1/FeatureServer/0/query'

const SATELLITE =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_LABELS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
const STREETS = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

type Ring = [number, number][]

function FitParcel({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap()

  useEffect(() => {
    map.invalidateSize()
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 })
  }, [map, bounds])

  return null
}

function toRings(raw: number[][][] | undefined): Ring[] {
  if (!raw) return []
  return raw
    .filter((ring) => ring.length > 2)
    .map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number]))
}

async function fetchParcelRings(parcelId: string): Promise<Ring[]> {
  if (!/^[A-Za-z0-9.-]+$/.test(parcelId)) return []

  const where = `GLIST_SPAN='${parcelId}' OR SPAN='${parcelId}'`
  const url = new URL(PARCEL_LAYER)
  url.searchParams.set('where', where)
  url.searchParams.set('outFields', 'SPAN')
  url.searchParams.set('returnGeometry', 'true')
  url.searchParams.set('outSR', '4326')
  url.searchParams.set('resultRecordCount', '1')
  url.searchParams.set('f', 'json')

  const response = await fetch(url)
  if (!response.ok) return []
  const data = await response.json()
  return toRings(data.features?.[0]?.geometry?.rings)
}

export function PropertyMap({
  latitude,
  longitude,
  parcelId,
  label,
}: {
  latitude: number
  longitude: number
  parcelId?: string
  label: string
}) {
  const [rings, setRings] = useState<Ring[]>([])
  const [basemap, setBasemap] = useState<'satellite' | 'streets'>('satellite')
  const center = useMemo(
    (): LatLngExpression => [latitude, longitude],
    [latitude, longitude]
  )

  useEffect(() => {
    if (!parcelId) return
    let cancelled = false
    fetchParcelRings(parcelId)
      .then((next) => {
        if (!cancelled) setRings(next)
      })
      .catch(() => {
        if (!cancelled) setRings([])
      })
    return () => {
      cancelled = true
    }
  }, [parcelId])

  const bounds = useMemo((): LatLngBoundsExpression => {
    const points = rings.flat()
    if (points.length > 2) {
      let minLat = points[0][0]
      let maxLat = points[0][0]
      let minLng = points[0][1]
      let maxLng = points[0][1]
      for (const [lat, lng] of points) {
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
      }
      return [
        [minLat, minLng],
        [maxLat, maxLng],
      ]
    }
    const pad = 0.004
    return [
      [latitude - pad, longitude - pad],
      [latitude + pad, longitude + pad],
    ]
  }, [rings, latitude, longitude])

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  return (
    <div className="space-y-2">
      <div className="relative h-72 overflow-hidden rounded-lg border border-slate-200">
        <div className="absolute top-2 right-2 z-[500] flex overflow-hidden rounded-md border border-[#d7e0d4] bg-[#fbfcfa] text-xs shadow-sm">
          <button
            type="button"
            className={`px-2 py-1 ${basemap === 'satellite' ? 'bg-[#1c3330] text-white' : 'text-[#3e5348]'}`}
            onClick={() => setBasemap('satellite')}
          >
            Satellite
          </button>
          <button
            type="button"
            className={`px-2 py-1 ${basemap === 'streets' ? 'bg-[#1c3330] text-white' : 'text-[#3e5348]'}`}
            onClick={() => setBasemap('streets')}
          >
            Streets
          </button>
        </div>
        <MapContainer
          center={center}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          {basemap === 'satellite' ? (
            <>
              <TileLayer
                url={SATELLITE}
                attribution="Tiles &copy; Esri"
                maxZoom={19}
              />
              <TileLayer url={SATELLITE_LABELS} maxZoom={19} />
            </>
          ) : (
            <TileLayer
              url={STREETS}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              maxZoom={19}
            />
          )}
          {rings.length > 0 ? (
            <Polygon
              positions={rings}
              pathOptions={{
                color: '#facc15',
                weight: 3,
                fillColor: '#2563eb',
                fillOpacity: 0.28,
              }}
            />
          ) : (
            <CircleMarker
              center={center}
              radius={9}
              pathOptions={{
                color: '#facc15',
                weight: 2,
                fillColor: '#2563eb',
                fillOpacity: 0.85,
              }}
            />
          )}
          <FitParcel bounds={bounds} />
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {rings.length > 0
            ? 'Parcel outline from VCGI'
            : 'Approximate location from the parcel centroid'}
        </span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#2a5c63] hover:underline"
        >
          Open {label} in Google Maps
        </a>
      </div>
    </div>
  )
}
