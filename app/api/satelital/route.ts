// app/api/satelital/route.ts
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const headers = {
  apikey:        SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Parámetros opcionales
  const limit  = searchParams.get('limit')  ?? '1000'
  const offset = searchParams.get('offset') ?? '0'
  const minArea = searchParams.get('min_area') // filtro por área mínima en m²

  // Bounding box opcional
  const latMin = searchParams.get('lat_min')
  const latMax = searchParams.get('lat_max')
  const lngMin = searchParams.get('lng_min')
  const lngMax = searchParams.get('lng_max')

  let url = `${SUPABASE_URL}/rest/v1/dano_satelital`
    + `?select=id,centro_lat,centro_lng,area_m2,fuente,fecha_imagen`
    + `&limit=${limit}&offset=${offset}`
    + `&order=area_m2.desc`

  if (minArea) url += `&area_m2=gte.${minArea}`
  if (latMin)  url += `&centro_lat=gte.${latMin}`
  if (latMax)  url += `&centro_lat=lte.${latMax}`
  if (lngMin)  url += `&centro_lng=gte.${lngMin}`
  if (lngMax)  url += `&centro_lng=lte.${lngMax}`

  try {
    const res  = await fetch(url, { headers })
    const data = await res.json()

    return NextResponse.json({
      fuente:      'TerraVE / Sentinel-1 GRD / Google Earth Engine',
      fecha_imagen: '2026-06-25',
      metodologia: 'Detección de cambio SAR — umbral -3dB backscatter',
      total:       data.length,
      offset:      Number(offset),
      limit:       Number(limit),
      data,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600',
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error al consultar datos satelitales' }, { status: 500 })
  }
}
  
