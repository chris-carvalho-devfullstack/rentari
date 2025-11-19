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
  
  // 2. REWRITES (Removidas todas as regras de app.rentou.com.br para evitar o conflito /rentou)
  async rewrites() {
    return [
      // As regras de rewrite para 'app.rentou.com.br' foram removidas.
      // O Middleware (src/proxy.ts) agora fará o redirecionamento da raiz (/)
      // para /dashboard ou /login, conforme a autenticação.
    ];
  },
};

export default nextConfig;