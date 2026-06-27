// app/api/lugares/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { lugaresToGeoJSON } from '@/lib/geo'
import type { Lugar } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tipo   = searchParams.get('tipo')
    const estado = searchParams.get('estado') // color_semaforo

    const supabase = createServerClient()

    // Query con join a reportes_dano para tener el estado de daño
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
      .order('created_at', { ascending: false })

    if (tipo && tipo !== 'todos') {
      query = query.eq('tipo', tipo)
    }

    const { data, error } = await query.limit(500)

    if (error) {
      console.error('Error obteniendo lugares:', error)
      return NextResponse.json(
        { error: 'Error consultando lugares' },
        { status: 500 }
      )
    }

    // El select de relación devuelve array, tomamos el más reciente
    const lugares: Lugar[] = (data || []).map((item: any) => ({
      ...item,
      reporte: Array.isArray(item.reporte) && item.reporte.length > 0
        ? item.reporte[0]
        : null,
    }))

    // Filtrar por estado de daño si se solicita
    const filtered = estado && estado !== 'todos'
      ? lugares.filter(l => l.reporte?.color_semaforo === estado)
      : lugares

    const geojson = lugaresToGeoJSON(filtered)

    // Stats para el contador
    const stats = {
      total:     filtered.length,
      evaluados: filtered.filter(l => l.reporte).length,
      criticos:  filtered.filter(l => l.reporte?.color_semaforo === 'rojo').length,
    }

    return NextResponse.json({ geojson, stats })

  } catch (err) {
    console.error('Error inesperado /api/lugares:', err)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
