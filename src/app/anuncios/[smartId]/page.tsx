// src/app/anuncios/[smartId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchImovelPorSmartId } from '@/services/ImovelService';
import { fetchCoordinatesByAddress, fetchBairroGeoJsonLimits } from '@/services/GeocodingService';
import AnuncioDetalheClient from '@/components/anuncios/AnuncioDetalheClient';

export const runtime = 'edge';

// CORREÇÃO CRÍTICA: No Next.js 15, 'params' é uma Promise.
type Props = {
    params: Promise<{ smartId: string }>;
};

// 1. GERAÇÃO DE METADADOS DINÂMICOS (SEO SOCIAL)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { smartId } = await params;
    
    // [DEBUG LOG]
    console.log(`[SEO DEBUG] Gerando metadata para SmartID: ${smartId}`);

    try {
        const imovel = await fetchImovelPorSmartId(smartId);
        
        if (!imovel) {
            return { title: 'Imóvel não encontrado | Rentou' };
        }

        const title = `${imovel.titulo} | Rentou`;
        const description = `${imovel.tipoDetalhado} em ${imovel.endereco.bairro}, ${imovel.endereco.cidade}. ${imovel.quartos} quartos, ${imovel.areaUtil}m². Aluguel: R$ ${imovel.valorAluguel.toLocaleString('pt-BR')}.`;
        const imageUrl = imovel.fotos?.[0] || 'https://rentou.com.br/og-image-default.jpg';

        return {
            title: title,
            description: description,
            openGraph: {
                title: title,
                description: description,
                images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
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
    const { smartId } = await params;
    
    // [DEBUG LOG]
    console.log(`[PAGE DEBUG] Iniciando renderização da página para SmartID: ${smartId}`);
    
    let imovel;

    try {
        // Busca de dados (REST API)
        imovel = await fetchImovelPorSmartId(smartId);
        
        if (imovel) {
             console.log(`[PAGE DEBUG] Imóvel encontrado. ID: ${imovel.id}, Status: ${imovel.status}`);
        } else {
             console.log(`[PAGE DEBUG] fetchImovelPorSmartId retornou NULO.`);
        }

    } catch (error) {
        console.error(`[PAGE DEBUG] ERRO CRÍTICO ao buscar imóvel:`, error);
        throw error;
    }

    if (!imovel || imovel.status !== 'ANUNCIADO') {
        console.error(`[PAGE DEBUG] Disparando notFound().`);
        notFound();
    }

    // --- LÓGICA DE GEOCODING ---
    const hasValidCoords = (imovel.latitude && imovel.longitude && (imovel.latitude !== 0 || imovel.longitude !== 0));

    if (!hasValidCoords) {
        try {
            const coords = await fetchCoordinatesByAddress(imovel.endereco);
            if (coords) {
                imovel.latitude = coords.latitude;
                imovel.longitude = coords.longitude;
            } else {
                imovel.latitude = -23.55052;
                imovel.longitude = -46.633307;
            }
        } catch (err) {
            console.error(`[PAGE DEBUG] Erro no Geocoding:`, err);
        }
    }

    let bairroGeoJson = null;
    if (imovel.endereco.bairro) {
        try {
             bairroGeoJson = await fetchBairroGeoJsonLimits(imovel.endereco.bairro, imovel.endereco.cidade, imovel.endereco.estado);
        } catch (err) {
             console.error(`[PAGE DEBUG] Erro ao buscar GeoJSON:`, err);
        }
    }

    // 3. DADOS ESTRUTURADOS MELHORADOS (PRODUTO) - "O Pulo do Gato"
    // Mudamos de 'RealEstateListing' para 'Product' para garantir que o Google exiba o preço.
    
    const safeAddress = imovel.endereco || {};
    
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product', // <--- MUDANÇA: Product ativa Rich Snippets de Preço
        name: imovel.titulo,
        description: imovel.descricaoLonga || `Imóvel para alugar em ${safeAddress.cidade}`,
        image: imovel.fotos || [],
        sku: imovel.smartId, // Identificador único
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
            availability: 'https://schema.org/InStock', // Indica que o imóvel está vago
            itemCondition: 'https://schema.org/NewCondition',
            priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        },
        // Mapeamento extra para não perder a semântica imobiliária
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
            {/* Injeção de JSON-LD Otimizado para Produto */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            <AnuncioDetalheClient 
                imovel={imovel} 
                bairroGeoJson={bairroGeoJson} 
            />
        </>
    );
}