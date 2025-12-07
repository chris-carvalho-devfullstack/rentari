// src/app/api/ai/generate/route.ts
import { NextResponse } from 'next/server';
import { AiService } from '@/services/AiService';

// Edge Runtime para máxima velocidade e menor custo
export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt obrigatório' }, { status: 400 });
        }

        // Chama o serviço centralizado
        const text = await AiService.generateText(prompt);

        // Cache-Control: Orienta navegadores e CDNs a cachear essa resposta por 24h
        // se o prompt for idêntico, economizando chamadas ao Google.
        return NextResponse.json({ text }, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
            }
        });

    } catch (error) {
        return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
    }
}