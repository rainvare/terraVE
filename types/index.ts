// types/index.ts

export type TipoLugar = 'escuela' | 'clinica' | 'farmacia' | 'mercado' | 'otro'

export type ClaseDano = 'sin_dano' | 'dano_menor' | 'dano_mayor' | 'destruido'

export type ColorSemaforo = 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'gris'

export interface Lugar {
  id: string
  nombre: string
  tipo: TipoLugar
  descripcion?: string
  lat: number
  lng: number
  foto_antes?: string
  creado_por?: string
  created_at: string
  reporte?: ReporteDano | null
}

export interface ReporteDano {
  id: string
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
