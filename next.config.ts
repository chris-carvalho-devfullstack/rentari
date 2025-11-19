// chris-carvalho-devfullstack/rentari/rentari-a5095e5f0efc1e543757fa8dd87a73cb94b50b98/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'nominatim.openstreetmap.org' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'via.placeholder.com' }
    ],
  },
  
  // 1. REDIRECTS (Resolve www.rentou.com.br/ -> /anuncios)
  async redirects() {
    return [
      {
        source: '/',
        has: [
          { type: 'host', value: 'www.rentou.com.br' },
        ],
        destination: '/anuncios',
        permanent: true,
      },
    ];
  },
  
  // 2. REWRITES (Resolve app.rentou.com.br)
  async rewrites() {
    return [
      // FORÇA O MAPA DA AUTENTICAÇÃO PRIMEIRO: /login -> /auth/login
      {
        source: '/login',
        has: [ { type: 'host', value: 'app.rentou.com.br' } ],
        destination: '/auth/login',
      },
      {
        source: '/signup',
        has: [ { type: 'host', value: 'app.rentou.com.br' } ],
        destination: '/auth/signup',
      },

      // MAPA GERAL PARA O PORTAL DE GESTÃO: Mapeia todas as outras rotas para /(rentou)
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'app.rentou.com.br' },
        ],
        destination: '/rentou/:path*', 
      },
      // MAPA DA RAIZ: Deve ser tratada pela regra de cima se o proxy não atuar,
      // mas garantimos que o /login e /dashboard não caiam no /rentou.
    ];
  },
};

export default nextConfig;