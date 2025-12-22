// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para o react-map-gl
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
  
  async headers() {
    // --- CSP DEFINITIVA (Mapbox + Firebase + Localhost) ---
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googleapis.com https://www.gstatic.com https://challenges.cloudflare.com;
      style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com;
      img-src 'self' blob: data: https:;
      font-src 'self' data: https://fonts.gstatic.com;
      frame-src 'self' https://challenges.cloudflare.com https://*.firebaseapp.com https://*.google.com;
      connect-src 'self' ws: wss: https://*.googleapis.com https://*.cloudfunctions.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.mapbox.com https://events.mapbox.com;
      worker-src 'self' blob:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { 
            key: "Access-Control-Allow-Headers", 
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-audit-mode, Authorization" 
          },
        ]
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader
          }
        ]
      }
    ]
  },

  async rewrites() {
    return [];
  },
};

export default nextConfig;