// src/app/api/pois/route.ts

import { NextResponse } from 'next/server';

// 1. O MAPEAMENTO DOS POIS (ATUALIZADO com NOVAS CATEGORIAS)
const POI_MAPPING: { [key: string]: { tag: string, ptBr: string } } = {
    // Categorias Antigas
    'school': { tag: 'amenity=school', ptBr: 'Escola' },
    'university': { tag: 'amenity=university', ptBr: 'Universidade' },
    'supermarket': { tag: 'shop=supermarket', ptBr: 'Supermercado' },
    'pharmacy': { tag: 'amenity=pharmacy', ptBr: 'Farmácia' },
    'hospital': { tag: 'amenity=hospital', ptBr: 'Hospital' },
    'shopping_mall': { tag: 'shop=mall', ptBr: 'Shopping/Loja' },
    'bus_station': { tag: 'amenity=bus_station', ptBr: 'Rodoviária' },
    'airport': { tag: 'aeroway=aerodrome', ptBr: 'Aeroporto' },
    'railway_station': { tag: 'railway=station', ptBr: 'Estação Ferroviária' },
    'bus_stop': { tag: 'highway=bus_stop', ptBr: 'Ponto de Ônibus' },
    
    // NOVAS CATEGORIAS
    'restaurant': { tag: 'amenity=restaurant', ptBr: 'Restaurante' },
    'church': { tag: 'amenity=place_of_worship', ptBr: 'Igreja' },
    'police': { tag: 'amenity=police', ptBr: 'Polícia' },
    'theatre': { tag: 'amenity=theatre', ptBr: 'Teatro' },
    'cinema': { tag: 'amenity=cinema', ptBr: 'Cinema' },
    'nightclub': { tag: 'amenity=nightclub', ptBr: 'Clube' },
    'pub': { tag: 'amenity=pub', ptBr: 'PUB' }, 
};

// 2. O CACHE DO LADO DO SERVIDOR
const cache = new Map<string, any>();

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'Rentou-App/1.0 (info@rentou.com.br)';

// 3. FUNÇÃO DE DELAY (Para evitar rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Constrói a query para um ÚNICO tipo de tag
 */
function buildSingleTagQuery(lat: number, lon: number, distance: number, tag: string): string {
    const tagInfo = POI_MAPPING[tag];
    if (!tagInfo) return "";
    
    // Query Overpass QL para um tipo
    return `
        [out:json][timeout:25];
        (
            node[${tagInfo.tag}](around:${distance},${lat},${lon});
            way[${tagInfo.tag}](around:${distance},${lat},${lon});
            relation[${tagInfo.tag}](around:${distance},${lat},${lon});
        );
        out center;
    `;
}

/**
 * Processa os resultados da API (calcula distância, formata)
 */
function processOverpassResults(elements: any[], lat: number, lon: number, internalTag: string) {
    const tagInfo = POI_MAPPING[internalTag];
    if (!tagInfo) return []; // Segurança

    const results = (elements || []).map((el: any) => {
        const elLat = el.lat || (el.center && el.center.lat);
        const elLon = el.lon || (el.center && el.center.lon);
        
        if (!elLat || !elLon) return null; // Ignora POIs sem coordenadas válidas

        // Cálculo da distância
        const R = 6371; // Raio da Terra em km
        const dLat = (elLat - lat) * (Math.PI / 180);
        const dLon = (elLon - lon) * (Math.PI / 180);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat * (Math.PI / 180)) * Math.cos(elLat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c; 

        return {
            name: el.tags.name || el.tags.operator || `${tagInfo.ptBr} Desconhecido`,
            type: tagInfo.ptBr, 
            tag: internalTag, 
            distanceKm: parseFloat(distanceKm.toFixed(1)),
            latitude: elLat,
            longitude: elLon,
        };
    }).filter(Boolean); // Remove os nulos

    // Limita a 5 por categoria
    return (results as any[]).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5);
}


/**
 * O Handler da API Route (GET)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const tag = searchParams.get('tag'); // 'TODOS', 'school', 'pharmacy', etc.
    const distance = searchParams.get('distance') || '2000';

    if (!lat || !lon || !tag) {
        return NextResponse.json({ error: 'Parâmetros ausentes: lat, lon e tag são obrigatórios' }, { status: 400 });
    }

    const cacheKey = `pois:${lat}:${lon}:${tag}:${distance}`;
    
    // 1. VERIFICAR CACHE
    if (cache.has(cacheKey)) {
        console.log(`[API POIS] Cache HIT para: ${cacheKey}`);
        return NextResponse.json(cache.get(cacheKey));
    }

    console.log(`[API POIS] Cache MISS para: ${cacheKey}. Buscando na Overpass...`);

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const distNum = parseInt(distance, 10);
    let allResults: any[] = [];

    try {
        if (tag === 'TODOS') {
            // === ESTRATÉGIA SEQUENCIAL NO BACKEND ===
            console.log("[API POIS] Modo 'TODOS'. Iniciando busca sequencial...");
            
            for (const internalTag of Object.keys(POI_MAPPING)) {
                console.log(`[API POIS] Buscando (sequencial): ${internalTag}`);
                const query = buildSingleTagQuery(latNum, lonNum, distNum, internalTag);
                
                const response = await fetch(OVERPASS_URL, {
                    method: 'POST',
                    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `data=${encodeURIComponent(query)}`,
                    cache: 'no-store' 
                });

                if (response.ok) {
                    const data = await response.json();
                    const processed = processOverpassResults(data.elements || [], latNum, lonNum, internalTag);
                    allResults = allResults.concat(processed);
                } else {
                    console.warn(`[API POIS] Falha na sub-query para ${internalTag}: ${response.status} ${response.statusText}`);
                }
                
                await delay(300); // Delay de 300ms entre requisições
            }

            // Ordena e limita o resultado final de 'TODOS'
            allResults.sort((a, b) => a.distanceKm - b.distanceKm);
            
            // Remove duplicatas
            const uniquePoisMap = new Map<string, any>();
            for (const poi of allResults) {
                const key = `${poi.name}_${poi.latitude}_${poi.longitude}`;
                if (!uniquePoisMap.has(key)) {
                    uniquePoisMap.set(key, poi);
                }
            }
            allResults = Array.from(uniquePoisMap.values()).slice(0, 20); // Limite final de 20

        } else {
            // === MODO CATEGORIA ÚNICA ===
            console.log(`[API POIS] Modo Categoria Única: ${tag}`);
            
            if (!POI_MAPPING[tag]) {
                 return NextResponse.json({ error: 'Tag de POI inválida' }, { status: 400 });
            }
            
            const query = buildSingleTagQuery(latNum, lonNum, distNum, tag);
            
            const response = await fetch(OVERPASS_URL, {
                method: 'POST',
                headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`,
                cache: 'no-store'
            });

            if (!response.ok) {
                console.error(`[API POIS] Overpass API erro para ${tag}: ${response.status}`);
                throw new Error(`Overpass API erro: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            allResults = processOverpassResults(data.elements || [], latNum, lonNum, tag);
        }

        // 5. SALVAR NO CACHE E RETORNAR
        console.log(`[API POIS] Busca concluída. ${allResults.length} resultados. Salvando no cache.`);
        cache.set(cacheKey, allResults);
        setTimeout(() => {
            cache.delete(cacheKey);
            console.log(`[API POIS] Cache expirado para: ${cacheKey}`);
        }, 3600000); // Cache por 1 hora

        return NextResponse.json(allResults);

    } catch (error: any) {
        console.error("[API POIS] Falha interna:", error);
        return NextResponse.json({ error: 'Falha interna ao buscar POIs', details: error.message }, { status: 502 });
    }
}