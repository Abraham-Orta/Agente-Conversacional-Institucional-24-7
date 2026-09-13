# Frontend: Interfaz Conversacional Institucional

Módulo de presentación e interacción web para el **Agente Conversacional Institucional 24/7** (Proyecto UNEG - Ingeniería de Software 1).

Construido con **Next.js 14** (App Router), **React**, **TypeScript** y **Tailwind CSS**.

---

## Características Principales

- **Diseño Responsivo y Accesible:** Adaptado para teléfonos móviles, tablets y escritorios (*mobile-first*) con paleta oscura.
- **Burbujas Conversacionales Dinámicas:** Renderizado fluido de mensajes entre el representante y el asistente virtual con scroll automático.
- **Tarjetas Interactivas de Horarios:** Cuando el asistente sugiere espacios de reunión, se presentan tarjetas interactivas con fechas y horas disponibles.
- **Modal de Agendamiento ACID:** Formulario integrado que valida nombre, teléfono y motivo del representante antes de ejecutar la transacción atómica hacia la base de datos.
- **Chips de Preguntas Frecuentes:** Botones de acceso rápido para consultar tarifas, horarios y uniformes con un solo clic.
- **Proxy Seguro API Route (`/api/chat`):** El cliente web nunca llama directamente al webhook de n8n, evitando problemas de CORS y protegiendo las rutas internas del servidor.

---

## Estructura de Componentes

```text
frontend/src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Endpoint proxy hacia el Webhook de n8n
│   ├── fonts/                    # Tipografías Geist optimizadas
│   ├── globals.css               # Estilos globales y directivas de Tailwind CSS
│   ├── layout.tsx                # Metadatos del sitio e idioma institucional
│   └── page.tsx                  # Vista principal del chat y gestión de estado
└── components/
    ├── Header.tsx                # Cabecera con insignia y badge "En línea 24/7"
    ├── HorariosList.tsx          # Cuadrícula interactiva de bloques horarios
    └── CitaModal.tsx             # Modal para confirmación de citas directivas
```

---

## Configuración de Entorno

El frontend se conecta a n8n mediante la variable de entorno definida en `.env.local`:

```env
# URL del Webhook de n8n (Local o Túnel de Producción)
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
```

---

## Scripts Disponibles

En el directorio `frontend`, puedes ejecutar:

### Modo Desarrollo
Inicia el servidor local de desarrollo con recarga en caliente:
```bash
npm run dev
```
Disponible en: [http://localhost:3000](http://localhost:3000)

### Compilación de Producción
Compila y optimiza la aplicación para despliegue:
```bash
npm run build
```

### Servidor de Producción
Inicia el servidor optimizado tras la compilación:
```bash
npm start
```

### Verificación de Linter
Ejecuta el análisis estático de código:
```bash
npm run lint
```
