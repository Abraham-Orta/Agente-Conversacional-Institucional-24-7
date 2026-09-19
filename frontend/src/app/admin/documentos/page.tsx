import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ==============================================================================
// Administración: Lista de Documentos Normativos — Componente de Servidor
// ==============================================================================

interface Documento {
  id: string;
  contenido: string;
  metadatos: { titulo?: string } | null;
  created_at: string;
}

async function getDocumentos(): Promise<Documento[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("documentos_normativos")
    .select("id, contenido, metadatos, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Documento[];
}

export default async function DocumentosPage() {
  const documentos = await getDocumentos();

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Documentos Normativos</h1>
          <p className="text-slate-400 text-sm">Base de conocimiento del chatbot (RAG)</p>
        </div>
        <Link
          href="/admin/documentos/nuevo"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo documento
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {documentos.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500 text-sm">
            No hay documentos cargados aún.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800">
              <tr>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">ID</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Título / Contenido</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Fecha</th>
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                    {doc.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-white font-medium truncate">
                      {doc.metadatos?.titulo ?? "Sin título"}
                    </p>
                    <p className="text-slate-500 text-xs truncate mt-0.5">
                      {doc.contenido.slice(0, 80)}…
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                    {new Date(doc.created_at).toLocaleDateString("es-VE")}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/documentos/${doc.id}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium"
                    >
                      Editar
                    </Link>
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
