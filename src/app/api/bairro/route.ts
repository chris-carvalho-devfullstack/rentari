// src/app/api/bairro/route.ts

import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Rentou-App/1.0 (info@rentou.com.br)';

/**
 * Busca o GeoJSON (limites) de um bairro/sub-urb via Nominatim.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bairro = searchParams.get('bairro');
    const cidade = searchParams.get('cidade');
    const estado = searchParams.get('estado');

    if (!bairro || !cidade || !estado) {
        return NextResponse.json({ error: 'Parâmetros ausentes: bairro, cidade e estado são obrigatórios' }, { status: 400 });
    }

    const query = `${bairro}, ${cidade}, ${estado}, Brasil`;
    
    // Configuração para GeoJSON e limites de sub-área
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=jsonv2&polygon_geojson=1&limit=1&extratags=1&addressdetails=1`;

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!response.ok) {
            console.error(`[API Bairro] Erro ao buscar limites: ${response.status}`);
            return NextResponse.json({ error: `Erro da API Nominatim: ${response.status}` }, { status: 502 });
        }

        const data = await response.json();

        // Filtra para garantir que seja um limite de bairro, vilarejo, etc.
        const result = data.find((item: any) => 
            item.geojson && 
            (item.class === 'boundary' || item.type === 'suburb' || item.type === 'neighbourhood' || item.type === 'village')
        );

        if (result && result.geojson) {
            // Retorna o GeoJSON (o limite do bairro)
            return NextResponse.json(result.geojson);
        } else {
            return NextResponse.json({ error: 'Limites do bairro não encontrados no OSM.' }, { status: 404 });
        }

    } catch (error: any) {
        console.error("[API Bairro] Falha interna:", error);
        return NextResponse.json({ error: 'Falha interna ao buscar limites', details: error.message }, { status: 500 });
    }
}