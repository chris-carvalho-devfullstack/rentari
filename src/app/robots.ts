// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/meu-espaco', '/financeiro', '/imoveis/*/editar'], // Bloqueia áreas privadas
    },
    sitemap: 'https://www.rentou.com.br/sitemap.xml',
  };
}