# Agente Conversacional Institucional 24/7

Sistema web de atención automatizada para una institución educativa. Permite
consultar información oficial mediante RAG (Retrieval-Augmented Generation) y
agendar citas con la directiva mediante una operación transaccional protegida
contra dobles reservas.

> **Proyecto:** 16 — Ingeniería de Software 1
> **Institución:** Universidad Nacional Experimental de Guayana (UNEG)
> **Autor:** Abrahám Orta

## Entregables del repositorio

| Entregable | Documento |
|---|---|
| README | Este documento |
| Arquitectura | [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md) |
| Setup | [`docs/SETUP.md`](./docs/SETUP.md) |
| Calidad y pruebas | [`docs/CALIDAD.md`](./docs/CALIDAD.md) |

## Funcionalidades

- Chat institucional disponible 24/7 desde una interfaz web responsiva.
- Respuestas fundamentadas en documentos normativos, horarios y tarifas
  oficiales mediante embeddings y búsqueda semántica con `pgvector`.
- Separación del razonamiento interno y la respuesta final del modelo.
- Consulta de horarios disponibles para reuniones con la directiva.
- Agendamiento de citas desde el chat.
- Prevención de reservas duplicadas bajo concurrencia mediante PostgreSQL.
- Panel administrativo para gestionar documentos normativos, horarios y
  métricas.

## Tecnologías

- **Frontend:** Next.js 14, React 18, TypeScript y Tailwind CSS.
- **Orquestación:** n8n ejecutándose en Docker.
- **Persistencia:** PostgreSQL administrado por Supabase y `pgvector`.
- **IA:** Google Gemini para embeddings y generación de respuestas.
- **Despliegue:** Vercel para el frontend y Azure VM para n8n.

## Estructura del repositorio

```text
.
├── database/
│   ├── 01_schema.sql          # Tablas, pgvector, índices y RLS
│   ├── 02_functions.sql       # RPC de búsqueda y agendamiento ACID
│   ├── 03_seed_data.sql       # Datos iniciales
│   ├── 04_admin_setup.sql     # Configuración administrativa
│   ├── 05_logs_chat.sql       # Registro de conversaciones
│   ├── seed_embeddings.py     # Generación de embeddings
│   └── test_acid.sql          # Validación de concurrencia
├── frontend/
│   ├── src/app/api/chat/      # Proxy seguro hacia n8n
│   ├── src/app/admin/         # Panel administrativo
│   ├── src/components/        # Componentes de interfaz
│   └── package.json
├── n8n/
│   ├── docker-compose.yml     # Ejecución local de n8n
│   ├── workflow_colegio.json  # Workflow importable
│   └── generar_workflow.py    # Generador del workflow
├── docs/
│   ├── ARQUITECTURA.md
│   └── SETUP.md
├── .env.example
└── README.md
```

## Inicio rápido

Consulta [`docs/SETUP.md`](./docs/SETUP.md) para la configuración completa.

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en <http://localhost:3000>.

## Despliegue

La configuración usada en producción es:

```text
Frontend Next.js  →  Vercel
        │
        └── /api/chat
                │
                ▼
        n8n en Docker → Azure VM
                │
                ▼
        Supabase + Google Gemini
```

Para conocer las variables, el orden de inicialización de Supabase, la
importación del workflow y el despliegue en Azure y Vercel, consulta
[`docs/SETUP.md`](./docs/SETUP.md).

## Seguridad

- No subas `.env`, `.env.local`, claves privadas SSH ni credenciales de n8n.
- Las variables `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` son únicamente
  de servidor.
- Usa una URL HTTPS pública para `N8N_WEBHOOK_URL` en producción.
- Rota cualquier credencial que haya sido expuesta en un commit, exportación o
  captura.

## Validación

Desde `frontend/`:

```bash
npm run build
```

La prueba de concurrencia de reservas está en
[`database/test_acid.sql`](./database/test_acid.sql).

Los controles de calidad, el workflow de CI y la checklist de smoke testing
están documentados en [`docs/CALIDAD.md`](./docs/CALIDAD.md).
