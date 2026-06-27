// app/api/classify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { classifyDamage } from '@/lib/classify'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imagen, lugar_id, lat, lng } = body

    if (!imagen) {
      return NextResponse.json(
        { error: 'Se requiere una imagen (base64 o URL)' },
        { status: 400 }
      )
    }

    // 1. Clasificar con Hugging Face
    const resultado = await classifyDamage(imagen)

    const supabase = createServerClient()

    // 2. Subir foto a Supabase Storage
    let fotoUrl: string = ''

    if (imagen.startsWith('data:image')) {
      const base64Data = imagen.split(',')[1]
      const buffer     = Buffer.from(base64Data, 'base64')
      const fileName   = `despues_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-despues')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        })

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('fotos-despues')
          .getPublicUrl(uploadData.path)
        fotoUrl = publicUrl
      }
    }

    // 3. Guardar reporte en Supabase
    const { data, error } = await supabase
      .from('reportes_dano')
      .insert({
        lugar_id:       lugar_id || null,
        foto_despues:   fotoUrl || imagen,
        clase_dano:     resultado.clase,
        confianza:      resultado.confianza,
        color_semaforo: resultado.color,
        lat:            lat ? parseFloat(lat) : null,
        lng:            lng ? parseFloat(lng) : null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error guardando reporte:', error)
      // Devolvemos el resultado aunque falle el guardado
    }

    return NextResponse.json({
      id:            data?.id,
      clase:         resultado.clase,
      etiqueta:      resultado.etiqueta,
      confianza:     resultado.confianza,
      color:         resultado.color,
      recomendacion: resultado.recomendacion,
      success:       true,
    })

  } catch (err: any) {
    console.error('Error /api/classify:', err)
    return NextResponse.json(
      { error: err.message || 'Error clasificando imagen' },
      { status: 500 }
    )
  }
}
