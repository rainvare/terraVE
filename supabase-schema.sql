-- ================================================
-- TerraVE — Schema SQL para Supabase
-- Ejecuta este script en:
-- Supabase Dashboard → SQL Editor → New Query
-- ================================================

-- Habilitar PostGIS (ya viene en Supabase)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ================================================
-- TABLA: lugares
-- Lugares registrados por ciudadanos
-- ================================================
CREATE TABLE IF NOT EXISTS lugares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('escuela', 'clinica', 'farmacia', 'mercado', 'otro')),
  descripcion TEXT,
  lat         DECIMAL(10, 8) NOT NULL,
  lng         DECIMAL(11, 8) NOT NULL,
  foto_antes  TEXT,
  creado_por  TEXT DEFAULT 'Anónimo',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABLA: reportes_dano
-- Clasificaciones de daño estructural por IA
-- ================================================
CREATE TABLE IF NOT EXISTS reportes_dano (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lugar_id        UUID REFERENCES lugares(id) ON DELETE SET NULL,
  foto_despues    TEXT NOT NULL,
  clase_dano      TEXT NOT NULL CHECK (clase_dano IN ('sin_dano', 'dano_menor', 'dano_mayor', 'destruido')),
  confianza       DECIMAL(4, 3) CHECK (confianza >= 0 AND confianza <= 1),
  color_semaforo  TEXT NOT NULL CHECK (color_semaforo IN ('verde', 'amarillo', 'naranja', 'rojo', 'gris')),
  lat             DECIMAL(10, 8),
  lng             DECIMAL(11, 8),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ÍNDICES
-- ================================================

-- Índice espacial para consultas de proximidad
CREATE INDEX IF NOT EXISTS idx_lugares_geo
  ON lugares USING GIST (ST_SetSRID(ST_MakePoint(lng, lat), 4326));

-- Índice para filtrar por tipo
CREATE INDEX IF NOT EXISTS idx_lugares_tipo
  ON lugares (tipo);

-- Índice para join con reportes
CREATE INDEX IF NOT EXISTS idx_reportes_lugar
  ON reportes_dano (lugar_id);

-- Índice para filtrar por color de semáforo
CREATE INDEX IF NOT EXISTS idx_reportes_color
  ON reportes_dano (color_semaforo);

-- ================================================
-- RLS (Row Level Security) — Acceso público de lectura
-- ================================================
ALTER TABLE lugares      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_dano ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer
CREATE POLICY "Lectura pública de lugares"
  ON lugares FOR SELECT USING (true);

CREATE POLICY "Lectura pública de reportes"
  ON reportes_dano FOR SELECT USING (true);

-- Cualquiera puede insertar (app sin auth para hackathon)
CREATE POLICY "Inserción pública de lugares"
  ON lugares FOR INSERT WITH CHECK (true);

CREATE POLICY "Inserción pública de reportes"
  ON reportes_dano FOR INSERT WITH CHECK (true);

-- ================================================
-- STORAGE BUCKETS
-- Ejecutar en: Supabase Dashboard → Storage → New Bucket
-- O ejecutar este SQL si tienes permisos de storage
-- ================================================

-- Bucket para fotos "antes"
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-antes', 'fotos-antes', true)
ON CONFLICT DO NOTHING;

-- Bucket para fotos "después" (post-clasificación)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-despues', 'fotos-despues', true)
ON CONFLICT DO NOTHING;

-- Políticas de storage (lectura pública, escritura pública para hackathon)
CREATE POLICY "Lectura pública fotos-antes"
  ON storage.objects FOR SELECT USING (bucket_id = 'fotos-antes');

CREATE POLICY "Upload público fotos-antes"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos-antes');

CREATE POLICY "Lectura pública fotos-despues"
  ON storage.objects FOR SELECT USING (bucket_id = 'fotos-despues');

CREATE POLICY "Upload público fotos-despues"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos-despues');

-- ================================================
-- DATOS DE PRUEBA (opcional — eliminar en producción)
-- ================================================
INSERT INTO lugares (nombre, tipo, descripcion, lat, lng, creado_por) VALUES
  ('Escuela Bolivariana Simón Bolívar', 'escuela',  'Escuela primaria, ~400 alumnos', 10.4806,  -66.9036, 'Admin'),
  ('Clínica Popular Barquisimeto',      'clinica',  'Atención primaria, urgencias',   10.0678,  -69.3467, 'Admin'),
  ('Farmacia Central Maracaibo',        'farmacia', 'Farmacia comunitaria 24h',        10.6666,  -71.6124, 'Admin'),
  ('Mercado Municipal Valencia',        'mercado',  'Mercado de abastos principal',    10.1620,  -67.9963, 'Admin')
ON CONFLICT DO NOTHING;
