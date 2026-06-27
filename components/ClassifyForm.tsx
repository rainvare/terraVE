'use client'
// components/ClassifyForm.tsx
import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { ClasificacionResult } from '@/types'

const COLOR_META = {
  verde:    { emoji: '🟢', label: 'Sin daño',   bg: '#27AE60', text: '#D5F5E3' },
  amarillo: { emoji: '🟡', label: 'Daño menor',  bg: '#F1C40F', text: '#FDEBD0' },
  naranja:  { emoji: '🟠', label: 'Daño mayor',  bg: '#E67E22', text: '#FAD7A0' },
  rojo:     { emoji: '🔴', label: 'Destruido',   bg: '#E74C3C', text: '#FADBD8' },
  gris:     { emoji: '⚪', label: 'Sin evaluar', bg: '#95A5A6', text: '#EAECEE' },
}

export default function ClassifyForm() {
  const searchParams = useSearchParams()
  const lugar_id = searchParams.get('lugar_id')
  const lat      = searchParams.get('lat')
  const lng      = searchParams.get('lng')

  const [imagen,     setImagen]     = useState<string | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [resultado,  setResultado]  = useState<ClasificacionResult | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [guardado,   setGuardado]   = useState(false)

  const fileRef     = useRef<HTMLInputElement>(null)
  const cameraRef   = useRef<HTMLInputElement>(null)

  const processImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX    = 800
        let { width, height } = img
        if (width > MAX) { height = height * MAX / width; width = MAX }
        if (height > MAX) { width = width * MAX / height; height = MAX }
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        setImagen(compressed)
        setPreview(compressed)
        setResultado(null)
        setError(null)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImage(file)
  }

  const handleClassify = async () => {
    if (!imagen) return

    setLoading(true)
    setError(null)
    setResultado(null)

    try {
      const res = await fetch('/api/classify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imagen, lugar_id, lat, lng }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error clasificando imagen')

      setResultado({
        clase:         data.clase,
        confianza:     data.confianza,
        color:         data.color,
        etiqueta:      data.etiqueta,
        recomendacion: data.recomendacion,
      })
      setGuardado(true)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const meta = resultado ? (COLOR_META[resultado.color] ?? COLOR_META.gris) : null
  const confianzaPct = resultado ? Math.round(resultado.confianza * 100) : 0

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Zona de carga de foto */}
      <div>
        <label className="label">Foto del edificio ahora *</label>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="btn-secondary py-4 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">📷</span>
            <span className="text-sm">Tomar foto</span>
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="btn-secondary py-4 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">🖼️</span>
            <span className="text-sm">Subir imagen</span>
          </button>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
               className="hidden" onChange={handleFile} />
        <input ref={fileRef}   type="file" accept="image/*"
               className="hidden" onChange={handleFile} />

        {preview && (
          <div className="relative rounded-xl overflow-hidden fade-in-up">
            <img src={preview} alt="Edificio a evaluar" className="w-full max-h-64 object-cover" />
            <button
              onClick={() => { setImagen(null); setPreview(null); setResultado(null) }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 
                         flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              ×
            </button>
          </div>
        )}

        {!preview && (
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-white/20 rounded-xl p-10 text-center cursor-pointer
                       hover:border-[#D4A017]/50 hover:bg-[#D4A017]/5 transition-all"
          >
            <div className="text-4xl mb-2">🏚️</div>
            <p className="text-white/40 text-sm">Sube una foto del edificio actual</p>
          </div>
        )}
      </div>

      {/* Link a lugar si hay lugar_id */}
      {lugar_id && (
        <div className="bg-[#D4A017]/10 border border-[#D4A017]/20 rounded-lg px-4 py-3 text-sm text-[#D4A017]">
          📍 Evaluando para lugar registrado en el mapa
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#E74C3C]/10 border border-[#E74C3C]/30 rounded-lg px-4 py-3 text-sm text-[#E74C3C]">
          ⚠️ {error}
          {error.includes('HF_TOKEN') && (
            <p className="mt-1 text-xs text-[#E74C3C]/70">
              Configura tu token de Hugging Face en .env.local
            </p>
          )}
        </div>
      )}

      {/* Botón clasificar */}
      {imagen && !resultado && (
        <button
          type="button"
          onClick={handleClassify}
          disabled={loading}
          className="btn-primary w-full text-base py-4 fade-in-up"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-[#0D1B2A]/30 border-t-[#0D1B2A] rounded-full animate-spin" />
              Analizando con IA...
            </span>
          ) : (
            '🔍 Clasificar daño estructural'
          )}
        </button>
      )}

      {/* Resultado */}
      {resultado && meta && (
        <div
          className="rounded-xl overflow-hidden border fade-in-up"
          style={{ borderColor: meta.bg + '55' }}
        >
          {/* Semáforo principal */}
          <div
            className="px-6 py-6 text-center"
            style={{ background: meta.bg + '22' }}
          >
            <div className="text-5xl mb-3">{meta.emoji}</div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: meta.bg }}>
              {resultado.etiqueta}
            </h2>

            {/* Barra de confianza */}
            <div className="max-w-xs mx-auto mt-3">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>Confianza del modelo</span>
                <span>{confianzaPct}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${confianzaPct}%`, background: meta.bg }}
                />
              </div>
            </div>
          </div>

          {/* Recomendación */}
          <div className="px-6 py-4 bg-white/5">
            <p className="text-sm font-semibold text-white/80 mb-1">📋 Recomendación</p>
            <p className="text-sm text-white/60 leading-relaxed">{resultado.recomendacion}</p>
          </div>

          {/* Acciones */}
          <div className="px-6 py-4 flex gap-3">
            <Link href="/map" className="btn-primary flex-1 text-center text-sm py-2">
              Ver en mapa
            </Link>
            <button
              onClick={() => { setImagen(null); setPreview(null); setResultado(null); setGuardado(false) }}
              className="btn-secondary flex-1 text-sm py-2"
            >
              Nueva foto
            </button>
          </div>

          {guardado && (
            <div className="px-6 pb-4 text-center text-xs text-white/30">
              ✓ Resultado guardado en la base de datos
            </div>
          )}
        </div>
      )}

      {/* Ayuda */}
      <div className="card text-sm text-white/40 space-y-1">
        <p className="font-medium text-white/60 mb-2">💡 Mejores resultados</p>
        <p>• Foto clara del frente del edificio, bien iluminada</p>
        <p>• Sin personas ni vehículos bloqueando la vista</p>
        <p>• Ángulo recto, a nivel del suelo</p>
        <p>• Foto reciente, post-desastre</p>
      </div>
    </div>
  )
}
