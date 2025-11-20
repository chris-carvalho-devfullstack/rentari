export const runtime = 'edge';

import { NextResponse } from 'next/server';

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_API_URL = 'https://api.mapbox.com/search/searchbox/v1/category';

// MAPEAMENTO ESTRITO (Apenas categorias oficiais do Mapbox)
const CATEGORY_MAPPING: Record<string, string> = {
    // Educação
    'school': 'school',
    // Transporte (Mapbox separa bus e train)
    'bus_station': 'bus_station', 
    'station': 'train_station', // Usado para Metrô/Trem
    // Comércio e Saúde
    'supermarket': 'grocery', // "grocery" é o termo oficial para mercado/supermercado
    'hospital': 'hospital',
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const tag = searchParams.get('tag'); 

    if (!lat || !lon || !tag) {
        return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    try {
        // 1. Identifica a categoria única
        const mapboxCategory = CATEGORY_MAPPING[tag];

        // Se a tag não for mapeada, retorna vazio (evita busca genérica)
        if (!mapboxCategory) {
            return NextResponse.json([]); 
        }

        // 2. Requisição ao Mapbox (Limite de 20 para ter margem de filtro)
        const url = `${MAPBOX_API_URL}/${mapboxCategory}` +
                    `?proximity=${lon},${lat}` + 
                    `&limit=20` + 
                    `&access_token=${MAPBOX_ACCESS_TOKEN}`;
        
        const response = await fetch(url);
        
        if(!response.ok) {
            // Se der erro no Mapbox, retorna vazio silenciosamente
            return NextResponse.json([]);
        }
        
        const data = await response.json();
        
        if (!data.features) return NextResponse.json([]);

        // 3. Processamento e Filtragem
        const mappedResults = data.features
            .map((f: any) => {
                const distMeters = f.properties.distance || 0;
                return {
                    id: f.properties.mapbox_id || Math.random().toString(), // ID único
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
            // FILTRO RÍGIDO DE RAIO: Apenas locais até 2km (2000 metros)
            .filter((poi: any) => poi.distanceMeters <= 2000);

        // 4. Ordenação e LIMITE FINAL (Top 10 mais próximos)
        // Isso impede que "65 locais" sejam retornados
        mappedResults.sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);
        const finalResults = mappedResults.slice(0, 10);

        return NextResponse.json(finalResults, {
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600'
            }
        });

    } catch (error: any) {
        console.error("[API POIS] Erro Interno:", error);
        return NextResponse.json([], { status: 500 });
    }
}