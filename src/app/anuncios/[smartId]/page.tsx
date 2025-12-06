import { fetchImovelPorSmartId } from '@/services/ImovelService';
import AnuncioDetalheClient from '@/components/anuncios/AnuncioDetalheClient';

export const runtime = 'edge';

type Props = {
    params: Promise<{ smartId: string }>;
};

// Desabilita metadata temporariamente para evitar erros paralelos
export async function generateMetadata() {
    return { title: 'Teste de Variáveis | Rentou' };
}

export default async function AnuncioDetalhePage({ params }: Props) {
    const { smartId } = await params;
    
    // 1. TESTE DE VARIÁVEIS DE AMBIENTE
    const envCheck = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ PRESENTE' : '❌ AUSENTE (Undefined)',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ PRESENTE' : '❌ AUSENTE (Undefined)',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ PRESENTE' : '❌ AUSENTE (Undefined)',
        nodeEnv: process.env.NODE_ENV,
        smartIdRecebido: smartId
    };

    let imovel = null;
    let erroFetch = null;

    // 2. TENTATIVA DE BUSCA
    try {
        console.log('Iniciando busca no Firebase...');
        imovel = await fetchImovelPorSmartId(smartId);
    } catch (e: any) {
        console.error(e);
        erroFetch = e.message || JSON.stringify(e);
    }

    // 3. SE FALHAR, MOSTRA O RELATÓRIO NA TELA (EM VEZ DE 404)
    if (!imovel) {
        return (
            <div className="p-10 font-mono text-sm bg-white text-black min-h-screen">
                <h1 className="text-2xl font-bold text-red-600 mb-4">DIAGNÓSTICO DE ERRO 404</h1>
                
                <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded">
                    <h2 className="font-bold mb-2">1. Checagem de Variáveis (Cloudflare)</h2>
                    <ul className="space-y-1">
                        <li><strong>API Key:</strong> {envCheck.apiKey}</li>
                        <li><strong>Project ID:</strong> {envCheck.projectId}</li>
                        <li><strong>Auth Domain:</strong> {envCheck.authDomain}</li>
                        <li><strong>NODE_ENV:</strong> {envCheck.nodeEnv}</li>
                    </ul>
                    <p className="mt-2 text-gray-600 text-xs">
                        *Se estiverem "AUSENTE", o Firebase não conecta e retorna null.
                    </p>
                </div>

                <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded">
                    <h2 className="font-bold mb-2">2. Resultado da Busca</h2>
                    <p><strong>Smart ID buscado:</strong> {smartId}</p>
                    <p><strong>Resultado:</strong> {imovel === null ? 'NULL (Não encontrado)' : 'Objeto recebido'}</p>
                    {erroFetch && (
                        <div className="mt-2 text-red-600">
                            <strong>Erro capturado:</strong> {erroFetch}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Se der certo (milagrosamente), renderiza normal
    return (
        <AnuncioDetalheClient imovel={imovel} bairroGeoJson={null} />
    );
}