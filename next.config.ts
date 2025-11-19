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
};

export default nextConfig;