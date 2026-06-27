'use client'
// components/PlaceCard.tsx
import Image from 'next/image'
import Link  from 'next/link'
import type { Lugar, ColorSemaforo } from '@/types'

interface Props {
  lugar:   Lugar
  onClose: () => void
}

const TIPO_ICONOS: Record<string, string> = {
  escuela:  '🏫',
  clinica:  '🏥',
  farmacia: '💊',
  mercado:  '🛒',
  otro:     '📌',
}

const SEMAFORO_META: Record<ColorSemaforo, { label: string; descripcion: string; bg: string; border: string }> = {
  verde:    { label: 'Sin daño aparente',          descripcion: 'Estructura visualmente intacta.',                          bg: '#27AE60', border: '#1E8449' },
  amarillo: { label: 'Pendiente de evaluación',    descripcion: 'Este lugar aún no ha sido evaluado. ¿Estás cerca?',        bg: '#F1C40F', border: '#D4AC0D' },
  naranja:  { label: 'Posible daño estructural',   descripcion: 'Se han detectado daños. Se recomienda inspección.',         bg: '#E67E22', border: '#CA6F1E' },
  rojo:     { label: 'Alerta de riesgo estructural', descripcion: 'Alta probabilidad de daño severo. No ingresar sin evaluación técnica.', bg: '#E74C3C', border: '#CB4335' },
  gris:     { label: 'Sin evaluar',                descripcion: 'Sin datos disponibles aún.',                                bg: '#95A5A6', border: '#7F8C8D' },
}

export default function PlaceCard({ lugar, onClose }: Props) {
  const semaforo = lugar.reporte
    ? SEMAFORO_META[lugar.reporte.color_semaforo] ?? SEMAFORO_META.gris
    : SEMAFORO_META.gris

  const confianzaPct = lugar.reporte
    ? Math.round(lugar.reporte.confianza * 100)
    : null

  return (
    <div className="card overflow-hidden shadow-2xl" style={{ borderColor: semaforo.border + '55' }}>
      {/* Header de estado */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ background: semaforo.bg + '22', borderBottom: `1px solid ${semaforo.bg}44` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: semaforo.bg }}
          />
          <span className="text-sm font-semibold" style={{ color: semaforo.bg }}>
            {semaforo.label}
          </span>
          {confianzaPct !== null && confianzaPct > 0 && (
            <span className="text-xs text-white/40">({confianzaPct}% conf.)</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors text-lg leading-none"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      {/* Fotos antes/después */}
      {(lugar.foto_antes || lugar.reporte?.foto_despues) && (
        <div className="grid grid-cols-2 gap-0.5 bg-black/20">
          {lugar.foto_antes && (
            <div className="relative aspect-video bg-black/40">
              <img
                src={lugar.foto_antes}
                alt="Foto antes"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white/70 px-1.5 py-0.5 rounded">
                Antes
              </span>
            </div>
          )}
          {lugar.reporte?.foto_despues && lugar.reporte.foto_despues !== '' && (
            <div className="relative aspect-video bg-black/40">
              <img
                src={lugar.reporte.foto_despues}
                alt="Foto después"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white/70 px-1.5 py-0.5 rounded">
                Ahora
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xl">{TIPO_ICONOS[lugar.tipo] ?? '📌'}</span>
          <div>
            <h3 className="font-semibold text-white leading-tight">{lugar.nombre}</h3>
            <p className="text-xs text-white/40 capitalize">{lugar.tipo}</p>
          </div>
        </div>

        {/* Descripción del estado */}
        <p className="text-xs mb-3 leading-relaxed" style={{ color: semaforo.bg + 'cc' }}>
          {semaforo.descripcion}
        </p>

        {lugar.descripcion && (
          <p className="text-sm text-white/60 mb-3 leading-relaxed line-clamp-2">
            {lugar.descripcion}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-white/30 mb-4">
          <span>📍 {lugar.lat.toFixed(4)}, {lugar.lng.toFixed(4)}</span>
          <span>por {lugar.creado_por === 'import-openstreetmap' ? 'OpenStreetMap' : lugar.creado_por || 'Anónimo'}</span>
        </div>

        {/* CTA — siempre visible para que cualquiera pueda actualizar el estado */}
        <Link
          href={`/classify?lugar_id=${lugar.id}&lat=${lugar.lat}&lng=${lugar.lng}`}
          className="btn-primary w-full text-center text-sm py-2 block"
        >
          📷 {lugar.reporte ? 'Actualizar evaluación' : 'Evaluar estado actual'}
        </Link>
      </div>
    </div>
  )
}
