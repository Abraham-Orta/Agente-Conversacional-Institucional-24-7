"use client";

import React from "react";
import { Horario } from "./CitaModal";

// ==============================================================================
// Componente: Lista Interactiva de Horarios Disponibles
// ==============================================================================

interface HorariosListProps {
  horarios: Horario[];
  onSeleccionarHorario: (horario: Horario) => void;
}

export default function HorariosList({
  horarios,
  onSeleccionarHorario,
}: HorariosListProps) {
  if (!horarios || horarios.length === 0) return null;

  return (
    <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3 text-slate-300 text-xs font-semibold uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        Horarios Disponibles para Atención Directiva
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {horarios.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/60 transition-all group"
          >
            <div>
              <p className="text-white text-xs font-medium">📅 {h.fecha}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                ⏰ {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
              </p>
            </div>
            <button
              onClick={() => onSeleccionarHorario(h)}
              className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm group-hover:shadow-blue-500/20"
            >
              Agendar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
