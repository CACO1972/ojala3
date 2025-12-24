/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/whatsapp',
        destination: 'https://wa.me/56935572986?text=Hola!%20Quiero%20agendar%20una%20evaluación',
        permanent: false,
      },
      {
        source: '/agendar',
        destination: 'https://clinicamiro.dentalink.healthatom.com/agendamiento-web',
        permanent: false,
      },
    ];
  },

  // Optimizaciones
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Webpack para Three.js
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
