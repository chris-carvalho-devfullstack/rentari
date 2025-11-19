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
  
  // 2. REWRITES (Garantindo array vazio para não conflitar com o Middleware)
  async rewrites() {
    return [
      // Regras de rewrite removidas para que o Middleware (src/proxy.ts) gerencie o roteamento interno.
    ];
  },
};

export default nextConfig;