// app/api/stats/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Total de lugares
    const { count: total } = await supabase
      .from('lugares')
      .select('*', { count: 'exact', head: true })

    // Evaluados (color distinto a gris)
    const { count: evaluados } = await supabase
      .from('lugares')
      .select('*', { count: 'exact', head: true })
      .neq('color_semaforo', 'gris')

    // Críticos (naranja + rojo)
    const { count: criticos } = await supabase
      .from('lugares')
      .select('*', { count: 'exact', head: true })
      .in('color_semaforo', ['naranja', 'rojo'])

    return NextResponse.json({ total, evaluados, criticos })
  } catch (err) {
    return NextResponse.json({ total: 0, evaluados: 0, criticos: 0 })
  }
}
