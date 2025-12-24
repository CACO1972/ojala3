import Link from "next/link";
import { AGENDA_ONLINE_URL, WHATSAPP_URL, PHONE, ADDRESS, HOURS } from "@/src/lib/constants";
import { StickyCTA } from "./_components/sticky-cta";

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      {/* =============================================
          HERO SECTION
          ============================================= */}
      <section className="relative min-h-screen flex flex-col">
        {/* Grain overlay */}
        <div className="grain-overlay" />
        
        {/* Header */}
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 md:py-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded border border-primary/50">
              <span className="font-display text-xl text-primary">M</span>
            </div>
            <span className="hidden font-display text-xl tracking-[0.25em] text-white sm:block">MIRÓ</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden items-center gap-10 md:flex">
            <Link href="#servicios" className="nav-link">Servicios</Link>
            <Link href="#tecnologia" className="nav-link">Tecnología IA</Link>
            <Link href="/diagnostico" className="nav-link">Diagnóstico</Link>
            <Link href="#contacto" className="nav-link">Contacto</Link>
          </nav>

          {/* CTA */}
          <a 
            href={AGENDA_ONLINE_URL} 
            target="_blank" 
            rel="noreferrer"
            className="nav-link-gold hidden md:block"
          >
            Reservar
          </a>

          {/* Mobile menu button */}
          <button className="flex h-10 w-10 items-center justify-center text-white/60 md:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto flex flex-1 max-w-5xl flex-col items-center justify-center px-4 text-center">
          {/* Tagline */}
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Odontología Premium en Chile
          </p>

          {/* Main Headline */}
          <h1 className="font-display text-4xl font-extralight leading-[1.1] text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Recupera tu sonrisa,
            <br />
            <span className="text-elegant-italic text-gold">
              recupera tu vida
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-8 max-w-2xl text-base font-light leading-relaxed tracking-wide text-white/60 md:text-lg">
            25 años perfeccionando sonrisas. Pioneros en fusionar experiencia clínica 
            con inteligencia artificial para el tratamiento exacto que necesitas.
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-6">
            <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer">
              <button className="btn-primary">
                Agendar Evaluación
              </button>
            </a>
            <Link href="/diagnostico">
              <button className="btn-outline">
                Diagnóstico IA
              </button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 font-mono text-xs uppercase tracking-[0.2em] text-white/30">
            <span>+5,000 pacientes</span>
            <span className="hidden h-4 w-px bg-white/20 sm:block" />
            <span>25 años experiencia</span>
            <span className="hidden h-4 w-px bg-white/20 sm:block" />
            <span>Tecnología IA</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <div className="scroll-indicator">
            <span>Scroll</span>
            <div className="scroll-line" />
          </div>
        </div>
      </section>

      {/* =============================================
          SERVICIOS SECTION
          ============================================= */}
      <section id="servicios" className="relative z-10 py-24 md:py-32">
        <div className="container">
          {/* Section header */}
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              Especialidades
            </p>
            <h2 className="mt-4 font-display text-3xl font-extralight text-white md:text-4xl lg:text-5xl">
              Nuestros <span className="text-elegant-italic text-gold">Servicios</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              Tratamientos de última generación con tecnología digital y atención personalizada
            </p>
          </div>

          {/* Services grid */}
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div 
                key={service.title}
                className="card group"
              >
                <div className="mb-4 text-3xl">{service.icon}</div>
                <h3 className="font-display text-xl font-light text-white">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          TECNOLOGÍA IA SECTION
          ============================================= */}
      <section id="tecnologia" className="relative z-10 py-24 md:py-32">
        <div className="container">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            {/* Content */}
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                Innovación
              </p>
              <h2 className="mt-4 font-display text-3xl font-extralight text-white md:text-4xl lg:text-5xl">
                HUMANA.AI
              </h2>
              <p className="mt-6 text-lg font-light leading-relaxed text-white/60">
                Inteligencia artificial desarrollada en Chile para diagnóstico dental de precisión. 
                Analizamos radiografías, planificamos implantes y predecimos resultados con tecnología propia.
              </p>
              
              <ul className="mt-8 space-y-4">
                {aiFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-4">
                    <span className="mt-1 text-primary">✓</span>
                    <span className="text-white/70">{item}</span>
                  </li>
                ))}
              </ul>

              <Link 
                href="/diagnostico"
                className="mt-10 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.15em] text-primary transition-colors hover:text-primary/80"
              >
                Probar diagnóstico IA
                <span>→</span>
              </Link>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="aspect-square rounded-2xl border border-white/10 bg-gradient-to-br from-primary/5 to-transparent p-12">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse-gold rounded-full bg-primary/20 blur-3xl" />
                    <div className="relative text-7xl">🧠</div>
                  </div>
                  <p className="mt-8 font-mono text-sm uppercase tracking-[0.2em] text-white/40">
                    Tecnología Propia
                  </p>
                  <p className="mt-2 font-display text-2xl font-extralight text-white/80">
                    Diagnóstico Asistido por IA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          CTA SECTION
          ============================================= */}
      <section id="contacto" className="relative z-10 py-24 md:py-32">
        <div className="container">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-16">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* Content */}
              <div>
                <h2 className="font-display text-3xl font-extralight text-white md:text-4xl">
                  ¿Listo para <span className="text-elegant-italic text-gold">empezar</span>?
                </h2>
                <p className="mt-4 text-white/60">
                  Agenda tu evaluación inicial o contáctanos por WhatsApp para resolver tus dudas.
                </p>
                
                <div className="mt-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-primary">
                      📍
                    </div>
                    <span className="text-white/70">{ADDRESS}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-primary">
                      📞
                    </div>
                    <span className="text-white/70">{PHONE}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-primary">
                      🕐
                    </div>
                    <span className="text-white/70">{HOURS.weekdays}</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col justify-center gap-4">
                <a href={AGENDA_ONLINE_URL} target="_blank" rel="noreferrer">
                  <button className="btn-primary w-full">
                    Agendar Evaluación
                  </button>
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                  <button className="btn-outline w-full">
                    Escribir por WhatsApp
                  </button>
                </a>
                <Link href="/diagnostico">
                  <button className="w-full px-8 py-4 font-mono text-sm uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white">
                    Diagnóstico IA Gratuito
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          FOOTER
          ============================================= */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded border border-primary/30">
                <span className="font-display text-lg text-primary">M</span>
              </div>
              <span className="font-display tracking-[0.2em] text-white/70">MIRÓ</span>
            </div>

            {/* Copyright */}
            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} Clínica Miró — Odontología Premium
            </p>

            {/* Links */}
            <div className="flex gap-8">
              <a 
                href={WHATSAPP_URL} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-white/40 transition-colors hover:text-primary"
              >
                WhatsApp
              </a>
              <a 
                href={AGENDA_ONLINE_URL} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-white/40 transition-colors hover:text-primary"
              >
                Agenda
              </a>
              <Link 
                href="/diagnostico"
                className="text-sm text-white/40 transition-colors hover:text-primary"
              >
                Diagnóstico IA
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA móvil */}
      <StickyCTA />
    </main>
  );
}

// Data
const services = [
  {
    title: "Implantología",
    desc: "Implantes dentales con planificación digital 3D. All-on-4, All-on-6 y rehabilitación de casos complejos.",
    icon: "🦷"
  },
  {
    title: "Rehabilitación Oral",
    desc: "Prótesis fijas y removibles, coronas de porcelana, carillas y restauraciones estéticas premium.",
    icon: "✨"
  },
  {
    title: "Ortodoncia",
    desc: "Brackets estéticos, ortodoncia invisible con alineadores y seguimiento digital de tu tratamiento.",
    icon: "😁"
  },
  {
    title: "Periodoncia",
    desc: "Tratamiento de encías, cirugía periodontal regenerativa y mantenimiento preventivo especializado.",
    icon: "💗"
  },
  {
    title: "Endodoncia",
    desc: "Tratamiento de conductos con microscopio operatorio y tecnología rotacional de última generación.",
    icon: "🔬"
  },
  {
    title: "Estética Dental",
    desc: "Blanqueamiento profesional, diseño de sonrisa digital y armonización orofacial integral.",
    icon: "💎"
  }
];

const aiFeatures = [
  "Análisis de radiografías con deep learning",
  "Planificación digital de implantes",
  "Predicción de éxito de tratamiento",
  "Segunda opinión automatizada 24/7"
];
