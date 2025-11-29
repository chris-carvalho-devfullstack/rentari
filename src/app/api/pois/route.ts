export const runtime = 'edge'; // Executa no Edge da Cloudflare para máxima performance

import { NextResponse } from 'next/server';

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_API_URL = 'https://api.mapbox.com/search/searchbox/v1/category';

// --- CONFIGURAÇÃO OTIMIZADA DE CATEGORIAS ---
// Dividimos as categorias de transporte para garantir que o Metrô tenha sua própria cota de resultados.
const CATEGORIES_TO_FETCH = [
    { tag: 'school', mapboxId: 'school' },
    { tag: 'bus_station', mapboxId: 'bus_stop,bus_station' },
    
    // 1. Metrô: Prioridade máxima (10 vagas exclusivas)
    { tag: 'station', mapboxId: 'metro_station,subway_station' },
    
    // 2. Trens: Prioridade secundária (10 vagas exclusivas)
    { tag: 'station', mapboxId: 'train_station,railway_station' },
    
    // 3. Outros: Fallback para paradas genéricas
    { tag: 'station', mapboxId: 'transit_stop' },
    
    // Supermercados grandes e atacadistas (além de mercadinhos)
    { tag: 'supermarket', mapboxId: 'supermarket,warehouse_club,wholesale_store,grocery' },
    
    { tag: 'hospital', mapboxId: 'hospital' }
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // --- LÓGICA DE AUDITORIA DE CUSTO ZERO (SAFE MISS) ---
    if (request.headers.get('x-audit-mode') === '1') {
        return NextResponse.json({ 
            audit: 'miss', 
            message: 'Cache MISS na Cloudflare. Economia de API ativada (Nenhuma chamada ao Mapbox realizada).' 
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'private, no-store, no-cache, max-age=0',
                'Cloudflare-CDN-Cache-Control': 'no-store',
                'CDN-Cache-Control': 'no-store',
                'Access-Control-Expose-Headers': 'Age, CF-Cache-Status, CF-RAY, Server, Date, Cache-Control, CDN-Cache-Control'
            }
        });
    }
    // ----------------------------------------------------

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Parâmetros de latitude e longitude obrigatórios' }, { status: 400 });
    }

    try {
        // Dispara requisições em paralelo
        const promises = CATEGORIES_TO_FETCH.map(async (cat) => {
            // MELHORIA: limit=10 (Máximo da API) para trazer mais opções antes de filtrar.
            const url = `${MAPBOX_API_URL}/${cat.mapboxId}?proximity=${lon},${lat}&limit=10&access_token=${MAPBOX_ACCESS_TOKEN}`;
            const res = await fetch(url);
            
            if (!res.ok) {
                console.error(`[Mapbox Error ${cat.tag}] ${res.status}`);
                return [];
            }
            
            const data = await res.json();
            
            return (data.features || []).map((f: any) => ({
                name: f.properties.name,
                type: cat.mapboxId,
                tag: cat.tag,
                address: f.properties.full_address || f.properties.place_formatted || '',
                distanceKm: (f.properties.distance / 1000).toFixed(1),
                distanceMeters: f.properties.distance,
                latitude: f.geometry.coordinates[1],
                longitude: f.geometry.coordinates[0]
            }))
            // MELHORIA: Raio de segurança aumentado para 5km para não perder estações importantes.
            // O frontend exibirá a distância real (ex: 1.2km).
            .filter((poi: any) => poi.distanceMeters <= 5000); 
        });

        const results = await Promise.all(promises);
        
        // Consolida e ordena por distância
        const allPois = results.flat().sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);

        return NextResponse.json(allPois, {
            headers: {
                'Content-Type': 'application/json',
                // Cache de 30 dias (MANTIDO IGUAL AO GITHUB)
                'Cache-Control': 'public, max-age=0, s-maxage=2592000, stale-while-revalidate=86400',
                'Cloudflare-CDN-Cache-Control': 'public, max-age=2592000',
                'CDN-Cache-Control': 'public, max-age=2592000',
                'Access-Control-Expose-Headers': 'Age, CF-Cache-Status, CF-RAY, Server, Date, Cache-Control, CDN-Cache-Control'
            }
        });

    } catch (error: any) {
        console.error("[API Error]", error);
        return NextResponse.json({ error: 'Erro interno ao buscar pontos de interesse' }, { status: 500 });
    }
}