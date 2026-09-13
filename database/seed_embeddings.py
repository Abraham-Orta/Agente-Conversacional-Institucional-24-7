#!/usr/bin/env python3
"""
seed_embeddings.py: Calcula y almacena embeddings de 768 dimensiones en Supabase
para las filas de documentos_normativos donde embedding IS NULL usando la API de Gemini.
Carga automáticamente variables de entorno desde el archivo .env si existe.
Solo utiliza la biblioteca estándar de Python (no requiere pip ni dependencias externas).
"""

import os
import sys
import json
import time
from pathlib import Path
import urllib.request
import urllib.error


def cargar_archivo_env():
    """Lee el archivo .env en la raíz del proyecto si existe y carga las variables."""
    ruta_raiz = Path(__file__).resolve().parent.parent
    ruta_env = ruta_raiz / ".env"
    if ruta_env.exists():
        with open(ruta_env, "r", encoding="utf-8") as f:
            for linea in f:
                linea = linea.strip()
                if not linea or linea.startswith("#") or "=" not in linea:
                    continue
                clave, valor = linea.split("=", 1)
                clave = clave.strip()
                valor = valor.strip().strip("'\"")
                if clave not in os.environ:
                    os.environ[clave] = valor


# Cargar variables antes de leerlas
cargar_archivo_env()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("SUPABASE_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


def obtener_embedding(texto: str, intentos: int = 3) -> list:
    """Solicita el vector de embedding al modelo gemini-embedding-001 de Google Gemini."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"
    payload = json.dumps({
        "content": {
            "parts": [{"text": texto}]
        },
        "outputDimensionality": 768
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})

    for i in range(intentos):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["embedding"]["values"]
        except (urllib.error.URLError, TimeoutError) as e:
            if i < intentos - 1:
                time.sleep(2)
                continue
            print(f"Error de red al consultar Gemini: {e}")
            sys.exit(1)
        except urllib.error.HTTPError as e:
            print(f"Error HTTP de Gemini: {e.read().decode('utf-8')}")
            sys.exit(1)


def obtener_documentos_pendientes() -> list:
    """Obtiene los documentos que aún no tienen vector generado."""
    url = f"{SUPABASE_URL}/rest/v1/documentos_normativos?embedding=is.null&select=id,contenido"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def actualizar_embedding_documento(doc_id: str, embedding: list, intentos: int = 3):
    """Actualiza la fila en Supabase con el vector generado, con reintentos."""
    url = f"{SUPABASE_URL}/rest/v1/documentos_normativos?id=eq.{doc_id}"
    payload = json.dumps({"embedding": embedding}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="PATCH",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
    )
    for i in range(intentos):
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                return resp.status
        except Exception as e:
            if i < intentos - 1:
                time.sleep(3)
                continue
            print(f"Error al actualizar Supabase para doc {doc_id}: {e}")
            sys.exit(1)


def main():
    if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
        print("Error: Faltan variables de entorno requeridas.")
        print("Asegurate de definir en tu archivo .env o en el entorno:")
        print("  SUPABASE_URL")
        print("  SUPABASE_SERVICE_ROLE_KEY")
        print("  GEMINI_API_KEY")
        sys.exit(1)

    print("Consultando documentos sin embedding en Supabase...")
    docs = obtener_documentos_pendientes()
    if not docs:
        print("¡Todos los documentos ya tienen sus embeddings calculados!")
        return

    print(f"Se encontraron {len(docs)} documentos pendientes de procesar.")

    for idx, doc in enumerate(docs, 1):
        doc_id = doc["id"]
        texto = doc["contenido"]
        print(f"[{idx}/{len(docs)}] Generando embedding para documento {doc_id}...")
        emb = obtener_embedding(texto)
        actualizar_embedding_documento(doc_id, emb)
        print(f" -> Documento {doc_id} actualizado con vector de {len(emb)} dimensiones.")
        time.sleep(1)

    print("\n¡Base de conocimientos vectorizada exitosamente!")


if __name__ == "__main__":
    main()
