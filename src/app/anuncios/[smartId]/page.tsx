// src/app/anuncios/[smartId]/page.tsx
import { db } from '@/services/FirebaseService';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import AnuncioDetalheClient from '@/components/anuncios/AnuncioDetalheClient';
import { fetchImovelPorSmartId } from '@/services/ImovelService';
import { fetchBairroGeoJsonLimits } from '@/services/GeocodingService';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // <--- FORÇA O NO-CACHE (CRÍTICO)

type Props = {
    params: Promise<{ smartId: string }>;
};

export async function generateMetadata() {
    return { title: 'Teste de Conexão | Rentou' };
}

export default async function AnuncioDetalhePage({ params }: Props) {
    const { smartId } = await params;
    
    // 1. Tenta buscar o imóvel específico
    let imovelAlvo = undefined;
    let listaTeste: any[] = [];
    let erroGeral = '';

    try {
        // Busca Específica
        imovelAlvo = await fetchImovelPorSmartId(smartId);

        // Busca Genérica (PROVA DE VIDA DO BANCO)
        // Tenta pegar qualquer 3 imóveis para ver se o banco responde
        const q = query(collection(db, 'imoveis'), limit(3));
        const snapshot = await getDocs(q);
        listaTeste = snapshot.docs.map(doc => ({ id: doc.id, smartId: doc.data().smartId }));
        
    } catch (e: any) {
        erroGeral = JSON.stringify(e, Object.getOwnPropertyNames(e));
    }

    // Se encontrou o imóvel certo, VIDA QUE SEGUE! Renderiza normal.
    if (imovelAlvo && imovelAlvo.status === 'ANUNCIADO') {
        let bairroGeoJson = null;
        if (imovelAlvo.endereco.bairro) {
             bairroGeoJson = await fetchBairroGeoJsonLimits(imovelAlvo.endereco.bairro, imovelAlvo.endereco.cidade, imovelAlvo.endereco.estado);
        }
        return <AnuncioDetalheClient imovel={imovelAlvo} bairroGeoJson={bairroGeoJson} />;
    }

    // SE FALHOU, MOSTRA O RELATÓRIO "TIRA-TEIMA"
    return (
        <div className="min-h-screen bg-white text-black p-8 font-mono text-sm">
            <h1 className="text-2xl font-bold text-red-600 mb-4">ERRO: Imóvel não carregou</h1>
            
            <div className="grid gap-4">
                <div className="p-4 border rounded bg-gray-50">
                    <h2 className="font-bold">1. Tentativa de Busca Direta</h2>
                    <p>ID Buscado: <strong>"{smartId}"</strong></p>
                    <p>Resultado: <strong>{imovelAlvo ? 'ENCONTRADO' : 'UNDEFINED (Não achou)'}</strong></p>
                </div>

                <div className="p-4 border rounded bg-blue-50">
                    <h2 className="font-bold text-blue-800">2. Prova de Vida do Banco (Teste Geral)</h2>
                    <p className="mb-2">Tentei listar quaisquer 3 imóveis do banco. Resultado:</p>
                    
                    {listaTeste.length > 0 ? (
                        <ul className="list-disc pl-5">
                            {listaTeste.map(item => (
                                <li key={item.id}>
                                    ID: {item.id} | SmartID: <strong>{item.smartId}</strong>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-red-600 font-bold">ZERO IMÓVEIS RETORNADOS. A CONEXÃO ESTÁ MORTA.</p>
                    )}
                </div>

                {erroGeral && (
                    <div className="p-4 border rounded bg-red-100 text-red-800 break-all">
                        <h2 className="font-bold">3. Erro Técnico Capturado</h2>
                        {erroGeral}
                    </div>
                )}
            </div>
        </div>
    );
}