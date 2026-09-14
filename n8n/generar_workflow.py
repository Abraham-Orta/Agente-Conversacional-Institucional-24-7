#!/usr/bin/env python3
"""
generar_workflow.py: Genera el archivo workflow_colegio.json listo para importar en n8n
con las credenciales de Supabase y Google Gemini inyectadas desde el archivo .env.
"""

import os
import sys
import json
from pathlib import Path

# Cargar variables del .env
ruta_raiz = Path(__file__).resolve().parent.parent
ruta_env = ruta_raiz / ".env"
if ruta_env.exists():
    with open(ruta_env, "r", encoding="utf-8") as f:
        for linea in f:
            linea = linea.strip()
            if not linea or linea.startswith("#") or "=" not in linea:
                continue
            k, v = linea.split("=", 1)
            k = k.strip()
            v = v.strip().strip("'\"")
            if k not in os.environ:
                os.environ[k] = v

supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
gemini_key = os.environ.get("GEMINI_API_KEY", "")

if not supabase_url or not supabase_key or not gemini_key:
    print("Error: Asegurate de tener configurado .env con SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y GEMINI_API_KEY")
    sys.exit(1)

js_codigo_ensamblador = """// Recuperar datos de nodos anteriores
const mensajeUsuario = $('Webhook Entrada').first().json.body.mensaje || '';
const docsEncontrados = $('Supabase - Búsqueda pgvector').all().map(item => item.json.contenido).filter(Boolean);
const horariosDisponibles = $('Supabase - Horarios Disponibles').all().map(item => item.json);

let contextoNormativo = 'No se encontraron artículos normativos específicos en la base oficial para esta consulta.';
if (docsEncontrados.length > 0) {
  contextoNormativo = docsEncontrados.join('\\n\\n');
}

let listaHorariosTexto = 'Actualmente no hay horarios disponibles registrados.';
if (horariosDisponibles.length > 0) {
  listaHorariosTexto = horariosDisponibles.map(h => `- Bloque ID: ${h.id} | Fecha: ${h.fecha} | Horario: ${h.hora_inicio} a ${h.hora_fin}`).join('\\n');
}

const promptCompleto = `Eres el Asistente Virtual Oficial del Colegio (atención institucional 24/7).

REGLAS ESTRICTAS DE RESPUESTA:
1. Responde de forma cordial, empática, profesional y concisa en español.
2. Basate EXCLUSIVAMENTE en el siguiente CONTEXTO NORMATIVO oficial.
3. Si la respuesta a la pregunta del representante NO está en el contexto normativo oficial provisto, o no tienes la certeza absoluta, TIENES PROHIBIDO INVENTAR INFORMACIÓN (cero alucinaciones). Explica amablemente que no dispones de esa información en tus registros oficiales y sugiere al representante agendar una cita presencial con la directiva escolar.
4. Si el representante solicita una reunión o cita, infórmale de los horarios disponibles que figuran abajo e indícale que puede agendar seleccionando el horario deseado y proporcionando su nombre y teléfono.

--- CONTEXTO NORMATIVO OFICIAL ---
${contextoNormativo}

--- HORARIOS DISPONIBLES EN AGENDA DIRECTIVA ---
${listaHorariosTexto}

--- PREGUNTA DEL REPRESENTANTE ---
${mensajeUsuario}
`;

return {
  json: {
    mensajeOriginal: mensajeUsuario,
    prompt: promptCompleto,
    horarios: horariosDisponibles,
    hayDocumentos: docsEncontrados.length > 0
  }
};
"""

workflow = {
    "name": "Agente Conversacional Institucional 24/7",
    "nodes": [
        {
            "parameters": {
                "httpMethod": "POST",
                "path": "chat",
                "responseMode": "responseNode",
                "options": {}
            },
            "id": "node-webhook-entrada",
            "name": "Webhook Entrada",
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 2,
            "position": [100, 300],
            "webhookId": "colegio-chat-webhook"
        },
        {
            "parameters": {
                "conditions": {
                    "options": {
                        "caseSensitive": True,
                        "leftValue": "",
                        "typeValidation": "strict",
                        "version": 2
                    },
                    "conditions": [
                        {
                            "id": "cond-es-agendar",
                            "leftValue": "={{ $json.body.accion }}",
                            "rightValue": "agendar",
                            "operator": {
                                "type": "string",
                                "operation": "equals"
                            }
                        }
                    ],
                    "combinator": "and"
                },
                "options": {}
            },
            "id": "node-enrutador-intencion",
            "name": "¿Es Acción Agendar?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2.2,
            "position": [340, 300]
        },
        {
            "parameters": {
                "method": "POST",
                "url": f"{supabase_url}/rest/v1/rpc/agendar_cita",
                "sendHeaders": True,
                "headerParameters": {
                    "parameters": [
                        {"name": "apikey", "value": supabase_key},
                        {"name": "Authorization", "value": f"Bearer {supabase_key}"},
                        {"name": "Content-Type", "value": "application/json"}
                    ]
                },
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={\n  \"p_horario_id\": \"{{ $json.body.horario_id }}\",\n  \"p_nombre\": \"{{ $json.body.nombre }}\",\n  \"p_telefono\": \"{{ $json.body.telefono || '' }}\",\n  \"p_email\": \"{{ $json.body.email || '' }}\",\n  \"p_motivo\": \"{{ $json.body.motivo || 'Consulta general' }}\"\n}",
                "options": {}
            },
            "id": "node-rpc-agendar-cita",
            "name": "Supabase - Agendar Cita ACID",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [620, 150]
        },
        {
            "parameters": {
                "respondWith": "json",
                "responseBody": "={\n  \"exito\": {{ $json.success }},\n  \"mensaje\": {{ JSON.stringify($json.message) }},\n  \"cita\": {{ JSON.stringify($json) }}\n}",
                "options": {}
            },
            "id": "node-resp-cita",
            "name": "Respuesta Cita Agendada",
            "type": "n8n-nodes-base.respondToWebhook",
            "typeVersion": 1.1,
            "position": [880, 150]
        },
        {
            "parameters": {
                "method": "POST",
                "url": f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={gemini_key}",
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={\n  \"content\": {\n    \"parts\": [{\"text\": \"{{ $json.body.mensaje }}\"}]\n  },\n  \"outputDimensionality\": 768\n}",
                "options": {}
            },
            "id": "node-gemini-embedding",
            "name": "Gemini - Generar Embedding",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [620, 450]
        },
        {
            "parameters": {
                "method": "POST",
                "url": f"{supabase_url}/rest/v1/rpc/match_documentos",
                "sendHeaders": True,
                "headerParameters": {
                    "parameters": [
                        {"name": "apikey", "value": supabase_key},
                        {"name": "Authorization", "value": f"Bearer {supabase_key}"},
                        {"name": "Content-Type", "value": "application/json"}
                    ]
                },
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={\n  \"query_embedding\": {{ JSON.stringify($json.embedding.values) }},\n  \"match_threshold\": 0.35,\n  \"match_count\": 3\n}",
                "options": {}
            },
            "id": "node-supabase-match-docs",
            "name": "Supabase - Búsqueda pgvector",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [880, 450]
        },
        {
            "parameters": {
                "method": "GET",
                "url": f"{supabase_url}/rest/v1/calendario_directivo?estado=eq.Disponible&order=fecha.asc,hora_inicio.asc&limit=10",
                "sendHeaders": True,
                "headerParameters": {
                    "parameters": [
                        {"name": "apikey", "value": supabase_key},
                        {"name": "Authorization", "value": f"Bearer {supabase_key}"}
                    ]
                },
                "options": {}
            },
            "id": "node-supabase-horarios",
            "name": "Supabase - Horarios Disponibles",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1120, 450]
        },
        {
            "parameters": {
                "jsCode": js_codigo_ensamblador
            },
            "id": "node-codigo-ensamblador",
            "name": "Ensamblar Prompt y Contexto",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1360, 450]
        },
        {
            "parameters": {
                "method": "POST",
                "url": f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}",
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={\n  \"contents\": [\n    {\n      \"parts\": [{\"text\": {{ JSON.stringify($json.prompt) }} }]\n    }\n  ],\n  \"generationConfig\": {\n    \"temperature\": 0.0\n  }\n}",
                "options": {}
            },
            "id": "node-gemini-flash",
            "name": "Gemini 1.5 Flash (Inferencia)",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1600, 450]
        },
        {
            "parameters": {
                "respondWith": "json",
                "responseBody": "={\n  \"partes\": {{ JSON.stringify($json.candidates[0].content.parts) }},\n  \"horarios_disponibles\": {{ JSON.stringify($(\"Ensamblar Prompt y Contexto\").first().json.horarios) }}\n}",
                "options": {}
            },
            "id": "node-resp-chat",
            "name": "Respuesta al Chat",
            "type": "n8n-nodes-base.respondToWebhook",
            "typeVersion": 1.1,
            "position": [1840, 450]
        }
    ],
    "connections": {
        "Webhook Entrada": {
            "main": [
                [
                    {
                        "node": "¿Es Acción Agendar?",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "¿Es Acción Agendar?": {
            "main": [
                [
                    {
                        "node": "Supabase - Agendar Cita ACID",
                        "type": "main",
                        "index": 0
                    }
                ],
                [
                    {
                        "node": "Gemini - Generar Embedding",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Supabase - Agendar Cita ACID": {
            "main": [
                [
                    {
                        "node": "Respuesta Cita Agendada",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Gemini - Generar Embedding": {
            "main": [
                [
                    {
                        "node": "Supabase - Búsqueda pgvector",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Supabase - Búsqueda pgvector": {
            "main": [
                [
                    {
                        "node": "Supabase - Horarios Disponibles",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Supabase - Horarios Disponibles": {
            "main": [
                [
                    {
                        "node": "Ensamblar Prompt y Contexto",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Ensamblar Prompt y Contexto": {
            "main": [
                [
                    {
                        "node": "Gemini 1.5 Flash (Inferencia)",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        },
        "Gemini 1.5 Flash (Inferencia)": {
            "main": [
                [
                    {
                        "node": "Respuesta al Chat",
                        "type": "main",
                        "index": 0
                    }
                ]
            ]
        }
    },
    "active": False,
    "settings": {
        "executionOrder": "v1"
    }
}

ruta_salida = ruta_raiz / "n8n" / "workflow_colegio.json"
with open(ruta_salida, "w", encoding="utf-8") as f:
    json.dump(workflow, f, indent=2, ensure_ascii=False)

print(f"Workflow generado con éxito en: {ruta_salida}")
