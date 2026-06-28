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

export default function ReportForm() {
  const router = useRouter()

  const [form, setForm] = useState({
    nombre:      '',
    tipo:        '' as TipoLugar | '',
    descripcion: '',
    lat:         '',
    lng:         '',
    creado_por:  '',
  })
  const [foto,          setFoto]          = useState<string | null>(null)
  const [preview,       setPreview]       = useState<string | null>(null)
  const [gpsStatus,     setGpsStatus]     = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [submitting,    setSubmitting]    = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [ubMode,        setUbMode]        = useState<UbicacionMode>('gps')
  const [direccion,     setDireccion]     = useState('')
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const fileRef = useRef<HTMLInputElement>(null)

  const handleGPS = async () => {
    setGpsStatus('loading')
    try {
      const { lat, lng } = await obtenerGPS()
      setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
      setGpsStatus('ok')
    } catch {
      setGpsStatus('error')
    }
  }

  const handleGeocode = async () => {
    if (!direccion.trim()) return
    setGeocodingStatus('loading')
    try {
      const query   = encodeURIComponent(`${direccion}, Venezuela`)
      const apiKey  = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
      const res     = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`
      )
      const data    = await res.json()
      if (data.status === 'OK' && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location
        setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
        setGeocodingStatus('ok')
      } else {
        setGeocodingStatus('error')
      }
    } catch {
      setGeocodingStatus('error')
    }
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 800
        let { width, height } = img
        if (width > MAX) { height = height * MAX / width; width = MAX }
        if (height > MAX) { width = width * MAX / height; height = MAX }
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        setFoto(compressed)
        setPreview(compressed)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.tipo || !form.lat || !form.lng) {
      setError('Completá los campos obligatorios: nombre, tipo y ubicación.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, foto_antes: foto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error guardando el lugar')
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

  const coordsOk = form.lat && form.lng

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Tipo */}
      <div>
        <label className="label">Tipo de lugar *</label>
        <div className="grid grid-cols-5 gap-2">
          {TIPOS.map(t => (
            <button
              key={t.value}
              type="button"
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
        <input
          type="text"
          placeholder="Ej: Escuela Bolivariana Simón Bolívar"
          className="input-field"
          value={form.nombre}
          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          maxLength={100}
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="label">Descripción</label>
        <textarea
          placeholder="¿Qué servicios prestaba? ¿A cuántas personas atendía?"
          className="input-field resize-none h-20"
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          maxLength={500}
        />
      </div>

      {/* Ubicación */}
      <div>
        <label className="label">Ubicación *</label>

        {/* Selector de modo */}
        <div className="flex gap-1 mb-3">
          {([
            ['gps',      '📡 GPS'],
            ['direccion','📍 Dirección'],
            ['manual',   '⌨️ Coords'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setUbMode(mode); setGpsStatus('idle'); setGeocodingStatus('idle') }}
              className={`flex-1 text-xs py-2 rounded-lg border transition-all ${
                ubMode === mode
                  ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017] font-semibold'
                  : 'border-white/10 text-white/40 hover:border-white/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* GPS */}
        {ubMode === 'gps' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGPS}
              disabled={gpsStatus === 'loading'}
              className="btn-secondary text-sm py-2 flex items-center gap-2"
            >
              {gpsStatus === 'loading' ? <span className="animate-spin">⏳</span> : <span>📡</span>}
              {gpsStatus === 'loading' ? 'Obteniendo...' : 'Usar mi ubicación'}
            </button>
            {gpsStatus === 'ok'    && <span className="text-sm text-[#27AE60]">✓ Capturado</span>}
            {gpsStatus === 'error' && <span className="text-sm text-[#E74C3C]">Error GPS</span>}
          </div>
        )}

        {/* Dirección */}
        {ubMode === 'direccion' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Av. Libertador, Caracas, Venezuela"
                className="input-field flex-1 text-sm"
                value={direccion}
                onChange={e => { setDireccion(e.target.value); setGeocodingStatus('idle') }}
                onKeyDown={e => e.key === 'Enter' && handleGeocode()}
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={geocodingStatus === 'loading' || !direccion.trim()}
                className="btn-secondary text-sm px-3 shrink-0"
              >
                {geocodingStatus === 'loading' ? '⏳' : '🔍'}
              </button>
            </div>
            {geocodingStatus === 'ok' && (
              <span className="text-xs text-[#27AE60]">
                ✓ Ubicación encontrada — {form.lat}, {form.lng}
              </span>
            )}
            {geocodingStatus === 'error' && (
              <span className="text-xs text-[#E74C3C]">
                No se encontró la dirección. Intentá ser más específico o usá coordenadas.
              </span>
            )}
          </div>
        )}

        {/* Manual */}
        {ubMode === 'manual' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.000001"
              placeholder="Latitud (ej: 10.4806)"
              className="input-field text-sm"
              value={form.lat}
              onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
            />
            <input
              type="number"
              step="0.000001"
              placeholder="Longitud (ej: -66.9036)"
              className="input-field text-sm"
              value={form.lng}
              onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
            />
          </div>
        )}

        {/* Confirmación de coords */}
        {coordsOk && ubMode !== 'manual' && (
          <p className="text-xs text-white/30 mt-2">
            📌 {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
          </p>
        )}
      </div>

      {/* Foto */}
      <div>
        <label className="label">Foto de antes (opcional)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#D4A017]/50 hover:bg-[#D4A017]/5 transition-all"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
          ) : (
            <>
              <div className="text-3xl mb-2">📸</div>
              <p className="text-white/40 text-sm">Tocá para subir foto</p>
              <p className="text-white/20 text-xs mt-1">De Google Maps, redes sociales, etc.</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
      </div>

      {/* Nombre */}
      <div>
        <label className="label">Tu nombre (opcional)</label>
        <input
          type="text"
          placeholder="Anónimo"
          className="input-field"
          value={form.creado_por}
          onChange={e => setForm(f => ({ ...f, creado_por: e.target.value }))}
          maxLength={60}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#E74C3C]/10 border border-[#E74C3C]/30 rounded-lg px-4 py-3 text-sm text-[#E74C3C]">
          ⚠️ {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="btn-primary w-full text-base py-4"
      >
        {submitting ? '⏳ Guardando...' : '📍 Registrar lugar en el mapa'}
      </button>
    </div>
  )
    }
    
