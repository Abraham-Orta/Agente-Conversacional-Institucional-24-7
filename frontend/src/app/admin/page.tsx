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

interface Metricas {
  total_documentos: number;
  total_citas: number;
  total_horarios: number;
  horarios_disponibles: number;
  horarios_ocupados: number;
  citas_recientes: CitaReciente[];
}

async function getMetricas(): Promise<Metricas> {
  const supabase = createSupabaseAdminClient();

  const [docsResult, horariosResult, citasResult, citasRecientesResult] =
    await Promise.all([
      supabase.from("documentos_normativos").select("id", { count: "exact", head: true }),
      supabase.from("calendario_directivo").select("id, estado"),
      supabase.from("citas_agendadas").select("id", { count: "exact", head: true }),
      supabase
        .from("citas_agendadas")
        .select("id, nombre_representante, motivo_cita, created_at, calendario_directivo(fecha, hora_inicio, hora_fin)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const horarios = horariosResult.data ?? [];

  return {
    total_documentos: docsResult.count ?? 0,
    total_citas: citasResult.count ?? 0,
    total_horarios: horarios.length,
    horarios_disponibles: horarios.filter((h) => h.estado === "Disponible").length,
    horarios_ocupados: horarios.filter((h) => h.estado === "Ocupado").length,
    citas_recientes: (citasRecientesResult.data ?? []) as unknown as CitaReciente[],
  };
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const metricas = await getMetricas();

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">Resumen general del sistema</p>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Documentos normativos" value={metricas.total_documentos} color="text-blue-400" />
        <StatCard label="Citas agendadas" value={metricas.total_citas} color="text-emerald-400" />
        <StatCard label="Horarios disponibles" value={metricas.horarios_disponibles} color="text-green-400" />
        <StatCard label="Horarios ocupados" value={metricas.horarios_ocupados} color="text-amber-400" />
      </div>

      {/* Citas Agendadas Recientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold">Citas recientes</h2>
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
    </div>
  );
}
