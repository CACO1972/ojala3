/**
 * Meta Marketing API Client
 * - Conversions API (CAPI)
 * - Lead Ads
 * 
 * Documentación: https://developers.facebook.com/docs/marketing-apis
 */

import crypto from "crypto";

const META_API_URL = "https://graph.facebook.com/v18.0";

interface MetaConfig {
  accessToken: string;
  pixelId: string;
  adAccountId?: string;
}

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook click ID
  fbp?: string; // Facebook browser ID
}

interface ConversionEvent {
  eventName: string;
  eventTime?: number;
  userData: UserData;
  customData?: Record<string, any>;
  eventSourceUrl?: string;
  actionSource?: "website" | "app" | "phone_call" | "chat" | "physical_store" | "system_generated" | "other";
}

interface LeadData {
  id: string;
  createdTime: string;
  formId: string;
  formName?: string;
  adId?: string;
  adName?: string;
  campaignId?: string;
  campaignName?: string;
  fields: Array<{
    name: string;
    values: string[];
  }>;
}

export class MetaClient {
  private config: MetaConfig;

  constructor(config?: Partial<MetaConfig>) {
    this.config = {
      accessToken: config?.accessToken || process.env.META_ACCESS_TOKEN || "",
      pixelId: config?.pixelId || process.env.META_PIXEL_ID || "",
      adAccountId: config?.adAccountId || process.env.META_AD_ACCOUNT_ID,
    };
  }

  // ===== CONVERSIONS API =====

  /**
   * Enviar evento de conversión al Pixel de Meta
   */
  async sendConversionEvent(event: ConversionEvent): Promise<any> {
    const payload = {
      data: [
        {
          event_name: event.eventName,
          event_time: event.eventTime || Math.floor(Date.now() / 1000),
          action_source: event.actionSource || "website",
          event_source_url: event.eventSourceUrl,
          user_data: this.hashUserData(event.userData),
          custom_data: event.customData,
        },
      ],
    };

    const response = await fetch(
      `${META_API_URL}/${this.config.pixelId}/events?access_token=${this.config.accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta CAPI Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Evento: Lead (formulario completado)
   */
  async trackLead(userData: UserData, customData?: Record<string, any>): Promise<any> {
    return this.sendConversionEvent({
      eventName: "Lead",
      userData,
      customData: {
        content_name: "Formulario de contacto",
        content_category: "dental",
        ...customData,
      },
    });
  }

  /**
   * Evento: Cita agendada
   */
  async trackSchedule(
    userData: UserData,
    appointmentData: { date: string; service?: string; value?: number }
  ): Promise<any> {
    return this.sendConversionEvent({
      eventName: "Schedule",
      userData,
      customData: {
        content_name: "Cita agendada",
        content_category: appointmentData.service || "consulta",
        value: appointmentData.value || 0,
        currency: "CLP",
        appointment_date: appointmentData.date,
      },
    });
  }

  /**
   * Evento: Inicio de diagnóstico IA
   */
  async trackInitiateCheckout(userData: UserData, service?: string): Promise<any> {
    return this.sendConversionEvent({
      eventName: "InitiateCheckout",
      userData,
      customData: {
        content_name: "Diagnóstico IA iniciado",
        content_category: service || "diagnostico",
      },
    });
  }

  /**
   * Evento: Compra/Pago realizado
   */
  async trackPurchase(
    userData: UserData,
    purchaseData: { value: number; currency?: string; service: string }
  ): Promise<any> {
    return this.sendConversionEvent({
      eventName: "Purchase",
      userData,
      customData: {
        content_name: purchaseData.service,
        content_category: "tratamiento_dental",
        value: purchaseData.value,
        currency: purchaseData.currency || "CLP",
      },
    });
  }

  /**
   * Evento: Contacto por WhatsApp
   */
  async trackContact(userData: UserData, method: string = "whatsapp"): Promise<any> {
    return this.sendConversionEvent({
      eventName: "Contact",
      userData,
      customData: {
        contact_method: method,
      },
    });
  }

  /**
   * Evento: Vista de página
   */
  async trackPageView(userData: UserData, pageUrl: string, pageTitle?: string): Promise<any> {
    return this.sendConversionEvent({
      eventName: "PageView",
      userData,
      eventSourceUrl: pageUrl,
      customData: {
        page_title: pageTitle,
      },
    });
  }

  // ===== LEAD ADS =====

  /**
   * Obtener leads de un formulario
   */
  async getLeads(formId: string, since?: Date): Promise<LeadData[]> {
    let url = `${META_API_URL}/${formId}/leads?access_token=${this.config.accessToken}&fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name`;

    if (since) {
      const timestamp = Math.floor(since.getTime() / 1000);
      url += `&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${timestamp}}]`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta Lead Ads Error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return this.parseLeads(data.data || [], formId);
  }

  /**
   * Obtener un lead específico
   */
  async getLead(leadId: string): Promise<LeadData | null> {
    const response = await fetch(
      `${META_API_URL}/${leadId}?access_token=${this.config.accessToken}&fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return this.parseLead(data);
  }

  /**
   * Obtener formularios de la página
   */
  async getForms(pageId: string): Promise<any[]> {
    const response = await fetch(
      `${META_API_URL}/${pageId}/leadgen_forms?access_token=${this.config.accessToken}&fields=id,name,status,created_time`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  // ===== HELPERS =====

  /**
   * Hash de datos de usuario para CAPI
   */
  private hashUserData(userData: UserData): Record<string, string> {
    const hashed: Record<string, string> = {};

    if (userData.email) {
      hashed.em = this.sha256(userData.email.toLowerCase().trim());
    }
    if (userData.phone) {
      hashed.ph = this.sha256(this.normalizePhone(userData.phone));
    }
    if (userData.firstName) {
      hashed.fn = this.sha256(userData.firstName.toLowerCase().trim());
    }
    if (userData.lastName) {
      hashed.ln = this.sha256(userData.lastName.toLowerCase().trim());
    }
    if (userData.city) {
      hashed.ct = this.sha256(userData.city.toLowerCase().trim().replace(/\s/g, ""));
    }
    if (userData.state) {
      hashed.st = this.sha256(userData.state.toLowerCase().trim());
    }
    if (userData.country) {
      hashed.country = this.sha256(userData.country.toLowerCase().trim());
    }
    if (userData.zipCode) {
      hashed.zp = this.sha256(userData.zipCode.trim());
    }
    if (userData.externalId) {
      hashed.external_id = this.sha256(userData.externalId);
    }
    if (userData.clientIpAddress) {
      hashed.client_ip_address = userData.clientIpAddress;
    }
    if (userData.clientUserAgent) {
      hashed.client_user_agent = userData.clientUserAgent;
    }
    if (userData.fbc) {
      hashed.fbc = userData.fbc;
    }
    if (userData.fbp) {
      hashed.fbp = userData.fbp;
    }

    return hashed;
  }

  private sha256(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  private normalizePhone(phone: string): string {
    // Limpiar y normalizar número de teléfono
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    
    // Si es chileno sin código de país
    if (cleaned.startsWith("9") && cleaned.length === 9) {
      cleaned = "56" + cleaned;
    }
    
    return cleaned;
  }

  private parseLeads(rawLeads: any[], formId: string): LeadData[] {
    return rawLeads.map((lead) => this.parseLead(lead, formId));
  }

  private parseLead(lead: any, formId?: string): LeadData {
    return {
      id: lead.id,
      createdTime: lead.created_time,
      formId: lead.form_id || formId || "",
      adId: lead.ad_id,
      adName: lead.ad_name,
      campaignId: lead.campaign_id,
      campaignName: lead.campaign_name,
      fields: (lead.field_data || []).map((field: any) => ({
        name: field.name,
        values: field.values,
      })),
    };
  }
}

// Singleton
export const meta = new MetaClient();

// Helpers para extraer datos de leads
export function extractLeadField(lead: LeadData, fieldName: string): string | null {
  const field = lead.fields.find(
    (f) => f.name.toLowerCase() === fieldName.toLowerCase()
  );
  return field?.values?.[0] || null;
}

export function extractLeadData(lead: LeadData): {
  email: string | null;
  phone: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
} {
  return {
    email: extractLeadField(lead, "email"),
    phone: extractLeadField(lead, "phone_number") || extractLeadField(lead, "phone"),
    fullName: extractLeadField(lead, "full_name"),
    firstName: extractLeadField(lead, "first_name"),
    lastName: extractLeadField(lead, "last_name"),
  };
}
