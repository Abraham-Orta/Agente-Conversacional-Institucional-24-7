-- ==============================================================================
-- 01_schema.sql: Esquema Base y Políticas de Seguridad (Supabase / PostgreSQL)
-- Proyecto: Agente Conversacional Institucional 24/7 (UNEG - Ing. de Software 1)
-- ==============================================================================

-- 1. Habilitar la extensión pgvector para búsqueda semántica / RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabla de Documentos Normativos (Base de Conocimiento RAG)
-- Los embeddings son de 768 dimensiones coincidentes con Google Gemini (text-embedding-004)
CREATE TABLE IF NOT EXISTS public.documentos_normativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contenido TEXT NOT NULL,
    metadatos JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para búsqueda rápida por similitud coseno usando HNSW
CREATE INDEX IF NOT EXISTS idx_documentos_normativos_embedding 
ON public.documentos_normativos 
USING hnsw (embedding vector_cosine_ops);

-- 3. Tabla de Calendario Directivo (Horarios Disponibles y Ocupados)
CREATE TABLE IF NOT EXISTS public.calendario_directivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Ocupado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT chk_horas_validas CHECK (hora_fin > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_calendario_fecha_estado 
ON public.calendario_directivo (fecha, estado);

-- 4. Tabla de Citas Confirmadas
CREATE TABLE IF NOT EXISTS public.citas_agendadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    horario_id UUID NOT NULL REFERENCES public.calendario_directivo(id) ON DELETE CASCADE,
    nombre_representante VARCHAR(255) NOT NULL,
    telefono_representante VARCHAR(50),
    email_representante VARCHAR(255),
    motivo_cita TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_horario_cita UNIQUE (horario_id) -- Integridad ACID: imposible reservar el mismo bloque dos veces
);

-- 5. Configuración de Seguridad a Nivel de Fila (RLS) (ISO 27001 / Principio de Menor Privilegio)
ALTER TABLE public.documentos_normativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_directivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas_agendadas ENABLE ROW LEVEL SECURITY;

-- Los usuarios anónimos (desde el frontend público) solo pueden consultar horarios disponibles
CREATE POLICY "Permitir lectura publica de horarios disponibles"
ON public.calendario_directivo
FOR SELECT
TO anon, authenticated
USING (estado = 'Disponible');

-- El rol de servicio (middleware n8n) mantiene el control administrativo total
CREATE POLICY "Servicio n8n control total sobre calendario"
ON public.calendario_directivo
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Servicio n8n control total sobre documentos"
ON public.documentos_normativos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Servicio n8n control total sobre citas"
ON public.citas_agendadas
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
