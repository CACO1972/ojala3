import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Eres un asistente de diagnóstico dental profesional de Clínica Miró. Tu rol es proporcionar orientación inicial basada en los síntomas que reporta el paciente.

IMPORTANTE:
- Esta es solo una orientación inicial, NO reemplaza una consulta clínica presencial
- Sé empático y profesional
- Usa un lenguaje claro y accesible, evitando jerga médica excesiva

ESTRUCTURA TU RESPUESTA EXACTAMENTE EN ESTAS 4 SECCIONES con emojis:

## 🔍 1. ¿Qué tienes?
Explica de forma clara y empática el posible diagnóstico basado en los síntomas. Usa lenguaje sencillo.

## ⚠️ 2. ¿Por qué es importante tratarlo?
Explica las consecuencias de no tratar el problema a tiempo. Menciona la urgencia (baja, moderada, alta).

## 💡 3. Alternativas de tratamiento
Lista las opciones de tratamiento disponibles. Menciona brevemente cada una con sus ventajas.

## 💰 4. Presupuesto aproximado y financiamiento
Da un rango de precios aproximado en pesos chilenos (CLP). Menciona que Clínica Miró ofrece:
- Evaluación inicial sin costo
- Planes de financiamiento hasta 12 cuotas sin interés
- Convenios con Isapres y Fonasa

Termina con una frase invitando a agendar una evaluación presencial gratuita.

Responde SIEMPRE en español chileno.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { symptoms, patientType } = await request.json();

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { error: "Se requieren síntomas para el diagnóstico" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for API key
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!OPENAI_API_KEY && !ANTHROPIC_API_KEY) {
      // Fallback: return a mock response for development
      return mockDiagnosisResponse(symptoms, patientType);
    }

    const patientContext = patientType === "nuevo" 
      ? "El paciente es nuevo en la clínica."
      : patientType === "existente" 
        ? "El paciente ya es paciente de la clínica."
        : "El paciente busca una segunda opinión.";

    const userMessage = `${patientContext}

El paciente reporta los siguientes síntomas:
${symptoms.map((s: string) => `- ${s}`).join('\n')}

Proporciona una orientación inicial basada en estos síntomas.`;

    // Use OpenAI if available
    if (OPENAI_API_KEY) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI error:", error);
        return NextResponse.json(
          { error: "Error al procesar la solicitud" },
          { status: 500, headers: corsHeaders }
        );
      }

      // Stream the response
      return new NextResponse(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Use Anthropic if available
    if (ANTHROPIC_API_KEY) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: userMessage },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Anthropic error:", error);
        return NextResponse.json(
          { error: "Error al procesar la solicitud" },
          { status: 500, headers: corsHeaders }
        );
      }

      return new NextResponse(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    return NextResponse.json(
      { error: "No API key configured" },
      { status: 500, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar la solicitud" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Mock response for development without API keys
function mockDiagnosisResponse(symptoms: string[], patientType: string | null) {
  const mockText = `## 🔍 1. ¿Qué tienes?

Basándonos en los síntomas que describes (${symptoms.join(", ")}), es posible que estés experimentando una condición dental que requiere atención profesional. Los síntomas que mencionas pueden estar relacionados con problemas comunes pero importantes de tratar.

## ⚠️ 2. ¿Por qué es importante tratarlo?

La urgencia es **moderada a alta**. Sin tratamiento oportuno, estos síntomas pueden evolucionar y causar:
- Mayor dolor y molestias
- Complicaciones que requieren tratamientos más extensos
- Mayor costo de tratamiento a largo plazo

## 💡 3. Alternativas de tratamiento

Dependiendo del diagnóstico confirmado en tu evaluación presencial, las opciones pueden incluir:
- Tratamiento conservador inicial
- Restauraciones dentales estéticas
- Tratamientos especializados según sea necesario

## 💰 4. Presupuesto aproximado y financiamiento

El rango de inversión varía entre $50.000 y $500.000 CLP dependiendo del tratamiento necesario.

En Clínica Miró ofrecemos:
- ✅ Evaluación inicial sin costo
- ✅ Planes de financiamiento hasta 12 cuotas sin interés
- ✅ Convenios con Isapres y Fonasa

Te invitamos a agendar tu evaluación presencial gratuita para un diagnóstico preciso y un plan de tratamiento personalizado.`;

  // Simulate streaming by converting to SSE format
  const lines = mockText.split('\n');
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      for (const line of lines) {
        const data = JSON.stringify({
          choices: [{ delta: { content: line + '\n' } }]
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });

  return new NextResponse(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
