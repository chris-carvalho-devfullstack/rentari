// src/services/GeocodingService.ts

import { EnderecoImovel } from '@/types/imovel';

interface Coordinates {
    latitude: number;
    longitude: number;
}

// A interface é mantida para tipagem no frontend
export interface PoiResult {
    name: string;
    type: string;
    tag: string; 
    distanceKm: number;
    latitude: number;
    longitude: number;
}


const buildNominatimUrl = (addressQuery: string): string => {
    const encodedAddress = encodeURIComponent(addressQuery);
    return `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1&extratags=1`;
};

const searchNominatim = async (addressQuery: string): Promise<Coordinates | null> => {
    const NOMINATIM_URL = buildNominatimUrl(addressQuery);
    try {
        const response = await fetch(NOMINATIM_URL, {
            headers: { 'User-Agent': 'Rentou-App/1.0' }
        });
        if (!response.ok) {
            console.error(`[GeocodingService] Erro HTTP ${response.status} na API Nominatim.`);
            return null;
        }
        const data = await response.json();
        if (data && data.length > 0) {
            return { 
                latitude: parseFloat(data[0].lat), 
                longitude: parseFloat(data[0].lon) 
            };
        }
        return null;
    } catch (error) {
        console.error("[GeocodingService] Falha ao executar Geocoding:", error);
        return null;
    }
};

export async function fetchCoordinatesByAddress(endereco: EnderecoImovel): Promise<Coordinates | null> {
    // Simula um atraso de rede
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    let coordinates: Coordinates | null = null;

    // 1. TENTATIVA MAIS PRECISA E LIMPA (Rua, Número, Cidade, Estado)
    const preciseAddressClean = `${endereco.logradouro}, ${endereco.numero}, ${endereco.cidade}, ${endereco.estado}, ${endereco.pais}`;
    coordinates = await searchNominatim(preciseAddressClean);
    if (coordinates) return coordinates;

    // 2. TENTATIVA DE FALLBACK 1 (Rua, Cidade, Estado - Ignora o número)
    const streetAddress = `${endereco.logradouro}, ${endereco.cidade}, ${endereco.estado}, ${endereco.pais}`;
    coordinates = await searchNominatim(streetAddress);
    if (coordinates) return coordinates;

    // 3. TENTATIVA DE FALLBACK 2 (Cidade e Estado)
    const genericAddress = `${endereco.cidade}, ${endereco.estado}, ${endereco.pais}`;
    coordinates = await searchNominatim(genericAddress);
    if (coordinates) return coordinates;
    
    console.error("[GeocodingService] Geocoding falhou. Usando fallback.");
    // Fallback: Coordenadas Mock de SP
    return { latitude: -23.55052, longitude: -46.633307 }; 
}


/**
 * ATUALIZADO: Busca POIs (Points of Interest) da NOSSA PRÓPRIA API
 */
export async function fetchNearbyPois(
    lat: number, 
    lon: number, 
    poiTag: string, // 'TODOS', 'school', etc.
    distance: number = 2000
): Promise<PoiResult[]> {
    
    // Constrói a URL para a nossa API route
    const apiUrl = `/api/pois?lat=${lat}&lon=${lon}&tag=${poiTag}&distance=${distance}`;
    
    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(`[GeocodingService] Erro ao buscar da nossa API de POIs: ${response.status}`);
            return [];
        }
        
        const data: PoiResult[] = await response.json();
        return data;
        
    } catch (error) {
        console.error("[GeocodingService] Falha na chamada à API de POIs:", error);
        return [];
    }
}