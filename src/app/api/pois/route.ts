export const runtime = 'edge'; // Executa no Edge da Cloudflare para máxima performance

import { NextResponse } from 'next/server';

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_API_URL = 'https://api.mapbox.com/search/searchbox/v1/category';

// Lista de categorias para buscar em paralelo (Batching)
// Isso permite uma única requisição do frontend trazer tudo de uma vez.
const CATEGORIES_TO_FETCH = [
    { tag: 'school', mapboxId: 'school' },
    { tag: 'bus_station', mapboxId: 'bus_stop,bus_station' },
    { tag: 'station', mapboxId: 'metro_station,train_station' },
    { tag: 'supermarket', mapboxId: 'grocery' },
    { tag: 'hospital', mapboxId: 'hospital' }
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    // --- LÓGICA DE AUDITORIA DE CUSTO ZERO (SAFE MISS) ---
    // Se o admin enviou 'x-audit-mode: 1', ele quer verificar se o cache existe na Cloudflare.
    // Se a requisição chegou aqui (Origin), significa que foi um MISS na Cloudflare.
    // Retornamos um aviso e impedimos o gasto de API do Mapbox.
    if (request.headers.get('x-audit-mode') === '1') {
        return NextResponse.json({ 
            audit: 'miss', 
            message: 'Cache MISS na Cloudflare. Economia de API ativada (Nenhuma chamada ao Mapbox realizada).' 
        }, {
            headers: {
                'Content-Type': 'application/json',
                // Instruímos Cloudflare e Navegador a NÃO cachearem essa resposta de teste.
                // A próxima visita real tentará buscar os dados reais.
                'Cache-Control': 'private, no-store, no-cache, max-age=0',
                'Cloudflare-CDN-Cache-Control': 'no-store',
                'CDN-Cache-Control': 'no-store'
            }
        });
    }
    // ----------------------------------------------------

    if (!lat || !lon) {
        return NextResponse.json({ error: 'Parâmetros de latitude e longitude obrigatórios' }, { status: 400 });
    }

    try {
        // Dispara 5 requisições ao Mapbox em paralelo (Server-to-Server é muito rápido)
        const promises = CATEGORIES_TO_FETCH.map(async (cat) => {
            const url = `${MAPBOX_API_URL}/${cat.mapboxId}?proximity=${lon},${lat}&limit=5&access_token=${MAPBOX_ACCESS_TOKEN}`;
            const res = await fetch(url);
            
            if (!res.ok) {
                console.error(`[Mapbox Error ${cat.tag}] ${res.status}`);
                return [];
            }
            
            const data = await res.json();
            
            // Mapeia e normaliza os dados
            return (data.features || []).map((f: any) => ({
                name: f.properties.name,
                type: cat.mapboxId,
                tag: cat.tag, // Tag interna para o frontend filtrar localmente
                address: f.properties.full_address || f.properties.place_formatted || '',
                distanceKm: (f.properties.distance / 1000).toFixed(1),
                distanceMeters: f.properties.distance,
                latitude: f.geometry.coordinates[1],
                longitude: f.geometry.coordinates[0]
            })).filter((poi: any) => poi.distanceMeters <= 2000); // Filtro de raio de segurança (2km)
        });

        // Aguarda todas as promessas resolverem
        const results = await Promise.all(promises);
        
        // Achata o array de arrays em uma única lista e ordena por distância
        const allPois = results.flat().sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);

        return NextResponse.json(allPois, {
            headers: {
                'Content-Type': 'application/json',
                // --- ESTRATÉGIA DE CACHE HÍBRIDA (CLOUD = LONGO, BROWSER = ZERO) ---
                // max-age=0: O Navegador (Chrome/Firefox) NÃO guarda localmente. Ele sempre pergunta pra Cloudflare.
                // s-maxage=2592000: A Cloudflare guarda por 30 dias.
                // stale-while-revalidate: Resiliência para entregar conteúdo antigo enquanto atualiza.
                'Cache-Control': 'public, max-age=0, s-maxage=2592000, stale-while-revalidate=86400',
                
                // O Header Supremo que a Cloudflare obedece acima de tudo
                'Cloudflare-CDN-Cache-Control': 'public, max-age=2592000',
                'CDN-Cache-Control': 'public, max-age=2592000'
            }
        });

    } catch (error: any) {
        console.error("[API Error]", error);
        return NextResponse.json({ error: 'Erro interno ao buscar pontos de interesse' }, { status: 500 });
    }
}