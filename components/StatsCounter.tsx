'use client'
// components/StatsCounter.tsx
import { useEffect, useState } from 'react'

interface Stats {
  total: number
  evaluados: number
  criticos: number
}

export default function StatsCounter() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/lugares')
      .then(r => r.json())
      .then(data => setStats(data.stats))
      .catch(() => {}) // Silencia error si no hay datos aún
  }, [])

  const items = [
    { label: 'Lugares registrados', value: stats?.total ?? '—', icon: '📍' },
    { label: 'Estructuras evaluadas', value: stats?.evaluados ?? '—', icon: '🔍' },
    { label: 'Zonas críticas', value: stats?.criticos ?? '—', icon: '🔴' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-center text-white/40 text-xs uppercase tracking-widest mb-6">
        Datos en tiempo real
      </p>
      <div className="grid grid-cols-3 gap-6 text-center">
        {items.map(item => (
          <div key={item.label}>
            <div className="text-3xl md:text-4xl font-bold text-[#D4A017] mb-1">
              {item.icon} {item.value}
            </div>
            <div className="text-white/40 text-sm">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
