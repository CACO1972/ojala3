import { NextRequest, NextResponse } from "next/server";
import { MetaClient, extractLeadData } from "@/src/lib/meta-client";
import { WhatsAppClient } from "@/src/lib/whatsapp-client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/meta/leads
 * 
 * Obtener leads de Meta Lead Ads
 * 
 * Query params:
 * - formId: ID del formulario de Meta
 * - since: fecha desde (ISO string)
 * - leadId: ID específico de un lead
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar API key
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const formId = searchParams.get("formId");
    const leadId = searchParams.get("leadId");
    const since = searchParams.get("since");

    const meta = new MetaClient();

    // Obtener lead específico
    if (leadId) {
      const lead = await meta.getLead(leadId);
      if (!lead) {
        return NextResponse.json(
          { error: "Lead no encontrado" },
          { status: 404, headers: corsHeaders }
        );
      }
      return NextResponse.json(
        { 
          success: true, 
          lead,
          extractedData: extractLeadData(lead)
        },
        { headers: corsHeaders }
      );
    }

    // Obtener leads del formulario
    if (!formId) {
      return NextResponse.json(
        { error: "Se requiere formId o leadId" },
        { status: 400, headers: corsHeaders }
      );
    }

    const sinceDate = since ? new Date(since) : undefined;
    const leads = await meta.getLeads(formId, sinceDate);

    // Extraer datos de cada lead
    const enrichedLeads = leads.map((lead) => ({
      ...lead,
      extractedData: extractLeadData(lead),
    }));

    return NextResponse.json(
      { 
        success: true, 
        count: leads.length,
        leads: enrichedLeads 
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Meta Leads error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error obteniendo leads" },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/meta/leads
 * 
 * Procesar un lead manualmente o desde webhook
 * Guarda en DB y envía WhatsApp de bienvenida
 * 
 * Body:
 * - leadId: ID del lead de Meta
 * - autoRespond: boolean - enviar WhatsApp automático
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, autoRespond = true } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: "Se requiere leadId" },
        { status: 400, headers: corsHeaders }
      );
    }

    const meta = new MetaClient();
    const lead = await meta.getLead(leadId);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead no encontrado en Meta" },
        { status: 404, headers: corsHeaders }
      );
    }

    const data = extractLeadData(lead);

    // Guardar en base de datos
    const savedLead = await saveLeadToDatabase({
      metaLeadId: lead.id,
      email: data.email,
      phone: data.phone,
      fullName: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      source: "meta_lead_ads",
      formId: lead.formId,
      adId: lead.adId,
      campaignId: lead.campaignId,
      campaignName: lead.campaignName,
      createdAt: new Date(lead.createdTime),
    });

    // Enviar WhatsApp de bienvenida
    if (autoRespond && data.phone) {
      try {
        const whatsapp = new WhatsAppClient();
        await whatsapp.sendWelcomeLead(
          data.phone,
          data.fullName || data.firstName || "Estimado/a"
        );
      } catch (waError) {
        console.error("Error enviando WhatsApp:", waError);
        // No fallar el request por esto
      }
    }

    // Trackear conversión
    if (data.email || data.phone) {
      try {
        await meta.trackLead({
          email: data.email || undefined,
          phone: data.phone || undefined,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
        }, {
          lead_source: "meta_lead_ads",
          form_id: lead.formId,
          campaign_id: lead.campaignId,
        });
      } catch (trackError) {
        console.error("Error tracking lead:", trackError);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        lead: savedLead,
        whatsappSent: autoRespond && !!data.phone
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error("Process lead error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error procesando lead" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Función para guardar lead en DB (implementar según tu backend)
async function saveLeadToDatabase(leadData: {
  metaLeadId: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  source: string;
  formId: string;
  adId?: string;
  campaignId?: string;
  campaignName?: string;
  createdAt: Date;
}) {
  // TODO: Implementar con Supabase/DB
  console.log("💾 Guardando lead:", leadData);
  
  // Por ahora retornar los datos
  return {
    id: `lead_${Date.now()}`,
    ...leadData,
    savedAt: new Date(),
  };
}
