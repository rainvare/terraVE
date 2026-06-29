# TerraVE — API pública

Datos abiertos de daño estructural satelital y exposición poblacional.
Post-terremoto Venezuela, 24 jun 2026.

**Base URL:** `https://terra-ve.vercel.app/api`

No requiere autenticación.

---

## Endpoints

### GET /api/satelital

Zonas de daño estructural detectadas por radar SAR Sentinel-1 (Copernicus/ESA).
Comparación de imágenes antes/después del 24 de junio de 2026. Resolución 10m/píxel.

**Parámetros opcionales:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `limit` | integer | Registros por página (default: 1000) |
| `offset` | integer | Para paginación (default: 0) |
| `min_area` | number | Área mínima en m² |
| `lat_min` | number | Latitud mínima (bounding box) |
| `lat_max` | number | Latitud máxima |
| `lng_min` | number | Longitud mínima |
| `lng_max` | number | Longitud máxima |

**Ejemplos:**
```
GET /api/satelital
GET /api/satelital?min_area=500&limit=500&offset=0
GET /api/satelital?lat_min=10.55&lat_max=10.70&lng_min=-67.1&lng_max=-66.8
```

**Respuesta:**
```json
{
  "fuente": "TerraVE / Sentinel-1 GRD / Google Earth Engine",
  "fecha_imagen": "2026-06-25",
  "metodologia": "Detección de cambio SAR — umbral -3dB backscatter",
  "total": 1000,
  "offset": 0,
  "limit": 1000,
  "data": [
    {
      "id": 1,
      "centro_lat": 10.6012,
      "centro_lng": -66.9034,
      "area_m2": 1173.4,
      "fuente": "sentinel-1-gee",
      "fecha_imagen": "2026-06-25"
    }
  ]
}
```

**Cobertura:** 59.862 zonas · 12.1 km² · Caracas / La Guaira

---

### GET /api/poblacion

Población expuesta por intensidad sísmica MMI, desglosada por municipio.
Fuente: UNOSAT Live Webmap — M7.5 Caracas earthquake.

**Parámetros opcionales:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `criticos` | boolean | Solo municipios con zona VII+ (default: true) |
| `estado` | string | Filtrar por estado (ej: `La Guaira`) |
| `pcode` | string | Código UNOSAT de municipio (ej: `VE0101`) |
| `limit` | integer | Registros por página (default: 100) |

**Ejemplos:**
```
GET /api/poblacion
GET /api/poblacion?criticos=true
GET /api/poblacion?estado=La Guaira
GET /api/poblacion?pcode=VE0101
GET /api/poblacion?criticos=false&limit=100
```

**Respuesta:**
```json
{
  "fuente": "TerraVE / UNOSAT Live Webmap — M7.5 Caracas earthquake",
  "fecha": "2026-06-24",
  "descripcion": "Población expuesta por intensidad sísmica MMI por municipio",
  "total": 31,
  "data": [
    {
      "adm1_name": "Distrito Capital",
      "adm2_name": "Libertador",
      "adm2_pcode": "VE0101",
      "centro_lat": 10.4806,
      "centro_lng": -66.9036,
      "pop_mmi_ix": 0,
      "pop_mmi_viii": 12400,
      "pop_mmi_vii": 785286,
      "pop_mmi_vi": 0,
      "pop_mmi_v": 0,
      "pop_total_expuesta": 785286,
      "zona_critica": true
    }
  ]
}
```

**Cobertura:** 31 municipios críticos · 1.76M personas en zona VII+

---

## Paginación

Para conjuntos grandes como `/api/satelital` (59k registros):

```
GET /api/satelital?limit=1000&offset=0
GET /api/satelital?limit=1000&offset=1000
GET /api/satelital?limit=1000&offset=2000
```

Continuar hasta que `total < limit`.

---

## Intensidades sísmicas MMI

| Campo | Escala | Descripción |
|---|---|---|
| `pop_mmi_ix` | IX — Violento | Daño severo en estructuras resistentes |
| `pop_mmi_viii` | VIII — Severo | Daño grave en estructuras ordinarias |
| `pop_mmi_vii` | VII — Muy fuerte | Daño en estructuras débiles |
| `pop_mmi_vi` | VI — Fuerte | Daño leve en estructuras débiles |
| `pop_mmi_v` | V — Moderado | Sentido por casi todos |

---

## Créditos

| Dato | Fuente |
|---|---|
| Imágenes SAR | Copernicus Sentinel-1 GRD via Google Earth Engine |
| Análisis de daño | TerraVE — umbral -3dB backscatter diferencial |
| Población expuesta | UNOSAT Live Webmap M7.5 Venezuela 2026 |
| Infraestructura | Supabase PostGIS + Vercel |

**Plataforma:** https://terra-ve.vercel.app
**Repositorio:** https://github.com/rainvare/terraVE
