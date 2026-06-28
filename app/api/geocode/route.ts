// app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Falta address' }, { status: 400 })

  const key = process.env.GOOGLE_MAPS_KEY  // server-side, sin NEXT_PUBLIC_
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', Venezuela')}&key=${key}`

  const res  = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK' || !data.results[0]) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const { lat, lng } = data.results[0].geometry.location
  return NextResponse.json({ lat, lng })
}
