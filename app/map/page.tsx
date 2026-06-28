// app/map/page.tsx
import Link    from 'next/link'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), {
  ssr:     false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0D1B2A]">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🗺️</div>
        <p className="text-white/40 text-sm">Cargando mapa...</p>
      </div>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Nav compacta */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0D1B2A] z-30 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <span>🌍</span>
          <span className="font-display font-bold text-[#D4A017]">TerraVE</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Nuevos botones de análisis */}
          <Link href="/satelital" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
            🛰️ Satelital
          </Link>
          <Link href="/dashboard" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
            📊 Dashboard
          </Link>
          <Link href="/report"    className="btn-secondary text-xs px-3 py-1.5">+ Reportar</Link>
          <Link href="/classify"  className="btn-primary   text-xs px-3 py-1.5">📷 Evaluar</Link>
        </div>
      </nav>

      {/* Mapa ocupa todo lo que queda */}
      <div className="flex-1 relative">
        <Map />
      </div>
    </div>
  )
}
