import { NextRequest, NextResponse } from "next/server";
import { MetaClient } from "@/src/lib/meta-client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/meta/conversions
 * 
 * Enviar eventos de conversión al Pixel de Meta (CAPI)
 * 
 * Body:
 * - eventType: "lead" | "schedule" | "purchase" | "contact" | "pageview" | "initiate_checkout"
 * - userData: { email?, phone?, firstName?, lastName?, clientIpAddress?, clientUserAgent?, fbc?, fbp? }
 * - customData: datos adicionales según el tipo de evento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, userData, customData, eventSourceUrl } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "Se requiere eventType" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extraer datos del request para tracking
    const enrichedUserData = {
      ...userData,
      clientIpAddress: userData.clientIpAddress || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      clientUserAgent: userData.clientUserAgent || request.headers.get("user-agent"),
    };

    const meta = new MetaClient();
    let result;

    switch (eventType) {
      case "lead":
        result = await meta.trackLead(enrichedUserData, customData);
        break;

      case "schedule":
        if (!customData?.date) {
          return NextResponse.json(
            { error: "Se requiere customData.date para evento schedule" },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await meta.trackSchedule(enrichedUserData, {
          date: customData.date,
          service: customData.service,
          value: customData.value,
        });
        break;

      case "purchase":
        if (!customData?.value || !customData?.service) {
          return NextResponse.json(
            { error: "Se requiere customData.value y customData.service para purchase" },
            { status: 400, headers: corsHeaders }
          );
        }
        result = await meta.trackPurchase(enrichedUserData, {
          value: customData.value,
          currency: customData.currency,
          service: customData.service,
        });
        break;

      case "contact":
        result = await meta.trackContact(enrichedUserData, customData?.method || "website");
        break;

      case "pageview":
        result = await meta.trackPageView(
          enrichedUserData,
          eventSourceUrl || customData?.pageUrl || "",
          customData?.pageTitle
        );
        break;

      case "initiate_checkout":
        result = await meta.trackInitiateCheckout(enrichedUserData, customData?.service);
        break;

      default:
        // Evento personalizado
        result = await meta.sendConversionEvent({
          eventName: eventType,
          userData: enrichedUserData,
          customData,
          eventSourceUrl,
        });
    }

    return NextResponse.json(
      { success: true, data: result },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Meta Conversions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error enviando evento" },
      { status: 500, headers: corsHeaders }
    );
  }
}
