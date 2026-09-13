import { NextRequest, NextResponse } from "next/server";

// ==============================================================================
// Endpoint Proxy de Chat hacia el Webhook de n8n
// ==============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/chat";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Error en el middleware n8n", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor de automatización (n8n)", details: errorMessage },
      { status: 500 }
    );
  }
}
