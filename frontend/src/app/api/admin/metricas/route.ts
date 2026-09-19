import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ==============================================================================
// Ruta de API: /api/admin/metricas
// GET → Obtener métricas agregadas para el dashboard de administración
// ==============================================================================

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const [docsResult, horariosResult, citasResult, citasRecientesResult] =
      await Promise.all([
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
      ]);

    if (docsResult.error) throw docsResult.error;
    if (horariosResult.error) throw horariosResult.error;
    if (citasResult.error) throw citasResult.error;
    if (citasRecientesResult.error) throw citasRecientesResult.error;

    const horarios = horariosResult.data ?? [];
    const disponibles = horarios.filter((h) => h.estado === "Disponible").length;
    const ocupados = horarios.filter((h) => h.estado === "Ocupado").length;

    return NextResponse.json({
      total_documentos: docsResult.count ?? 0,
      total_citas: citasResult.count ?? 0,
      total_horarios: horarios.length,
      horarios_disponibles: disponibles,
      horarios_ocupados: ocupados,
      citas_recientes: citasRecientesResult.data ?? [],
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
