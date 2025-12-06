// src/app/anuncios/[smartId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchImovelPorSmartId } from '@/services/ImovelService';
import { fetchCoordinatesByAddress, fetchBairroGeoJsonLimits } from '@/services/GeocodingService';
import AnuncioDetalheClient from '@/components/anuncios/AnuncioDetalheClient';

export const runtime = 'edge';

// CORREÇÃO CRÍTICA: No Next.js 15, 'params' é uma Promise e deve ser tipada como tal.
type Props = {
    params: Promise<{ smartId: string }>;
};

// 1. GERAÇÃO DE METADADOS DINÂMICOS (SEO)
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
        const description = `${imovel.tipoDetalhado} em ${imovel.endereco.bairro}, ${imovel.endereco.cidade}. ${imovel.quartos} quartos, ${imovel.areaUtil}m². Aluguel: R$ ${imovel.valorAluguel.toLocaleString('pt-BR')}.`;
        const imageUrl = imovel.fotos[0] || 'https://rentou.com.br/og-image-default.jpg';

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

    try {
        // Busca de dados no lado do servidor (Sem Loading Spinner para o usuário, HTML já vem pronto)
        imovel = await fetchImovelPorSmartId(smartId);
        
        // [DEBUG LOG] - Resultado da busca
        if (imovel) {
             console.log(`[PAGE DEBUG] Imóvel encontrado. ID: ${imovel.id}, Status: ${imovel.status}`);
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
    // Isso "ensina" ao Google sobre o preço, localização e título do imóvel
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: imovel.titulo,
        description: imovel.descricaoLonga,
        image: imovel.fotos,
        address: {
            '@type': 'PostalAddress',
            streetAddress: `${imovel.endereco.logradouro}, ${imovel.endereco.numero}`,
            addressLocality: imovel.endereco.cidade,
            addressRegion: imovel.endereco.estado,
            postalCode: imovel.endereco.cep,
            addressCountry: 'BR',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: imovel.latitude,
            longitude: imovel.longitude,
        },
        offers: {
            '@type': 'Offer',
            price: imovel.valorAluguel,
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
        },
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
            />
        </>
    );
}