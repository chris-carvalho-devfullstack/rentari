export const runtime = 'edge';

import { NextResponse } from 'next/server';

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_API_URL = 'https://api.mapbox.com/search/searchbox/v1/category';

// MAPEAMENTO ESTRITO (Whitelist)
const CATEGORY_MAPPING: Record<string, string> = {
    'school': 'school', 
    'bus_station': 'bus_stop,bus_station', 
    'station': 'metro_station,train_station', 
    'supermarket': 'grocery', 
    'hospital': 'hospital',
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const tag = searchParams.get('tag'); 

    // 1. Validação Básica
    if (!lat || !lon || !tag) {
        return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    try {
        // 2. Seleção Rigorosa da Categoria
        const mapboxCategory = CATEGORY_MAPPING[tag];

        if (!mapboxCategory) {
            return NextResponse.json([]); // Retorna vazio para tags não permitidas
        }

        // 3. Requisição Mapbox (Limitada a 20 para filtrar depois)
        const url = `${MAPBOX_API_URL}/${mapboxCategory}` +
                    `?proximity=${lon},${lat}` + 
                    `&limit=20` + 
                    `&access_token=${MAPBOX_ACCESS_TOKEN}`;
        
        const response = await fetch(url);
        
        if(!response.ok) {
            console.error(`[Mapbox API Error] Status: ${response.status}`);
            return NextResponse.json([]);
        }
        
        const data = await response.json();
        
        if (!data.features) return NextResponse.json([]);

        // 4. Mapeamento e Filtragem Rígida (Máx 2km)
        const mappedResults = data.features
            .map((f: any) => {
                const distMeters = f.properties.distance;
                return {
                    name: f.properties.name,
                    type: mapboxCategory,
                    tag: tag,
                    address: f.properties.full_address || f.properties.place_formatted || '',
                    distanceKm: (distMeters / 1000).toFixed(1),
                    distanceMeters: distMeters,
                    latitude: f.geometry.coordinates[1],
                    longitude: f.geometry.coordinates[0]
                };
            })
            .filter((poi: any) => poi.distanceMeters <= 2000);

        // 5. Ordenação e Limite Final (Top 10)
        mappedResults.sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);
        const finalResults = mappedResults.slice(0, 10);

        return NextResponse.json(finalResults, {
            headers: {
                // CACHE CLOUDFLARE: 20 DIAS
                // 'max-age': Navegador do cliente (20 dias)
                // 's-maxage': Edge Cache (Cloudflare) (20 dias)
                // 'Cloudflare-CDN-Cache-Control': Prioridade específica para CF
                'Cache-Control': 'public, max-age=1728000, s-maxage=1728000, stale-while-revalidate=86400',
                'Cloudflare-CDN-Cache-Control': 'public, max-age=1728000',
                'CDN-Cache-Control': 'public, max-age=1728000'
            }
        });

    } catch (error: any) {
        console.error("[API POIS] Erro Interno:", error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}