// lib/classify.ts
import type { ClaseDano, ClasificacionResult, ColorSemaforo } from '@/types'

const HF_API = 'https://api-inference.huggingface.co/models/'

// Modelos especializados en daño estructural post-desastre
// Opción 1: fine-tuned sobre RescueNet (daño en fotos de calle)
// Opción 2: caidas/building-damage-classifier (xView2 fine-tuned)
// Fallback: keremberke/satellite-building-segmentation
const MODEL = 'caidas/building-damage-classifier'

interface HFResponse {
  label: string
  score: number
}

// Validación de tamaño de imagen (máx 4MB en base64)
const MAX_BASE64_SIZE = 4 * 1024 * 1024

/**
 * Clasifica el daño estructural de un edificio a partir de una imagen en base64.
 * Retorna clase de daño, confianza, color de semáforo y recomendación.
 */
export async function classifyDamage(imageBase64: string): Promise<ClasificacionResult> {
  const token = process.env.HF_TOKEN
  if (!token) throw new Error('HF_TOKEN no configurado')

  // Limpiar prefijo data:image si viene del frontend
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  // Validar tamaño
  if (cleanBase64.length > MAX_BASE64_SIZE) {
    throw new Error('Imagen demasiado grande. Máximo 4MB.')
  }

  // Validar que sea base64 válido
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
    throw new Error('Formato de imagen inválido.')
  }

  const res = await fetch(`${HF_API}${MODEL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: cleanBase64 }),
  })

  // Si el modelo está cargando, reintentamos una vez
  if (res.status === 503) {
    await new Promise(r => setTimeout(r, 5000))
    return classifyDamage(imageBase64)
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error HF API: ${res.status} — ${err}`)
  }

  const data: HFResponse[] = await res.json()

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Respuesta inesperada del modelo')
  }

  const top       = data.sort((a, b) => b.score - a.score)[0]
  const clase     = mapLabelToClase(top.label)
  const color     = labelToColor(clase)
  const etiqueta  = claseToEtiqueta(clase)
  const recomendacion = labelToRec(clase)

  return { clase, confianza: top.score, color, etiqueta, recomendacion }
}

/** Mapea etiquetas del modelo a nuestras 4 clases */
function mapLabelToClase(label: string): ClaseDano {
  const l = label.toLowerCase()

  // Etiquetas de modelos fine-tuned (xView2, RescueNet, caidas)
  if (l.includes('no_damage')  || l.includes('undamaged') || l === 'no-damage') return 'sin_dano'
  if (l.includes('minor')      || l.includes('slight'))                          return 'dano_menor'
  if (l.includes('major')      || l.includes('severe') || l.includes('partial')) return 'dano_mayor'
  if (l.includes('destroy')    || l.includes('collapse') || l.includes('rubble')) return 'destruido'

  // Fallback semántico para modelos genéricos
  const intact   = ['house', 'building', 'architecture', 'structure', 'church']
  const damaged  = ['ruins', 'ruin', 'wreckage', 'debris']
  if (intact.some(w  => l.includes(w))) return 'sin_dano'
  if (damaged.some(w => l.includes(w))) return 'destruido'

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
    sin_dano:   'Sin daño aparente',
    dano_menor: 'Daño menor',
    dano_mayor: 'Posible daño estructural',
    destruido:  'Alerta de riesgo estructural',
  }
  return map[clase]
}

function labelToRec(clase: ClaseDano): string {
  const map: Record<ClaseDano, string> = {
    sin_dano:   'Estructura visualmente intacta. Verificar instalaciones básicas.',
    dano_menor: 'Revisión técnica recomendada antes de reocupar.',
    dano_mayor: 'No habitar. Requiere evaluación estructural urgente.',
    destruido:  'Zona de exclusión. Riesgo de colapso. Evacuación inmediata.',
  }
  return map[clase]
}

export function colorToHex(color: ColorSemaforo): string {
  const map: Record<ColorSemaforo, string> = {
    verde:    '#27AE60',
    amarillo: '#F1C40F',
    naranja:  '#E67E22',
    rojo:     '#E74C3C',
    gris:     '#95A5A6',
  }
  return map[color] ?? '#95A5A6'
    }
