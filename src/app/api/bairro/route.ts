export const runtime = 'edge';

import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Rentou-App/1.0 (info@rentou.com.br)';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bairro = searchParams.get('bairro');
    const cidade = searchParams.get('cidade');
    const estado = searchParams.get('estado');

    if (!bairro || !cidade || !estado) {
        return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
    }

    const query = `${bairro}, ${cidade}, ${estado}, Brasil`;
    
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=jsonv2&polygon_geojson=1&limit=1&extratags=1&addressdetails=1`;

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT }
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Erro da API Nominatim` }, { status: 502 });
        }

        const data = await response.json();

        const result = data.find((item: any) => 
            item.geojson && 
            (item.class === 'boundary' || item.type === 'suburb' || item.type === 'neighbourhood' || item.type === 'village')
        );

        if (result && result.geojson) {
            return NextResponse.json(result.geojson, {
                headers: {
                    // Cache de 20 dias para Cloudflare
                    'Cache-Control': 'public, max-age=1728000, s-maxage=1728000, stale-while-revalidate=86400',
                    'Cloudflare-CDN-Cache-Control': 'public, max-age=1728000',
                    'CDN-Cache-Control': 'public, max-age=1728000'
                }
            });
        } else {
            return NextResponse.json({ error: 'Limites não encontrados.' }, { status: 404 });
        }

    } catch (error: any) {
        return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
    }
}