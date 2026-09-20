-- ==============================================================================
-- 05_logs_chat.sql: Tabla de Registro de Tokens y Consultas del Chatbot
-- Proyecto: Agente Conversacional Institucional 24/7 (UNEG - Ing. de Software 1)
-- ==============================================================================

-- 1. Crear tabla para registro de uso de tokens por sesión
CREATE TABLE IF NOT EXISTS public.logs_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    mensaje_usuario TEXT NOT NULL,
    respuesta_bot TEXT,
    tokens_input INT NOT NULL DEFAULT 0,
    tokens_output INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índice para consultas rápidas agrupadas por sesión y fecha
CREATE INDEX IF NOT EXISTS idx_logs_chat_session_id ON public.logs_chat(session_id);
CREATE INDEX IF NOT EXISTS idx_logs_chat_created_at ON public.logs_chat(created_at DESC);

-- 3. Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE public.logs_chat ENABLE ROW LEVEL SECURITY;

-- 4. Política de acceso total para el rol de servicio
CREATE POLICY "Servicio control total sobre logs_chat"
ON public.logs_chat
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
