'use client'
// components/LeafletMap.tsx
// Componente puro de Leaflet — solo se renderiza en el cliente
import { useEffect, useRef } from 'react'
import type { Lugar } from '@/types'

interface Props {
  lugares:        Lugar[]
  onSelectLugar:  (lugar: Lugar) => void
}

const TIPO_ICONOS: Record<string, string> = {
  escuela:  '🏫',
  clinica:  '🏥',
  farmacia: '💊',
  mercado:  '🛒',
  otro:     '📌',
}

// Color del círculo según estado
function getColor(lugar: Lugar & { _color?: string }): string {
  if (lugar._color) return lugar._color
  if (!lugar.reporte) return '#95A5A6'
  const map: Record<string, string> = {
    verde:    '#27AE60',
    amarillo: '#F1C40F',
    naranja:  '#E67E22',
    rojo:     '#E74C3C',
  }
  return map[lugar.reporte.color_semaforo] ?? '#95A5A6'
}

export default function LeafletMap({ lugares, onSelectLugar }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markersRef   = useRef<any[]>([])

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Import dinámico de Leaflet (solo cliente)
    import('leaflet').then(L => {
      // Fix para íconos en Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Venezuela: centro en Caracas
      const map = L.map(containerRef.current!, {
        center:    [10.48, -66.9],
        zoom:      6,
        zoomControl: false,
      })

      // Tiles de OpenStreetMap — gratuito, sin token
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains:  'abcd',
        maxZoom:     19,
      }).addTo(map)

      // Control de zoom en posición correcta
      L.control.zoom({ position: 'topright' }).addTo(map)

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Actualizar marcadores cuando cambian los lugares
  useEffect(() => {
    if (!mapRef.current) return

    import('leaflet').then(L => {
      // Limpiar marcadores anteriores
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      lugares.forEach(lugar => {
        const color = getColor(lugar as any)
        const icono = TIPO_ICONOS[lugar.tipo] ?? '📌'

        // Crear ícono SVG circular coloreado
        const svgIcon = L.divIcon({
          html: `
            <div style="
              width: 28px; height: 28px;
              background: ${color};
              border: 2px solid white;
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              font-size: 13px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              cursor: pointer;
            ">${icono}</div>
          `,
          className:   '',
          iconSize:    [28, 28],
          iconAnchor:  [14, 14],
          popupAnchor: [0, -16],
        })

        const marker = L.marker([lugar.lat, lugar.lng], { icon: svgIcon })
          .addTo(mapRef.current)

        marker.on('click', () => onSelectLugar(lugar))

        // Tooltip con nombre al hover
        marker.bindTooltip(lugar.nombre, {
          direction:  'top',
          className:  'leaflet-terra-tooltip',
          offset:     [0, -14],
        })

        markersRef.current.push(marker)
      })
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
        .leaflet-control-zoom a:hover {
          background: #2A3B4C !important;
        }
        .leaflet-control-attribution {
          background: rgba(13,27,42,0.8) !important;
          color: rgba(255,255,255,0.3) !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: rgba(212,160,23,0.6) !important;
        }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  )
}
