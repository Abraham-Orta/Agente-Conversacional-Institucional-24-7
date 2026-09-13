"use client";

import React from "react";

// ==============================================================================
// Componente: Cabecera Institucional del Chat
// ==============================================================================

export default function Header() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        {/* Ícono de insignia institucional */}
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-semibold text-base leading-tight">
            Colegio Institucional
          </h1>
          <p className="text-slate-400 text-xs">
            Asistente Virtual 24/7 para Representantes
          </p>
        </div>
      </div>

      {/* Indicador de estado en línea */}
      <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1.5 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-emerald-400 text-xs font-medium tracking-wide">
          En línea 24/7
        </span>
      </div>
    </header>
  );
}
