"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

// ==============================================================================
// Editor de Documentos — Se utiliza tanto para crear como para editar normativas
// Cuando id === "nuevo" → POST para crear; de lo contrario → GET + PUT para actualizar
// ==============================================================================

export default function DocumentoEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === "nuevo";

  const [contenido, setContenido] = useState("");
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchDocumento = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/documentos/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContenido(data.documento.contenido);
      setTitulo(data.documento.metadatos?.titulo ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el documento.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isNew) {
      fetchDocumento();
    }
  }, [isNew, fetchDocumento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const payload = {
        contenido,
        metadatos: { titulo: titulo.trim() || "Sin título" },
      };

      const res = isNew
        ? await fetch("/api/admin/documentos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/documentos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);

      if (isNew) {
        // Redirigir al editor del nuevo documento creado
        router.push(`/admin/documentos/${data.documento.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este documento? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/admin/documentos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      router.push("/admin/documentos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Cargando documento...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push("/admin/documentos")}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isNew ? "Nuevo documento" : "Editar documento"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {isNew
              ? "El embedding se generará automáticamente al guardar."
              : "Al guardar se regenerará el embedding con Gemini gemini-embedding-001."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 text-sm rounded-xl px-4 py-3">
            ✓ Documento guardado y embedding actualizado correctamente.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Título (metadato)
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Reglamento de Uniformes"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Contenido normativo
          </label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            required
            rows={16}
            placeholder="Ingresá el texto completo del reglamento, normativa o información que debe conocer el chatbot..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-y font-mono leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 text-sm transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar documento
            </button>
          )}
          <div className={!isNew ? "" : "ml-auto"}>
            <button
              type="submit"
              disabled={saving || !contenido.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              {saving ? "Guardando y generando embedding..." : "Guardar documento"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
