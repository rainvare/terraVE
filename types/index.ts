// types/index.ts

export type TipoLugar = 'escuela' | 'clinica' | 'farmacia' | 'mercado' | 'otro'

export type ClaseDano = 'sin_dano' | 'dano_menor' | 'dano_mayor' | 'destruido'

export type ColorSemaforo = 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'gris'

export type EstadoLugar = 'sin_evaluar' | 'dano_menor' | 'dano_mayor'

export interface Lugar {
  id: string
  nombre: string
  tipo: TipoLugar
  descripcion?: string
  lat: number
  lng: number
  foto_antes?: string | null
  creado_por?: string
  created_at: string
  estado?: EstadoLugar
  color_semaforo?: ColorSemaforo
  reporte?: ReporteDano | null
  // campo interno del mapa (calculado en route.ts)
  color?: string
}

export interface ReporteDano {
  id: string | null
  lugar_id?: string
  foto_despues: string
  clase_dano: ClaseDano
  confianza: number
  color_semaforo: ColorSemaforo
  lat?: number
  lng?: number
  created_at: string
}

export interface ClasificacionResult {
  clase: ClaseDano
  confianza: number
  color: ColorSemaforo
  recomendacion: string
  etiqueta: string
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: Lugar & { color: string }
}
