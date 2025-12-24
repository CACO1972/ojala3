import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import GL from "./_components/gl";

// Fuente de respaldo
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://clinicamiro.cl"),
  title: {
    default: "Clínica Miró | Odontología Premium en Chile",
    template: "%s | Clínica Miró"
  },
  description: "25 años de experiencia. Implantología avanzada con tecnología IA. Recupera tu sonrisa, recupera tu vida.",
  keywords: ["dentista", "implantes dentales", "clínica dental", "Santiago", "Chile", "odontología"],
  authors: [{ name: "Clínica Miró" }],
  creator: "Clínica Miró",
  openGraph: {
    title: "Clínica Miró | Odontología Premium",
    description: "Recupera tu sonrisa con tecnología de última generación y 25 años de experiencia.",
    url: "https://clinicamiro.cl",
    siteName: "Clínica Miró",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clínica Miró | Odontología Premium",
    description: "Recupera tu sonrisa con tecnología de última generación.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className={inter.variable}>
      <body className="min-h-screen antialiased">
        {/* Fondo WebGL con partículas doradas */}
        <GL />
        
        {/* Contenido principal */}
        <div className="content-wrapper">
          {children}
        </div>

        {/* Toaster para notificaciones */}
        <Toaster 
          position="top-center" 
          richColors
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid #424242',
              color: '#ffffff',
            },
          }}
        />
        
        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Dentist",
              name: "Clínica Miró",
              url: "https://clinicamiro.cl",
              telephone: "+56935572986",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Av. Providencia 1234",
                addressLocality: "Providencia",
                addressRegion: "Santiago",
                addressCountry: "CL"
              },
              areaServed: "CL",
              priceRange: "$$$",
              sameAs: []
            })
          }}
        />
      </body>
    </html>
  );
}
