// app/page.tsx
import Link from 'next/link'
import StatsCounter from '@/components/StatsCounter'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌍</span>
          <span className="font-display text-xl font-bold text-[#D4A017]">TerraVE</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/map"      className="text-sm text-white/70 hover:text-white transition-colors">Mapa</Link>
          <Link href="/report"   className="text-sm text-white/70 hover:text-white transition-colors">Reportar</Link>
          <Link href="/classify" className="btn-primary text-sm px-4 py-2">Evaluar daño</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
          <span className="text-[#D4A017] text-sm font-medium">Build 4 Venezuela 2026</span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 max-w-4xl">
          Dos preguntas.<br />
          <span className="text-[#D4A017]">Un mapa vivo.</span>
        </h1>

        <p className="text-white/60 text-lg md:text-xl max-w-xl mb-4 leading-relaxed">
          TerraVE combina <strong className="text-white">memoria ciudadana</strong> con{' '}
          <strong className="text-white">visión computacional</strong> para responder lo que más importa
          después de un desastre.
        </p>

        {/* Las 2 preguntas clave */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 mt-4">
          <div className="card text-left max-w-xs">
            <div className="text-2xl mb-2">🏚️</div>
            <p className="text-[#D4A017] font-semibold mb-1">¿Qué existía aquí?</p>
            <p className="text-white/50 text-sm">Levantamiento ciudadano de infraestructura perdida: escuelas, clínicas, mercados.</p>
          </div>
          <div className="card text-left max-w-xs">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-[#D4A017] font-semibold mb-1">¿Qué quedó en pie?</p>
            <p className="text-white/50 text-sm">Clasificación automática de daño estructural por foto usando IA.</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/report" className="btn-primary text-base px-8 py-4">
            📍 Reportar un lugar
          </Link>
          <Link href="/map" className="btn-secondary text-base px-8 py-4">
            🗺️ Ver el mapa
          </Link>
        </div>
      </section>

      {/* Stats en tiempo real */}
      <section className="border-t border-white/10 px-6 py-8">
        <StatsCounter />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4 flex items-center justify-between text-white/30 text-sm">
        <span>TerraVE v1.0 — Build 4 Venezuela Hackathon 2026</span>
        <div className="flex gap-4">
          <span>Stack 100% gratuito</span>
          <span>·</span>
          <a href="https://build4venezuela.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4A017] transition-colors">
            build4venezuela.com
          </a>
        </div>
      </footer>
    </main>
  )
}
