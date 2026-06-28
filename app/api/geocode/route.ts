// app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Falta address' }, { status: 400 })

  const key = process.env.GOOGLE_MAPS_KEY
  if (!key) return NextResponse.json({ error: 'Sin API key' }, { status: 500 })

  const query = `${address}, Venezuela`
  const url   = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`

  const res  = await fetch(url)
  const data = await res.json()

  // Devolver respuesta completa para debug
  if (data.status !== 'OK' || !data.results?.[0]) {
    return NextResponse.json({ 
      error:  'No encontrada',
      status: data.status,
      query,
    }, { status: 404 })
  }

  const { lat, lng } = data.results[0].geometry.location
  return NextResponse.json({ lat, lng })
}
