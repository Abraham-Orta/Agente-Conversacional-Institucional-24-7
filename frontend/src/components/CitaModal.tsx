"use client";

import React, { useState } from "react";

// ==============================================================================
// Componente: Modal para Agendar Cita Presencial con la Directiva
// ==============================================================================

export interface Horario {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

interface CitaModalProps {
  horario: Horario | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (datos: {
    horario_id: string;
    nombre: string;
    telefono: string;
    motivo: string;
  }) => Promise<void>;
}

export default function CitaModal({
  horario,
  isOpen,
  onClose,
  onConfirmar,
}: CitaModalProps) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !horario) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("Por favor ingresá tu nombre completo.");
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await onConfirmar({
        horario_id: horario.id,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        motivo: motivo.trim() || "Consulta general con la directiva",
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al procesar la reserva.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-lg">
              Agendar Cita Directiva
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Detalle del bloque horario seleccionado */}
        <div className="bg-slate-800/60 rounded-xl p-3 mb-4 border border-slate-700/50">
          <p className="text-slate-300 text-sm font-medium">
            📅 Fecha: <span className="text-white font-semibold">{horario.fecha}</span>
          </p>
          <p className="text-slate-300 text-sm font-medium mt-1">
            ⏰ Horario: <span className="text-blue-400 font-semibold">{horario.hora_inicio} a {horario.hora_fin}</span>
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 px-3 py-2 rounded-xl text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">
              Nombre y Apellido del Representante *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">
              Teléfono de Contacto (WhatsApp)
            </label>
            <input
              type="tel"
              placeholder="Ej. 0414-1234567"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">
              Motivo de la Cita
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Consulta sobre proceso de inscripción y requisitos"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {enviando ? "Confirmando..." : "Confirmar Cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
