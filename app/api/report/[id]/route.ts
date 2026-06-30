// app/api/reports/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// ── Whitelist de campos editables ──────────────────────────────────────────
// Solo estos campos pueden ser modificados por el cliente.
// Cualquier otro campo en el body es ignorado silenciosamente.
const CAMPOS_PERMITIDOS = z.object({
  foto_despues:   z.string().url('URL de foto inválida').optional(),
  clase_dano:     z.enum(['sin_dano', 'dano_menor', 'dano_mayor', 'destruido']).optional(),
  color_semaforo: z.enum(['verde', 'amarillo', 'naranja', 'rojo', 'gris']).optional(),
  confianza:      z.number().min(0).max(1).optional(),
}).strict() // .strict() rechaza cualquier campo extra no declarado

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar que el ID sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const rawBody = await req.json()

    // Validar y filtrar el body — solo campos permitidos
    const parsed = CAMPOS_PERMITIDOS.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', detalles: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Si no hay nada que actualizar
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('reportes_dano')
      .update(parsed.data)       // solo los campos validados
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
      }
