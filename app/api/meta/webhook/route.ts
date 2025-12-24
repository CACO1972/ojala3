import { NextRequest, NextResponse } from "next/server";
import { MetaClient, extractLeadData } from "@/src/lib/meta-client";
import { WhatsAppClient } from "@/src/lib/whatsapp-client";

/**
 * GET /api/meta/webhook
 * 
 * Verificación del webhook por Meta
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Meta webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("❌ Meta webhook verification failed");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST /api/meta/webhook
 * 
 * Recibir eventos de Meta:
 * - Lead Ads (nuevos leads)
 * - Page events
 * - Instagram events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📩 Meta webhook received:", JSON.stringify(body, null, 2));

    // Verificar que es un evento válido
    if (!body.entry || !Array.isArray(body.entry)) {
      return NextResponse.json({ status: "invalid" });
    }

    // Procesar cada entrada
    for (const entry of body.entry) {
      // Lead Ads
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === "leadgen") {
            await handleLeadgenEvent(change.value);
          }
          
          if (change.field === "feed") {
            await handleFeedEvent(change.value);
          }

          if (change.field === "messages") {
            // Esto es para Instagram DMs
            await handleInstagramMessage(change.value);
          }
        }
      }

      // Messaging (Instagram/Messenger)
      if (entry.messaging) {
        for (const event of entry.messaging) {
          await handleMessagingEvent(event);
        }
      }
    }

    // Siempre responder 200 OK
    return NextResponse.json({ status: "ok" });

  } catch (error) {
    console.error("Meta webhook error:", error);
    return NextResponse.json({ status: "error" });
  }
}

/**
 * Manejar evento de Lead Ads
 */
async function handleLeadgenEvent(value: any) {
  const leadId = value.leadgen_id;
  const formId = value.form_id;
  const pageId = value.page_id;
  const adId = value.ad_id;
  const adgroupId = value.adgroup_id;
  const createdTime = value.created_time;

  console.log(`📋 Nuevo lead recibido: ${leadId}`);

  try {
    // Obtener datos completos del lead
    const meta = new MetaClient();
    const lead = await meta.getLead(leadId);

    if (!lead) {
      console.error(`Lead ${leadId} no encontrado`);
      return;
    }

    const data = extractLeadData(lead);
    console.log("📝 Datos del lead:", data);

    // Guardar en base de datos
    await saveLeadToDatabase({
      metaLeadId: leadId,
      formId,
      pageId,
      adId,
      adgroupId,
      email: data.email,
      phone: data.phone,
      fullName: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      source: "meta_lead_ads",
      createdAt: new Date(createdTime * 1000),
    });

    // Enviar WhatsApp de bienvenida (si hay teléfono)
    if (data.phone) {
      const whatsapp = new WhatsAppClient();
      const name = data.firstName || data.fullName?.split(" ")[0] || "Estimado/a";
      
      await whatsapp.sendWelcomeLead(data.phone, name);
      console.log(`📱 WhatsApp enviado a ${data.phone}`);
    }

    // Enviar email de bienvenida (si hay email)
    if (data.email) {
      await sendWelcomeEmail(data.email, data.fullName || data.firstName || "");
    }

    // Notificar al equipo
    await notifyTeam({
      type: "new_lead",
      source: "meta_lead_ads",
      leadId,
      name: data.fullName || `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      formId,
      adId,
    });

    // Trackear conversión (server-side)
    await meta.trackLead(
      {
        email: data.email || undefined,
        phone: data.phone || undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      },
      {
        lead_source: "meta_lead_ads_webhook",
        form_id: formId,
        ad_id: adId,
      }
    );

  } catch (error) {
    console.error("Error procesando lead:", error);
  }
}

/**
 * Manejar evento de feed (comentarios, etc.)
 */
async function handleFeedEvent(value: any) {
  const item = value.item;
  const verb = value.verb; // add, edit, remove
  
  if (item === "comment" && verb === "add") {
    const commentId = value.comment_id;
    const postId = value.post_id;
    const message = value.message;
    const from = value.from;

    console.log(`💬 Nuevo comentario de ${from?.name}: ${message}`);

    // Opcional: responder automáticamente a comentarios
    // await autoReplyToComment(commentId, postId, message);

    // Notificar al equipo
    await notifyTeam({
      type: "new_comment",
      postId,
      commentId,
      message,
      from: from?.name,
    });
  }
}

/**
 * Manejar mensaje de Instagram DM
 */
async function handleInstagramMessage(value: any) {
  const senderId = value.sender?.id;
  const message = value.message;

  if (!message) return;

  console.log(`📸 Instagram DM de ${senderId}:`, message.text || message);

  // Procesar según tipo de mensaje
  if (message.text) {
    // Mensaje de texto
    await notifyTeam({
      type: "instagram_dm",
      senderId,
      text: message.text,
    });
  }

  if (message.attachments) {
    // Mensaje con adjuntos
    await notifyTeam({
      type: "instagram_dm_media",
      senderId,
      attachments: message.attachments,
    });
  }
}

/**
 * Manejar evento de Messenger/Instagram messaging
 */
async function handleMessagingEvent(event: any) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const timestamp = event.timestamp;

  if (event.message) {
    console.log(`💬 Mensaje de ${senderId}:`, event.message.text);
    
    await notifyTeam({
      type: "messenger_message",
      senderId,
      text: event.message.text,
      timestamp,
    });
  }

  if (event.postback) {
    console.log(`🔘 Postback de ${senderId}:`, event.postback.payload);
  }
}

// ===== HELPERS =====

async function saveLeadToDatabase(data: any) {
  // TODO: Implementar con Supabase
  console.log("💾 Guardando lead en DB:", data);
  return data;
}

async function sendWelcomeEmail(email: string, name: string) {
  // TODO: Implementar con servicio de email (Resend, SendGrid, etc.)
  console.log(`📧 Enviando email de bienvenida a ${email}`);
}

async function notifyTeam(notification: any) {
  // TODO: Implementar notificación (Slack, email, etc.)
  console.log("🔔 Notificación:", notification);

  // Ejemplo: enviar a Slack
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🦷 *Nuevo Lead - Clínica Miró*\n${JSON.stringify(notification, null, 2)}`,
        }),
      });
    } catch (e) {
      console.error("Error enviando a Slack:", e);
    }
  }
}
