// app/lugares/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Lugar } from '@/types'

const SEMAFORO_COLOR: Record<string, string> = {
  verde:    '#27AE60',
  amarillo: '#F1C40F',
  naranja:  '#E67E22',
  rojo:     '#E74C3C',
  gris:     '#8B9EA7',
}

const SEMAFORO_LABEL: Record<string, string> = {
  verde:    'Sin daño',
  amarillo: 'Daño menor',
  naranja:  'Daño mayor',
  rojo:     'Destruido',
  gris:     'Sin evaluar',
}

const OPCIONES_DANO = [
  { clase: 'sin_dano',   color: 'verde',    label: 'Sin daño',   emoji: '✅' },
  { clase: 'dano_menor', color: 'amarillo', label: 'Daño menor', emoji: '🟡' },
  { clase: 'dano_mayor', color: 'naranja',  label: 'Daño mayor', emoji: '🟠' },
  { clase: 'destruido',  color: 'rojo',     label: 'Destruido',  emoji: '🔴' },
] as const

export default function LugaresPage() {
  const [lugares,   setLugares]   = useState<Lugar[]>([])
  const [loading,   setLoading]   = useState(true)
  const [buscar,    setBuscar]    = useState('')
  const [selected,  setSelected]  = useState<Lugar | null>(null)
  const [editando,  setEditando]  = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardado,  setGuardado]  = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (buscar.length >= 2) params.set('buscar', buscar)
    setLoading(true)
    fetch(`/api/lugares?${params}`)
      .then(r => r.json())
      .then(data => {
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
          }))
          setLugares(lista)
        }
      })
      .finally(() => setLoading(false))
  }, [buscar])

  const guardarDano = async (clase: string, nuevoColor: string) => {
    if (!selected) return
    setGuardando(true)
    try {
      await fetch(`/api/lugares/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: clase === 'sin_dano' ? 'sin_evaluar' : clase,
          color_semaforo: nuevoColor,
        }),
      })
      if (selected.reporte?.id) {
        await fetch(`/api/reports/${selected.reporte.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clase_dano: clase, color_semaforo: nuevoColor, confianza: 1.0 }),
        })
      }
      // Actualizar local
      setLugares(prev => prev.map(l =>
        l.id === selected.id ? { ...l, color_semaforo: nuevoColor as any } : l
      ))
      setSelected(prev => prev ? { ...prev, color_semaforo: nuevoColor as any } : null)
      setGuardado(true)
      setEditando(false)
      setTimeout(() => setGuardado(false), 2000)
    } finally {
      setGuardando(false)
    }
  }

  const direccion = (l: Lugar) =>
    l.descripcion?.split(' | ')[1]?.split('|')[0]?.trim() ?? ''

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <span>🌍</span>
          <span className="font-bold text-[#D4A017]">TerraVE</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/map" className="text-xs text-white/50 hover:text-white">🗺️ Mapa</Link>
          <Link href="/report" className="btn-secondary text-xs px-3 py-1.5">+ Reportar</Link>
        </div>
      </nav>

      {selected ? (
        /* ── Vista detalle ── */
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-4 gap-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <button onClick={() => { setSelected(null); setEditando(false) }} className="text-white/40 hover:text-white text-xl mt-0.5">←</button>
            <div>
              <h1 className="font-semibold text-base leading-tight">{selected.nombre}</h1>
              <p className="text-xs text-white/35 mt-0.5 line-clamp-2">{direccion(selected)}</p>
            </div>
          </div>

          {/* Semáforo */}
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: SEMAFORO_COLOR[selected.color_semaforo ?? 'gris'] + '22',
                color: SEMAFORO_COLOR[selected.color_semaforo ?? 'gris']
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: SEMAFORO_COLOR[selected.color_semaforo ?? 'gris'] }} />
              {SEMAFORO_LABEL[selected.color_semaforo ?? 'gris']}
            </span>
            {guardado
              ? <span className="text-xs text-green-400">✓ Guardado</span>
              : <button onClick={() => setEditando(e => !e)} className="text-xs text-[#D4A017]">
                  {editando ? 'Cancelar' : '✏️ Editar daño'}
                </button>
            }
          </div>

          {/* Selector manual */}
          {editando && (
            <div className="grid grid-cols-2 gap-2">
              {OPCIONES_DANO.map(op => (
                <button
                  key={op.clase}
                  onClick={() => guardarDano(op.clase, op.color)}
                  disabled={guardando}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <span className="text-xl">{op.emoji}</span>
                  <span className="text-xs font-medium">{op.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Fotos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Antes</span>
              {selected.foto_antes
                ? <img src={selected.foto_antes} alt="antes" className="w-full h-44 object-cover rounded-xl" />
                : <div className="h-44 bg-white/5 rounded-xl flex flex-col items-center justify-center text-white/20 text-xs gap-1"><span className="text-3xl">🗺️</span>Sin foto</div>
              }
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Después</span>
              {selected.reporte?.foto_despues
                ? <img src={selected.reporte.foto_despues} alt="después" className="w-full h-44 object-cover rounded-xl" />
                : <div className="h-44 bg-white/5 rounded-xl flex flex-col items-center justify-center text-white/20 text-xs gap-1"><span className="text-3xl">📷</span>Sin foto</div>
              }
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-4 pt-1">
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selected.lat},${selected.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#D4A017] hover:underline"
            >
              Ver en Street View →
            </a>
            <a href={`/classify?lugar_id=${selected.id}`} className="text-xs text-[#E74C3C] hover:underline">
              Reportar daño
            </a>
          </div>
        </div>
      ) : (
        /* ── Vista lista ── */
        <div className="flex-1 flex flex-col">
          {/* Buscador */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-white/30">🔍</span>
              <input
                type="text"
                value={buscar}
                onChange={e => setBuscar(e.target.value)}
                placeholder="Buscar por nombre o dirección..."
                className="bg-transparent text-white text-sm placeholder:text-white/25 outline-none flex-1"
              />
              {buscar && (
                <button onClick={() => setBuscar('')} className="text-white/30 hover:text-white text-lg leading-none">×</button>
              )}
            </div>
            <p className="text-xs text-white/30 mt-2">
              {loading ? 'Cargando…' : `${lugares.length} lugar${lugares.length !== 1 ? 'es' : ''}`}
            </p>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-white/30 text-sm animate-pulse">Cargando…</div>
            ) : lugares.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-white/20 text-sm gap-2">
                <span className="text-3xl">📭</span>Sin resultados
              </div>
            ) : (
              lugares.map(l => {
                const color = l.color_semaforo ?? 'gris'
                const foto  = l.foto_antes ?? l.reporte?.foto_despues ?? null
                return (
                  <button
                    key={l.id}
                    onClick={() => setSelected(l)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/5">
                      {foto
                        ? <img src={foto} alt={l.nombre} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">🏢</div>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{l.nombre}</p>
                      <p className="text-xs text-white/35 truncate mt-0.5">{direccion(l)}</p>
                    </div>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: SEMAFORO_COLOR[color] }} />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
