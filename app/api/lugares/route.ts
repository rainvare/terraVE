// app/api/lugares/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { lugaresToGeoJSON } from '@/lib/geo'
import type { Lugar } from '@/types'

const COLOR_MAP: Record<string, string> = {
  verde:    '#27AE60',
  amarillo: '#F1C40F',
  naranja:  '#E67E22',
  rojo:     '#E74C3C',
  gris:     '#95A5A6',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tipo   = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const buscar = searchParams.get('buscar')?.trim()

    const supabase = createServerClient()

    // Supabase devuelve máx 1000 filas por defecto — paginamos para traer todos
    let allData: any[] = []
    let from = 0
    const PAGE = 1000

    while (true) {
      let query = supabase
        .from('lugares')
        .select(`
          *,
          reporte:reportes_dano(
            id,
            clase_dano,
            confianza,
            color_semaforo,
            foto_despues,
            created_at
          )
        `)
        .order('color_semaforo', { ascending: true })
        .range(from, from + PAGE - 1)

      if (tipo && tipo !== 'todos')  query = query.eq('tipo', tipo)
      if (buscar)                    query = query.or(`nombre.ilike.%${buscar}%,descripcion.ilike.%${buscar}%`)
      if (estado && estado !== 'todos') query = query.eq('color_semaforo', estado)

      // Solo lugares con foto (para rendimiento) — excepto al filtrar por estado
      if (!buscar && (!estado || estado === 'todos')) query = query.not('foto_antes', 'is', null)

      const { data: page, error: pageError } = await query

      if (pageError) {
        console.error('Error obteniendo lugares:', pageError)
        return NextResponse.json({ error: 'Error consultando lugares' }, { status: 500 })
      }

      if (!page || page.length === 0) break
      allData = allData.concat(page)
      if (page.length < PAGE) break
      from += PAGE
    }

    const lugares: Lugar[] = allData.map((item: any) => {
      const reporte = Array.isArray(item.reporte) && item.reporte.length > 0
        ? item.reporte[0]
        : null

      const colorKey = reporte?.color_semaforo ?? item.color_semaforo ?? 'gris'

      const reporteEfectivo = reporte ?? (item.color_semaforo && item.color_semaforo !== 'gris'
        ? {
            id:             null,
            clase_dano:     item.estado ?? 'sin_dano',
            confianza:      0,
            color_semaforo: item.color_semaforo,
            foto_despues:   '',
            created_at:     item.created_at,
          }
        : null)

      return {
        ...item,
        reporte: reporteEfectivo,
        color:   COLOR_MAP[colorKey] ?? '#95A5A6',
      }
    })

    const filtered = estado && estado !== 'todos'
      ? lugares.filter(l => (l.color_semaforo ?? 'gris') === estado)
      : lugares

    const geojson = lugaresToGeoJSON(filtered)

    const stats = {
      total:     filtered.length,
      evaluados: filtered.filter(l => l.reporte).length,
      criticos:  filtered.filter(l => l.reporte?.color_semaforo === 'rojo').length,
    }

    return NextResponse.json({ geojson, stats })

  } catch (err) {
    console.error('Error inesperado /api/lugares:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
    }
