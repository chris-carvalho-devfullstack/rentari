// chris-carvalho-devfullstack/rentari/rentari-main/next.config.ts

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

      // REGRA REMOVIDA: A regra que mapeava '/:path*' para '/rentou/:path*'
      // foi removida para permitir que o Middleware (src/proxy.ts) trate a 
      // autenticação e o redirecionamento de raiz corretamente (para /dashboard ou /login).
      // O Next.js fará o roteamento de /dashboard, /imoveis, etc., diretamente para
      // a pasta de agrupamento (rentou) sem a necessidade de um rewrite.
    ];
  },
};

export default nextConfig;