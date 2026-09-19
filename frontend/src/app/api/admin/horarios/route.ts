import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ==============================================================================
// Ruta de API: /api/admin/horarios
// GET  → Listar todos los bloques horarios (sin filtro de estado, vista completa de administración)
// POST → Crear un nuevo bloque horario en el calendario
// ==============================================================================

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("calendario_directivo")
      .select("id, fecha, hora_inicio, hora_fin, estado, created_at")
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ horarios: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fecha, hora_inicio, hora_fin, estado } = await req.json();

    if (!fecha || !hora_inicio || !hora_fin) {
      return NextResponse.json(
        { error: "Los campos 'fecha', 'hora_inicio' y 'hora_fin' son requeridos." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("calendario_directivo")
      .insert({
        fecha,
        hora_inicio,
        hora_fin,
        estado: estado ?? "Disponible",
      })
      .select("id, fecha, hora_inicio, hora_fin, estado, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ horario: data }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
