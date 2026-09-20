import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ==============================================================================
// Ruta de API: /api/admin/metricas
// GET → Obtener métricas agregadas para el dashboard de administración
// ==============================================================================

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const [
      docsResult,
      horariosResult,
      citasResult,
      citasRecientesResult,
      logsTokensResult,
      logsRecientesResult,
    ] = await Promise.all([
      supabase
        .from("documentos_normativos")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("calendario_directivo")
        .select("id, estado", { count: "exact" }),

      supabase
        .from("citas_agendadas")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("citas_agendadas")
        .select(
          "id, nombre_representante, motivo_cita, created_at, calendario_directivo(fecha, hora_inicio, hora_fin)"
        )
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("logs_chat")
        .select("total_tokens, session_id"),

      supabase
        .from("logs_chat")
        .select("id, session_id, mensaje_usuario, total_tokens, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (docsResult.error) throw docsResult.error;
    if (horariosResult.error) throw horariosResult.error;
    if (citasResult.error) throw citasResult.error;
    if (citasRecientesResult.error) throw citasRecientesResult.error;

    const horarios = horariosResult.data ?? [];
    const disponibles = horarios.filter((h) => h.estado === "Disponible").length;
    const ocupados = horarios.filter((h) => h.estado === "Ocupado").length;

    // Calcular estadísticas de consumo de tokens y sesiones
    const logs = logsTokensResult.data ?? [];
    const totalTokens = logs.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
    const sesionesUnicas = new Set(logs.map((l) => l.session_id)).size;
    const promedioTokensPorSesion =
      sesionesUnicas > 0 ? Math.round(totalTokens / sesionesUnicas) : 0;

    return NextResponse.json({
      total_documentos: docsResult.count ?? 0,
      total_citas: citasResult.count ?? 0,
      total_horarios: horarios.length,
      horarios_disponibles: disponibles,
      horarios_ocupados: ocupados,
      total_tokens: totalTokens,
      total_sesiones: sesionesUnicas,
      promedio_tokens_sesion: promedioTokensPorSesion,
      citas_recientes: citasRecientesResult.data ?? [],
      logs_recientes: logsRecientesResult.data ?? [],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
