// src/app/anuncios/[smartId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
// Adicionamos a função para buscar outros imóveis do mesmo dono
import { fetchImovelPorSmartId, fetchAnunciosPorProprietarioHandle, fetchImoveisRelacionados } from '@/services/ImovelService';
import { fetchCoordinatesByAddress, fetchBairroGeoJsonLimits } from '@/services/GeocodingService';
import AnuncioDetalheClient from '@/components/anuncios/AnuncioDetalheClient';
// Novos imports para a integração de IA no Servidor
import { AiService } from '@/services/AiService';
import { unstable_cache } from 'next/cache';

export const runtime = 'edge';

// CORREÇÃO CRÍTICA: No Next.js 15, 'params' é uma Promise e deve ser tipada como tal.
type Props = {
    params: Promise<{ smartId: string }>;
};

// Cachear a chamada da IA para SEO (para não gastar cota a cada refresh e manter performance)
const getCachedSeoDescription = unstable_cache(
    async (titulo: string, bairro: string, caracteristicas: string[]) => {
        const prompt = `Crie uma meta-description SEO (max 155 chars) muito atraente para aluguel de: ${titulo} em ${bairro}. Inclua destaques: ${caracteristicas.slice(0,3).join(', ')}. Termine com chamada para ação.`;
        return await AiService.generateText(prompt);
    },
    ['seo-description-ai'], // Chave de cache
    { revalidate: 86400 } // Cache válido por 24h
);

// 1. GERAÇÃO DE METADADOS DINÂMICOS (SEO SOCIAL)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // Aguarda a resolução dos parâmetros (obrigatório no Next.js 15)
    const { smartId } = await params;
    
    // [DEBUG LOG]
    console.log(`[SEO DEBUG] Gerando metadata para SmartID: ${smartId}`);

    try {
        const imovel = await fetchImovelPorSmartId(smartId);
        
        if (!imovel) {
            console.log(`[SEO DEBUG] Imóvel não encontrado para metadata.`);
            return {
                title: 'Imóvel não encontrado | Rentou',
            };
        }

        const title = `${imovel.titulo} | Rentou`;
        // Resumo para a descrição: Tipo, Bairro, Quartos, Preço
        // Alterado para let para permitir sobrescrita pela IA
        let description = `${imovel.tipoDetalhado} em ${imovel.endereco.bairro}, ${imovel.endereco.cidade}. ${imovel.quartos} quartos, ${imovel.areaUtil}m². Aluguel: R$ ${imovel.valorAluguel.toLocaleString('pt-BR')}.`;
        
        // --- IMPLEMENTAÇÃO SEO INTELIGENTE ---
        try {
            // Verifica se a chave existe para não fazer chamadas desnecessárias
            if (process.env.GEMINI_API_KEY) {
                const aiDesc = await getCachedSeoDescription(
                    imovel.titulo, 
                    imovel.endereco.bairro, 
                    imovel.caracteristicas || []
                );
                // Validação básica para garantir que não veio uma mensagem de erro
                if (aiDesc && !aiDesc.includes("Erro") && !aiDesc.includes("indisponível") && aiDesc.length > 10) {
                    description = aiDesc;
                }
            }
        } catch (e) {
            // Falha silenciosa para não quebrar a página, mantém a descrição padrão
            console.error("[SEO DEBUG] IA Falhou, usando fallback padrão.", e);
        }
        // -------------------------------------

        const imageUrl = imovel.fotos?.[0] || 'https://rentou.com.br/og-image-default.jpg';

        return {
            title: title,
            description: description,
            openGraph: {
                title: title,
                description: description,
                images: [
                    {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: imovel.titulo,
                    },
                ],
                type: 'website',
                locale: 'pt_BR',
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description: description,
                images: [imageUrl],
            },
        };
    } catch (error) {
        console.error(`[SEO DEBUG] Erro ao gerar metadata:`, error);
        return { title: 'Erro | Rentou' };
    }
}

// 2. COMPONENTE SERVIDOR (SSR)
export default async function AnuncioDetalhePage({ params }: Props) {
    // Aguarda a resolução dos parâmetros antes de usar
    const { smartId } = await params;
    
    // [DEBUG LOG] - Início da execução da página
    console.log(`[PAGE DEBUG] Iniciando renderização da página para SmartID: ${smartId}`);
    
    let imovel;
    let outrosImoveis: any[] = []; // Array para armazenar imóveis relacionados
    let imoveisRelacionados: any[] = []; // <--- NOVA VARIÁVEL PARA O GRID DO FINAL

    try {
        // Busca de dados no lado do servidor (Sem Loading Spinner para o usuário, HTML já vem pronto)
        imovel = await fetchImovelPorSmartId(smartId);
        
        // [DEBUG LOG] - Resultado da busca
        if (imovel) {
             console.log(`[PAGE DEBUG] Imóvel encontrado. ID: ${imovel.id}, Status: ${imovel.status}`);
             
             // --- NOVO: Busca outros imóveis deste proprietário para a Sidebar ---
             if (imovel.proprietarioId) {
                 try {
                     const resultados = await fetchAnunciosPorProprietarioHandle(imovel.proprietarioId);
                     // Filtra para remover o imóvel que já estamos vendo
                     if (resultados && Array.isArray(resultados)) {
                         outrosImoveis = resultados.filter(item => item.smartId !== smartId);
                     }
                 } catch (err) {
                     console.warn('[PAGE DEBUG] Falha ao buscar outros imóveis (não crítico):', err);
                     // Não lançamos erro aqui para não quebrar a página principal
                 }
             }
             // -------------------------------------------------------------------

             // --- NOVO 2: Busca Imóveis Relacionados (Algoritmo Inteligente) ---
             // Passamos o objeto completo 'imovel' para o serviço calcular a relevância
             try {
                 imoveisRelacionados = await fetchImoveisRelacionados(imovel);
             } catch (err) {
                 console.warn('[PAGE DEBUG] Falha ao buscar imóveis relacionados:', err);
             }
             // -------------------------------------------------------------------

        } else {
             console.log(`[PAGE DEBUG] fetchImovelPorSmartId retornou NULO/UNDEFINED.`);
        }

    } catch (error) {
        // [DEBUG LOG] - Erro crítico na conexão (ex: falta de env vars)
        console.error(`[PAGE DEBUG] ERRO CRÍTICO ao buscar imóvel:`, error);
        throw error; // Deixa o Next.js tratar como erro 500 para diferenciar do 404
    }

    if (!imovel || imovel.status !== 'ANUNCIADO') {
        // [DEBUG LOG] - Disparando 404
        console.error(`[PAGE DEBUG] Disparando notFound(). Motivo: ${!imovel ? 'Imóvel Inexistente' : 'Status inválido (' + imovel.status + ')'}`);
        notFound(); // Retorna página 404 padrão do Next.js
    }

    // --- LÓGICA DE GEOCODING (Convertida para Server-Side) ---
    // Verifica se já tem coordenadas válidas
    const hasValidCoords = (imovel.latitude && imovel.longitude && (imovel.latitude !== 0 || imovel.longitude !== 0));

    if (!hasValidCoords) {
        console.log(`[PAGE DEBUG] Coordenadas ausentes. Buscando via Geocoding...`);
        try {
            const coords = await fetchCoordinatesByAddress(imovel.endereco);
            if (coords) {
                imovel.latitude = coords.latitude;
                imovel.longitude = coords.longitude;
            } else {
                // Fallback padrão se falhar
                imovel.latitude = -23.55052;
                imovel.longitude = -46.633307;
            }
        } catch (err) {
            console.error(`[PAGE DEBUG] Erro no Geocoding:`, err);
        }
    }
    // --- FIM LÓGICA DE GEOCODING ---

    // Busca limites do bairro (GeoJSON) no Servidor para passar pronto ao cliente
    let bairroGeoJson = null;
    if (imovel.endereco.bairro) {
        try {
             bairroGeoJson = await fetchBairroGeoJsonLimits(imovel.endereco.bairro, imovel.endereco.cidade, imovel.endereco.estado);
        } catch (err) {
             console.error(`[PAGE DEBUG] Erro ao buscar GeoJSON:`, err);
        }
    }

    // 3. DADOS ESTRUTURADOS (JSON-LD) PARA GOOGLE
    const safeAddress = imovel.endereco || {};
    
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product', // Mantemos 'Product' para garantir Rich Snippets
        name: imovel.titulo,
        description: imovel.descricaoLonga || `Imóvel para alugar em ${safeAddress.cidade}`,
        image: imovel.fotos || [],
        sku: imovel.smartId,
        mpn: imovel.id,
        brand: {
            '@type': 'Brand',
            name: 'Rentou'
        },
        offers: {
            '@type': 'Offer',
            url: `https://rentou.com.br/anuncios/${imovel.smartId}`,
            priceCurrency: 'BRL',
            price: imovel.valorAluguel,
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        },
        additionalProperty: [
            { '@type': 'PropertyValue', name: 'Quartos', value: imovel.quartos },
            { '@type': 'PropertyValue', name: 'Banheiros', value: imovel.banheiros },
            { '@type': 'PropertyValue', name: 'Area', value: `${imovel.areaUtil} m²` },
            { '@type': 'PropertyValue', name: 'Bairro', value: safeAddress.bairro },
            { '@type': 'PropertyValue', name: 'Cidade', value: safeAddress.cidade }
        ]
    };

    return (
        <>
            {/* Injeção de JSON-LD (Invisível ao usuário, visível ao Google) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            {/* Renderização do Componente Cliente com Dados Prontos */}
            <AnuncioDetalheClient 
                imovel={imovel} 
                bairroGeoJson={bairroGeoJson}
                outrosImoveis={outrosImoveis} // Passamos a nova lista para o componente cliente
                imoveisRelacionados={imoveisRelacionados} // <--- PASSAMOS A NOVA PROP (Agora com lógica inteligente)
            />
        </>
    );
}