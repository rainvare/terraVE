'use client'
// components/LeafletMap.tsx
import { useEffect, useRef } from 'react'
import type { Lugar } from '@/types'

interface Props {
  lugares:       Lugar[]
  onSelectLugar: (lugar: Lugar) => void
}

const TIPO_ICONOS: Record<string, string> = {
  escuela:  '🏫',
  clinica:  '🏥',
  farmacia: '💊',
  mercado:  '🛒',
  otro:     '📌',
}

function getColor(lugar: Lugar & { _color?: string }): string {
  if (lugar._color) return lugar._color
  const map: Record<string, string> = {
    verde:    '#27AE60',
    amarillo: '#F1C40F',
    naranja:  '#E67E22',
    rojo:     '#E74C3C',
    gris:     '#95A5A6',
  }
  return map[lugar.color_semaforo ?? 'gris'] ?? '#95A5A6'
}

export default function LeafletMap({ lugares, onSelectLugar }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const clusterRef   = useRef<any>(null)

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Cargar Leaflet + MarkerCluster CSS dinámicamente
    const link1 = document.createElement('link')
    link1.rel  = 'stylesheet'
    link1.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css'
    document.head.appendChild(link1)

    const link2 = document.createElement('link')
    link2.rel  = 'stylesheet'
    link2.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css'
    document.head.appendChild(link2)

    import('leaflet').then(async L => {
      // Cargar MarkerCluster JS
      await import('leaflet.markercluster' as any).catch(() => {
        // fallback: cargar via script tag si el import falla
        return new Promise<void>(resolve => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js'
          s.onload = () => resolve()
          document.head.appendChild(s)
        })
      })

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, {
        center:      [10.48, -66.9],
        zoom:        6,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains:  'abcd',
        maxZoom:     19,
      }).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      clusterRef.current = null
    }
  }, [])

  // Actualizar marcadores con clustering
  useEffect(() => {
    if (!mapRef.current) return

    import('leaflet').then(L => {
      // Limpiar cluster anterior
      if (clusterRef.current) {
        mapRef.current.removeLayer(clusterRef.current)
        clusterRef.current = null
      }

      const LAny = L as any

      // Crear grupo de clusters con colores personalizados
      const cluster = LAny.markerClusterGroup
        ? LAny.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (c: any) => {
              const count = c.getChildCount()
              // Color del cluster según el daño más grave dentro
              const markers  = c.getAllChildMarkers()
              const colores  = markers.map((m: any) => m.options.colorKey ?? 'gris')
              const prioridad = ['rojo', 'naranja', 'amarillo', 'verde', 'gris']
              const color    = prioridad.find(p => colores.includes(p)) ?? 'gris'
              const hex      = { rojo: '#E74C3C', naranja: '#E67E22', amarillo: '#F1C40F', verde: '#27AE60', gris: '#95A5A6' }[color]
              const size     = count > 100 ? 44 : count > 10 ? 36 : 28
              return LAny.divIcon({
                html: `<div style="
                  width:${size}px;height:${size}px;
                  background:${hex};
                  border:2px solid white;
                  border-radius:50%;
                  display:flex;align-items:center;justify-content:center;
                  color:white;font-weight:700;font-size:${size > 36 ? 13 : 11}px;
                  box-shadow:0 2px 8px rgba(0,0,0,0.4);
                ">${count}</div>`,
                className:  '',
                iconSize:   [size, size],
                iconAnchor: [size / 2, size / 2],
              })
            },
          })
        : null

      if (!cluster) {
        // MarkerCluster no disponible aún — reintentar en 500ms
        setTimeout(() => {
          if (mapRef.current) mapRef.current.dispatchEvent?.(new Event('clustersready'))
        }, 500)
        return
      }

      lugares.forEach(lugar => {
        const color    = getColor(lugar as any)
        const colorKey = lugar.color_semaforo ?? 'gris'
        const icono    = TIPO_ICONOS[lugar.tipo] ?? '📌'

        const svgIcon = L.divIcon({
          html: `<div style="
            width:28px;height:28px;
            background:${color};
            border:2px solid white;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:13px;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
            cursor:pointer;
          ">${icono}</div>`,
          className:   '',
          iconSize:    [28, 28],
          iconAnchor:  [14, 14],
          popupAnchor: [0, -16],
        })

        const marker = L.marker([lugar.lat, lugar.lng], {
          icon: svgIcon,
          // @ts-ignore — guardamos colorKey para el cluster
          colorKey,
        })

        marker.on('click', () => onSelectLugar(lugar))
        marker.bindTooltip(lugar.nombre, {
          direction: 'top',
          className: 'leaflet-terra-tooltip',
          offset:    [0, -14],
        })

        cluster.addLayer(marker)
      })

      mapRef.current.addLayer(cluster)
      clusterRef.current = cluster
    })
  }, [lugares, onSelectLugar])

  return (
    <>
      <style>{`
        .leaflet-terra-tooltip {
          background: #1A2B3C !important;
          border: 1px solid rgba(212,160,23,0.4) !important;
          color: white !important;
          font-size: 12px !important;
          padding: 4px 8px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .leaflet-terra-tooltip::before {
          border-top-color: rgba(212,160,23,0.4) !important;
        }
        .leaflet-control-zoom a {
          background: #1A2B3C !important;
          color: white !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover { background: #2A3B4C !important; }
        .leaflet-control-attribution {
          background: rgba(13,27,42,0.8) !important;
          color: rgba(255,255,255,0.3) !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: rgba(212,160,23,0.6) !important; }
        .leaflet-cluster-anim .leaflet-marker-icon,
        .leaflet-cluster-anim .leaflet-marker-shadow {
          transition: transform 0.3s ease-out, opacity 0.3s ease-in;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  )
                                  }
