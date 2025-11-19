// chris-carvalho-devfullstack/rentari/rentari-a5095e5f0efc1e543757fa8dd87a73cb94b50b98/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CORREÇÃO 1: Removido 'reactCompiler: true,' para evitar o erro Invalid next.config.ts options
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'nominatim.openstreetmap.org',
      },
       {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },
  
  async rewrites() {
    return [
      // 1. Roteamento para o Portal de Gestão (app.rentou.com.br)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'app.rentou.com.br',
          },
        ],
        // CORREÇÃO 2: Usa o nome do grupo sem parênteses no destino
        // O Next.js sabe que 'rentou' mapeia para a pasta '(rentou)'
        destination: '/rentou/:path*',
      },
      // 2. Roteamento para rotas de autenticação
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'app.rentou.com.br',
          },
        ],
        // CORREÇÃO 2: Usa o nome do grupo sem parênteses no destino
        destination: '/auth/:path*', 
      },
      // 3. Redirecionamento da raiz www.rentou.com.br para /anuncios
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'www.rentou.com.br',
          },
        ],
        destination: '/anuncios',
      },
    ];
  },
};

export default nextConfig;