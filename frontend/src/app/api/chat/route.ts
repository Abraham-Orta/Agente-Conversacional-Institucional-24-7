import { NextRequest, NextResponse } from "next/server";

// ==============================================================================
// Endpoint Proxy de Chat hacia el Webhook de n8n
// Separa en el servidor el razonamiento (pensamiento) de la respuesta final,
// y filtra condicionalmente los horarios para que solo aparezcan cuando se requiera.
// ==============================================================================

interface Part {
  text?: string;
  thought?: boolean;
}

function normalizarHorarios(horarios: unknown): unknown[] | undefined {
  if (Array.isArray(horarios)) return horarios;
  if (typeof horarios === "string") {
    try {
      const parseado = JSON.parse(horarios);
      if (Array.isArray(parseado)) return parseado;
    } catch {
      // No es un JSON válido: se descarta
    }
  }
  return undefined;
}

/**
 * Determina si se deben adjuntar las tarjetas interactivas de citas:
 * 1. El usuario solicitó explícitamente una reunión, cita o hablar con la directiva.
 * 2. O el bot no encontró la información oficial y sugiere agendar cita presencial.
 */
function debeOfrecerCita(mensajeUsuario: string, respuestaBot: string): boolean {
  const msgUser = mensajeUsuario.toLowerCase();
  const respBot = respuestaBot.toLowerCase();

  // Intención explícita del usuario
  const palabrasUsuarioCita = [
    "cita",
    "citas",
    "agendar",
    "reunir",
    "reunion",
    "reunión",
    "entrevista",
    "directiva",
    "director",
    "directora",
    "hablar con",
    "presencial",
    "horarios disponibles",
  ];
  if (palabrasUsuarioCita.some((palabra) => msgUser.includes(palabra))) {
    return true;
  }

  // Sugerencia del bot o falta de información en registros oficiales
  const frasesBotSugerencia = [
    "agendar una cita",
    "agendar su cita",
    "agendar tu cita",
    "cita presencial",
    "reunión con la directiva",
    "no dispongo de esa información",
    "no disponemos de esa información",
    "no cuento con esa información",
    "no se encuentra en nuestros registros",
    "sugiero agendar",
    "puede agendar",
    "puedes agendar",
    "horarios disponibles",
  ];
  return frasesBotSugerencia.some((frase) => respBot.includes(frase));
}

/**
 * Extrae de forma robusta el razonamiento interno (CoT en inglés/borradores)
 * y la respuesta final en español para el representante.
 * Solo se usa como FALLBACK cuando n8n no manda el campo "pensamiento" ya separado.
 */
function extraerPensamientoYRespuesta(textoBruto: string): {
  respuesta: string;
  pensamiento: string | null;
} {
  if (!textoBruto) return { respuesta: "", pensamiento: null };
  const texto = textoBruto.trim();

  // Caso 1: La respuesta final está contenida entre comillas con un saludo en español
  const patternComillas = /["“]([\s]*((?:Estimad[oa]|Hola|Buen[oa]s|Saludos|Con gusto|Es un placer)[\s\S]+?))["”]/g;
  const matches = Array.from(texto.matchAll(patternComillas));
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const startIdx = lastMatch.index ?? 0;
    const endIdx = startIdx + lastMatch[0].length;

    const pensamientoAntes = texto.slice(0, startIdx).trim();
    const pensamientoDespues = texto.slice(endIdx).trim();

    let pensamiento = pensamientoAntes;
    if (pensamientoDespues) {
      pensamiento = (pensamiento ? pensamiento + "\n\n" : "") + pensamientoDespues;
    }

    const respuestaRaw = lastMatch[1].trim();
    const lineas = respuestaRaw.split("\n").map((l) => l.trimStart());
    const respuesta = lineas.join("\n");

    return {
      respuesta,
      pensamiento: pensamiento || null,
    };
  }

  // Caso 2: Marcadores textuales conocidos de corte
  const marcadores = [
    "Refining for Conciseness and Professionalism:",
    "Final Response:",
    "Respuesta final:",
    "Estimado representante",
    "Estimada representante",
    "Hola, un gusto saludarle",
    "Hola, es un gusto saludarle",
    "Buen día, estimado",
    "Buen día, estimada",
    "Con gusto le informo",
  ];

  for (const marcador of marcadores) {
    const idx = texto.lastIndexOf(marcador);
    if (idx > 60) {
      const pensamiento = texto.slice(0, idx).trim();
      let resto = texto.slice(idx).trim();

      // Limpiar encabezados en inglés
      for (const m of [
        "Refining for Conciseness and Professionalism:",
        "Final Response:",
        "Respuesta final:",
      ]) {
        if (resto.startsWith(m)) {
          resto = resto.slice(m.length).trim();
        }
      }

      if (
        (resto.startsWith('"') && resto.endsWith('"')) ||
        (resto.startsWith("“") && resto.endsWith("”"))
      ) {
        resto = resto.slice(1, -1).trim();
      }

      const lineas = resto.split("\n").map((l) => l.trimStart());
      return {
        respuesta: lineas.join("\n"),
        pensamiento: pensamiento || null,
      };
    }
  }

  // Caso 3: Respuesta directa sin razonamiento previo
  const lineas = texto.split("\n").map((l) => l.trimStart());
  return {
    respuesta: lineas.join("\n"),
    pensamiento: null,
  };
}

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

    // Rama de agendado de cita: se pasa tal cual viene de Supabase.
    if (typeof data?.exito === "boolean") {
      return NextResponse.json({
        exito: data.exito,
        mensaje: typeof data.mensaje === "string" ? data.mensaje : "Operación completada.",
        cita: data.cita ?? null,
      });
    }

    let textoCrudo = "";
    let pensamientoPreexistente: string | null = null;

    if (typeof data?.respuesta === "string") {
      textoCrudo = data.respuesta;

      // FIX: n8n ya nos manda el pensamiento separado y limpio en "data.pensamiento"
      // (usando el flag "thought" de la API de Gemini/Gemma). Hay que leerlo
      // directamente en vez de depender solo de la extracción por regex, que
      // no encuentra nada porque "textoCrudo" ya viene sin rastro del razonamiento.
      if (typeof data?.pensamiento === "string" && data.pensamiento.trim()) {
        pensamientoPreexistente = data.pensamiento.trim();
      }
    } else if (Array.isArray(data?.partes)) {
      const partes = data.partes as Part[];
      const p = partes.filter((x) => x.thought).map((x) => x.text ?? "").join("\n\n").trim();
      const r = partes.filter((x) => !x.thought).map((x) => x.text ?? "").join("\n").trim();
      textoCrudo = r;
      pensamientoPreexistente = p || null;
    }

    // Extraer pensamiento y respuesta final (fallback si no vino "pensamiento" preexistente)
    const extraido = extraerPensamientoYRespuesta(textoCrudo);
    const respuestaFinal = extraido.respuesta || textoCrudo || "No se recibió una respuesta adecuada del sistema.";
    const pensamientoFinal = pensamientoPreexistente || extraido.pensamiento;

    // Condicionar visualización de citas: solo si el usuario pide o si el bot sugiere
    const mensajeUsuario = typeof body?.mensaje === "string" ? body.mensaje : "";
    const mostrarHorarios = debeOfrecerCita(mensajeUsuario, respuestaFinal);

    return NextResponse.json({
      respuesta: respuestaFinal,
      pensamiento: pensamientoFinal,
      horarios_disponibles: mostrarHorarios
        ? normalizarHorarios(data?.horarios_disponibles)
        : undefined,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo conectar con el servidor de automatización (n8n)", details: errorMessage },
      { status: 500 }
    );
  }
}