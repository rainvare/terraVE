'use client'
// components/ClassifyForm.tsx
import { useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const COLOR_HEX: Record<string, string> = {
  verde:    '#27AE60',
  amarillo: '#F1C40F',
  naranja:  '#E67E22',
  rojo:     '#E74C3C',
  gris:     '#95A5A6',
}

export default function ClassifyForm() {
  const searchParams = useSearchParams()
  const lugar_id     = searchParams.get('lugar_id')

  const [preview,   setPreview]   = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error,     setError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setResultado(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!preview) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/classify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imagen: preview, lugar_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error del servidor')
      setResultado(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Upload */}
      {!resultado && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#D4A017]/50 hover:bg-white/5 transition-all"
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full max-h-64 object-cover rounded-xl" />
            ) : (
              <>
                <span className="text-4xl">📷</span>
                <p className="text-white/50 text-sm text-center">
                  Tocá para seleccionar una foto<br />
                  <span className="text-white/30 text-xs">o arrastrá aquí</span>
                </p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {preview && (
            <div className="flex gap-3">
              <button
                onClick={() => { setPreview(null); setResultado(null) }}
                className="flex-1 py-3 rounded-xl border border-white/20 text-white/50 text-sm hover:bg-white/5 transition-colors"
              >
                Cambiar foto
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#D4A017] text-[#0D1B2A] font-semibold text-sm hover:bg-[#D4A017]/90 disabled:opacity-50 transition-colors"
              >
                {loading ? '⏳ Guardando…' : '📤 Subir foto'}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
              ❌ {error}
            </div>
          )}
        </>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="flex flex-col gap-4">
          {/* Foto subida */}
          {preview && (
            <img src={preview} alt="foto subida" className="w-full max-h-56 object-cover rounded-xl" />
          )}

          {/* Estado IA */}
          {resultado.ia_disponible ? (
            <div
              className="rounded-2xl p-5 flex flex-col gap-2"
              style={{ background: COLOR_HEX[resultado.color] + '15', border: `1px solid ${COLOR_HEX[resultado.color]}40` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: COLOR_HEX[resultado.color] }} />
                <span className="font-semibold text-sm" style={{ color: COLOR_HEX[resultado.color] }}>
                  {resultado.etiqueta}
                </span>
                <span className="text-white/30 text-xs ml-auto">
                  {(resultado.confianza * 100).toFixed(0)}% confianza
                </span>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">{resultado.recomendacion}</p>
            </div>
          ) : (
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📸</span>
                <span className="font-semibold text-sm text-white">Foto guardada</span>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                La IA no está disponible ahora. Podés clasificar el daño manualmente desde{' '}
                <Link href="/lugares" className="text-[#D4A017] hover:underline">la lista de lugares</Link>.
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={() => { setPreview(null); setResultado(null); setError(null) }}
              className="flex-1 py-3 rounded-xl border border-white/20 text-white/50 text-sm hover:bg-white/5 transition-colors"
            >
              Subir otra foto
            </button>
            <Link
              href="/map"
              className="flex-1 py-3 rounded-xl bg-[#D4A017] text-[#0D1B2A] font-semibold text-sm text-center hover:bg-[#D4A017]/90 transition-colors"
            >
              Ver en mapa →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
        }
    
