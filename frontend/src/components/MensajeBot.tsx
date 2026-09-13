"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

// ==============================================================================
// Componente: Mensaje del Bot con Acordeón de Razonamiento (Pensamiento / CoT)
// ==============================================================================

interface MensajeBotProps {
  texto: string;
  pensamiento?: string | null;
}

/**
 * Función de respaldo (fallback) en el cliente por si el texto viene sin procesar.
 */
function limpiarTextoFallback(textoBruto: string): {
  respuesta: string;
  pensamiento: string | null;
} {
  if (!textoBruto) return { respuesta: "", pensamiento: null };
  const texto = textoBruto.trim();

  // Buscar bloque entre comillas con saludo en español
  const patternComillas = /["“]([\s]*((?:Estimad[oa]|Hola|Buen[oa]s|Saludos|Con gusto|Es un placer)[\s\S]+?))["”]/g;
  const matches = Array.from(texto.matchAll(patternComillas));
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const startIdx = lastMatch.index ?? 0;
    const endIdx = startIdx + lastMatch[0].length;

    const pensamientoAntes = texto.slice(0, startIdx).trim();
    const pensamientoDespues = texto.slice(endIdx).trim();
    let pensamiento = pensamientoAntes;
    if (pensamientoDespues) {
      pensamiento = (pensamiento ? pensamiento + "\n\n" : "") + pensamientoDespues;
    }

    const respuestaRaw = lastMatch[1].trim();
    const lineas = respuestaRaw.split("\n").map((l) => l.trimStart());
    return {
      respuesta: lineas.join("\n"),
      pensamiento: pensamiento || null,
    };
  }

  // Si no hay comillas, limpiar sangrías iniciales
  const lineas = texto.split("\n").map((l) => l.trimStart());
  return {
    respuesta: lineas.join("\n"),
    pensamiento: null,
  };
}

export default function MensajeBot({ texto, pensamiento: pensamientoProp }: MensajeBotProps) {
  const [desplegado, setDesplegado] = useState(false);

  // Si no vino pensamiento como prop, intentar extraerlo del texto como fallback
  let pensamiento = pensamientoProp;
  let respuestaFinal = texto;

  if (!pensamiento) {
    const fallback = limpiarTextoFallback(texto);
    if (fallback.pensamiento) {
      pensamiento = fallback.pensamiento;
      respuestaFinal = fallback.respuesta;
    } else {
      respuestaFinal = fallback.respuesta;
    }
  } else {
    // Asegurar que las líneas no tengan sangría accidental
    respuestaFinal = texto.split("\n").map((l) => l.trimStart()).join("\n");
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden break-words text-white">
      {/* Acordeón de Pensamiento / Razonamiento Interno */}
      {pensamiento && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setDesplegado(!desplegado)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all cursor-pointer select-none"
            title="Hacer clic para ver el proceso de inferencia y evaluación del modelo"
          >
            <svg
              className={`w-3.5 h-3.5 text-blue-400 transition-transform duration-200 ${
                desplegado ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-medium text-[11px]">
              {desplegado ? "Ocultar proceso de pensamiento (CoT)" : "Ver proceso de pensamiento del LLM (Debug)"}
            </span>
          </button>

          {desplegado && (
            <div className="mt-2.5 p-3.5 bg-slate-950/95 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 leading-relaxed max-h-72 overflow-y-auto overflow-x-hidden shadow-inner whitespace-pre-wrap break-words animate-in fade-in duration-150">
              <div className="text-[10px] uppercase font-bold text-blue-400 mb-1.5 tracking-wider border-b border-slate-800 pb-1">
                ⚙️ Razonamiento Interno del Modelo (Cadena de Pensamiento):
              </div>
              {pensamiento}
            </div>
          )}
        </div>
      )}

      {/* Respuesta Final al Representante — Renderizada con Markdown nativo */}
      <div className="text-white text-sm leading-relaxed break-words space-y-2.5">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-100 break-words">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-white">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-slate-200">{children}</em>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-outside pl-5 my-2.5 space-y-1.5 text-slate-100 break-words">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside pl-5 my-2.5 space-y-1.5 text-slate-100 break-words">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed text-slate-100 break-words">{children}</li>
            ),
            h1: ({ children }) => (
              <h1 className="text-base font-bold text-white mt-3 mb-1.5">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-bold text-white mt-3 mb-1">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-white mt-2 mb-1">{children}</h3>
            ),
            code: ({ children }) => (
              <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono break-all">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-slate-800 rounded-lg p-3 text-xs text-slate-200 my-2 whitespace-pre-wrap break-words overflow-x-hidden">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-blue-500 pl-3 italic text-slate-300 my-2">
                {children}
              </blockquote>
            ),
          }}
        >
          {respuestaFinal}
        </ReactMarkdown>
      </div>
    </div>
  );
}
