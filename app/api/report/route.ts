// app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { TipoLugar } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, tipo, descripcion, lat, lng, foto_antes, creado_por } = body

    if (!nombre || !tipo || !lat || !lng) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: nombre, tipo, lat, lng' },
        { status: 400 }
      )
    }

    const tiposValidos: TipoLugar[] = ['escuela', 'clinica', 'farmacia', 'mercado', 'otro']
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Opciones: ${tiposValidos.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    let fotoUrl: string | undefined

    if (foto_antes && foto_antes.startsWith('data:image')) {
      const base64Data = foto_antes.split(',')[1]
      const buffer     = Buffer.from(base64Data, 'base64')
      const fileName   = `antes_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-antes')
        .upload(fileName, buffer, { contentType: 'image/jpeg', cacheControl: '3600' })

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('fotos-antes')
          .getPublicUrl(uploadData.path)
        fotoUrl = publicUrl
      }
    } else if (foto_antes && foto_antes.startsWith('http')) {
      fotoUrl = foto_antes
    }

    const { data, error } = await supabase
      .from('lugares')
      .insert({
        nombre:      nombre.trim(),
        tipo,
        descripcion: descripcion?.trim(),
        lat:         parseFloat(lat),
        lng:         parseFloat(lng),
        foto_antes:  fotoUrl,
        creado_por:  creado_por?.trim() || 'Anónimo',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error Supabase insert lugares:', error)
      return NextResponse.json({ error: 'Error guardando el lugar.' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, success: true }, { status: 201 })

  } catch (err) {
    console.error('Error inesperado /api/report:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
