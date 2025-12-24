import { NextRequest, NextResponse } from "next/server";
import { WhatsAppClient } from "@/src/lib/whatsapp-client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/whatsapp/send
 * 
 * Enviar mensajes de WhatsApp
 * 
 * Body:
 * - type: "text" | "template" | "appointment_reminder" | "appointment_confirmation" | "welcome_lead" | "diagnosis"
 * - to: string (número de teléfono)
 * - Parámetros adicionales según el tipo
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar API key interna
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { type, to, ...params } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Se requiere número de teléfono (to)" },
        { status: 400, headers: corsHeaders }
      );
    }

    const whatsapp = new WhatsAppClient();
    let result;

    switch (type) {
      case "text":
        if (!params.text) {
          return NextResponse.json(
            { error: "Se requiere texto del mensaje" },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await whatsapp.sendText(to, params.text);
        break;

      case "template":
        if (!params.templateName) {
          return NextResponse.json(
            { error: "Se requiere nombre del template" },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await whatsapp.sendTemplate(
          to,
          params.templateName,
          params.components,
          params.languageCode
        );
        break;

      case "appointment_reminder":
        if (!params.patientName || !params.date || !params.time || !params.doctorName) {
          return NextResponse.json(
            { error: "Se requieren: patientName, date, time, doctorName" },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await whatsapp.sendAppointmentReminder(
          to,
          params.patientName,
          params.date,
          params.time,
          params.doctorName
        );
        break;

      case "appointment_confirmation":
        if (!params.patientName || !params.date || !params.time) {
          return NextResponse.json(
            { error: "Se requieren: patientName, date, time" },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await whatsapp.sendAppointmentConfirmation(
          to,
          params.patientName,
          params.date,
          params.time,
          params.address || "Av. Providencia 1234, Providencia"
        );
        break;

      case "welcome_lead":
        if (!params.name) {
          return NextResponse.json(
            { error: "Se requiere nombre del lead" },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await whatsapp.sendWelcomeLead(to, params.name);
        break;

      case "diagnosis":
        if (!params.patientName || !params.summary) {
          return NextResponse.json(
            { error: "Se requieren: patientName, summary" },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await whatsapp.sendDiagnosisResult(to, params.patientName, params.summary);
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de mensaje no soportado: ${type}` },
          { status: 400, headers: corsHeaders }
        );
    }

    return NextResponse.json(
      { success: true, data: result },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error enviando mensaje" },
      { status: 500, headers: corsHeaders }
    );
  }
}
