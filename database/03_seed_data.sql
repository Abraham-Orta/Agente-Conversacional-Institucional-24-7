-- ==============================================================================
-- 03_seed_data.sql: Base de Conocimiento Institucional y Horarios de Prueba
-- Proyecto: Agente Conversacional Institucional 24/7 (UNEG - Ing. de Software 1)
-- ==============================================================================

-- 1. Insertar bloques horarios de prueba en el Calendario Directivo
-- Genera bloques de atención realistas de 30 minutos
INSERT INTO public.calendario_directivo (fecha, hora_inicio, hora_fin, estado)
VALUES
    (CURRENT_DATE + INTERVAL '1 day', '08:00:00', '08:30:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '1 day', '08:30:00', '09:00:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '1 day', '09:30:00', '10:00:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '1 day', '10:30:00', '11:00:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '2 days', '08:00:00', '08:30:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '2 days', '09:00:00', '09:30:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '2 days', '10:00:00', '10:30:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '3 days', '08:30:00', '09:00:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '3 days', '09:30:00', '10:00:00', 'Disponible'),
    (CURRENT_DATE + INTERVAL '3 days', '11:00:00', '11:30:00', 'Disponible');

-- 2. Insertar fragmentos de normas y reglamentos oficiales
-- Nota: La columna vectorial embedding se calculará con seed_embeddings.py
-- o automáticamente mediante el flujo en n8n.
INSERT INTO public.documentos_normativos (contenido, metadatos)
VALUES
    (
        'MATRÍCULA Y ARANCELES 2026-2027: El costo de inscripción para Educación Primaria y Media General es de $120 USD (o en Bs. a tasa oficial del BCV del día). La mensualidad escolar tiene un costo de $85 USD pagaderos durante los primeros cinco (5) días hábiles de cada mes. Pagos después del día 10 tienen un recargo administrativo del 5%. Medios de pago aceptados: Pago Móvil, transferencia bancaria nacional y efectivo en caja institucional.',
        '{"categoria": "Tarifas", "titulo": "Costos de Matrícula y Mensualidades"}'::jsonb
    ),
    (
        'HORARIO DE ENTRADA Y SALIDA: El horario de entrada general para todos los niveles es a las 7:00 AM. El portón principal cierra a las 7:15 AM en punto por motivos de seguridad. El horario de salida es: Nivel Inicial a las 11:45 AM, Educación Primaria a las 12:30 PM, y Educación Media General a la 1:30 PM (o según carga horaria vespertina de laboratorios).',
        '{"categoria": "Horarios", "titulo": "Horario Escolar y Apertura de Portón"}'::jsonb
    ),
    (
        'NORMATIVA DE UNIFORME ESCOLAR: Primaria: chemise blanca con insignia bordada en el pecho izquierdo, pantalón azul marino de gabardina o vestir (no jeans ni joggers), medias blancas y zapatos escolares negros. Media General (1ro a 3er año): chemise azul celeste; 4to y 5to año: chemise beige. Educación Física: franela blanca institucional con monograma, mono azul marino y calzado deportivo blanco o negro.',
        '{"categoria": "Reglamento", "titulo": "Código de Vestimenta y Uniformes"}'::jsonb
    ),
    (
        'REQUISITOS DE INSCRIPCIÓN (NUEVO INGRESO): 1. Partida de nacimiento original y copia legible. 2. Copia de la cédula de identidad del estudiante (si posee) y de los padres/representantes. 3. Tres fotos tipo carnet del alumno y una de cada representante. 4. Notas certificadas originales de grados anteriores. 5. Carta de buena conducta del plantel de procedencia. 6. Solvencia administrativa del colegio anterior.',
        '{"categoria": "Admisiones", "titulo": "Requisitos para Estudiantes de Nuevo Ingreso"}'::jsonb
    ),
    (
        'JUSTIFICACIÓN DE INASISTENCIAS: Cualquier inasistencia superior a dos (2) días continuos debe justificarse mediante informe médico emitido o validado por un centro de salud público o privado ante la Coordinación Académica en un plazo no mayor a 72 horas tras el reintegro. Las evaluaciones perdidas por inasistencias injustificadas no tienen reprogramación salvo causa de fuerza mayor certificada.',
        '{"categoria": "Reglamento", "titulo": "Inasistencias y Evaluaciones"}'::jsonb
    ),
    (
        'ATENCIÓN DE PADRES Y CITAS DIRECTIVAS: La directiva del plantel y la coordinación académica atienden a representantes previa cita agendada a través de este asistente virtual o en recepción. El horario de atención directiva es de lunes a jueves de 8:00 AM a 11:30 AM. No se atienden consultas académicas o disciplinarias durante la hora de entrada o cambio de clase de los docentes.',
        '{"categoria": "Atencion", "titulo": "Protocolo de Citas con la Directiva"}'::jsonb
    );
