// app/classify/page.tsx
import Link         from 'next/link'
import { Suspense } from 'react'
import ClassifyForm from '@/components/ClassifyForm'

export const metadata = {
  title: 'Evaluar daño — TerraVE',
  description: 'Sube una foto y la IA clasifica el daño estructural automáticamente',
}

export default function ClassifyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span>🌍</span>
          <span className="font-display font-bold text-[#D4A017]">TerraVE</span>
        </Link>
        <Link href="/map" className="text-sm text-white/50 hover:text-white transition-colors">
          ← Ver mapa
        </Link>
      </nav>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-lg mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-full px-4 py-1.5 mb-4">
              <span className="text-[#D4A017] text-sm">¿Qué quedó en pie?</span>
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Evaluar daño estructural
            </h1>
            <p className="text-white/50 text-sm leading-relaxed">
              Sube una foto del edificio y nuestra IA lo clasificará en segundos usando
              visión computacional. El resultado aparece en el mapa automáticamente.
            </p>

            {/* Leyenda semáforo */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { color: '#27AE60', label: 'Sin daño' },
                { color: '#F1C40F', label: 'Daño menor' },
                { color: '#E67E22', label: 'Daño mayor' },
                { color: '#E74C3C', label: 'Destruido' },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-white/40 text-center leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Suspense fallback={<div className="text-white/40 text-sm">Cargando formulario...</div>}>
            <ClassifyForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
