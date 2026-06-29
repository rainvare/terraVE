// lib/classify.ts
import type { ClaseDano, ClasificacionResult, ColorSemaforo } from '@/types'

const HF_API = 'https://api-inference.huggingface.co/models/'
// Modelo de visión para clasificación de daño estructural
// Puedes reemplazar con un fine-tuned específico para daño post-sismo
const MODEL  = 'keremberke/satellite-building-segmentation'

interface HFResponse {
  label: string
  score: number
}

/**
 * Clasifica el daño estructural de un edificio a partir de una imagen en base64
 * Retorna clase de daño, confianza, color de semáforo y recomendación
 */
export async function classifyDamage(imageBase64: string): Promise<ClasificacionResult> {
  const token = process.env.HF_TOKEN

  if (!token) {
    throw new Error('HF_TOKEN no configurado en variables de entorno')
  }

  // Limpiar prefijo data:image si viene del frontend
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  const res = await fetch(`${HF_API}${MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: cleanBase64 }),
  })

  if (!res.ok) {
    const err = await res.text()
    // Si el modelo está cargando, esperamos y reintentamos una vez
    if (res.status === 503) {
      await new Promise(r => setTimeout(r, 5000))
      return classifyDamage(imageBase64)
    }
    throw new Error(`Error HF API: ${res.status} — ${err}`)
  }

  const data: HFResponse[] = await res.json()

  // Tomamos el label de mayor score
  const top = data.sort((a, b) => b.score - a.score)[0]

  const clase     = mapLabelToClase(top.label)
  const color     = labelToColor(clase)
  const etiqueta  = claseToEtiqueta(clase)
  const recomendacion = labelToRec(clase)

  return {
    clase,
    confianza: top.score,
    color,
    etiqueta,
    recomendacion,
  }
}

/** Mapea etiquetas genéricas del ViT a nuestras 4 clases */
function mapLabelToClase(label: string): ClaseDano {
  const l = label.toLowerCase()

  // Etiquetas de modelos fine-tuned en daño (xView2, RescueNet)
  if (l.includes('no_damage') || l.includes('undamaged') || l === 'no-damage') return 'sin_dano'
  if (l.includes('minor') || l.includes('slight'))                               return 'dano_menor'
  if (l.includes('major') || l.includes('severe') || l.includes('partial'))      return 'dano_mayor'
  if (l.includes('destroy') || l.includes('collapse') || l.includes('rubble'))   return 'destruido'

  // Para ViT genérico, hacemos mapeo por grupo semántico
  const intact    = ['house', 'building', 'architecture', 'structure', 'church']
  const damaged   = ['ruins', 'ruin', 'wreckage', 'debris']

  if (intact.some(w => l.includes(w)))   return 'sin_dano'
  if (damaged.some(w => l.includes(w)))  return 'destruido'

  // Fallback neutro
  return 'dano_menor'
}

function labelToColor(clase: ClaseDano): ColorSemaforo {
  const map: Record<ClaseDano, ColorSemaforo> = {
    sin_dano:   'verde',
    dano_menor: 'amarillo',
    dano_mayor: 'naranja',
    destruido:  'rojo',
  }
  return map[clase]
}

function claseToEtiqueta(clase: ClaseDano): string {
  const map: Record<ClaseDano, string> = {
    sin_dano:   'Sin daño',
    dano_menor: 'Daño menor',
    dano_mayor: 'Daño mayor',
    destruido:  'Destruido',
  }
  return map[clase]
}

function labelToRec(clase: ClaseDano): string {
  const map: Record<ClaseDano, string> = {
    sin_dano:   'Estructura habitable. Verificar instalaciones básicas.',
    dano_menor: 'Revisión técnica recomendada antes de reocupar.',
    dano_mayor: 'No habitar. Requiere evaluación estructural urgente.',
    destruido:  'Zona de exclusión. Riesgo de colapso. Evacuación inmediata.',
  }
  return map[clase]
}

/** Convierte color semáforo a hex para el mapa */
export function colorToHex(color: ColorSemaforo): string {
  const map: Record<ColorSemaforo, string> = {
    verde:     '#27AE60',
    amarillo:  '#F1C40F',
    naranja:   '#E67E22',
    rojo:      '#E74C3C',
    gris:      '#95A5A6',
  }
  return map[color] ?? '#95A5A6'
}
