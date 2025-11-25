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
  
  // --- CORREÇÃO PARA O "MISS VERDE" ---
  async headers() {
    return [
      {
        // Aplica a todas as rotas da API
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
      }
    ]
  },
  // ----------------------------------

  async rewrites() {
    return [];
  },
};

export default nextConfig;