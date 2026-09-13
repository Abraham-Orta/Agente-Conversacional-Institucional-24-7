"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import HorariosList from "@/components/HorariosList";
import CitaModal, { Horario } from "@/components/CitaModal";

// ==============================================================================
// Página Principal: Interfaz Conversacional del Chatbot Institucional 24/7
// ==============================================================================

interface Mensaje {
  id: string;
  remitente: "bot" | "usuario";
  texto: string;
  horarios?: Horario[];
  citaConfirmada?: boolean;
}

// Función para limpiar posibles trazas o notas internas del modelo
function limpiarTextoRespuesta(texto: string): string {
  if (!texto) return "";
  // Si contiene comillas de respuesta final, extraer la respuesta limpia
  const matchComillas = texto.match(/"([^"]{30,})"/);
  if (matchComillas && matchComillas[1]) {
    return matchComillas[1].trim();
  }
  // Si empieza con notas en inglés, buscar saludos en español
  const saludos = ["Hola", "Estimado", "Buen día", "Buenas tardes", "Saludos", "Con gusto"];
  for (const saludo of saludos) {
    const idx = texto.indexOf(saludo);
    if (idx !== -1 && idx > 50) {
      return texto.slice(idx).trim();
    }
  }
  return texto.trim();
}

export default function Home() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: "bienvenida",
      remitente: "bot",
      texto:
        "¡Hola! 👋 Soy el Asistente Virtual Oficial del Colegio Institucional (atención 24/7).\n\nPuedo responder tus dudas sobre costos de matrícula, normativas de uniformes, horarios y requisitos de inscripción, o ayudarte a agendar una cita con la directiva escolar.\n\n¿En qué te puedo colaborar hoy?",
    },
  ]);
  const [inputTexto, setInputTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [horarioParaAgendar, setHorarioParaAgendar] = useState<Horario | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  // Enviar mensaje al Webhook mediante la API Route de Next.js
  const enviarMensaje = async (textoAEnviar?: string) => {
    const texto = textoAEnviar || inputTexto;
    if (!texto.trim() || cargando) return;

    const nuevoMensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      remitente: "usuario",
      texto: texto.trim(),
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    if (!textoAEnviar) setInputTexto("");
    setCargando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: texto.trim(),
          sessionId: "sesion-web-1",
        }),
      });

      if (!res.ok) {
        throw new Error("Error de comunicación con el asistente virtual.");
      }

      const data = await res.json();
      const textoLimpio = limpiarTextoRespuesta(data.respuesta || "No recibí una respuesta adecuada del sistema.");

      // Filtrar horarios duplicados si los hubiera
      const horariosUnicos = data.horarios_disponibles
        ? Array.from(new Map(data.horarios_disponibles.map((item: Horario) => [item.id, item])).values()) as Horario[]
        : undefined;

      const nuevoMensajeBot: Mensaje = {
        id: (Date.now() + 1).toString(),
        remitente: "bot",
        texto: textoLimpio,
        horarios: horariosUnicos,
      };

      setMensajes((prev) => [...prev, nuevoMensajeBot]);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Error inesperado.";
      setMensajes((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          remitente: "bot",
          texto: `⚠️ Lo siento, ocurrió un error temporal: ${errorMsg}. Por favor, intentá nuevamente.`,
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  // Confirmar cita desde el modal (ejecuta acción transaccional ACID)
  const handleConfirmarCita = async (datos: {
    horario_id: string;
    nombre: string;
    telefono: string;
    motivo: string;
  }) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "agendar",
        ...datos,
      }),
    });

    const data = await res.json();

    if (!data.exito) {
      throw new Error(data.mensaje || "El horario seleccionado ya no está disponible.");
    }

    // Agregar mensaje de confirmación en el chat
    setMensajes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        remitente: "bot",
        texto: `✅ ¡Cita confirmada con éxito!\n\n📅 Fecha: ${data.cita?.fecha}\n⏰ Horario: ${data.cita?.hora_inicio} a ${data.cita?.hora_fin}\n👤 Representante: ${data.cita?.nombre_representante}\n\nTe esperamos puntualmente en la directiva escolar.`,
        citaConfirmada: true,
      },
    ]);
  };

  // Preguntas sugeridas para interacción rápida
  const sugerencias = [
    "¿Cuánto cuesta la matrícula y mensualidad?",
    "¿Cuál es el horario escolar de entrada y salida?",
    "¿Cómo es el uniforme de primaria?",
    "¿Qué horarios tienen disponibles para citas directivas?",
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      <Header />

      {/* Contenedor de Mensajes */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-4xl mx-auto w-full space-y-4">
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.remitente === "usuario" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[88%] md:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                m.remitente === "usuario"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
              }`}
            >
              {/* Formato de texto limpio */}
              <div className="whitespace-pre-wrap">{m.texto}</div>

              {/* Lista interactiva de citas si el bot retornó horarios */}
              {m.horarios && m.horarios.length > 0 && (
                <HorariosList
                  horarios={m.horarios}
                  onSeleccionarHorario={(h) => {
                    setHorarioParaAgendar(h);
                    setModalAbierto(true);
                  }}
                />
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {m.remitente === "usuario" ? "Tú" : "Asistente Virtual"}
            </span>
          </div>
        ))}

        {/* Indicador de escritura */}
        {cargando && (
          <div className="flex items-start gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none p-4 shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}

        <div ref={mensajesEndRef} />
      </main>

      {/* Sugerencias de Preguntas Frecuentes */}
      {mensajes.length <= 2 && (
        <div className="px-4 py-2 max-w-4xl mx-auto w-full">
          <p className="text-xs text-slate-500 mb-2 font-medium">Preguntas frecuentes:</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {sugerencias.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => enviarMensaje(sug)}
                disabled={cargando}
                className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full text-xs transition-colors shadow-sm"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Entrada de Texto */}
      <footer className="bg-slate-900/80 backdrop-blur-md border-t border-slate-800 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviarMensaje();
          }}
          className="max-w-4xl mx-auto flex gap-3"
        >
          <input
            type="text"
            placeholder="Escribí tu consulta sobre reglamentos, tarifas o citas..."
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            disabled={cargando}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputTexto.trim() || cargando}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-5 py-3 rounded-2xl font-medium text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <span>Enviar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </footer>

      {/* Modal para confirmar cita */}
      <CitaModal
        horario={horarioParaAgendar}
        isOpen={modalAbierto}
        onClose={() => {
          setModalAbierto(false);
          setHorarioParaAgendar(null);
        }}
        onConfirmar={handleConfirmarCita}
      />
    </div>
  );
}
