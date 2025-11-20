export const runtime = 'edge'; // Executa no Edge da Cloudflare

import { NextResponse } from 'next/server';

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_API_URL = 'https://api.mapbox.com/search/searchbox/v1/category';

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

    // --- LÓGICA DE AUDITORIA DE CUSTO ZERO ---
    // Se o admin enviou este header, ele só quer saber se o cache existe.
    // Se a requisição chegou até aqui (Origin), significa que a Cloudflare NÃO tinha o cache (MISS).
    // Nós retornamos um aviso de "MISS" e abortamos a chamada ao Mapbox para economizar.
    if (request.headers.get('x-audit-mode') === '1') {
        return NextResponse.json({ audit: 'miss', message: 'Cache MISS na Cloudflare. Economia de API ativada.' }, {
            headers: {
                'Content-Type': 'application/json',
                // Instruímos a Cloudflare e o Navegador a NÃO cachear essa resposta de auditoria.
                // Assim, a próxima visita real de um usuário tentará buscar os dados reais novamente.
                'Cache-Control': 'private, no-store, no-cache, max-age=0',
                'Cloudflare-CDN-Cache-Control': 'no-store' 
            }
        });
    }
    // -----------------------------------------

    if (!lat || !lon || !tag) {
        return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    try {
        const mapboxCategory = CATEGORY_MAPPING[tag];
        if (!mapboxCategory) return NextResponse.json([]); 

        const url = `${MAPBOX_API_URL}/${mapboxCategory}` +
                    `?proximity=${lon},${lat}` + 
                    `&limit=10` + // Limitamos a 10 para economizar banda
                    `&access_token=${MAPBOX_ACCESS_TOKEN}`;
        
        const response = await fetch(url);
        
        if(!response.ok) {
            console.error(`[Mapbox Error] ${response.status}`);
            return NextResponse.json([]);
        }
        
        const data = await response.json();
        if (!data.features) return NextResponse.json([]);

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

        mappedResults.sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);
        const finalResults = mappedResults.slice(0, 10);

        // --- ESTRATÉGIA DE CACHE CORRIGIDA PARA CLOUDFLARE ---
        return NextResponse.json(finalResults, {
            headers: {
                'Content-Type': 'application/json',
                // Browser: guarda por 1 dia
                // Cloudflare (s-maxage): guarda por 20 dias
                // stale-while-revalidate: se vencer, usa o velho enquanto busca o novo
                'Cache-Control': 'public, max-age=86400, s-maxage=1728000, stale-while-revalidate=86400',
                // Header específico que a Cloudflare respeita acima de tudo
                'Cloudflare-CDN-Cache-Control': 'public, max-age=1728000' 
            }
        });

    } catch (error: any) {
        console.error("[API Error]", error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}