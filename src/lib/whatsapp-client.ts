/**
 * WhatsApp Business Cloud API Client
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
}

interface TextMessage {
  type: "text";
  to: string;
  text: string;
}

interface TemplateMessage {
  type: "template";
  to: string;
  templateName: string;
  languageCode?: string;
  components?: TemplateComponent[];
}

interface TemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{
    type: "text" | "image" | "document" | "video";
    text?: string;
    image?: { link: string };
  }>;
}

type WhatsAppMessage = TextMessage | TemplateMessage;

interface SendMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export class WhatsAppClient {
  private config: WhatsAppConfig;

  constructor(config?: Partial<WhatsAppConfig>) {
    this.config = {
      accessToken: config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || "",
      phoneNumberId: config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      businessAccountId: config?.businessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    };
  }

  /**
   * Enviar mensaje de texto simple
   */
  async sendText(to: string, text: string): Promise<SendMessageResponse> {
    return this.sendMessage({
      type: "text",
      to: this.formatPhoneNumber(to),
      text,
    });
  }

  /**
   * Enviar mensaje con template predefinido
   */
  async sendTemplate(
    to: string,
    templateName: string,
    components?: TemplateComponent[],
    languageCode = "es"
  ): Promise<SendMessageResponse> {
    return this.sendMessage({
      type: "template",
      to: this.formatPhoneNumber(to),
      templateName,
      languageCode,
      components,
    });
  }

  /**
   * Enviar recordatorio de cita
   */
  async sendAppointmentReminder(
    to: string,
    patientName: string,
    date: string,
    time: string,
    doctorName: string
  ): Promise<SendMessageResponse> {
    // Usar template predefinido "cita_recordatorio"
    return this.sendTemplate(to, "cita_recordatorio", [
      {
        type: "body",
        parameters: [
          { type: "text", text: patientName },
          { type: "text", text: date },
          { type: "text", text: time },
          { type: "text", text: doctorName },
        ],
      },
    ]);
  }

  /**
   * Enviar confirmación de cita agendada
   */
  async sendAppointmentConfirmation(
    to: string,
    patientName: string,
    date: string,
    time: string,
    address: string
  ): Promise<SendMessageResponse> {
    return this.sendTemplate(to, "cita_confirmada", [
      {
        type: "body",
        parameters: [
          { type: "text", text: patientName },
          { type: "text", text: date },
          { type: "text", text: time },
          { type: "text", text: address },
        ],
      },
    ]);
  }

  /**
   * Enviar mensaje de bienvenida a nuevo lead
   */
  async sendWelcomeLead(to: string, name: string): Promise<SendMessageResponse> {
    return this.sendTemplate(to, "bienvenida_lead", [
      {
        type: "body",
        parameters: [{ type: "text", text: name }],
      },
    ]);
  }

  /**
   * Enviar resultado de diagnóstico IA
   */
  async sendDiagnosisResult(
    to: string,
    patientName: string,
    summary: string
  ): Promise<SendMessageResponse> {
    const text = `¡Hola ${patientName}! 🦷\n\nAquí está el resumen de tu diagnóstico inicial:\n\n${summary}\n\n📅 Te invitamos a agendar tu evaluación presencial gratuita en:\nhttps://clinicamiro.cl/agendar\n\n¿Tienes dudas? Responde este mensaje y te ayudamos.`;
    
    return this.sendText(to, text);
  }

  /**
   * Marcar mensaje como leído
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_URL}/${this.config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            status: "read",
            message_id: messageId,
          }),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Enviar mensaje genérico
   */
  private async sendMessage(message: WhatsAppMessage): Promise<SendMessageResponse> {
    const payload = this.buildPayload(message);

    const response = await fetch(
      `${WHATSAPP_API_URL}/${this.config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  private buildPayload(message: WhatsAppMessage) {
    const base = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: message.to,
    };

    if (message.type === "text") {
      return {
        ...base,
        type: "text",
        text: { preview_url: true, body: message.text },
      };
    }

    if (message.type === "template") {
      return {
        ...base,
        type: "template",
        template: {
          name: message.templateName,
          language: { code: message.languageCode || "es" },
          components: message.components,
        },
      };
    }

    return base;
  }

  private formatPhoneNumber(phone: string): string {
    // Remover espacios, guiones, paréntesis
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    
    // Si empieza con +, removerlo
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.slice(1);
    }
    
    // Si es número chileno sin código de país, agregar 56
    if (cleaned.startsWith("9") && cleaned.length === 9) {
      cleaned = "56" + cleaned;
    }
    
    return cleaned;
  }
}

// Singleton para uso global
export const whatsapp = new WhatsAppClient();
