-- ==============================================================================
-- 04_admin_setup.sql: Configuración del Usuario Administrador
-- Proyecto: Agente Conversacional Institucional 24/7 (UNEG - Ing. de Software 1)
-- ==============================================================================
-- INSTRUCCIONES:
--   1. Ir al Dashboard de Supabase → Authentication → Users
--   2. Crear un nuevo usuario con email y contraseña (ej: admin@colegio.com)
--   3. Copiar el UUID del usuario creado
--   4. Reemplazar el email en la query de abajo con el del usuario creado
--   5. Ejecutar este script en Supabase → SQL Editor
-- ==============================================================================

-- Otorgar flag is_admin al usuario administrador
-- Reemplazar 'admin@colegio.com' con el email real del usuario creado
UPDATE auth.users
SET app_metadata = jsonb_set(
  COALESCE(app_metadata, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
WHERE email = 'admin@colegio.com';

-- Verificar que el flag fue asignado correctamente
SELECT id, email, app_metadata
FROM auth.users
WHERE email = 'admin@colegio.com';
