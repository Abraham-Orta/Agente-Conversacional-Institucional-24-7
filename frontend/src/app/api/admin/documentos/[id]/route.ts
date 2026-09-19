import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ==============================================================================
// Ruta de API: /api/admin/documentos/[id]
// GET    → Obtener un documento por su ID
// PUT    → Actualizar contenido y regenerar el embedding con Gemini
// DELETE → Eliminar documento
// ==============================================================================

async function generarEmbedding(texto: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text: texto }] },
        outputDimensionality: 768,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Embeddings API error: ${err}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("documentos_normativos")
      .select("id, contenido, metadatos, created_at")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ documento: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { contenido, metadatos } = await req.json();

    if (!contenido || typeof contenido !== "string" || !contenido.trim()) {
      return NextResponse.json(
        { error: "El campo 'contenido' es requerido." },
        { status: 400 }
      );
    }

    // Regenerate embedding with the new content
    const embedding = await generarEmbedding(contenido.trim());
    const supabase = createSupabaseAdminClient();

    const updatePayload: Record<string, unknown> = {
      contenido: contenido.trim(),
      embedding,
    };
    if (metadatos !== undefined) {
      updatePayload.metadatos = metadatos;
    }

    const { data, error } = await supabase
      .from("documentos_normativos")
      .update(updatePayload)
      .eq("id", params.id)
      .select("id, contenido, metadatos, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ documento: data });
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
      .from("documentos_normativos")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
