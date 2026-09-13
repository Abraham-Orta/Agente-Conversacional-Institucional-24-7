-- ==============================================================================
-- 02_functions.sql: Funciones RPC con Propiedades ACID (Supabase / PostgreSQL)
-- Proyecto: Agente Conversacional Institucional 24/7 (UNEG - Ing. de Software 1)
-- ==============================================================================

-- 1. Función RPC para búsqueda semántica vectorial en RAG (Distancia Coseno vía pgvector)
-- Invocada directamente por n8n o cliente con el vector generado por Gemini
CREATE OR REPLACE FUNCTION public.match_documentos(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.4,
    match_count INT DEFAULT 4
)
RETURNS TABLE (
    id UUID,
    contenido TEXT,
    metadatos JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.contenido,
        d.metadatos,
        (1 - (d.embedding <=> query_embedding))::FLOAT AS similarity
    FROM public.documentos_normativos d
    WHERE d.embedding IS NOT NULL
      AND (1 - (d.embedding <=> query_embedding)) >= match_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Asignar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.match_documentos(VECTOR(768), FLOAT, INT) TO anon, authenticated, service_role;

-- 2. Función RPC para Agendamiento Atómico de Citas (Cumplimiento ACID)
-- Resuelve HU03: Garantiza la prevención de colisiones o cruces de agenda bajo accesos concurrentes
CREATE OR REPLACE FUNCTION public.agendar_cita(
    p_horario_id UUID,
    p_nombre VARCHAR(255),
    p_telefono VARCHAR(50) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_motivo TEXT DEFAULT 'Consulta general con directiva'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows_updated INT;
    v_cita_id UUID;
    v_fecha DATE;
    v_hora_inicio TIME;
    v_hora_fin TIME;
BEGIN
    -- Actualización condicional atómica: Solo cambia el estado si está estrictamente 'Disponible'
    UPDATE public.calendario_directivo
    SET estado = 'Ocupado'
    WHERE id = p_horario_id AND estado = 'Disponible';

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    -- Si no se actualizó ninguna fila, el horario ya fue tomado por una petición concurrente
    IF v_rows_updated = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'El horario seleccionado ya no se encuentra disponible o no existe.'
        );
    END IF;

    -- Obtener detalles del horario para el payload de confirmación
    SELECT fecha, hora_inicio, hora_fin 
    INTO v_fecha, v_hora_inicio, v_hora_fin
    FROM public.calendario_directivo
    WHERE id = p_horario_id;

    -- Insertar el registro formal de la cita
    INSERT INTO public.citas_agendadas (
        horario_id,
        nombre_representante,
        telefono_representante,
        email_representante,
        motivo_cita
    ) VALUES (
        p_horario_id,
        TRIM(p_nombre),
        TRIM(p_telefono),
        TRIM(p_email),
        TRIM(p_motivo)
    )
    RETURNING id INTO v_cita_id;

    RETURN jsonb_build_object(
        'success', true,
        'cita_id', v_cita_id,
        'horario_id', p_horario_id,
        'fecha', v_fecha,
        'hora_inicio', v_hora_inicio,
        'hora_fin', v_hora_fin,
        'nombre_representante', p_nombre,
        'message', 'Cita agendada exitosamente con la directiva escolar.'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', SQLSTATE,
            'message', SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION public.agendar_cita(UUID, VARCHAR, VARCHAR, VARCHAR, TEXT) TO anon, authenticated, service_role;
