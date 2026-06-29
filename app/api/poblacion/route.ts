// app/api/poblacion/route.ts
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const headers = {
  apikey:        SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const solocriticos = searchParams.get('criticos') !== 'false'
  const estado       = searchParams.get('estado')
  const pcode        = searchParams.get('pcode')
  const limit        = searchParams.get('limit') ?? '100'

  let url = `${SUPABASE_URL}/rest/v1/poblacion_expuesta`
    + `?select=adm1_name,adm2_name,adm2_pcode,centro_lat,centro_lng`
    + `,pop_mmi_ix,pop_mmi_viii,pop_mmi_vii,pop_mmi_vi,pop_mmi_v`
    + `,pop_total_expuesta,zona_critica`
    + `&order=pop_total_expuesta.desc`
    + `&limit=${limit}`

  if (solocriticos) url += `&zona_critica=eq.true`
  if (estado)        url += `&adm1_name=eq.${encodeURIComponent(estado)}`
  if (pcode)         url += `&adm2_pcode=eq.${pcode}`

  try {
    const res  = await fetch(url, { headers })
    const data = await res.json()

    return NextResponse.json({
      fuente:      'TerraVE / UNOSAT Live Webmap — M7.5 Caracas earthquake',
      fecha:       '2026-06-24',
      descripcion: 'Población expuesta por intensidad sísmica MMI por municipio',
      total:       data.length,
      data,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600',
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error al consultar datos de población' }, { status: 500 })
  }
}
