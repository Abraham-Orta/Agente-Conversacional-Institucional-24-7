import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

// ==============================================================================
// Ruta de API: /api/admin/documentos
// GET  → Listar todos los documentos normativos
// POST → Crear un nuevo documento con embedding generado automáticamente en Gemini
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

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("documentos_normativos")
      .select("id, contenido, metadatos, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documentos: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { contenido, metadatos } = await req.json();

    if (!contenido || typeof contenido !== "string" || !contenido.trim()) {
      return NextResponse.json(
        { error: "El campo 'contenido' es requerido." },
        { status: 400 }
      );
    }

    const embedding = await generarEmbedding(contenido.trim());
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("documentos_normativos")
      .insert({
        contenido: contenido.trim(),
        metadatos: metadatos ?? {},
        embedding,
      })
      .select("id, contenido, metadatos, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ documento: data }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
