// lib/geo.ts
import type { Lugar, GeoJSONFeature } from '@/types'
import { colorToHex } from './classify'

/**
 * Convierte lista de lugares a GeoJSON FeatureCollection
 * listo para Mapbox GL JS
 */
export function lugaresToGeoJSON(lugares: Lugar[]): GeoJSON.FeatureCollection {
  const features: GeoJSONFeature[] = lugares.map(lugar => {
    const color = lugar.reporte
      ? colorToHex(lugar.reporte.color_semaforo)
      : '#95A5A6' // gris = sin evaluar

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lugar.lng, lugar.lat],
      },
      properties: {
        ...lugar,
        color,
      },
    }
  })

  return {
    type: 'FeatureCollection',
    features,
  }
}

/** Calcula distancia en km entre dos coordenadas (fórmula Haversine) */
export function distanciaKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return deg * (Math.PI / 180)
}

/** Obtiene posición GPS del browser */
export function obtenerGPS(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no disponible en este dispositivo'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error(`Error GPS: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

/** Venezuela bounding box para validación */
export function estaEnVenezuela(lat: number, lng: number): boolean {
  return lat >= 0.6 && lat <= 12.2 && lng >= -73.4 && lng <= -59.8
}
