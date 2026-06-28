'use client'
// components/DashboardClient.tsx
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Stats {
  zonas_satelitales:   number
  area_danada_km2:     number
  reportes_ciudadanos: number
  coincidencias:       number
  zonas_con_reporte:   number
  municipios_criticos: number
  poblacion_critica:   number
}

interface Municipio {
  adm1_name:          string
  adm2_name:          string
  pop_total_expuesta:  number
  pop_mmi_viii:        number
  pop_mmi_ix:          number
}

interface Coincidencia {
  lugar_nombre:   string
  clase_dano:     string
  color_semaforo: string
  reporte_lat:    number
  reporte_lng:    number
  area_m2:        number
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const headers = {
  apikey:        SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
}

function StatCard({ label, value, sub, color }: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-[#0D1B2A] border border-white/10 rounded-xl p-4">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

function SemaforoColor({ color }: { color: string }) {
  const map: Record<string, string> = {
    rojo:     'bg-red-500',
    naranja:  'bg-orange-500',
    amarillo: 'bg-yellow-400',
    verde:    'bg-green-500',
  }
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[color] ?? 'bg-gray-400'}`} />
}

export default function DashboardClient() {
  const [stats,         setStats]         = useState<Stats | null>(null)
  const [municipios,    setMunicipios]    = useState<Municipio[]>([])
  const [coincidencias, setCoincidencias] = useState<Coincidencia[]>([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const [sRes, mRes, cRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/stats_dashboard?limit=1`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/poblacion_expuesta?zona_critica=eq.true&order=pop_total_expuesta.desc&limit=15&select=adm1_name,adm2_name,pop_total_expuesta,pop_mmi_viii,pop_mmi_ix`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/coincidencias_satelital?select=lugar_nombre,clase_dano,color_semaforo,reporte_lat,reporte_lng,area_m2&limit=50`, { headers }),
        ])
        const [sData, mData, cData] = await Promise.all([sRes.json(), mRes.json(), cRes.json()])
        if (sData[0]) setStats(sData[0])
        setMunicipios(mData)
        setCoincidencias(cData)
      } catch (e) {
        console.error('Error dashboard:', e)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#060F1A] text-white">
      <nav className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0D1B2A] sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <span>🌍</span>
          <span className="font-display font-bold text-[#D4A017]">TerraVE</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/map"       className="btn-secondary text-xs px-3 py-1.5">🗺️ Mapa</Link>
          <Link href="/satelital" className="btn-secondary text-xs px-3 py-1.5">🛰️ Satelital</Link>
          <Link href="/report"    className="btn-primary   text-xs px-3 py-1.5">+ Reportar</Link>
        </div>
      </nav>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Dashboard de impacto</h1>
          <p className="text-xs text-white/40 mt-1">
            Sentinel-1 SAR + Reportes ciudadanos + UNOSAT · 24 jun 2026
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-white/30 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
              Cargando datos...
            </div>
          </div>
        ) : (
          <>
            <section className="mb-6">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Resumen general</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Área afectada"     value={`${Number(stats?.area_danada_km2 ?? 0).toFixed(1)} km²`} sub="Detección SAR"    color="text-red-400" />
                <StatCard label="Coincidencias"     value={stats?.coincidencias ?? 0}                               sub="SAR + ciudadano"  color="text-[#D4A017]" />
                <StatCard label="Población crítica" value={Number(stats?.poblacion_critica ?? 0).toLocaleString()}  sub="Intensidad VII+"  color="text-orange-400" />
                <StatCard label="Municipios"        value={stats?.municipios_criticos ?? 0}                         sub="Zona VII o sup."  color="text-blue-400" />
              </div>
            </section>

            <section className="mb-6">
              <div className="bg-[#0D1B2A] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Cobertura ciudadana</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div
                      className="bg-[#D4A017] h-2 rounded-full"
                      style={{ width: `${stats ? Math.min(100, (stats.zonas_con_reporte / (stats.zonas_satelitales || 1)) * 100 * 1000) : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/50 whitespace-nowrap">
                    {stats?.zonas_con_reporte ?? 0} / {stats?.zonas_satelitales ?? 0} zonas con reporte
                  </p>
                </div>
                <p className="text-xs text-white/30 mt-2">
                  ⚠️ {Number(stats?.zonas_satelitales ?? 0) - Number(stats?.zonas_con_reporte ?? 0)} zonas sin reporte ciudadano
                </p>
              </div>
            </section>

            {coincidencias.length > 0 && (
              <section className="mb-6">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Edificios con daño confirmado</p>
                <div className="bg-[#0D1B2A] border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40">
                        <th className="text-left px-4 py-2">Lugar</th>
                        <th className="text-left px-4 py-2">Daño</th>
                        <th className="text-right px-4 py-2">Área SAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coincidencias.map((c, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-2 text-white/80">
                            {c.lugar_nombre || `${c.reporte_lat?.toFixed(4)}, ${c.reporte_lng?.toFixed(4)}`}
                          </td>
                          <td className="px-4 py-2">
                            <span className="flex items-center gap-1.5">
                              <SemaforoColor color={c.color_semaforo} />
                              <span className="text-white/60 capitalize">{c.clase_dano || '—'}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-white/40">
                            {c.area_m2 ? `${Number(c.area_m2).toFixed(0)} m²` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="mb-6">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Municipios con mayor exposición (VII+)</p>
              <div className="flex flex-col gap-2">
                {municipios.map((m, i) => {
                  const maxPop = municipios[0]?.pop_total_expuesta || 1
                  const pct    = (m.pop_total_expuesta / maxPop) * 100
                  return (
                    <div key={i} className="bg-[#0D1B2A] border border-white/10 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-sm text-white font-medium">{m.adm2_name}</span>
                          <span className="text-xs text-white/40 ml-2">{m.adm1_name}</span>
                        </div>
                        <span className="text-sm font-bold text-orange-400">
                          {Number(m.pop_total_expuesta).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-full h-1.5">
                        <div className="bg-orange-500/60 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      {((m.pop_mmi_viii ?? 0) + (m.pop_mmi_ix ?? 0)) > 0 && (
                        <p className="text-xs text-red-400/70 mt-1">
                          ⚠️ {Number((m.pop_mmi_viii ?? 0) + (m.pop_mmi_ix ?? 0)).toLocaleString()} en zona Severa/Violenta
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <div className="flex justify-center pb-6">
              <Link href="/satelital" className="btn-secondary text-sm px-6 py-2.5 flex items-center gap-2">
                🛰️ Ver mapa de zonas SAR
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
