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

    const supabase = createServerClient()

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

    const lugares: Lugar[] = (data || []).map((item: any) => {
      // Tomar el reporte más reciente si existe
      const reporte = Array.isArray(item.reporte) && item.reporte.length > 0
        ? item.reporte[0]
        : null

      // Color: prioridad → reporte → color_semaforo de lugares → gris
      const colorKey = reporte?.color_semaforo
        ?? item.color_semaforo
        ?? 'gris'

      // Si no hay reporte pero hay color en lugares, crear reporte sintético
      // para que LeafletMap y PlaceCard lo lean correctamente
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

    // Filtrar por estado si se solicita
    const filtered = estado && estado !== 'todos'
      ? lugares.filter(l => (l.reporte?.color_semaforo ?? 'gris') === estado)
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
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
