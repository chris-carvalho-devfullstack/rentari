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
  
  async rewrites() {
    return [];
  },
};

export default nextConfig;