// app/api/classify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { classifyDamage } from '@/lib/classify'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imagen, lugar_id, lat, lng } = body

    if (!imagen) {
      return NextResponse.json({ error: 'Se requiere una imagen' }, { status: 400 })
    }

    const supabase = createServerClient()

    // 1. Subir foto SIEMPRE — independiente de la IA
    let fotoUrl: string = ''
    if (imagen.startsWith('data:image')) {
      const base64Data = imagen.split(',')[1]
      const buffer     = Buffer.from(base64Data, 'base64')
      const fileName   = `despues_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-despues')
        .upload(fileName, buffer, { contentType: 'image/jpeg', cacheControl: '3600' })

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('fotos-despues')
          .getPublicUrl(uploadData.path)
        fotoUrl = publicUrl
      }
    }

    // 2. Intentar clasificar con IA — si falla, seguimos igual
    let resultado = null
    try {
      resultado = await classifyDamage(imagen)
    } catch (iaError: any) {
      console.warn('IA no disponible, guardando sin clasificar:', iaError.message)
    }

    // 3. Guardar reporte siempre
    const { data, error } = await supabase
      .from('reportes_dano')
      .insert({
        lugar_id:       lugar_id || null,
        foto_despues:   fotoUrl || imagen,
        clase_dano:     resultado?.clase     ?? 'sin_dano',
        confianza:      resultado?.confianza ?? 0,
        color_semaforo: resultado?.color     ?? 'gris',
        lat:            lat ? parseFloat(lat) : null,
        lng:            lng ? parseFloat(lng) : null,
      })
      .select('id')
      .single()

    if (error) console.error('Error guardando reporte:', error)

    // 4. Si hay lugar_id y hay resultado de IA, actualizar semáforo del lugar
    if (lugar_id && resultado) {
      await supabase
        .from('lugares')
        .update({
          estado:         resultado.clase === 'sin_dano' ? 'sin_evaluar' : resultado.clase,
          color_semaforo: resultado.color,
        })
        .eq('id', lugar_id)
    }

    return NextResponse.json({
      id:            data?.id,
      foto_url:      fotoUrl,
      clase:         resultado?.clase      ?? null,
      etiqueta:      resultado?.etiqueta   ?? 'Sin evaluar',
      confianza:     resultado?.confianza  ?? 0,
      color:         resultado?.color      ?? 'gris',
      recomendacion: resultado?.recomendacion ?? 'Foto guardada. Evaluación pendiente.',
      ia_disponible: resultado !== null,
      success:       true,
    })

  } catch (err: any) {
    console.error('Error /api/classify:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
