import { NextRequest, NextResponse } from "next/server";
import { WhatsAppClient } from "@/src/lib/whatsapp-client";

/**
 * GET /api/whatsapp/webhook
 * 
 * Verificación del webhook por Meta
 * Meta envía: hub.mode, hub.verify_token, hub.challenge
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("❌ WhatsApp webhook verification failed");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * 
 * Recibir mensajes entrantes y actualizaciones de estado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log para debugging
    console.log("📩 WhatsApp webhook received:", JSON.stringify(body, null, 2));

    // Verificar que es un evento de WhatsApp
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" });
    }

    const whatsapp = new WhatsAppClient();

    // Procesar cada entrada
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // Procesar mensajes entrantes
        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessage(message, value.contacts?.[0], whatsapp);
          }
        }

        // Procesar estados de mensajes (entregado, leído, etc.)
        if (value.statuses) {
          for (const status of value.statuses) {
            await handleMessageStatus(status);
          }
        }
      }
    }

    // Siempre responder 200 OK a Meta
    return NextResponse.json({ status: "ok" });

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    // Aún así responder 200 para que Meta no reintente
    return NextResponse.json({ status: "error", message: "Internal error" });
  }
}

/**
 * Manejar mensaje entrante
 */
async function handleIncomingMessage(
  message: any,
  contact: any,
  whatsapp: WhatsAppClient
) {
  const from = message.from; // Número del remitente
  const messageId = message.id;
  const timestamp = message.timestamp;
  const contactName = contact?.profile?.name || "Paciente";

  console.log(`📱 Mensaje de ${contactName} (${from}):`, message);

  // Marcar como leído
  await whatsapp.markAsRead(messageId);

  // Procesar según tipo de mensaje
  switch (message.type) {
    case "text":
      await handleTextMessage(from, message.text.body, contactName, whatsapp);
      break;

    case "button":
      // Respuesta a botón de template
      await handleButtonResponse(from, message.button, contactName, whatsapp);
      break;

    case "interactive":
      // Respuesta interactiva (lista, botones)
      await handleInteractiveResponse(from, message.interactive, contactName, whatsapp);
      break;

    case "image":
    case "document":
    case "audio":
    case "video":
      await handleMediaMessage(from, message, contactName, whatsapp);
      break;

    case "location":
      await handleLocationMessage(from, message.location, contactName, whatsapp);
      break;

    default:
      console.log(`Tipo de mensaje no manejado: ${message.type}`);
  }

  // Guardar mensaje en base de datos (opcional)
  await saveMessageToDatabase({
    from,
    contactName,
    messageId,
    type: message.type,
    content: message.text?.body || message.button?.text || "media",
    timestamp: new Date(parseInt(timestamp) * 1000),
  });
}

/**
 * Manejar mensaje de texto
 */
async function handleTextMessage(
  from: string,
  text: string,
  contactName: string,
  whatsapp: WhatsAppClient
) {
  const lowerText = text.toLowerCase().trim();

  // Respuestas automáticas basadas en palabras clave
  if (lowerText.includes("agendar") || lowerText.includes("cita") || lowerText.includes("hora")) {
    await whatsapp.sendText(
      from,
      `¡Hola ${contactName}! 📅\n\nPuedes agendar tu cita directamente aquí:\n👉 https://clinicamiro.cl/agendar\n\nO si prefieres, cuéntanos qué horario te acomoda y te ayudamos.`
    );
    return;
  }

  if (lowerText.includes("precio") || lowerText.includes("costo") || lowerText.includes("valor")) {
    await whatsapp.sendText(
      from,
      `¡Hola ${contactName}! 💰\n\nLos precios varían según el tratamiento. Te ofrecemos:\n\n✅ Evaluación inicial GRATIS\n✅ Financiamiento hasta 12 cuotas sin interés\n✅ Convenios con Isapres y Fonasa\n\n¿Te gustaría agendar tu evaluación gratuita?`
    );
    return;
  }

  if (lowerText.includes("horario") || lowerText.includes("atencion") || lowerText.includes("abierto")) {
    await whatsapp.sendText(
      from,
      `🕐 Nuestros horarios:\n\n📍 Lunes a Viernes: 9:00 - 19:00\n📍 Sábado: 9:00 - 14:00\n📍 Domingo: Cerrado\n\n¿Necesitas agendar una hora?`
    );
    return;
  }

  if (lowerText.includes("direccion") || lowerText.includes("ubicacion") || lowerText.includes("donde")) {
    await whatsapp.sendText(
      from,
      `📍 Estamos en:\nAv. Providencia 1234, Providencia, Santiago\n\n🚇 Metro: Estación Los Leones\n🅿️ Estacionamiento disponible\n\n¿Te esperamos?`
    );
    return;
  }

  if (lowerText.includes("hola") || lowerText.includes("buenos") || lowerText.includes("buenas")) {
    await whatsapp.sendText(
      from,
      `¡Hola ${contactName}! 👋\n\nBienvenido/a a Clínica Miró 🦷\n\n¿En qué podemos ayudarte hoy?\n\n• Agendar cita\n• Consultar precios\n• Conocer nuestros servicios\n• Ubicación y horarios`
    );
    return;
  }

  // Respuesta por defecto - notificar al equipo
  await notifyTeam({
    type: "new_message",
    from,
    contactName,
    message: text,
  });

  await whatsapp.sendText(
    from,
    `Gracias por tu mensaje, ${contactName}. Un miembro de nuestro equipo te responderá pronto.\n\nMientras tanto, puedes:\n📅 Agendar online: https://clinicamiro.cl/agendar\n🤖 Obtener diagnóstico IA: https://clinicamiro.cl/diagnostico`
  );
}

/**
 * Manejar respuesta de botón
 */
async function handleButtonResponse(
  from: string,
  button: any,
  contactName: string,
  whatsapp: WhatsAppClient
) {
  const payload = button.payload;
  
  switch (payload) {
    case "AGENDAR_CITA":
      await whatsapp.sendText(
        from,
        `¡Perfecto ${contactName}! 📅\n\nAgenda tu cita aquí:\n👉 https://clinicamiro.cl/agendar`
      );
      break;

    case "CONFIRMAR_CITA":
      await whatsapp.sendText(
        from,
        `✅ ¡Cita confirmada!\n\nTe esperamos. Recuerda llegar 10 minutos antes.\n\n📍 Av. Providencia 1234, Providencia`
      );
      // Actualizar en sistema
      break;

    case "CANCELAR_CITA":
      await whatsapp.sendText(
        from,
        `Entendemos que a veces surgen imprevistos. ¿Deseas reagendar tu cita?\n\n👉 https://clinicamiro.cl/agendar`
      );
      break;

    default:
      console.log(`Payload de botón no manejado: ${payload}`);
  }
}

/**
 * Manejar respuesta interactiva
 */
async function handleInteractiveResponse(
  from: string,
  interactive: any,
  contactName: string,
  whatsapp: WhatsAppClient
) {
  const responseType = interactive.type;
  
  if (responseType === "button_reply") {
    const buttonId = interactive.button_reply.id;
    await handleButtonResponse(from, { payload: buttonId }, contactName, whatsapp);
  }
  
  if (responseType === "list_reply") {
    const selectedId = interactive.list_reply.id;
    console.log(`Lista seleccionada: ${selectedId}`);
    // Procesar según la selección
  }
}

/**
 * Manejar mensaje con media (imagen, documento, etc.)
 */
async function handleMediaMessage(
  from: string,
  message: any,
  contactName: string,
  whatsapp: WhatsAppClient
) {
  const mediaType = message.type;
  
  await whatsapp.sendText(
    from,
    `Gracias por enviar ${mediaType === "image" ? "la imagen" : mediaType === "document" ? "el documento" : "el archivo"}, ${contactName}.\n\nNuestro equipo lo revisará y te contactará pronto.`
  );

  // Notificar al equipo
  await notifyTeam({
    type: "media_received",
    from,
    contactName,
    mediaType,
    mediaId: message[mediaType]?.id,
  });
}

/**
 * Manejar ubicación compartida
 */
async function handleLocationMessage(
  from: string,
  location: any,
  contactName: string,
  whatsapp: WhatsAppClient
) {
  await whatsapp.sendText(
    from,
    `Gracias por compartir tu ubicación, ${contactName}.\n\n📍 Nuestra clínica está en:\nAv. Providencia 1234, Providencia\n\n🚗 A ${calculateDistance(location)} de ti aproximadamente.`
  );
}

/**
 * Manejar estado de mensaje
 */
async function handleMessageStatus(status: any) {
  const messageId = status.id;
  const statusType = status.status; // sent, delivered, read, failed
  const timestamp = status.timestamp;

  console.log(`📊 Estado de mensaje ${messageId}: ${statusType}`);

  // Actualizar estado en base de datos
  await updateMessageStatus(messageId, statusType, timestamp);

  if (statusType === "failed") {
    const error = status.errors?.[0];
    console.error(`❌ Mensaje fallido: ${error?.title} - ${error?.message}`);
    // Notificar error
  }
}

// Funciones auxiliares (implementar según tu backend)

async function saveMessageToDatabase(data: any) {
  // TODO: Guardar en Supabase/DB
  console.log("💾 Guardando mensaje:", data);
}

async function updateMessageStatus(messageId: string, status: string, timestamp: string) {
  // TODO: Actualizar en DB
  console.log(`💾 Actualizando estado: ${messageId} -> ${status}`);
}

async function notifyTeam(notification: any) {
  // TODO: Notificar por email, Slack, etc.
  console.log("🔔 Notificación al equipo:", notification);
}

function calculateDistance(location: { latitude: number; longitude: number }): string {
  // Coordenadas de la clínica
  const clinicLat = -33.4268;
  const clinicLng = -70.6138;
  
  // Cálculo simple de distancia (Haversine simplificado)
  const dLat = Math.abs(location.latitude - clinicLat);
  const dLng = Math.abs(location.longitude - clinicLng);
  const distance = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // Aproximado en km
  
  return `${distance.toFixed(1)} km`;
}
