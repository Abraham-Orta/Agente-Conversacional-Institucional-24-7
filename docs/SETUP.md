# Setup y despliegue

## Requisitos

- Node.js 18 o superior y npm.
- Docker y Docker Compose.
- Proyecto de Supabase.
- Clave de Google Gemini.
- Cuenta de Vercel para el frontend.
- Para producción: Azure VM Ubuntu con una IP pública y un dominio.

## 1. Variables de entorno

Desde la raíz del repositorio:

```bash
cp .env.example .env
```

Completa las variables sin subir el archivo al repositorio. Para el frontend,
crea `frontend/.env.local` con:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role
GEMINI_API_KEY=tu_clave_gemini
```

En producción, `N8N_WEBHOOK_URL` debe ser una URL HTTPS pública. Las variables
con `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` nunca deben exponerse al
navegador.

## 2. Configurar Supabase

En el SQL Editor ejecuta en este orden:

1. [`database/01_schema.sql`](../database/01_schema.sql)
2. [`database/02_functions.sql`](../database/02_functions.sql)
3. [`database/03_seed_data.sql`](../database/03_seed_data.sql)
4. [`database/04_admin_setup.sql`](../database/04_admin_setup.sql)
5. [`database/05_logs_chat.sql`](../database/05_logs_chat.sql)

Genera los embeddings de los documentos:

```bash
cd database
python3 seed_embeddings.py
cd ..
```

Valida la prevención de reservas duplicadas con
[`database/test_acid.sql`](../database/test_acid.sql).

## 3. Ejecutar n8n localmente

```bash
docker compose -f n8n/docker-compose.yml up -d
```

Abre <http://localhost:5678>, importa
[`n8n/workflow_colegio.json`](../n8n/workflow_colegio.json), configura sus
credenciales y publica el workflow.

Para detenerlo:

```bash
docker compose -f n8n/docker-compose.yml down
```

El volumen `n8n_datos` conserva la configuración entre reinicios.

## 4. Ejecutar el frontend localmente

```bash
cd frontend
npm install
npm run dev
```

Abre <http://localhost:3000>.

Comandos útiles:

```bash
npm run build
npm start
npm run lint
```

## 5. Desplegar n8n en Azure

La instancia de producción usada por el proyecto es una Azure VM con Ubuntu,
Docker Compose y un proxy HTTPS.

### Crear y preparar la VM

1. Crea una VM Ubuntu LTS con una IP pública estática.
2. Permite únicamente los puertos `22`, `80` y `443` en el NSG.
3. No publiques el puerto `5678`.
4. Conéctate por SSH e instala Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

### Dominio y HTTPS

Apunta un registro DNS `A` como `n8n.tudominio.com` a la IP de la VM. Usa
Caddy, Nginx o un Application Gateway para terminar TLS y reenviar al
contenedor n8n. Los valores de producción deben ser equivalentes a:

```env
N8N_HOST=n8n.tudominio.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n.tudominio.com/
N8N_EDITOR_BASE_URL=https://n8n.tudominio.com/
N8N_SECURE_COOKIE=true
GENERIC_TIMEZONE=America/Caracas
```

Define también una `N8N_ENCRYPTION_KEY` larga y aleatoria y consérvala en un
gestor de secretos. Perderla impide descifrar las credenciales guardadas por
n8n.

### Arrancar y comprobar

```bash
docker compose up -d
docker compose ps
docker compose logs -f n8n
```

El webhook de producción debe quedar disponible en:

```text
https://n8n.tudominio.com/webhook/chat
```

Prueba el workflow:

```bash
curl -X POST https://n8n.tudominio.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"¿Cuál es el horario escolar?","sessionId":"setup"}'
```

## 6. Desplegar el frontend en Vercel

1. Importa el repositorio en Vercel.
2. Configura `frontend` como **Root Directory**.
3. Usa `npm run build` como Build Command.
4. Agrega estas variables en Production y Preview:

```env
N8N_WEBHOOK_URL=https://n8n.tudominio.com/webhook/chat
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role
GEMINI_API_KEY=tu_clave_gemini
```

5. Ejecuta el deploy y prueba la aplicación y
   `https://tu-app.vercel.app/api/chat`.

## 7. Seguridad y operación

- No versionar `.env`, `.env.local`, `*.pem`, credenciales, tokens ni backups.
- Usar credenciales de n8n o variables de entorno en lugar de secretos dentro
  de nodos exportados.
- Rotar Gemini, Supabase y n8n si fueron expuestos.
- Respaldar periódicamente el volumen de n8n y la base de datos.
- Mantener una imagen de n8n fijada a una versión probada en producción en vez
  de usar `latest`.
- Revisar los logs de Vercel, n8n y Supabase después de cada despliegue.

## 8. Control de calidad

Cada Pull Request y cada push a las ramas principales ejecuta
[`quality.yml`](../.github/workflows/quality.yml), que instala dependencias,
ejecuta ESLint y compila el frontend. El despliegue debe esperar a que ese
workflow termine correctamente.

Después de publicar, sigue la checklist de smoke testing y ejecuta las pruebas
ACID descritas en [`CALIDAD.md`](./CALIDAD.md).
