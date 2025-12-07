// src/app/api/services/broadband/route.ts
import { NextResponse } from 'next/server';
import { BROADBAND_DATABASE } from '@/data/broadbandStats';

// CORREÇÃO: Adicionando a configuração obrigatória para Cloudflare Pages
export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
        return NextResponse.json({ error: 'Cidade obrigatória' }, { status: 400 });
    }

    // Tenta encontrar a cidade exata, ou cai no padrão
    const stats = BROADBAND_DATABASE[city] || BROADBAND_DATABASE["DEFAULT"];

    // Adiciona um pequeno delay artificial para parecer uma consulta real
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
        city: city,
        data: stats,
        source: "Base Estatística Anatel (Ref)"
    });
}