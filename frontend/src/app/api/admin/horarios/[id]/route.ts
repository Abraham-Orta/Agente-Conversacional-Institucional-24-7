import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ==============================================================================
// Ruta de API: /api/admin/horarios/[id]
// PATCH  → Alternar estado del turno (Disponible / Ocupado)
// DELETE → Eliminar bloque horario del calendario
// ==============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { estado } = await req.json();

    if (!estado || !["Disponible", "Ocupado"].includes(estado)) {
      return NextResponse.json(
        { error: "El campo 'estado' debe ser 'Disponible' o 'Ocupado'." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("calendario_directivo")
      .update({ estado })
      .eq("id", params.id)
      .select("id, fecha, hora_inicio, hora_fin, estado")
      .single();

    if (error) throw error;

    return NextResponse.json({ horario: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("calendario_directivo")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
