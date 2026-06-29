'use client'
// components/SatelitalPageClient.tsx
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SatelitalMap = dynamic(() => import('./SatelitalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0D1B2A]">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🛰️</div>
        <p className="text-white/40 text-sm">Cargando análisis satelital...</p>
      </div>
    </div>
  ),
})

export default function SatelitalPageClient() {
  return (
    <div className="flex flex-col h-screen">
      <nav className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0D1B2A] z-30 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <span>🌍</span>
          <span className="font-display font-bold text-[#D4A017]">TerraVE</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/map"       className="btn-secondary text-xs px-3 py-1.5">🗺️ Mapa</Link>
          <Link href="/dashboard" className="btn-secondary text-xs px-3 py-1.5">📊 Dashboard</Link>
          <Link href="/report"    className="btn-primary   text-xs px-3 py-1.5">+ Reportar</Link>
        </div>
      </nav>

      <div className="bg-[#0D1B2A] border-b border-white/10 px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70 inline-block" />
            Zona de daño SAR (Sentinel-1)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D4A017] inline-block" />
            Reporte coincidente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
            Reporte sin coincidencia
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-white/30 hidden sm:inline">📡 Sentinel-1 · 25 jun 2026</span>
            <a
              href="https://www.arcgis.com/home/webscene/viewer.html?webscene=c01ef4b6b74b4d25a39f7a1e4865be58"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#D4A017] hover:text-white border border-[#D4A017]/30 hover:border-white/30 rounded-lg px-2 py-1 transition-colors whitespace-nowrap"
            >
              🌐 Ver en 3D
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <SatelitalMap />
      </div>
    </div>
  )
}
