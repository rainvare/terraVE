// app/api/geojson/route.ts
// Endpoint optimizado que devuelve todos los lugares como GeoJSON
// en una sola query sin joins pesados — solo lat/lng/color para el mapa
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const COLOR_MAP: Record<string, string> = {
  verde:    '#27AE60',
  amarillo: '#F1C40F',
  naranja:  '#E67E22',
  rojo:     '#E74C3C',
  gris:     '#95A5A6',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tipo   = searchParams.get('tipo')
  const estado = searchParams.get('estado')
  const buscar = searchParams.get('buscar')?.trim()

  const supabase = createServerClient()

  // Query liviana: solo los campos que necesita el mapa
  let query = supabase
    .from('lugares')
    .select('id, nombre, tipo, lat, lng, color_semaforo, estado, foto_antes')

  if (tipo   && tipo   !== 'todos') query = query.eq('tipo', tipo)
  if (estado && estado !== 'todos') query = query.eq('color_semaforo', estado)
  if (buscar) query = query.or(`nombre.ilike.%${buscar}%,descripcion.ilike.%${buscar}%`)

  // Supabase permite hasta 50k con range encadenados
  // Usamos limit alto + postgrest header
  const { data, error } = await query
    .limit(50000)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const features = (data ?? []).map((l: any) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
    properties: {
      id:             l.id,
      nombre:         l.nombre,
      tipo:           l.tipo,
      color_semaforo: l.color_semaforo ?? 'gris',
      foto_antes:     l.foto_antes,
      color:          COLOR_MAP[l.color_semaforo ?? 'gris'] ?? '#95A5A6',
    },
  }))

  const stats = {
    total:     features.length,
    evaluados: (data ?? []).filter((l: any) => l.color_semaforo && l.color_semaforo !== 'gris').length,
    criticos:  (data ?? []).filter((l: any) => ['naranja', 'rojo'].includes(l.color_semaforo)).length,
  }

  return NextResponse.json(
    { type: 'FeatureCollection', features, stats },
    {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      }
    }
  )
      }
    
