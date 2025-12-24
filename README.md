# 🦷 Clínica Miró - Web Premium + APIs

Web oficial de Clínica Miró con diseño premium, diagnóstico AI, WhatsApp Business y Meta Ads integrados.

![Next.js](https://img.shields.io/badge/Next.js-15.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black)

## ✨ Características

- **Diseño Premium** - Fondo de partículas WebGL doradas, tipografía elegante
- **Diagnóstico IA** - Orientación inicial con streaming en tiempo real
- **WhatsApp Business** - Mensajería automatizada y webhook de recepción
- **Meta Ads** - Conversions API (CAPI) + Lead Ads con auto-respuesta
- **Portal de Pacientes** - Autenticación OTP, historial de citas
- **Integración Dentalink** - API completa de gestión dental
- **Optimizado para Vercel** - Edge functions, ISR, SSR

## 🚀 Quick Start

```bash
# Clonar repositorio
git clone https://github.com/clinicamiro/web.git
cd web

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus keys

# Desarrollo
npm run dev

# Build producción
npm run build
npm start
```

## 📁 Estructura

```
clinicamiro/
├── app/
│   ├── api/
│   │   ├── auth/              # Autenticación OTP
│   │   ├── dentalink/         # APIs Dentalink
│   │   ├── diagnosis/         # Diagnóstico AI
│   │   ├── leads/             # Gestión de leads
│   │   ├── whatsapp/          # ⭐ WhatsApp Business API
│   │   │   ├── send/          # Enviar mensajes
│   │   │   └── webhook/       # Recibir mensajes
│   │   └── meta/              # ⭐ Meta Marketing APIs
│   │       ├── conversions/   # Pixel CAPI
│   │       ├── leads/         # Lead Ads
│   │       └── webhook/       # Webhook tiempo real
│   ├── diagnostico/           # Página de diagnóstico IA
│   ├── antiguo/               # Portal pacientes existentes
│   ├── _components/
│   │   └── gl/                # Componentes WebGL
│   ├── globals.css            # Estilos globales
│   └── page.tsx               # Homepage
├── src/lib/
│   ├── whatsapp-client.ts     # ⭐ Cliente WhatsApp
│   ├── meta-client.ts         # ⭐ Cliente Meta CAPI
│   └── ...
└── package.json
```

## 🔌 APIs Disponibles

### WhatsApp Business API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/whatsapp/send` | POST | Enviar mensajes (texto, templates, recordatorios) |
| `/api/whatsapp/webhook` | GET | Verificación de webhook |
| `/api/whatsapp/webhook` | POST | Recibir mensajes entrantes |

**Ejemplo: Enviar mensaje**
```bash
curl -X POST https://tu-sitio.vercel.app/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu_api_key" \
  -d '{
    "type": "text",
    "to": "+56912345678",
    "text": "Hola! Tu cita está confirmada"
  }'
```

**Tipos de mensaje:**
- `text` - Mensaje de texto simple
- `template` - Template predefinido
- `appointment_reminder` - Recordatorio de cita
- `appointment_confirmation` - Confirmación de cita
- `welcome_lead` - Bienvenida a nuevo lead
- `diagnosis` - Resultado de diagnóstico IA

### Meta Marketing APIs

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/meta/conversions` | POST | Enviar eventos al Pixel (CAPI) |
| `/api/meta/leads` | GET | Obtener leads de Lead Ads |
| `/api/meta/leads` | POST | Procesar lead manualmente |
| `/api/meta/webhook` | GET/POST | Webhook para Lead Ads tiempo real |

**Ejemplo: Trackear conversión**
```bash
curl -X POST https://tu-sitio.vercel.app/api/meta/conversions \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "lead",
    "userData": {
      "email": "paciente@email.com",
      "phone": "+56912345678"
    },
    "customData": {
      "content_name": "Formulario web"
    }
  }'
```

**Eventos soportados:**
- `lead` - Nuevo lead/contacto
- `schedule` - Cita agendada
- `purchase` - Pago realizado
- `contact` - Contacto por WhatsApp/teléfono
- `pageview` - Vista de página
- `initiate_checkout` - Inicio de diagnóstico

### Otras APIs

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/diagnosis` | POST | Diagnóstico IA con streaming |
| `/api/auth/request-otp` | POST | Solicitar código OTP |
| `/api/auth/verify-otp` | POST | Verificar código OTP |
| `/api/dentalink/pacientes` | GET | Buscar pacientes |
| `/api/health` | GET | Health check |

## 🔧 Variables de Entorno

```bash
# AI (al menos uno requerido)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# WhatsApp Business
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...

# Meta / Facebook
META_ACCESS_TOKEN=...
META_PIXEL_ID=...
META_WEBHOOK_VERIFY_TOKEN=...

# Opcional
DENTALINK_API_KEY=...
SLACK_WEBHOOK_URL=...
```

## 📲 Configurar Webhooks

### WhatsApp Webhook

1. Ve a [Meta Business Suite](https://business.facebook.com)
2. Tu App → WhatsApp → Configuration
3. Webhook URL: `https://tu-sitio.vercel.app/api/whatsapp/webhook`
4. Verify Token: El valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
5. Suscribirse a: `messages`

### Meta Lead Ads Webhook

1. Ve a [Meta for Developers](https://developers.facebook.com)
2. Tu App → Webhooks
3. Webhook URL: `https://tu-sitio.vercel.app/api/meta/webhook`
4. Verify Token: El valor de `META_WEBHOOK_VERIFY_TOKEN`
5. Suscribirse a: `leadgen`, `feed`, `messages`

## 🚢 Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

O importa directamente desde GitHub en [vercel.com/new](https://vercel.com/new)

**Variables de entorno requeridas en Vercel:**
- `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`
- `WHATSAPP_ACCESS_TOKEN` (para WhatsApp)
- `META_ACCESS_TOKEN` (para Meta)
- Los tokens de verificación de webhooks

## 🎨 Branding

| Color | Hex | Uso |
|-------|-----|-----|
| Negro | `#000000` | Fondo principal |
| Dorado | `#FFC700` | Acentos, CTAs |
| Blanco | `#FFFFFF` | Texto principal |

## 📄 Licencia

Propiedad de Clínica Miró © 2025

---

Desarrollado con ❤️ por **HUMANA.AI**
