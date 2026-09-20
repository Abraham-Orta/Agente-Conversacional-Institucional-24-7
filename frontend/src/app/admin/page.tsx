import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ==============================================================================
// Página Principal del Dashboard Administrativo — Métricas obtenidas en el servidor
// ==============================================================================

interface CitaReciente {
  id: string;
  nombre_representante: string;
  motivo_cita: string;
  created_at: string;
  calendario_directivo: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
  } | null;
}

interface LogChatReciente {
  id: string;
  session_id: string;
  mensaje_usuario: string;
  total_tokens: number;
  created_at: string;
}

interface Metricas {
  total_documentos: number;
  total_citas: number;
  total_horarios: number;
  horarios_disponibles: number;
  horarios_ocupados: number;
  total_tokens: number;
  total_sesiones: number;
  promedio_tokens_sesion: number;
  citas_recientes: CitaReciente[];
  logs_recientes: LogChatReciente[];
}

async function getMetricas(): Promise<Metricas> {
  const supabase = createSupabaseAdminClient();

  const [
    docsResult,
    horariosResult,
    citasResult,
    citasRecientesResult,
    logsTokensResult,
    logsRecientesResult,
  ] = await Promise.all([
    supabase.from("documentos_normativos").select("id", { count: "exact", head: true }),
    supabase.from("calendario_directivo").select("id, estado"),
    supabase.from("citas_agendadas").select("id", { count: "exact", head: true }),
    supabase
      .from("citas_agendadas")
      .select("id, nombre_representante, motivo_cita, created_at, calendario_directivo(fecha, hora_inicio, hora_fin)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("logs_chat").select("total_tokens, session_id"),
    supabase
      .from("logs_chat")
      .select("id, session_id, mensaje_usuario, total_tokens, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const horarios = horariosResult.data ?? [];
  const logs = logsTokensResult.data ?? [];
  const totalTokens = logs.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
  const sesionesUnicas = new Set(logs.map((l) => l.session_id)).size;
  const promedioTokens = sesionesUnicas > 0 ? Math.round(totalTokens / sesionesUnicas) : 0;

  return {
    total_documentos: docsResult.count ?? 0,
    total_citas: citasResult.count ?? 0,
    total_horarios: horarios.length,
    horarios_disponibles: horarios.filter((h) => h.estado === "Disponible").length,
    horarios_ocupados: horarios.filter((h) => h.estado === "Ocupado").length,
    total_tokens: totalTokens,
    total_sesiones: sesionesUnicas,
    promedio_tokens_sesion: promedioTokens,
    citas_recientes: (citasRecientesResult.data ?? []) as unknown as CitaReciente[],
    logs_recientes: (logsRecientesResult.data ?? []) as LogChatReciente[],
  };
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const metricas = await getMetricas();

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">Resumen general del sistema y uso de IA</p>

      {/* Tarjetas de Estadísticas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Documentos normativos" value={metricas.total_documentos} color="text-blue-400" />
        <StatCard label="Citas agendadas" value={metricas.total_citas} color="text-emerald-400" />
        <StatCard label="Horarios disponibles" value={metricas.horarios_disponibles} color="text-green-400" />
        <StatCard label="Total tokens consumidos" value={metricas.total_tokens.toLocaleString("es-VE")} color="text-purple-400" />
        <StatCard label="Sesiones de chat activas" value={metricas.total_sesiones} color="text-cyan-400" />
        <StatCard label="Promedio tokens / sesión" value={metricas.promedio_tokens_sesion.toLocaleString("es-VE")} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Citas Agendadas Recientes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-white font-semibold text-sm">Citas recientes</h2>
          </div>

          {metricas.citas_recientes.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">
              No hay citas agendadas aún.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {metricas.citas_recientes.map((cita) => (
                <div key={cita.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-medium">{cita.nombre_representante}</p>
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{cita.motivo_cita}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {cita.calendario_directivo && (
                      <>
                        <p className="text-slate-300 text-xs">{cita.calendario_directivo.fecha}</p>
                        <p className="text-slate-500 text-xs">
                          {cita.calendario_directivo.hora_inicio} – {cita.calendario_directivo.hora_fin}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monitoreo de Tokens por Sesión */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-white font-semibold text-sm">Registro de tokens por consulta</h2>
          </div>

          {metricas.logs_recientes.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">
              No hay registros de chat aún.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {metricas.logs_recientes.map((log) => (
                <div key={log.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-blue-400">
                        {log.session_id}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs truncate mt-1">
                      {log.mensaje_usuario}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-purple-400 font-semibold text-xs">
                      {log.total_tokens} tokens
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
