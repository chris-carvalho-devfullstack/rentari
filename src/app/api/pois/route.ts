export const runtime = 'edge';

import { NextResponse } from 'next/server';

// Token secreto para o backend (garante acesso à Search API)
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_API_URL = 'https://api.mapbox.com/search/searchbox/v1/category';

// Mapeamento: Chave interna (do seu app) -> Categoria oficial do Mapbox
const CATEGORY_MAPPING: Record<string, string> = {
    'school': 'school',
    'university': 'university',
    'supermarket': 'grocery',
    'pharmacy': 'pharmacy',
    'hospital': 'hospital',
    'shopping_mall': 'shopping_mall',
    'bus_station': 'bus_station',
    'restaurant': 'restaurant',
    'police': 'police_station',
    'park': 'park',
    'gym': 'gym',
    'cinema': 'cinema',
    'church': 'place_of_worship',
    'pub': 'bar',
    'nightclub': 'nightclub'
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    
    // Removemos a lógica de 'tag' específica. Sempre buscamos tudo para o cache.
    
    if (!lat || !lon) {
        return NextResponse.json({ error: 'Lat/Lon obrigatórios' }, { status: 400 });
    }

    // Chave de cache baseada na localização (arredondada para aumentar o "cache hit" entre vizinhos)
    // 3 casas decimais = precisão de ~100m
    const latKey = parseFloat(lat).toFixed(3);
    const lonKey = parseFloat(lon).toFixed(3);

    try {
        console.log(`[API POIS] Iniciando Master Fetch para: ${latKey}, ${lonKey}`);

        // Seleciona as categorias para buscar
        const categoriesToFetch = Object.values(CATEGORY_MAPPING);
        
        // Executa requisições em PARALELO para o Mapbox
        const promises = categoriesToFetch.map(async (cat) => {
            // Busca 5 itens de cada categoria num raio aproximado
            const url = `${MAPBOX_API_URL}/${cat}` +
                        `?proximity=${lon},${lat}` + // Mapbox exige Longitude,Latitude
                        `&limit=5` + 
                        `&access_token=${MAPBOX_ACCESS_TOKEN}`;
            
            try {
                const res = await fetch(url);
                if(!res.ok) {
                    console.warn(`[Mapbox] Erro ao buscar ${cat}: ${res.status}`);
                    return [];
                }
                const data = await res.json();
                
                // Normaliza os dados para o formato do seu App (PoiResult)
                return data.features.map((f: any) => {
                    // Encontra a tag interna baseada na categoria do Mapbox
                    const internalTag = Object.keys(CATEGORY_MAPPING).find(key => CATEGORY_MAPPING[key] === cat) || cat;
                    
                    return {
                        name: f.properties.name,
                        type: cat, // Categoria original (ex: 'grocery')
                        tag: internalTag, // Tag do seu sistema (ex: 'supermarket')
                        address: f.properties.full_address || f.properties.place_formatted || '',
                        distanceKm: (f.properties.distance / 1000).toFixed(1), // Metros p/ KM
                        latitude: f.geometry.coordinates[1],
                        longitude: f.geometry.coordinates[0]
                    };
                });
            } catch (err) {
                console.error(`[Mapbox] Falha na categoria ${cat}`, err);
                return [];
            }
        });

        // Aguarda todas as requisições terminarem
        const resultsArrays = await Promise.all(promises);
        // Achata o array de arrays em uma única lista
        const allResults = resultsArrays.flat();

        // Ordena por distância globalmente
        allResults.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));

        // Retorna com Cabeçalhos de Cache agressivos (Cloudflare/Vercel/Navegador)
        return NextResponse.json(allResults, {
            headers: {
                // Browser: guarda por 1 hora (3600s)
                // CDN (Cloudflare/Vercel): guarda por 24 horas (86400s)
                // Stale-while-revalidate: entrega o cache vencido por +1h enquanto atualiza em background
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600',
                'CDN-Cache-Control': 'public, s-maxage=86400',
                'Vercel-CDN-Cache-Control': 'public, s-maxage=86400'
            }
        });

    } catch (error: any) {
        console.error("[API POIS] Erro Crítico:", error);
        return NextResponse.json({ error: 'Erro interno ao buscar POIs' }, { status: 500 });
    }
}