'use client'
// components/Map.tsx
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Lugar } from '@/types'
import SearchBar from './SearchBar'
import PlaceCard from './PlaceCard'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0D1B2A]">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🗺️</div>
        <p className="text-white/40 text-sm">Cargando mapa...</p>
      </div>
    </div>
  ),
})

interface MapFilters {
  tipo:   string
  estado: string
  buscar: string
}

export default function MapComponent() {
  const [lugares,       setLugares]       = useState<Lugar[]>([])
  const [selectedLugar, setSelectedLugar] = useState<Lugar | null>(null)
  const [filters,       setFilters]       = useState<MapFilters>({ tipo: 'todos', estado: 'todos', buscar: '' })
  const [stats,         setStats]         = useState({ total: 0, evaluados: 0, criticos: 0 })
  const [loading,       setLoading]       = useState(true)

  const fetchLugares = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.tipo   !== 'todos') params.set('tipo',   filters.tipo)
      if (filters.estado !== 'todos') params.set('estado', filters.estado)
      if (filters.buscar)             params.set('buscar', filters.buscar)

      const res  = await fetch(`/api/lugares?${params}`)
      const data = await res.json()

      if (data.geojson?.features) {
        const lista: Lugar[] = data.geojson.features.map((f: any) => ({
          ...f.properties,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          reporte: f.properties.reporte
            ? (typeof f.properties.reporte === 'string'
                ? JSON.parse(f.properties.reporte)
                : f.properties.reporte)
            : null,
          _color: f.properties.color,
        }))
        setLugares(lista)
      }
      if (data.stats) setStats(data.stats)
    } catch (e) {
      console.error('Error cargando lugares:', e)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchLugares() }, [fetchLugares])

  return (
    <div className="relative w-full h-full">
      <LeafletMap lugares={lugares} onSelectLugar={setSelectedLugar} />

      {/* Buscador */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-72">
        <SearchBar
          onSearch={q  => setFilters(f => ({ ...f, buscar: q }))}
          onClear={() => setFilters(f => ({ ...f, buscar: '' }))}
        />
      </div>

      {/* Filtros */}
      <div className="absolute top-16 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-[#0D1B2A]/90 backdrop-blur border border-white/10 rounded-xl p-3 min-w-[200px]">
          <p className="text-xs text-[#8B9EA7] font-medium mb-2">Tipo de lugar</p>
          <div className="flex flex-wrap gap-1">
            {[
              { key: 'todos',    icon: '🗺️' },
              { key: 'escuela',  icon: '🏫' },
              { key: 'clinica',  icon: '🏥' },
              { key: 'farmacia', icon: '💊' },
              { key: 'mercado',  icon: '🛒' },
              { key: 'otro',     icon: '📌' },
            ].map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setFilters(f => ({ ...f, tipo: key }))}
                className={`text-xs px-2 py-1 rounded-md transition-colors capitalize ${
                  filters.tipo === key
                    ? 'bg-[#D4A017] text-[#0D1B2A] font-semibold'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {icon} {key}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0D1B2A]/90 backdrop-blur border border-white/10 rounded-xl p-3">
          <p className="text-xs text-[#8B9EA7] font-medium mb-2">Estado estructural</p>
          <div className="flex flex-col gap-1">
            {[
              { key: 'todos',    label: 'Todos',      color: '#8B9EA7' },
              { key: 'verde',    label: 'Sin daño',   color: '#27AE60' },
              { key: 'amarillo', label: 'Daño menor', color: '#F1C40F' },
              { key: 'naranja',  label: 'Daño mayor', color: '#E67E22' },
              { key: 'rojo',     label: 'Destruido',  color: '#E74C3C' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setFilters(f => ({ ...f, estado: item.key }))}
                className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md transition-colors ${
                  filters.estado === item.key
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-white/60 hover:bg-white/10'
                }`}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats + botón lista */}
      <div className="absolute bottom-8 left-4 z-[1000] flex items-center gap-3">
        <div className="bg-[#0D1B2A]/90 backdrop-blur border border-white/10 rounded-xl py-2 px-4 flex gap-4 text-sm">
          <span className="text-white/50">📍 <strong className="text-white">{stats.total}</strong></span>
          <span className="text-white/50">🔍 <strong className="text-white">{stats.evaluados}</strong></span>
          <span className="text-white/50">🔴 <strong className="text-[#E74C3C]">{stats.criticos}</strong></span>
        </div>
        <Link
          href="/lugares"
          className="bg-[#0D1B2A]/90 backdrop-blur border border-white/10 rounded-xl py-2 px-3 text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors flex items-center gap-1.5"
        >
          ☰ Lista
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="bg-[#0D1B2A]/90 border border-white/10 rounded-lg py-1 px-3 text-xs text-white/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
            Cargando...
          </div>
        </div>
      )}

      {/* PlaceCard al tocar un pin */}
      {selectedLugar && (
        <div className="absolute top-4 right-4 z-[1000] w-80">
          <PlaceCard
            lugar={selectedLugar}
            googleMapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''}
            onClose={() => setSelectedLugar(null)}
          />
        </div>
      )}
    </div>
  )
      }
        
