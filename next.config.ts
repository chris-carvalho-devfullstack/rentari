// chris-carvalho-devfullstack/rentari/rentari-a5095e5f0efc1e543757fa8dd87a73cb94b50b98/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true, // <--- Desativa a otimização de imagem da Vercel
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
  // =======================================================
  // NOVO: CONFIGURAÇÃO DE REWRITES PARA SUBDOMÍNIOS
  // =======================================================
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
        // Reescreve as rotas de app.rentou.com.br para o grupo /rentou
        // Ex: app.rentou.com.br/dashboard -> /dashboard (do grupo /rentou)
        destination: '/(rentou)/:path*',
      },
      // 2. Roteamento para rotas de autenticação (sem /rentou prefixo)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'app.rentou.com.br',
          },
        ],
        // Permite que as rotas de autenticação (/login, /signup) funcionem no app.rentou.com.br
        destination: '/(auth)/:path*', 
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
  // =======================================================
};

export default nextConfig;