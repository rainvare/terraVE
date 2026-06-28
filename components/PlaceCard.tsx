'use client'
// components/PlaceCard.tsx
import { useState, useEffect } from 'react'
import type { Lugar } from '@/types'

interface PlaceCardProps {
  lugar: Lugar
  googleMapsKey: string
  onClose: () => void
}

const SEMAFORO_LABEL: Record<string, string> = {
  verde:    'Sin daño',
  amarillo: 'Daño menor',
  naranja:  'Daño mayor',
  rojo:     'Destruido',
  gris:     'Sin evaluar',
}

const SEMAFORO_COLOR: Record<string, string> = {
  verde:    '#27AE60',
  amarillo: '#F1C40F',
  naranja:  '#E67E22',
  rojo:     '#E74C3C',
  gris:     '#8B9EA7',
}

function streetViewUrl(lat: number, lng: number, apiKey: string) {
  return (
    `https://maps.googleapis.com/maps/api/streetview` +
    `?size=600x400&location=${lat},${lng}&fov=90&pitch=0&source=outdoor&key=${apiKey}`
  )
}

export default function PlaceCard({ lugar, googleMapsKey, onClose }: PlaceCardProps) {
  const [svOk,        setSvOk]        = useState<boolean | null>(null)
  const [imgError,    setImgError]    = useState(false)

  const fotoAntes   = lugar.foto_antes ?? null
  const fotoDespues = lugar.reporte?.foto_despues ?? null
  const svUrl       = streetViewUrl(lugar.lat, lugar.lng, googleMapsKey)
  const colorKey    = lugar.color_semaforo ?? 'gris'

  // Verificar cobertura de Street View (Metadata API — gratis)
  useEffect(() => {
    if (fotoAntes || !googleMapsKey) return
    fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata` +
      `?location=${lugar.lat},${lugar.lng}&radius=100&key=${googleMapsKey}`
    )
      .then(r => r.json())
      .then(d => setSvOk(d.status === 'OK'))
      .catch(() => setSvOk(false))
  }, [lugar.lat, lugar.lng, fotoAntes, googleMapsKey])

  // Imagen "antes": foto subida por ciudadano > Street View > placeholder
  const imagenAntes =
    fotoAntes ??
    (!imgError && svOk === true ? svUrl : null)

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl bg-[#0D1B2A] border border-white/10 text-white">

      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{lugar.nombre}</h3>
          <p className="text-xs text-white/40 mt-0.5 capitalize">{lugar.tipo}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Semáforo */}
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: SEMAFORO_COLOR[colorKey] + '33', color: SEMAFORO_COLOR[colorKey] }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: SEMAFORO_COLOR[colorKey] }} />
            {SEMAFORO_LABEL[colorKey]}
          </span>
          {/* Cerrar */}
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Fotos */}
      <div className="grid grid-cols-2 divide-x divide-white/10">

        {/* ANTES */}
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 pt-2 pb-1">
            Antes
          </span>
          {imagenAntes ? (
            <div className="relative">
              <img
                src={imagenAntes}
                alt={`${lugar.nombre} — antes`}
                className="w-full h-36 object-cover"
                onError={() => setImgError(true)}
              />
              {!fotoAntes && (
                <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white/70 px-1.5 py-0.5 rounded">
                  Street View
                </span>
              )}
            </div>
          ) : (
            <div className="h-36 bg-white/5 flex flex-col items-center justify-center text-white/20 text-xs gap-1">
              {svOk === null && !fotoAntes
                ? <span className="animate-pulse text-white/30">Buscando…</span>
                : <><span className="text-2xl">🗺️</span><span>Sin foto previa</span></>
              }
            </div>
          )}
        </div>

        {/* DESPUÉS */}
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 pt-2 pb-1">
            Después
          </span>
          {fotoDespues ? (
            <img
              src={fotoDespues}
              alt={`${lugar.nombre} — después`}
              className="w-full h-36 object-cover"
            />
          ) : (
            <div className="h-36 bg-white/5 flex flex-col items-center justify-center text-white/20 text-xs gap-1">
              <span className="text-2xl">📷</span>
              <span>Subí una foto</span>
            </div>
          )}
        </div>
      </div>

      {/* Descripción */}
      {lugar.descripcion && (
        <p className="px-4 py-2 text-xs text-white/30 line-clamp-2 border-t border-white/5">
          {lugar.descripcion}
        </p>
      )}

      {/* Acciones */}
      <div className="px-4 py-3 border-t border-white/10 flex gap-3">
        <a
          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lugar.lat},${lugar.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#D4A017] hover:underline"
        >
          Ver en Street View →
        </a>
        <span className="text-white/10">|</span>
        <button className="text-xs text-[#E74C3C] hover:underline">
          Reportar daño
        </button>
      </div>
    </div>
  )
            }
