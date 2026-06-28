'use client'
// components/SatelitalMap.tsx
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface ZonaSAR {
  type: string
  geometry: any
  properties: {
    id: number
    area_m2: number
    centro_lat: number
    centro_lng: number
  }
}

interface ReporteCoincidente {
  reporte_id: string
  lugar_nombre: string
  clase_dano: string
  color_semaforo: string
  reporte_lat: number
  reporte_lng: number
  coincide: boolean
}

interface Stats {
  zonas_satelitales: number
  area_danada_km2: number
  reportes_ciudadanos: number
  coincidencias: number
  municipios_criticos: number
  poblacion_critica: number
}

// Centrar mapa en Venezuela afectada
function MapCenter() {
  const map = useMap()
  useEffect(() => {
    map.setView([10.48, -67.0], 11)
  }, [map])
  return null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
}

export default function SatelitalMap() {
  const [zonasSAR,    setZonasSAR]    = useState<any>(null)
  const [reportes,    setReportes]    = useState<ReporteCoincidente[]>([])
  const [stats,       setStats]       = useState<Stats | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [mostrarSAR,  setMostrarSAR]  = useState(true)
  const [mostrarRep,  setMostrarRep]  = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      try {
        // Stats del dashboard
        const statsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/stats_dashboard?limit=1`,
          { headers }
        )
        const statsData = await statsRes.json()
        if (statsData[0]) setStats(statsData[0])

        // Zonas SAR como GeoJSON
        // Supabase puede devolver geometría como GeoJSON via PostGIS
        const sarRes = await fetch(
          `${SUPABASE_URL}/rest/v1/dano_satelital?select=id,centro_lat,centro_lng,area_m2&limit=60000`,
          { headers }
        )
        const sarData = await sarRes.json()

        // Convertir a GeoJSON FeatureCollection de puntos centroides
        // (los polígonos completos serían muy pesados para Leaflet)
        const geojson = {
          type: 'FeatureCollection',
          features: sarData.map((z: any) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [z.centro_lng, z.centro_lat],
            },
            properties: { id: z.id, area_m2: z.area_m2 },
          })),
        }
        setZonasSAR(geojson)

        // Reportes con y sin coincidencia satelital
        const coinRes = await fetch(
          `${SUPABASE_URL}/rest/v1/coincidencias_satelital?select=reporte_id,lugar_nombre,clase_dano,color_semaforo,reporte_lat,reporte_lng&limit=1000`,
          { headers }
        )
        const coinData = await coinRes.json()
        const coincidentes = coinData.map((r: any) => ({ ...r, coincide: true }))

        // Todos los reportes
        const repRes = await fetch(
          `${SUPABASE_URL}/rest/v1/reportes_dano?select=id,clase_dano,color_semaforo,lat,lng&limit=1000`,
          { headers }
        )
        const repData = await repRes.json()
        const idsCoincidentes = new Set(coincidentes.map((r: any) => r.reporte_id))

        const todosReportes = repData.map((r: any) => ({
          reporte_id:    r.id,
          lugar_nombre:  '',
          clase_dano:    r.clase_dano,
          color_semaforo: r.color_semaforo,
          reporte_lat:   r.lat,
          reporte_lng:   r.lng,
          coincide:      idsCoincidentes.has(r.id),
        }))

        setReportes(todosReportes)
      } catch (e) {
        console.error('Error cargando datos SAR:', e)
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [])

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[10.48, -67.0]}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
        />
        <MapCenter />

        {/* Zonas SAR como puntos de calor rojos */}
        {mostrarSAR && zonasSAR && zonasSAR.features.map((f: any, i: number) => (
          <CircleMarker
            key={i}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={3}
            pathOptions={{
              color: 'transparent',
              fillColor: '#FF4444',
              fillOpacity: 0.35,
            }}
          />
        ))}

        {/* Reportes ciudadanos */}
        {mostrarRep && reportes.map((r, i) => (
          <CircleMarker
            key={`rep-${i}`}
            center={[r.reporte_lat, r.reporte_lng]}
            radius={6}
            pathOptions={{
              color: r.coincide ? '#D4A017' : '#60A5FA',
              fillColor: r.coincide ? '#D4A017' : '#60A5FA',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup className="terraVE-popup">
              <div className="text-sm">
                <p className="font-semibold">{r.lugar_nombre || 'Edificio reportado'}</p>
                <p className="text-xs text-gray-500 mt-1">Daño: {r.clase_dano || '—'}</p>
                {r.coincide && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    ⚠️ Coincide con zona SAR
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Panel de controles */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-[#0D1B2A]/95 backdrop-blur border border-white/10 rounded-xl p-3 min-w-[180px]">
          <p className="text-xs text-[#8B9EA7] font-medium mb-2">Capas</p>
          <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer mb-1.5">
            <input
              type="checkbox"
              checked={mostrarSAR}
              onChange={e => setMostrarSAR(e.target.checked)}
              className="accent-red-500"
            />
            <span className="w-3 h-3 rounded-full bg-red-500/70 inline-block" />
            Daño satelital SAR
          </label>
          <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarRep}
              onChange={e => setMostrarRep(e.target.checked)}
              className="accent-[#D4A017]"
            />
            <span className="w-3 h-3 rounded-full bg-[#D4A017] inline-block" />
            Reportes ciudadanos
          </label>
        </div>
      </div>

      {/* Stats panel */}
      {stats && (
        <div className="absolute bottom-8 left-4 z-[1000]">
          <div className="bg-[#0D1B2A]/95 backdrop-blur border border-white/10 rounded-xl p-3 flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-red-400 font-bold text-lg">{Number(stats.area_danada_km2).toFixed(1)}</p>
              <p className="text-white/40 text-xs">km² afectados</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-[#D4A017] font-bold text-lg">{stats.coincidencias}</p>
              <p className="text-white/40 text-xs">coincidencias</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-blue-400 font-bold text-lg">{stats.reportes_ciudadanos}</p>
              <p className="text-white/40 text-xs">reportes</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="bg-[#0D1B2A]/90 border border-white/10 rounded-lg py-1 px-3 text-xs text-white/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Cargando datos satelitales...
          </div>
        </div>
      )}
    </div>
  )
}
