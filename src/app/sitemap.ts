// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { fetchAnunciosPublicos } from '@/services/ImovelService'; //

export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.rentou.com.br'; // Ajuste para seu domínio de produção

  // 1. Rotas Estáticas
  const routes = [
    '',
    '/anuncios',
    '/login',
    '/signup',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  // 2. Rotas Dinâmicas de Imóveis
  const imoveis = await fetchAnunciosPublicos();
  
  const imoveisUrls = imoveis.map((imovel) => ({
    url: `${baseUrl}/anuncios/${imovel.smartId}`,
    lastModified: new Date(), // Idealmente, usar a data de atualização do imóvel se disponível
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...routes, ...imoveisUrls];
}