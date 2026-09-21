# Gestión de calidad y pruebas

La calidad se controla durante el desarrollo y el despliegue, no únicamente al
final. La implementación actual prioriza controles automáticos sencillos y
repetibles sobre los caminos críticos del sistema.

## 1. SQA en código

El workflow [`quality.yml`](../.github/workflows/quality.yml) se ejecuta en
cada `push` a las ramas principales y en cada Pull Request. Un cambio no se
considera listo si falla cualquiera de estos pasos:

1. `npm ci`: instalación reproducible desde `package-lock.json`.
2. `npm run lint`: análisis estático de Next.js/ESLint.
3. `npm run build`: verificación de tipos y compilación de producción.

Vercel vuelve a ejecutar la compilación antes del despliegue. Así, GitHub
detecta problemas antes de fusionar y Vercel evita publicar una aplicación que
no compile.

## 2. Integridad y concurrencia de citas

La regla de negocio vive en PostgreSQL, no solo en la interfaz:

- `calendario_directivo.estado` solo permite `Disponible` u `Ocupado`.
- `citas_agendadas.horario_id` tiene una restricción `UNIQUE`.
- `agendar_cita` actualiza el horario únicamente si sigue disponible.
- Si el horario ya fue tomado, no se crea una segunda cita.

La validación reproducible está en
[`database/test_acid.sql`](../database/test_acid.sql). El script realiza una
reserva válida y luego intenta reservar el mismo horario nuevamente; esto
verifica la regla de no duplicación y el resultado de la función. Debe
ejecutarse en una base de datos de pruebas o después de respaldar los datos,
porque crea y elimina registros temporales. Para demostrar concurrencia real,
se debe ejecutar la función desde dos sesiones PostgreSQL simultáneas.

## 3. Smoke testing post-despliegue

Después de cada despliegue de Azure o Vercel, ejecutar:

### Aplicación web

- La página principal carga sin errores visuales ni errores en la consola.
- El formulario permite enviar una pregunta.
- Se muestra una respuesta del asistente.
- Una pregunta relacionada con citas muestra horarios disponibles.
- El formulario de cita rechaza datos obligatorios vacíos.
- Una cita válida muestra confirmación.

### API y n8n

```bash
curl -i -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"¿Cuál es el horario escolar?","sessionId":"smoke-test"}'
```

Resultado esperado:

- Código HTTP `200`.
- Cuerpo JSON.
- Campo `respuesta` o `partes`.

También se puede probar el proxy de Vercel:

```bash
curl -i -X POST "https://tu-app.vercel.app/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"¿Cuál es el horario escolar?","sessionId":"smoke-test"}'
```

### Infraestructura

- `docker compose ps` muestra n8n en estado `running`.
- El dominio de n8n responde por HTTPS.
- El webhook de producción está activo en n8n.
- Las variables de entorno de Vercel están configuradas para Preview y
  Production.

## 4. Seguridad operativa

- Los secretos reales no se guardan en GitHub.
- La clave de servicio de Supabase y la de Gemini se usan únicamente en
  servidor.
- El puerto `5678` de Azure no se expone públicamente; se publica el proxy
  HTTPS.
- Si una credencial aparece en un commit, se revoca y se genera otra.
