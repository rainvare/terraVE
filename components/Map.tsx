'use client'
// components/Map.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import type { Lugar, TipoLugar, ColorSemaforo } from '@/types'
import PlaceCard from './PlaceCard'

declare const mapboxgl: any

interface MapFilters {
  tipo:   string
  estado: string
}

export default function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const [selectedLugar, setSelectedLugar] = useState<Lugar | null>(null)
  const [filters, setFilters] = useState<MapFilters>({ tipo: 'todos', estado: 'todos' })
  const [stats, setStats]     = useState({ total: 0, evaluados: 0, criticos: 0 })
  const [loading, setLoading] = useState(true)

  const fetchAndRenderLugares = useCallback(async () => {
    if (!mapRef.current) return
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (filters.tipo   !== 'todos') params.set('tipo',   filters.tipo)
      if (filters.estado !== 'todos') params.set('estado', filters.estado)

      const res  = await fetch(`/api/lugares?${params}`)
      const data = await res.json()

      if (!data.geojson) return

      setStats(data.stats)

      const source = mapRef.current.getSource('lugares')
      if (source) {
        source.setData(data.geojson)
      } else {
        mapRef.current.addSource('lugares', {
          type: 'geojson',
          data: data.geojson,
          cluster:            true,
          clusterMaxZoom:     14,
          clusterRadius:      50,
        })

        // Capa de clusters
        mapRef.current.addLayer({
          id:     'clusters',
          type:   'circle',
          source: 'lugares',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step', ['get', 'point_count'],
              '#D4A017', 10,
              '#E67E22', 30,
              '#E74C3C'
            ],
            'circle-radius': [
              'step', ['get', 'point_count'],
              20, 10,
              30, 30,
              40
            ],
            'circle-opacity': 0.85,
          },
        })

        // Conteo en clusters
        mapRef.current.addLayer({
          id:     'cluster-count',
          type:   'symbol',
          source: 'lugares',
          filter: ['has', 'point_count'],
          layout: {
            'text-field':      '{point_count_abbreviated}',
            'text-font':       ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size':       13,
          },
          paint: { 'text-color': '#0D1B2A' },
        })

        // Pins individuales
        mapRef.current.addLayer({
          id:     'lugares-pins',
          type:   'circle',
          source: 'lugares',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color':        ['get', 'color'],
            'circle-radius':       10,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity':      0.9,
          },
        })

        // Etiquetas de pins
        mapRef.current.addLayer({
          id:     'lugares-labels',
          type:   'symbol',
          source: 'lugares',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field':            ['get', 'nombre'],
            'text-size':             11,
            'text-offset':           [0, 1.5],
            'text-anchor':           'top',
            'text-optional':         true,
          },
          paint: {
            'text-color':      '#ffffff',
            'text-halo-color': 'rgba(0,0,0,0.7)',
            'text-halo-width': 1,
          },
        })

        // Click en pin individual
        mapRef.current.on('click', 'lugares-pins', (e: any) => {
          if (!e.features?.length) return
          const props = e.features[0].properties
          setSelectedLugar({
            ...props,
            reporte: props.reporte ? JSON.parse(props.reporte) : null,
          })
        })

        // Click en cluster → zoom in
        mapRef.current.on('click', 'clusters', (e: any) => {
          const features = mapRef.current.queryRenderedFeatures(e.point, { layers: ['clusters'] })
          const clusterId = features[0].properties.cluster_id
          mapRef.current.getSource('lugares').getClusterExpansionZoom(
            clusterId,
            (err: any, zoom: number) => {
              if (err) return
              mapRef.current.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom + 1,
              })
            }
          )
        })

        // Cursores
        mapRef.current.on('mouseenter', 'lugares-pins', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer'
        })
        mapRef.current.on('mouseleave', 'lugares-pins', () => {
          mapRef.current.getCanvas().style.cursor = ''
        })
        mapRef.current.on('mouseenter', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = 'pointer'
        })
        mapRef.current.on('mouseleave', 'clusters', () => {
          mapRef.current.getCanvas().style.cursor = ''
        })
      }
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Inicializar Mapbox
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style:     'mapbox://styles/mapbox/dark-v11',
      center:    [-66.9, 10.48], // Caracas, Venezuela
      zoom:      6,
      minZoom:   4,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
      'top-right'
    )

    mapRef.current.on('load', fetchAndRenderLugares)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Re-fetch cuando cambian filtros
  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) {
      fetchAndRenderLugares()
    }
  }, [filters, fetchAndRenderLugares])

  const tiposIconos: Record<string, string> = {
    todos:    '🗺️',
    escuela:  '🏫',
    clinica:  '🏥',
    farmacia: '💊',
    mercado:  '🛒',
    otro:     '📌',
  }

  return (
    <div className="relative w-full h-full">
      {/* Mapa */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Panel de filtros */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="card p-3 min-w-[200px]">
          <p className="label text-xs mb-2">Tipo de lugar</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(tiposIconos).map(([tipo, icono]) => (
              <button
                key={tipo}
                onClick={() => setFilters(f => ({ ...f, tipo }))}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  filters.tipo === tipo
                    ? 'bg-[#D4A017] text-[#0D1B2A] font-semibold'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {icono} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-3">
          <p className="label text-xs mb-2">Estado estructural</p>
          <div className="flex flex-col gap-1">
            {[
              { key: 'todos',    label: 'Todos',        color: '#8B9EA7' },
              { key: 'verde',    label: 'Sin daño',     color: '#27AE60' },
              { key: 'amarillo', label: 'Daño menor',   color: '#F1C40F' },
              { key: 'naranja',  label: 'Daño mayor',   color: '#E67E22' },
              { key: 'rojo',     label: 'Destruido',    color: '#E74C3C' },
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
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats flotantes */}
      <div className="absolute bottom-8 left-4 z-10">
        <div className="card py-2 px-4 flex gap-6 text-sm">
          <span className="text-white/50">📍 <strong className="text-white">{stats.total}</strong> registrados</span>
          <span className="text-white/50">🔍 <strong className="text-white">{stats.evaluados}</strong> evaluados</span>
          <span className="text-white/50">🔴 <strong className="text-[#E74C3C]">{stats.criticos}</strong> críticos</span>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 right-20 z-10">
          <div className="card py-1 px-3 text-xs text-white/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
            Cargando datos...
          </div>
        </div>
      )}

      {/* Place card popup */}
      {selectedLugar && (
        <div className="absolute top-4 right-4 z-20 w-80 fade-in-up">
          <PlaceCard
            lugar={selectedLugar}
            onClose={() => setSelectedLugar(null)}
          />
        </div>
      )}
    </div>
  )
}
