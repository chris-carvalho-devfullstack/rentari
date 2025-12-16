// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mantenha isso! É necessário para o react-map-gl
  transpilePackages: ['react-map-gl', 'mapbox-gl'],

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'nominatim.openstreetmap.org' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' }
    ],
  },
  
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'www.rentou.com.br' }],
        destination: '/anuncios',
        permanent: true,
      },
    ];
  },
  
  // --- CORREÇÃO PARA O "MISS VERDE" + FIX DE SEGURANÇA (CSP) ---
  async headers() {
    return [
      {
        // 1. Aplica a todas as rotas da API (MANTIDO ORIGINAL)
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { 
            key: "Access-Control-Allow-Headers", 
            // AQUI ESTÁ O SEGREDO: Autorizamos o x-audit-mode explicitamente
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-audit-mode" 
          },
        ]
      },
      {
        // 2. NOVO: Aplica a TODAS as rotas do site para permitir Scripts Externos (Google Auth, Cloudflare Turnstile)
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // Esta política libera explicitamente os domínios necessários para o Login funcionar
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googleapis.com https://www.gstatic.com https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com https://*.firebaseapp.com https://*.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.cloudfunctions.net https://identitytoolkit.googleapis.com securetoken.googleapis.com;" 
          }
        ]
      }
    ]
  },
  // ----------------------------------

  async rewrites() {
    return [];
  },
};

export default nextConfig;