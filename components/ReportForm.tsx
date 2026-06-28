'use client'
// components/ReportForm.tsx
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { obtenerGPS } from '@/lib/geo'
import type { TipoLugar } from '@/types'

const TIPOS: { value: TipoLugar; label: string; icon: string }[] = [
  { value: 'escuela',  label: 'Escuela',  icon: '🏫' },
  { value: 'clinica',  label: 'Clínica',  icon: '🏥' },
  { value: 'farmacia', label: 'Farmacia', icon: '💊' },
  { value: 'mercado',  label: 'Mercado',  icon: '🛒' },
  { value: 'otro',     label: 'Otro',     icon: '📌' },
]

type UbicacionMode = 'gps' | 'direccion' | 'manual'

function FotoUpload({ label, hint, preview, onChange }: {
  label: string; hint: string; preview: string | null; onChange: (b: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 800
        let { width, height } = img
        if (width > MAX) { height = height * MAX / width; width = MAX }
        if (height > MAX) { width = width * MAX / height; height = MAX }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        onChange(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }
  return (
    <div>
      <label className="label">{label}</label>
      <div onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        className="border border-dashed border-white/20 rounded-xl p-5 text-center cursor-pointer hover:border-[#D4A017]/50 hover:bg-[#D4A017]/5 transition-all"
      >
        {preview
          ? <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
          : <><div className="text-3xl mb-2">📸</div><p className="text-white/40 text-sm">{hint}</p></>
        }
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

export default function ReportForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '', tipo: '' as TipoLugar | '',
    descripcion: '', lat: '', lng: '', creado_por: '',
  })
  const [fotoDespues, setFotoDespues] = useState<string | null>(null)
  const [fotoAntes,   setFotoAntes]   = useState<string | null>(null)
  const [gpsStatus,   setGpsStatus]   = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [geocoding,   setGeocoding]   = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [direccion,   setDireccion]   = useState('')
  const [ubMode,      setUbMode]      = useState<UbicacionMode>('gps')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [duplicados,  setDuplicados]  = useState<{id: string, nombre: string}[]>([])
  const [ignorarDup,  setIgnorarDup]  = useState(false)

  const handleGPS = async () => {
    setGpsStatus('loading')
    try {
      const { lat, lng } = await obtenerGPS()
      setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
      setGpsStatus('ok')
    } catch { setGpsStatus('error') }
  }

  const handleGeocode = async () => {
    if (!direccion.trim()) return
    setGeocoding('loading')
    try {
      const q   = encodeURIComponent(`${direccion}, Venezuela`)
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(direccion)}`)
      const d   = await res.json()
      if (d.lat) {
       setForm(f => ({ ...f, lat: d.lat.toFixed(6), lng: d.lng.toFixed(6) }))
       setGeocoding('ok')
    } else setGeocoding('error')
    } catch { setGeocoding('error') }
  }

  const buscarDuplicados = async (nombre: string) => {
    if (nombre.length < 3) return
    const res  = await fetch(`/api/lugares?buscar=${encodeURIComponent(nombre)}`)
    const data = await res.json()
    if (data.geojson?.features) {
      const hits = data.geojson.features
        .map((f: any) => ({ id: f.properties.id, nombre: f.properties.nombre }))
        .filter((l: any) => l.nombre.toLowerCase().includes(nombre.toLowerCase()))
        .slice(0, 3)
      setDuplicados(hits)
      setIgnorarDup(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.tipo || !form.lat || !form.lng) {
      setError('Completá nombre, tipo y ubicación.')
      return
    }
    if (duplicados.length > 0 && !ignorarDup) {
      setError('Ya existe un lugar con ese nombre. Confirmá si es distinto.')
      return
    }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, foto_antes: fotoAntes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error guardando')

      if (fotoDespues && data.id) {
        await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagen: fotoDespues, lugar_id: data.id, lat: form.lat, lng: form.lng }),
        })
      }
      setSubmitted(true)
      setTimeout(() => router.push('/map'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center fade-in-up">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-[#D4A017] mb-2">¡Lugar registrado!</h2>
        <p className="text-white/50 mb-6">Ya aparece en el mapa en tiempo real.</p>
        <p className="text-white/30 text-sm">Redirigiendo al mapa...</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Tipo */}
      <div>
        <label className="label">Tipo de lugar *</label>
        <div className="grid grid-cols-5 gap-2">
          {TIPOS.map(t => (
            <button key={t.value} type="button"
              onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                form.tipo === t.value
                  ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]'
                  : 'border-white/10 text-white/50 hover:border-white/30'
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="label">Nombre del lugar *</label>
        <input type="text" placeholder="Ej: Escuela Bolivariana Simón Bolívar"
          className="input-field" value={form.nombre} maxLength={100}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          onBlur={e => buscarDuplicados(e.target.value)} />

        {/* Aviso duplicados */}
        {duplicados.length > 0 && !ignorarDup && (
          <div className="mt-2 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-sm text-[#D4A017] font-medium">⚠️ Ya existe un lugar similar:</p>
            {duplicados.map(d => (
              <div key={d.id} className="flex items-center justify-between text-xs text-white/60">
                <span>{d.nombre}</span>
                <a href="/lugares" className="text-[#D4A017] hover:underline">Ver →</a>
              </div>
            ))}
            <button type="button" onClick={() => setIgnorarDup(true)}
              className="text-xs text-white/40 hover:text-white border border-white/10 rounded-lg py-2 transition-colors">
              No es el mismo, registrar igual
            </button>
          </div>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="label">Descripción</label>
        <textarea placeholder="¿Qué servicios prestaba? ¿A cuántas personas atendía?"
          className="input-field resize-none h-20" value={form.descripcion} maxLength={500}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      </div>

      {/* Ubicación */}
      <div>
        <label className="label">Ubicación *</label>
        <div className="flex gap-1 mb-3">
          {([['gps','📡 GPS'],['direccion','📍 Dirección'],['manual','⌨️ Coords']] as const).map(([mode, lbl]) => (
            <button key={mode} type="button"
              onClick={() => { setUbMode(mode); setGpsStatus('idle'); setGeocoding('idle') }}
              className={`flex-1 text-xs py-2 rounded-lg border transition-all ${
                ubMode === mode
                  ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017] font-semibold'
                  : 'border-white/10 text-white/40 hover:border-white/30'
              }`}
            >{lbl}</button>
          ))}
        </div>

        {ubMode === 'gps' && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleGPS} disabled={gpsStatus === 'loading'}
              className="btn-secondary text-sm py-2 flex items-center gap-2">
              {gpsStatus === 'loading' ? <span className="animate-spin">⏳</span> : '📡'}
              {gpsStatus === 'loading' ? 'Obteniendo...' : 'Usar mi ubicación'}
            </button>
            {gpsStatus === 'ok'    && <span className="text-sm text-[#27AE60]">✓ Capturado</span>}
            {gpsStatus === 'error' && <span className="text-sm text-[#E74C3C]">Error GPS</span>}
          </div>
        )}

        {ubMode === 'direccion' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Av. Libertador, Caracas"
                className="input-field flex-1 text-sm" value={direccion}
                onChange={e => { setDireccion(e.target.value); setGeocoding('idle') }}
                onKeyDown={e => e.key === 'Enter' && handleGeocode()} />
              <button type="button" onClick={handleGeocode}
                disabled={geocoding === 'loading' || !direccion.trim()}
                className="btn-secondary text-sm px-3 shrink-0">
                {geocoding === 'loading' ? '⏳' : '🔍'}
              </button>
            </div>
            {geocoding === 'ok'    && <span className="text-xs text-[#27AE60]">✓ {form.lat}, {form.lng}</span>}
            {geocoding === 'error' && <span className="text-xs text-[#E74C3C]">No encontrada. Intentá ser más específico.</span>}
          </div>
        )}

        {ubMode === 'manual' && (
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.000001" placeholder="Latitud (10.4806)"
              className="input-field text-sm" value={form.lat}
              onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
            <input type="number" step="0.000001" placeholder="Longitud (-66.9036)"
              className="input-field text-sm" value={form.lng}
              onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
          </div>
        )}

        {form.lat && form.lng && ubMode !== 'manual' && (
          <p className="text-xs text-white/30 mt-2">📌 {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}</p>
        )}
      </div>

      {/* Foto daño actual */}
      <FotoUpload
        label="Foto del estado actual"
        hint="Seleccioná de tu galería o sacá una foto ahora"
        preview={fotoDespues}
        onChange={setFotoDespues}
      />

      {/* Foto de antes */}
      <FotoUpload
        label="Foto de antes (opcional)"
        hint="De Google Maps, redes sociales, etc."
        preview={fotoAntes}
        onChange={setFotoAntes}
      />

      {/* Nombre usuario */}
      <div>
        <label className="label">Tu nombre (opcional)</label>
        <input type="text" placeholder="Anónimo" className="input-field"
          value={form.creado_por} maxLength={60}
          onChange={e => setForm(f => ({ ...f, creado_por: e.target.value }))} />
      </div>

      {error && (
        <div className="bg-[#E74C3C]/10 border border-[#E74C3C]/30 rounded-lg px-4 py-3 text-sm text-[#E74C3C]">
          ⚠️ {error}
        </div>
      )}

      <button type="button" onClick={handleSubmit} disabled={submitting}
        className="btn-primary w-full text-base py-4">
        {submitting ? '⏳ Guardando...' : '📍 Registrar lugar en el mapa'}
      </button>
    </div>
  )
    }
             
