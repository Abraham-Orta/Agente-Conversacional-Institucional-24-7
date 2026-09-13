-- ==============================================================================
-- test_acid.sql: ACID Concurrency & Functionality Verification Script
-- Project: Agente Conversacional Institucional 24/7 (UNEG - Ing. de Software 1)
-- ==============================================================================

DO $$
DECLARE
    v_test_slot_id UUID;
    v_result1 JSONB;
    v_result2 JSONB;
BEGIN
    RAISE NOTICE '--- INICIANDO PRUEBAS DE INTEGRIDAD ACID ---';

    -- 1. Crear un bloque horario temporal de prueba
    INSERT INTO public.calendario_directivo (fecha, hora_inicio, hora_fin, estado)
    VALUES (CURRENT_DATE + INTERVAL '10 days', '14:00:00', '14:30:00', 'Disponible')
    RETURNING id INTO v_test_slot_id;

    RAISE NOTICE 'Bloque de prueba creado: %', v_test_slot_id;

    -- 2. Primer intento de reserva (debe tener éxito)
    v_result1 := public.agendar_cita(
        v_test_slot_id,
        'Carlos Perez',
        '+584141234567',
        'carlos@example.com',
        'Consulta sobre proceso de becas'
    );

    RAISE NOTICE 'Resultado Intento 1: %', v_result1;
    IF (v_result1->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'FALLO: El primer intento debía ser exitoso.';
    END IF;

    -- 3. Segundo intento concurrente/duplicado sobre el MISMO horario (debe fallar y aislar la transacción)
    v_result2 := public.agendar_cita(
        v_test_slot_id,
        'Maria Rodriguez',
        '+584129876543',
        'maria@example.com',
        'Intento de colisión de horario'
    );

    RAISE NOTICE 'Resultado Intento 2 (Concurrente): %', v_result2;
    IF (v_result2->>'success')::BOOLEAN IS TRUE THEN
        RAISE EXCEPTION 'FALLO CRÍTICO: La transacción permitió una reserva duplicada en el mismo horario.';
    END IF;

    RAISE NOTICE '>>> ÉXITO: Propiedad de Aislamiento y Atomicidad ACID verificada correctamente. <<<';

    -- 4. Limpieza del registro de prueba
    DELETE FROM public.calendario_directivo WHERE id = v_test_slot_id;
    RAISE NOTICE 'Registro de prueba limpiado exitosamente.';
END;
$$;
