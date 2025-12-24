// URLs externas
export const AGENDA_ONLINE_URL = "https://app.dentalink.healthatom.com/agendaonline/clinicamiro";
export const WHATSAPP_URL = "https://wa.me/56935572986?text=Hola%2C%20quiero%20agendar%20una%20hora";
export const WHATSAPP_PHONE = "+56935572986";

// Teléfonos
export const PHONE = "+56 9 3557 2986";

// Direcciones
export const ADDRESS = "Av. Providencia 1234, Providencia, Santiago";

// Horarios
export const HOURS = {
  weekdays: "Lunes a Viernes: 9:00 - 19:00",
  saturday: "Sábado: 9:00 - 14:00",
  sunday: "Domingo: Cerrado"
};

// Síntomas para el formulario de diagnóstico
export const SYMPTOMS = [
  { id: "faltan", label: "Me faltan dientes", category: "estructura" },
  { id: "chuecos", label: "Dientes chuecos", category: "posicion" },
  { id: "desgastados", label: "Dientes desgastados", category: "desgaste" },
  { id: "manchados", label: "Dientes manchados", category: "estetica" },
  { id: "movilidad", label: "Dientes con movilidad", category: "periodontal" },
  { id: "sangrado", label: "Sangrado de encías", category: "periodontal" },
  { id: "retraida", label: "Encía retraída", category: "periodontal" },
  { id: "caries", label: "Caries", category: "infeccion" },
  { id: "fractura", label: "Fractura dental", category: "trauma" },
  { id: "dolor", label: "Dolor", category: "urgencia" },
] as const;

// Tipos de pacientes
export const PATIENT_TYPES = {
  nuevo: "nuevo",
  existente: "existente", 
  opinion: "opinion"
} as const;

export type PatientType = typeof PATIENT_TYPES[keyof typeof PATIENT_TYPES] | null;

// API endpoints
export const API_ENDPOINTS = {
  diagnosis: "/api/diagnosis",
  leads: "/api/leads/segunda-opinion",
  auth: {
    requestOtp: "/api/auth/request-otp",
    verifyOtp: "/api/auth/verify-otp",
    logout: "/api/auth/logout"
  },
  dentalink: {
    pacientes: "/api/dentalink/pacientes",
    sucursales: "/api/dentalink/sucursales"
  }
} as const;
