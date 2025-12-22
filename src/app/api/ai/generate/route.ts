// src/app/api/ai/generate/route.ts
import { NextResponse } from 'next/server';
import { AiService } from '@/services/AiService';
// Importa a biblioteca leve de segurança compatível com Edge
import { jwtVerify, createRemoteJWKSet } from 'jose';

// ✅ Edge Runtime mantido para máxima performance na Cloudflare
export const runtime = 'edge';

// Configuração para validar o token
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Baixa as chaves públicas do Google (JWKS) uma vez e faz cache automático
const JWKS = createRemoteJWKSet(
    new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export async function POST(req: Request) {
    // --- 1. BLOCO DE SEGURANÇA (JOSE) ---
    try {
        const authHeader = req.headers.get('Authorization');
        
        // Verifica se o cabeçalho existe e começa com "Bearer "
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Login necessário.' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];

        // Valida a assinatura do token diretamente com o Google
        // Isso dispensa o uso de chave privada e funciona no Edge
        await jwtVerify(token, JWKS, {
            issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
            algorithms: ['RS256'],
        });

    } catch (error) {
        console.error("Tentativa de acesso não autorizado:", error);
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 403 });
    }
    // --- FIM DA SEGURANÇA ---


    // --- 2. LÓGICA DA IA ---
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt obrigatório' }, { status: 400 });
        }

        // Chama o serviço centralizado
        const text = await AiService.generateText(prompt);

        // Retorna com Cache-Control (Economia de recursos)
        return NextResponse.json({ text }, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
            }
        });

    } catch (error) {
        console.error("Erro interno na IA:", error);
        return NextResponse.json({ error: 'Falha interna ao processar' }, { status: 500 });
    }
}