import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LogChat {
  id: string;
  session_id: string;
  mensaje_usuario: string;
  total_tokens: number;
  created_at: string;
}

async function getLogsChat(): Promise<LogChat[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("logs_chat")
    .select("id, session_id, mensaje_usuario, total_tokens, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function TokensPage() {
  const logs = await getLogsChat();
  const totalTokens = logs.reduce((total, log) => total + (log.total_tokens || 0), 0);
  const sessions = new Set(logs.map((log) => log.session_id)).size;
  const averageTokens = logs.length > 0 ? Math.round(totalTokens / logs.length) : 0;

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Uso de tokens</h1>
        <p className="text-slate-400 text-sm">
          Registro completo del consumo de tokens por cada consulta realizada.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-xs">Consultas registradas</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{logs.length.toLocaleString("es-VE")}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-xs">Tokens consumidos</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{totalTokens.toLocaleString("es-VE")}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-xs">Promedio por consulta</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{averageTokens.toLocaleString("es-VE")}</p>
        </div>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold text-sm">Consultas de chat</h2>
            <p className="text-slate-500 text-xs mt-1">{sessions} sesiones registradas</p>
          </div>
          <span className="text-slate-500 text-xs">Más recientes primero</span>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500 text-sm">
            No hay registros de chat aún.
          </div>
        ) : (
          <div className="max-h-[calc(100vh-20rem)] overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {logs.map((log) => (
                <article
                  key={log.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="font-mono text-[11px] bg-slate-800 px-2 py-1 rounded text-blue-400 break-all">
                      Sesión: {log.session_id}
                    </span>
                    <span className="text-purple-400 font-semibold text-xs whitespace-nowrap">
                      {log.total_tokens.toLocaleString("es-VE")} tokens
                    </span>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words mb-4">
                    {log.mensaje_usuario}
                  </p>
                  <time dateTime={log.created_at} className="text-slate-500 text-xs">
                    {formatDate(log.created_at)}
                  </time>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
