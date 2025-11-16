// src/services/GeocodingService.ts

import { EnderecoImovel } from '@/types/imovel';

interface Coordinates {
    latitude: number;
    longitude: number;
}

// NOVO: Estrutura para os POIs
export interface PoiResult {
    name: string;
    type: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
}


/**
 * Monta a URL para o Nominatim.
 */
const buildNominatimUrl = (addressQuery: string): string => {
    const encodedAddress = encodeURIComponent(addressQuery);
    // addressdetails=1 e extratags=1 podem ajudar a identificar o nível de precisão
    return `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1&extratags=1`;
};

/**
 * Executa uma busca no Nominatim e retorna as coordenadas.
 */
const searchNominatim = async (addressQuery: string): Promise<Coordinates | null> => {
    const NOMINATIM_URL = buildNominatimUrl(addressQuery);
    
    try {
        // User-Agent é crucial para evitar bloqueios do Nominatim
        const response = await fetch(NOMINATIM_URL, {
            headers: { 'User-Agent': 'Rentou-Portal-Proprietario/1.0' }
        });
        
        if (!response.ok) {
            console.error(`[GeocodingService] Erro HTTP ${response.status} na API Nominatim.`);
            return null;
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const result = data[0];
            const coords = { 
                latitude: parseFloat(result.lat), 
                longitude: parseFloat(result.lon) 
            };
            return coords;
        }
        
        return null;
        
    } catch (error) {
        console.error("[GeocodingService] Falha ao executar Geocoding:", error);
        return null;
    }
};


/**
 * Obtém as coordenadas geográficas (Latitude e Longitude) a partir de um endereço,
 * utilizando a API de Geocoding pública do OpenStreetMap (Nominatim).
 */
export async function fetchCoordinatesByAddress(endereco: EnderecoImovel): Promise<Coordinates | null> {
    
    // Simula um atraso de rede
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    let coordinates: Coordinates | null = null;

    // 1. TENTATIVA MAIS PRECISA E LIMPA (Rua, Número, Cidade, Estado)
    const preciseAddressClean = `${endereco.logradouro}, ${endereco.numero}, ${endereco.cidade}, ${endereco.estado}, ${endereco.pais}`;
    console.log(`[GeocodingService] TENTATIVA 1: Precisão Limpa: ${preciseAddressClean}`);
    coordinates = await searchNominatim(preciseAddressClean);
    
    if (coordinates) {
        console.log(`[GeocodingService] SUCESSO 1: Coordenadas encontradas (LAT=${coordinates.latitude}, LNG=${coordinates.longitude})`);
        return coordinates;
    }

    // 2. TENTATIVA DE FALLBACK 1 (Rua, Cidade, Estado - Ignora o número que pode estar incorreto/falho)
    const streetAddress = `${endereco.logradouro}, ${endereco.cidade}, ${endereco.estado}, ${endereco.pais}`;
    console.warn(`[GeocodingService] TENTATIVA 2: Falha na precisão. Tentando Nível de Rua: ${streetAddress}`);
    coordinates = await searchNominatim(streetAddress);

    if (coordinates) {
        console.log(`[GeocodingService] SUCESSO 2: Coordenadas encontradas no Nível de Rua (LAT=${coordinates.latitude}, LNG=${coordinates.longitude})`);
        return coordinates;
    }

    // 3. TENTATIVA DE FALLBACK 2 (Cidade e Estado - para pelo menos centralizar na cidade)
    const genericAddress = `${endereco.cidade}, ${endereco.estado}, ${endereco.pais}`;
    console.warn(`[GeocodingService] TENTATIVA 3: Falha na Rua. Tentando Nível de Cidade: ${genericAddress}`);
    coordinates = await searchNominatim(genericAddress);

    if (coordinates) {
        console.log(`[GeocodingService] SUCESSO 3: Coordenadas encontradas no Nível de Cidade (LAT=${coordinates.latitude}, LNG=${coordinates.longitude})`);
        return coordinates;
    }
    
    console.error("[GeocodingService] Geocoding falhou após todas as tentativas. Usando coordenadas de fallback.");
    // Fallback: Coordenadas Mock de SP
    return { latitude: -23.55052, longitude: -46.633307 }; 
}


/**
 * NOVO: Busca POIs (Points of Interest) próximos usando a Overpass API (OSM).
 * A consulta é simplificada para buscar um tipo específico de POI em um raio de 1.5km.
 */
export async function fetchNearbyPois(
    lat: number, 
    lon: number, 
    poiTag: string, 
    distance: number = 1500
): Promise<PoiResult[]> {
    
    // Mapeamento de tags OSM para POIs
    const POI_TAGS: { [key: string]: string } = {
        'supermarket': 'shop=supermarket',
        'pharmacy': 'amenity=pharmacy',
        'school': 'amenity=school',
        'bus_stop': 'highway=bus_stop',
        'railway_station': 'railway=station',
    };
    
    const tag = POI_TAGS[poiTag];
    if (!tag) return [];

    // Consulta Overpass QL: Busca elementos (nodes, ways, relations) em um raio (around)
    const overpassQuery = `
        [out:json][timeout:25];
        (
            node[${tag}](around:${distance}, ${lat}, ${lon});
            way[${tag}](around:${distance}, ${lat}, ${lon});
            relation[${tag}](around:${distance}, ${lat}, ${lon});
        );
        out center;
    `;
    
    const OVERPASS_URL = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    try {
        const response = await fetch(OVERPASS_URL);
        if (!response.ok) {
            console.error(`[Overpass API] Erro HTTP ${response.status}`);
            return [];
        }
        
        const data = await response.json();
        
        return (data.elements || []).map((el: any) => {
            const elLat = el.lat || (el.center && el.center.lat);
            const elLon = el.lon || (el.center && el.center.lon);
            
            // Calcula a distância simplificada (Haversine é complexo, usaremos uma aproximação)
            const distance = Math.sqrt(Math.pow(elLat - lat, 2) + Math.pow(elLon - lon, 2)) * 111; // 1 grau Lat ~ 111 km
            
            return {
                name: el.tags.name || el.tags.operator || `${poiTag.replace('_', ' ')} Desconhecido`,
                type: el.tags.shop || el.tags.amenity || el.tags.railway || poiTag,
                distanceKm: parseFloat(distance.toFixed(1)),
                latitude: elLat,
                longitude: elLon,
            };
        }).sort((a: PoiResult, b: PoiResult) => a.distanceKm - b.distanceKm).slice(0, 5); // Limita aos 5 mais próximos
        
    } catch (error) {
        console.error("[GeocodingService] Falha na chamada à Overpass API:", error);
        return [];
    }
}