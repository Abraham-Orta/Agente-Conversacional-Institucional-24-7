"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import HorariosList from "@/components/HorariosList";
import CitaModal, { Horario } from "@/components/CitaModal";
import MensajeBot from "@/components/MensajeBot";

// ==============================================================================
// Página Principal: Interfaz Conversacional del Chatbot Institucional 24/7
// ==============================================================================

interface Mensaje {
  id: string;
  remitente: "bot" | "usuario";
  texto: string;
  timestamp: string;
  pensamiento?: string | null;
  horarios?: Horario[];
  citaConfirmada?: boolean;
}

function getHoraActual(): string {
  return new Date().toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Home() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: "bienvenida",
      remitente: "bot",
      timestamp: getHoraActual(),
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

    const hora = getHoraActual();

    const nuevoMensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      remitente: "usuario",
      texto: texto.trim(),
      timestamp: hora,
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
      const textoLimpio = data.respuesta || "No recibí una respuesta adecuada del sistema.";
      const pensamiento =
        typeof data.pensamiento === "string" && data.pensamiento ? data.pensamiento : null;

      // Filtrar horarios duplicados si los hubiera
      const horariosUnicos = data.horarios_disponibles
        ? Array.from(new Map(data.horarios_disponibles.map((item: Horario) => [item.id, item])).values()) as Horario[]
        : undefined;

      const nuevoMensajeBot: Mensaje = {
        id: (Date.now() + 1).toString(),
        remitente: "bot",
        texto: textoLimpio,
        timestamp: getHoraActual(),
        pensamiento,
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
          timestamp: getHoraActual(),
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
        timestamp: getHoraActual(),
        citaConfirmada: true,
      },
    ]);
  };

  // Preguntas sugeridas para interacción rápida
  const sugerencias = [
    { icono: "💰", texto: "¿Cuánto cuesta la matrícula y mensualidad?" },
    { icono: "⏰", texto: "¿Cuál es el horario escolar de entrada y salida?" },
    { icono: "👔", texto: "¿Cómo es el uniforme de primaria?" },
    { icono: "📅", texto: "¿Qué horarios tienen disponibles para citas directivas?" },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <Header />

      {/* Contenedor Principal con Scroll a Pantalla Completa */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-4xl mx-auto w-full px-4 py-6 md:px-8 space-y-6">
          {mensajes.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.remitente === "usuario" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              {m.remitente === "bot" ? (
                <div className="w-9 h-9 rounded-full bg-blue-600 border border-blue-500/50 flex items-center justify-center text-white shadow-md shadow-blue-600/20 flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-md flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}

              {/* Burbuja del mensaje */}
              <div
                className={`flex flex-col ${
                  m.remitente === "usuario" ? "items-end" : "items-start"
                } max-w-[85%] md:max-w-[78%] min-w-0`}
              >
                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed shadow-md break-words min-w-0 ${
                    m.remitente === "usuario"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none"
                  }`}
                >
                  {/* Render inteligente: oculta pensamiento del LLM, muestra respuesta final */}
                  {m.remitente === "bot" ? (
                    <MensajeBot texto={m.texto} pensamiento={m.pensamiento} />
                  ) : (
                    <div className="whitespace-pre-wrap">{m.texto}</div>
                  )}

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

                {/* Remitente y Hora */}
                <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-500 font-medium">
                  <span>{m.remitente === "usuario" ? "Tú" : "Asistente Virtual"}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Indicador de escritura */}
          {cargando && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 border border-blue-500/50 flex items-center justify-center text-white shadow-md flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={mensajesEndRef} />
        </div>
      </main>

      {/* Sugerencias de Preguntas Frecuentes */}
      {mensajes.length <= 2 && (
        <div className="px-4 py-3 max-w-4xl mx-auto w-full">
          <p className="text-xs text-slate-500 mb-2.5 font-medium flex items-center gap-1.5">
            <span>✨</span> Sugerencias de consulta rápida:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sugerencias.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => enviarMensaje(sug.texto)}
                disabled={cargando}
                className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 group"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">{sug.icono}</span>
                <span>{sug.texto}</span>
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
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
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
