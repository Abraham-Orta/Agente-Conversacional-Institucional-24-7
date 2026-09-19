"use client";

import { useState, useEffect } from "react";

// ==============================================================================
// Administración: Gestión de Turnos del Calendario — Componente del Cliente
// Permite alternar la disponibilidad de turnos, crear y eliminar bloques horarios
// ==============================================================================

interface Horario {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "Disponible" | "Ocupado";
  created_at: string;
}

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // New slot form
  const [showForm, setShowForm] = useState(false);
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchHorarios = async () => {
    try {
      const res = await fetch("/api/admin/horarios");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHorarios(data.horarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar horarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, []);

  const toggleEstado = async (horario: Horario) => {
    setToggling(horario.id);
    const nuevoEstado = horario.estado === "Disponible" ? "Ocupado" : "Disponible";

    try {
      const res = await fetch(`/api/admin/horarios/${horario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setHorarios((prev) =>
        prev.map((h) => (h.id === horario.id ? { ...h, estado: nuevoEstado } : h))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar estado.");
    } finally {
      setToggling(null);
    }
  };

  const eliminarHorario = async (id: string) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      const res = await fetch(`/api/admin/horarios/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setHorarios((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    }
  };

  const crearHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, hora_inicio: horaInicio, hora_fin: horaFin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setHorarios((prev) => [...prev, data.horario].sort((a, b) =>
        a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio)
      ));
      setShowForm(false);
      setFecha("");
      setHoraInicio("");
      setHoraFin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear horario.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Horarios de Citas</h1>
          <p className="text-slate-400 text-sm">Gestión del calendario directivo</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo horario
        </button>
      </div>

      {error && (
        <div className="mb-5 bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Formulario de creación de turno */}
      {showForm && (
        <form
          onSubmit={crearHorario}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 grid grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Hora inicio</label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Hora fin</label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="col-span-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white text-sm transition-colors px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {creating ? "Creando..." : "Crear horario"}
            </button>
          </div>
        </form>
      )}

      {/* Tabla de turnos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-slate-500 text-sm">Cargando horarios...</div>
        ) : horarios.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500 text-sm">No hay horarios cargados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800">
              <tr>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Fecha</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Horario</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Estado</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {horarios.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-white">
                    {new Date(h.fecha + "T12:00:00").toLocaleDateString("es-VE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {h.hora_inicio} – {h.hora_fin}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleEstado(h)}
                      disabled={toggling === h.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        h.estado === "Disponible"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
                          : "bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900"
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          h.estado === "Disponible" ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      {toggling === h.id ? "..." : h.estado}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => eliminarHorario(h.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
