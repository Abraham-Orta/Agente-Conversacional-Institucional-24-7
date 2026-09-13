# Agente Conversacional Institucional 24/7

> **Unidad Curricular:** Ingeniería de Software 1  
> **Institución:** Universidad Nacional Experimental de Guayana   
> **Proyecto 16 :** Agente Conversacional Institucional 24/7  
> **Desarrollador:** Abrahám Orta  

---

## 1. Descripción del Proyecto

Sistema integral de atención automatizada disponible 24/7 diseñado para instituciones educativas. El agente procesa lenguaje natural mediante técnicas de **RAG (Generación Aumentada por Recuperación)** fundamentadas en bases de datos vectoriales (`pgvector` en PostgreSQL) y modelos de lenguaje de Google Gemini, garantizando respuestas estrictamente apegadas al reglamento, calendario y tarifas oficiales sin alucinaciones.

Adicionalmente, incorpora un motor transaccional con propiedades **ACID** para la gestión y agendamiento en tiempo real de citas con la directiva escolar, previniendo colisiones o dobles reservas bajo concurrencia.

---

## 2. Arquitectura del Sistema

El sistema implementa una arquitectura orientada a servicios (SOA) y modular dividida en tres capas principales:

```
[ Cliente Web ]  <--->  [ Middleware n8n ]  <--->  [ Persistencia & IA ]
 (Next.js 14)           (Event-Driven Bus)         (Supabase + pgvector / Gemini)
```

1. **Capa de Presentación (Frontend):**
   - Construida en **Next.js 14** (App Router) y **Tailwind CSS**.
   - Interfaz conversacional adaptativa (*mobile-first*), con tarjetas interactivas de horarios disponibles y modal de reserva transaccional.
   - Endpoint proxy interno (`/api/chat`) para evitar problemas de CORS y proteger la dirección del webhook.

2. **Capa de Orquestación y Lógica de Negocio (Middleware):**
   - Implementada sobre **n8n** en contenedor Docker.
   - Orquesta la bifurcación lógica entre consultas informativas (pipeline RAG) y operaciones transaccionales (reserva de citas en base de datos).
   - Inyección de contexto estricto con temperatura cero (0.0) hacia el LLM.

3. **Capa de Persistencia y Seguridad (Base de Datos):**
   - Alojada en **PostgreSQL (Supabase)** con la extensión `pgvector`.
   - Búsqueda por similitud coseno en documentos normativos mediante índice HNSW.
   - Procedimiento almacenado `agendar_cita` con aislamiento y atomicidad ACID.
   - Seguridad perimetral mediante **Row Level Security (RLS)** y principio de menor privilegio.

---

## 3. Cumplimiento de Estándares de Calidad

- **ISO/IEC 25010 (Adecuación Funcional y Fiabilidad):** Validación atómica en motor de base de datos antes de confirmar asignaciones horarias; mitigación sistemática de alucinaciones informativas mediante contexto inyectado.
- **IEEE 730 (Aseguramiento de Calidad del Software - SQA):** Modularidad en capas, separación estricta de secretos en `.env` y control de ramas mediante integración continua.

---

## 4. Estructura del Repositorio

```text
proyecto-software/
├── database/                   # Capa de datos y persistencia (PostgreSQL / Supabase)
│   ├── 01_schema.sql           # Tablas, extensión pgvector, índices y RLS
│   ├── 02_functions.sql        # Funciones RPC (match_documentos, agendar_cita)
│   ├── 03_seed_data.sql        # Normativas, aranceles y bloques horarios de prueba
│   ├── seed_embeddings.py      # Vectorización con Gemini text-embedding
│   └── test_acid.sql           # Script de validación de concurrencia ACID
├── frontend/                   # Interfaz de usuario (Next.js + Tailwind CSS)
│   ├── src/
│   │   ├── app/                # Rutas y páginas (App Router)
│   │   │   ├── api/chat/       # Proxy seguro hacia n8n
│   │   │   ├── layout.tsx      # Configuración de layout y metadatos
│   │   │   └── page.tsx        # Interfaz de chat interactiva
│   │   └── components/         # Componentes modulares (Header, CitaModal, HorariosList)
│   └── package.json
├── n8n/                        # Middleware de automatización
│   ├── docker-compose.yml      # Despliegue local de n8n con persistencia y DNS
│   ├── generar_workflow.py     # Generador automatizado del flujo con credenciales
│   └── workflow_colegio.json   # Definición exportable/importable del flujo
├── .env.example                # Plantilla de variables de entorno
├── .gitignore                  # Exclusión de credenciales y dependencias
└── README.md                   # Documentación general del proyecto
```

---

## 5. Puesta en Marcha Rápida

### Requisitos Previos
- Node.js v18+ y npm
- Docker y Docker Compose
- Cuenta en Supabase (PostgreSQL gratuito)
- Clave de API de Google Gemini (Google AI Studio)

### Paso 1: Configurar Variables de Entorno
Copia la plantilla y configura tus credenciales:
```bash
cp .env.example .env
```
Edita `.env` con tus claves reales de Supabase y Gemini.

### Paso 2: Base de Datos (Supabase)
Ejecuta en el **SQL Editor** de Supabase en este orden:
1. `database/01_schema.sql`
2. `database/02_functions.sql`
3. `database/03_seed_data.sql`

Luego, vectoriza la base de conocimientos ejecutando:
```bash
python3 database/seed_embeddings.py
```

### Paso 3: Orquestación (n8n)
Levanta la instancia local de n8n:
```bash
docker compose -f n8n/docker-compose.yml up -d
```
1. Ingresa a `http://localhost:5678`.
2. Ve a **Workflows** -> **Import from File** y selecciona `n8n/workflow_colegio.json`.
3. Haz clic en **Publish** (arriba a la derecha) para activar el Webhook de producción.

### Paso 4: Frontend (Next.js)
Inicia la aplicación web:
```bash
cd frontend
npm install
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

---

## 6. Historias de Usuario Verificadas

- **HU01 - Consulta Normativa (RAG):** Representantes consultan aranceles y normativas en lenguaje natural, recibiendo respuestas fundamentadas en documentos oficiales.
- **HU02 - Reserva de Citas Directivas:** Los usuarios pueden seleccionar un horario disponible y agendar una reunión formal desde el chat.
- **HU03 - Prevención de Cruces (ACID):** Intentos simultáneos de reserva sobre el mismo horario son rechazados atómicamente por PostgreSQL.
- **HU04 - Fiabilidad de Información:** Si una pregunta escapa al reglamento cargado, el asistente virtual no alucina e invita a reservar una cita presencial.
