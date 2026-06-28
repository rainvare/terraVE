'use client'
// components/LugaresPanel.tsx
import { useState } from 'react'
import type { Lugar, ColorSemaforo, ClaseDano } from '@/types'

interface LugaresPanelProps {
  lugares:       Lugar[]
  selectedLugar: Lugar | null
  onSelectLugar: (l: Lugar) => void
  onClose:       () => void
  googleMapsKey: string
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

const OPCIONES_DANO: { clase: ClaseDano; color: ColorSemaforo; label: string; emoji: string }[] = [
  { clase: 'sin_dano',   color: 'verde',    label: 'Sin daño',   emoji: '✅' },
  { clase: 'dano_menor', color: 'amarillo', label: 'Daño menor', emoji: '🟡' },
  { clase: 'dano_mayor', color: 'naranja',  label: 'Daño mayor', emoji: '🟠' },
  { clase: 'destruido',  color: 'rojo',     label: 'Destruido',  emoji: '🔴' },
]

// ── Card de detalle ───────────────────────────────────────────────────────────

function DetailCard({ lugar, onClose }: {
  lugar: Lugar
  onClose: () => void
}) {
  const [color,       setColor]       = useState<string>(lugar.color_semaforo ?? 'gris')
  const [guardando,   setGuardando]   = useState(false)
  const [guardado,    setGuardado]    = useState(false)
  const [editando,    setEditando]    = useState(false)

  const fotoAntes   = lugar.foto_antes ?? null
  const fotoDespues = lugar.reporte?.foto_despues || null
  const direccion   = lugar.descripcion?.split(' | ')[1] ?? ''

  const guardarDano = async (clase: ClaseDano, nuevoColor: ColorSemaforo) => {
    setGuardando(true)
    try {
      // Actualizar lugar
      await fetch(`/api/lugares/${lugar.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: clase === 'sin_dano' ? 'sin_evaluar' : clase, color_semaforo: nuevoColor }),
      })
      // Actualizar reporte si existe
      if (lugar.reporte?.id) {
        await fetch(`/api/reports/${lugar.reporte.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clase_dano: clase, color_semaforo: nuevoColor, confianza: 1.0 }),
        })
      }
      setColor(nuevoColor)
      setGuardado(true)
      setEditando(false)
      setTimeout(() => setGuardado(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-white/10">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm leading-tight">{lugar.nombre}</h2>
          {direccion && <p className="text-xs text-white/35 mt-1 line-clamp-2">{direccion}</p>}
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none shrink-0 mt-0.5">←</button>
      </div>

      {/* Semáforo + editar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: SEMAFORO_COLOR[color] + '22', color: SEMAFORO_COLOR[color] }}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: SEMAFORO_COLOR[color] }} />
          {SEMAFORO_LABEL[color]}
          {lugar.reporte?.confianza ? ` · ${(lugar.reporte.confianza * 100).toFixed(0)}%` : ''}
        </span>

        {guardado ? (
          <span className="text-xs text-green-400">✓ Guardado</span>
        ) : (
          <button
            onClick={() => setEditando(e => !e)}
            className="text-xs text-[#D4A017] hover:underline shrink-0"
          >
            {editando ? 'Cancelar' : '✏️ Editar'}
          </button>
        )}
      </div>

      {/* Selector de daño manual */}
      {editando && (
        <div className="px-4 py-3 border-b border-white/10 flex flex-col gap-2">
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Clasificar daño</p>
          {OPCIONES_DANO.map(op => (
            <button
              key={op.clase}
              onClick={() => guardarDano(op.clase, op.color)}
              disabled={guardando}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-50"
            >
              <span className="text-base">{op.emoji}</span>
              <span className="text-xs text-white font-medium">{op.label}</span>
              {guardando && <span className="ml-auto text-[10px] text-white/30 animate-pulse">Guardando…</span>}
            </button>
          ))}
        </div>
      )}

      {/* Fotos */}
      <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 pt-2 pb-1">Antes</span>
          {fotoAntes ? (
            <div className="relative">
              <img src={fotoAntes} alt="antes" className="w-full h-36 object-cover" />
              <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white/60 px-1.5 py-0.5 rounded">Google Maps</span>
            </div>
          ) : (
            <div className="h-36 bg-white/5 flex flex-col items-center justify-center text-white/20 text-xs gap-1">
              <span className="text-2xl">🗺️</span><span>Sin foto previa</span>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 pt-2 pb-1">Después</span>
          {fotoDespues ? (
            <img src={fotoDespues} alt="después" className="w-full h-36 object-cover" />
          ) : (
            <div className="h-36 bg-white/5 flex flex-col items-center justify-center text-white/20 text-xs gap-1">
              <span className="text-2xl">📷</span><span>Sin reporte</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex flex-col gap-2 text-xs text-white/40 border-b border-white/10">
        <div className="flex justify-between">
          <span>Tipo</span>
          <span className="text-white/60 capitalize">{lugar.tipo}</span>
        </div>
        <div className="flex justify-between">
          <span>Coordenadas</span>
          <span className="text-white/60">{Number(lugar.lat).toFixed(4)}, {Number(lugar.lng).toFixed(4)}</span>
        </div>
        {lugar.reporte?.created_at && (
          <div className="flex justify-between">
            <span>Reportado</span>
            <span className="text-white/60">{new Date(lugar.reporte.created_at).toLocaleDateString('es-VE')}</span>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-4 py-3 flex gap-3">
        <a
          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lugar.lat},${lugar.lng}`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#D4A017] hover:underline"
        >
          Street View →
        </a>
        <span className="text-white/10">|</span>
        <a href={`/classify?lugar_id=${lugar.id}`} className="text-xs text-[#E74C3C] hover:underline">
          Reportar daño
        </a>
      </div>
    </div>
  )
}

// ── Item de lista ─────────────────────────────────────────────────────────────

function LugarItem({ lugar, onClick }: { lugar: Lugar; onClick: () => void }) {
  const color = lugar.color_semaforo ?? 'gris'
  const foto  = lugar.foto_antes ?? lugar.reporte?.foto_despues ?? null

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
        {foto
          ? <img src={foto} alt={lugar.nombre} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">🏢</div>
        }
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-white leading-tight truncate">{lugar.nombre}</p>
        <p className="text-[10px] text-white/30 truncate mt-0.5">
          {lugar.descripcion?.split(' | ')[1]?.split('|')[0]?.trim() ?? lugar.tipo}
        </p>
      </div>
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEMAFORO_COLOR[color] }} />
    </button>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────

export default function LugaresPanel({ lugares, selectedLugar, onSelectLugar, onClose, googleMapsKey }: LugaresPanelProps) {
  const [tab, setTab] = useState<'todos' | 'con_foto'>('todos')

  const conFoto = lugares.filter(l => l.foto_antes || l.reporte?.foto_despues)
  const lista   = tab === 'con_foto' ? conFoto : lugares

  return (
    <div className="flex flex-col h-full bg-[#0D1B2A] border-l border-white/10 text-white">
      {selectedLugar ? (
        <DetailCard lugar={selectedLugar} onClose={onClose} />
      ) : (
        <>
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <p className="text-xs text-white/40">{lista.length} lugar{lista.length !== 1 ? 'es' : ''}{tab === 'con_foto' ? ' con foto' : ''}</p>
            <div className="flex gap-1 mt-2">
              {([['todos', 'Todos'], ['con_foto', '📸 Con foto']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`text-[11px] px-3 py-1 rounded-md transition-colors ${
                    tab === key ? 'bg-[#D4A017] text-[#0D1B2A] font-semibold' : 'bg-white/10 text-white/50 hover:bg-white/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {lista.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20 text-xs gap-2">
                <span className="text-3xl">📭</span><span>Sin resultados</span>
              </div>
            ) : (
              lista.map(l => <LugarItem key={l.id} lugar={l} onClick={() => onSelectLugar(l)} />)
            )}
          </div>
        </>
      )}
    </div>
  )
    }
                                                                                    
