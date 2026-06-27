// app/report/page.tsx
import Link        from 'next/link'
import ReportForm  from '@/components/ReportForm'

export const metadata = {
  title: 'Reportar lugar — TerraVE',
  description: 'Registra un lugar que existía antes del desastre',
}

export default function ReportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span>🌍</span>
          <span className="font-display font-bold text-[#D4A017]">TerraVE</span>
        </Link>
        <Link href="/map" className="text-sm text-white/50 hover:text-white transition-colors">
          ← Ver mapa
        </Link>
      </nav>

      {/* Content */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-full px-4 py-1.5 mb-4">
              <span className="text-[#D4A017] text-sm">¿Qué existía aquí?</span>
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Registrar un lugar
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Ayuda a reconstruir la memoria de tu comunidad. Registra escuelas, clínicas,
              farmacias y otros lugares que existían antes del terremoto.
            </p>
          </div>

          <ReportForm />
        </div>
      </main>
    </div>
  )
}
